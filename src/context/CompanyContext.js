import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { debounce } from 'lodash';
import { useNotification } from './NotificationContext';

const CompanyContext = createContext();

export const useCompany = () => {
    return useContext(CompanyContext);
};

const hasToken = () => {
    return !!Cookies.get('accessToken');
};

export const CompanyProvider = ({ children }) => {
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const checkAuthStatusRef = useRef(null);
    const [authState, setAuthState] = useState(hasToken() ? 'checking' : 'unauthenticated');
    const [isRedirecting, setIsRedirecting] = useState(false);
    const { resetNotifications, reloadNotifications } = useNotification() || {};

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setCompanyData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        setIsAuthChecked(false);
        setAuthState('unauthenticated');
        if (resetNotifications) {
            resetNotifications();
        }
        navigate('/company/login');
    }, [navigate, resetNotifications]);

    const refreshToken = useCallback(async () => {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
            console.error('Không có refresh token');
            return null;
        }
        try {
            const response = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            Cookies.set('accessToken', accessToken, { expires: 1/24 });
            Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
            setRefreshAttempts(0);
            setAuthState('authenticated');
            return { accessToken, refreshToken: newRefreshToken };
        } catch (error) {
            console.error('Lỗi khi làm mới token:', error);
            setRefreshAttempts(prev => prev + 1);
            setAuthState('unauthenticated');
            return null;
        }
    }, []);

    const setupAxiosInterceptors = useCallback(() => {
        axios.interceptors.request.use(
            config => {
                const accessToken = Cookies.get('accessToken');
                if (accessToken) {
                    config.headers['Authorization'] = `Bearer ${accessToken}`;
                }
                return config;
            },
            error => {
                return Promise.reject(error);
            }
        );

        axios.interceptors.response.use(
            response => response,
            async error => {
                const originalRequest = error.config;
                if (error.response && error.response.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const newTokens = await refreshToken();
                    if (newTokens) {
                        axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
                        originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
                        return axios(originalRequest);
                    } else {
                        window.location.replace('/company/login');
                        return Promise.reject(error);
                    }
                }
                return Promise.reject(error);
            }
        );
    }, [refreshToken, logout]);

    const checkAuthStatus = useCallback(async () => {
        if (authState !== 'checking') return;
        
        const accessToken = Cookies.get('accessToken');
        const refreshTokenExists = Cookies.get('refreshToken');
        
        if (!accessToken && !refreshTokenExists) {
            setAuthState('unauthenticated');
            setLoading(false);
            setIsAuthChecked(true);
            return;
        }

        try {
            let currentAccessToken = accessToken;
            if (!currentAccessToken && refreshTokenExists) {
                const newTokens = await refreshToken();
                if (newTokens) {
                    currentAccessToken = newTokens.accessToken;
                } else {
                    logout();
                }
            }

            const response = await axios.get('http://localhost:5000/api/company/me', {
                headers: { Authorization: `Bearer ${currentAccessToken}` }
            });
            setCompanyData(response.data);
            setUserRole(response.data.account.role);
            setAuthState('authenticated');
            if (reloadNotifications) {
                reloadNotifications();
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái xác thực:', error);
            setCompanyData(null);
            setUserRole(null);
            setAuthState('unauthenticated');
        } finally {
            setLoading(false);
            setIsAuthChecked(true);
        }
    }, [authState, reloadNotifications, refreshToken]);

    useEffect(() => {
        if (authState === 'checking') {
            checkAuthStatus();
        }
    }, [authState, checkAuthStatus]);

    const fetchAccounts = useCallback(async (params) => {
        setLoading(true);
        try {
            const accessToken = Cookies.get('accessToken');
            const response = await axios.get('http://localhost:5000/api/company/accounts', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách tài khoản:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const axiosInstance = useMemo(() => createAxiosInstance(refreshToken, logout), [refreshToken, logout]);

    const value = {
        companyData,
        loading,
        userRole,
        logout,
        checkAuthStatus,
        fetchAccounts,
        authState,
        axiosInstance,
        isAuthChecked,
        isRedirecting,
        setIsRedirecting,
        refreshToken,
    };
    
    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};

const createAxiosInstance = (refreshToken, logout) => {
    const instance = axios.create({
        baseURL: 'http://localhost:5000/api',
    });

    instance.interceptors.request.use(
        (config) => {
            const accessToken = Cookies.get('accessToken');
            if (accessToken) {
                config.headers['Authorization'] = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const newTokens = await refreshToken();
                    if (newTokens) {
                        instance.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
                        originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
                        return instance(originalRequest);
                    }
                } catch (refreshError) {
                    logout();
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
};
