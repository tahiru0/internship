import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';
import { useNotification } from './NotificationContext';
import axiosInstance, { withAuth } from '../utils/axiosInstance';

const StudentContext = createContext();

export const useStudent = () => {
    return useContext(StudentContext);
};

export const StudentProvider = ({ children }) => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [userData, setUserData] = useState(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isUserDataFetched, setIsUserDataFetched] = useState(false);
    const isCheckingAuth = useRef(false);
    const { resetNotifications, reloadNotifications } = useNotification() || {};

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('studentRefreshToken');
        setStudentData(null);
        setUserData(null);
        setUserRole(null);
        setLoading(false);
        setIsAuthChecked(false);
        if (resetNotifications) {
            resetNotifications();
        }
        navigate('/login');
    }, [navigate, resetNotifications]);

    const fetchUserData = useCallback(async () => {
        if (isUserDataFetched) return userData;
        try {
            const response = await axiosInstance.get('/student/me', withAuth());
            setUserData(response.data.student);
            setIsUserDataFetched(true);
            return response.data.student;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error.message);
            logout();
            return null;
        }
    }, [isUserDataFetched, userData, logout]);

    const checkAuthStatus = useCallback(async () => {
        if (isAuthChecked || isUserDataFetched || isCheckingAuth.current) return;
        isCheckingAuth.current = true;
        setLoading(true);
        try {
            const userData = await fetchUserData();
            if (userData) {
                setUserData(userData);
                setUserRole('student');
                setIsUserDataFetched(true);
                if (reloadNotifications) {
                    reloadNotifications();
                }
            } else {
                throw new Error('Không thể lấy thông tin người dùng');
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái xác thực:', error.message);
            logout();
        } finally {
            setIsAuthChecked(true);
            setLoading(false);
            isCheckingAuth.current = false;
        }
    }, [fetchUserData, logout, isAuthChecked, isUserDataFetched, reloadNotifications]);

    useEffect(() => {
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
            const response = await axiosInstance.get('/student/profile', withAuth());
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin sinh viên:', error.message);
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
