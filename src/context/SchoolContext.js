import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { debounce } from 'lodash';

const SchoolContext = createContext();

export const useSchool = () => {
    return useContext(SchoolContext);
};

export const SchoolProvider = ({ children }) => {
    const [schoolData, setSchoolData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isCheckingAuth = useRef(false);

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('schoolRefreshToken');
        setSchoolData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        setIsAuthChecked(false);
        navigate('/school/login');
    }, [navigate]);

    const refreshToken = async () => {
        const refreshToken = Cookies.get('schoolRefreshToken');
        if (!refreshToken) {
            console.error('Không có refresh token');
            return null;
        }
        try {
            const response = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            Cookies.set('accessToken', accessToken, { expires: 1/24 });
            Cookies.set('schoolRefreshToken', newRefreshToken, { expires: 7 });
            setRefreshAttempts(0);
            return { accessToken, refreshToken: newRefreshToken };
        } catch (error) {
            console.error('Lỗi khi làm mới token:', error);
            setRefreshAttempts(prev => prev + 1);
            return null;
        }
    };

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
    });

    api.interceptors.request.use(
        async (config) => {
            const token = Cookies.get('accessToken');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
        response => response,
        async error => {
            const originalRequest = error.config;
            if (error.response && error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                const newTokens = await refreshToken();
                if (newTokens) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
                    return api(originalRequest);
                } else {
                    logout();
                }
            }
            return Promise.reject(error);
        }
    );

    const checkAuthStatus = useCallback(debounce(async () => {
        if (isAuthChecked || isCheckingAuth.current) return;
        isCheckingAuth.current = true;
        setLoading(true);
        try {
            const response = await api.get('/school/me');
            setSchoolData(response.data);
            setUserRole(response.data.account.role);
            setRefreshAttempts(0);
        } catch (error) {
            if (refreshAttempts < 1) {
                console.log('Access token không hợp lệ, đang thử refresh...');
                const newTokens = await refreshToken();
                if (newTokens) {
                    try {
                        const response = await api.get('/school/me');
                        setSchoolData(response.data);
                        setUserRole(response.data.account.role);
                    } catch (innerError) {
                        console.error('Lỗi khi lấy thông tin người dùng sau khi refresh token:', innerError);
                        logout();
                    }
                } else {
                    console.error('Không thể refresh token');
                    logout();
                }
            } else {
                console.error('Đã thử refresh token nhưng không thành công');
                logout();
            }
        } finally {
            setIsAuthChecked(true);
            setLoading(false);
            isCheckingAuth.current = false;
        }
    }, 300), [refreshAttempts, logout, api, refreshToken]);

    useEffect(() => {
        if (location.pathname !== '/school/forgot-password' && !location.pathname.startsWith('/school/forgot-password')) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, [checkAuthStatus, location.pathname]);

    const fetchStudents = useCallback(debounce(async (params) => {
        setLoading(true);
        try {
            const response = await api.get('/school/students', { params });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sinh viên:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, 300), [api]);

    const value = {
        schoolData,
        loading,
        userRole,
        logout,
        checkAuthStatus,
        fetchStudents,
        api,
        isAuthChecked
    };
    
    return (
        <SchoolContext.Provider value={value}>
            {children}
        </SchoolContext.Provider>
    );
};