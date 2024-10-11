import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';

const CompanyContext = createContext();

export const useCompany = () => {
    return useContext(CompanyContext);
};

export const CompanyProvider = ({ children }) => {
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const checkAuthStatusRef = useRef(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setCompanyData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        setIsAuthChecked(false); // Reset trạng thái kiểm tra xác thực
        navigate('/company/login');
    }, [navigate]);

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
            return { accessToken, refreshToken: newRefreshToken };
        } catch (error) {
            console.error('Lỗi khi làm mới token:', error);
            setRefreshAttempts(prev => prev + 1);
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
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );
    }, [refreshToken, logout]);

    const checkAuthStatus = useCallback(async () => {
        if (isAuthChecked) return; // Nếu đã kiểm tra xác thực rồi thì không cần kiểm tra lại
        setLoading(true);
        try {
            let accessToken = Cookies.get('accessToken');
            if (!accessToken) {
                setCompanyData(null);
                setUserRole(null);
                setIsAuthChecked(true);
                setLoading(false);
                return;
            }
            
            try {
                const response = await axios.get('http://localhost:5000/api/company/me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setCompanyData(response.data);
                setUserRole(response.data.account.role);
                setRefreshAttempts(0);
            } catch (error) {
                if (refreshAttempts < 1) {
                    console.log('Access token không hợp lệ, đang thử refresh...');
                    const newTokens = await refreshToken();
                    if (newTokens) {
                        const response = await axios.get('http://localhost:5000/api/company/me', {
                            headers: { Authorization: `Bearer ${newTokens.accessToken}` }
                        });
                        setCompanyData(response.data);
                        setUserRole(response.data.account.role);
                    } else {
                        throw new Error('Không thể refresh token');
                    }
                } else {
                    throw new Error('Đã thử refresh token nhưng không thành công');
                }
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái xác thực:', error);
            logout();
        } finally {
            setIsAuthChecked(true);
            setLoading(false);
        }
    }, [logout, refreshAttempts, refreshToken, isAuthChecked]);

    useEffect(() => {
        setupAxiosInterceptors();
        if (
            location.pathname !== '/company/forgot-password' &&
            !location.pathname.startsWith('/company/forgot-password') &&
            !companyData
        ) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, [setupAxiosInterceptors, checkAuthStatus, location.pathname, companyData]);

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

    const value = {
        companyData,
        loading,
        userRole,
        logout,
        checkAuthStatus,
        fetchAccounts,
        isAuthChecked, // Thêm isAuthChecked vào context
    };
    
    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};