import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';
import { useNotification } from './NotificationContext';

const StudentContext = createContext();

export const useStudent = () => {
    return useContext(StudentContext);
};

export const StudentProvider = ({ children }) => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isUserDataFetched, setIsUserDataFetched] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const isCheckingAuth = useRef(false);
    const { resetNotifications, reloadNotifications } = useNotification() || {};

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('studentRefreshToken');
        setStudentData(null);
        setUserData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        setLoading(false);
        setIsAuthChecked(false);
        if (resetNotifications) {
            resetNotifications();
        }
        navigate('/login');
    }, [navigate, resetNotifications]);

    const refreshToken = async () => {
        const refreshToken = Cookies.get('studentRefreshToken');
        if (!refreshToken) {
            console.error('Không có refresh token');
            return null;
        }
        try {
            const response = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            Cookies.set('accessToken', accessToken, { expires: 1/24 });
            Cookies.set('studentRefreshToken', newRefreshToken, { expires: 7 });
            setRefreshAttempts(0);
            return { accessToken, refreshToken: newRefreshToken };
        } catch (error) {
            console.error('Lỗi khi làm mới token:', error);
            setRefreshAttempts(prev => prev + 1);
            return null;
        }
    };

    const setupAxiosInterceptors = () => {
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
                    try {
                        const newTokens = await refreshToken();
                        if (newTokens) {
                            axios.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
                            originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
                            return axios(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('Không thể làm mới token:', refreshError);
                        logout();
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );
    };

    const fetchUserData = useCallback(async () => {
        if (isUserDataFetched) return userData;
        try {
            const accessToken = Cookies.get('accessToken');
            if (!accessToken) {
                console.log('Không có accessToken, thử refresh token');
                const newTokens = await refreshToken();
                if (!newTokens) {
                    console.error('Không thể refresh token');
                    logout();
                    return;
                }
            }
            const response = await axios.get('http://localhost:5000/api/student/me', {
                headers: { Authorization: `Bearer ${Cookies.get('accessToken')}` }
            });
            setUserData(response.data.student);
            setIsUserDataFetched(true);
            return response.data.student;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            logout();
            return null;
        }
    }, [isUserDataFetched, userData, refreshToken, logout]);

    const checkAuthStatus = useCallback(async () => {
        if (isAuthChecked || isUserDataFetched || isCheckingAuth.current) return;
        isCheckingAuth.current = true;
        setLoading(true);
        try {
            const accessToken = Cookies.get('accessToken');
            if (!accessToken) {
                setUserData(null);
                setUserRole(null);
                setIsAuthChecked(true);
                setIsUserDataFetched(true);
                setLoading(false);
                return;
            }

            const userData = await fetchUserData();
            if (userData) {
                setUserData(userData);
                setUserRole('student');
                setIsUserDataFetched(true);
                if (reloadNotifications && typeof reloadNotifications === 'function') {
                    reloadNotifications();
                }
            } else {
                throw new Error('Không thể lấy thông tin người dùng');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái xác thực:', error);
            logout();
        } finally {
            setIsAuthChecked(true);
            setLoading(false);
            isCheckingAuth.current = false;
        }
    }, [fetchUserData, logout, isAuthChecked, isUserDataFetched, reloadNotifications]);

    useEffect(() => {
        setupAxiosInterceptors();
        if (
            location.pathname !== '/student/forgot-password' &&
            !location.pathname.startsWith('/student/forgot-password')
        ) {
            checkAuthStatus();
        } else {
            setLoading(false);
            setIsAuthChecked(true);
        }
    }, [checkAuthStatus, location.pathname]);

    const fetchStudentProfile = async () => {
        setLoading(true);
        try {
            const accessToken = Cookies.get('accessToken');
            const response = await axios.get('http://localhost:5000/api/student/profile', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin sinh viên:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        userData,
        loading,
        userRole,
        logout,
        checkAuthStatus,
        fetchStudentProfile,
        fetchUserData,
        isAuthChecked,
        isUserDataFetched
    };

    return (
        <StudentContext.Provider value={value}>
            {children}
        </StudentContext.Provider>
    );
};
