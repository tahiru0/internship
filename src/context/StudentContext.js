import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';

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

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('studentRefreshToken');
        setStudentData(null);
        setUserData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        setLoading(false);
        setIsAuthChecked(false); // Reset trạng thái kiểm tra xác thực
        navigate('/login');
    }, [navigate]);

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
    };

    const fetchUserData = useCallback(async () => {
        try {
            const accessToken = Cookies.get('accessToken');
            if (!accessToken) {
                console.log('Không có accessToken, bỏ qua việc fetch thông tin người dùng');
                return null;
            }
            const response = await axios.get('http://localhost:5000/api/student/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setUserData(response.data.student);
            return response.data.student;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            return null;
        }
    }, []);

    const checkAuthStatus = useCallback(async () => {
        if (isAuthChecked) return; // Nếu đã kiểm tra xác thực rồi thì không cần kiểm tra lại
        setLoading(true);
        try {
            const accessToken = Cookies.get('accessToken');
            if (!accessToken) {
                setUserData(null);
                setUserRole(null);
                setIsAuthChecked(true);
                setLoading(false);
                return;
            }

            const userData = await fetchUserData();
            if (userData) {
                setUserData(userData);
                setUserRole('student'); // Hoặc bạn có thể set role cụ thể nếu có
            } else {
                logout();
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái xác thực:', error);
            logout();
        } finally {
            setIsAuthChecked(true);
            setLoading(false);
        }
    }, [fetchUserData, logout, isAuthChecked]);

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
        isAuthChecked // Thêm isAuthChecked vào context
    };

    return (
        <StudentContext.Provider value={value}>
            {children}
        </StudentContext.Provider>
    );
};