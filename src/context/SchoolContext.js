import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axiosInstance, { withAuth } from '../utils/axiosInstance';
import { useNotification } from './NotificationContext';

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
    const { resetNotifications, reloadNotifications } = useNotification() || {};

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('schoolRefreshToken');
        setSchoolData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        setIsAuthChecked(false);
        if (resetNotifications) {
            resetNotifications();
        }
        navigate('/school/login');
    }, [navigate, resetNotifications]);

    const checkAuthStatus = useCallback(async () => {
        if (isAuthChecked) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get('/school/me', withAuth());
            setSchoolData(response.data);
            setUserRole(response.data.account.role);
            setRefreshAttempts(0);
            if (reloadNotifications) {
                reloadNotifications();
            }
        } catch (error) {
            console.error('Auth error:', error.message);
            logout();
        } finally {
            setIsAuthChecked(true);
            setLoading(false);
        }
    }, [isAuthChecked, logout, reloadNotifications]);

    useEffect(() => {
        if (location.pathname !== '/school/forgot-password' && !location.pathname.startsWith('/school/forgot-password')) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, [checkAuthStatus, location.pathname]);

    const fetchStudents = useCallback(async (params) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/school/students', withAuth({ params }));
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sinh viên:', error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [reloadNotifications]);

    const value = {
        schoolData,
        loading,
        userRole,
        logout,
        checkAuthStatus,
        fetchStudents,
        isAuthChecked
    };
    
    return (
        <SchoolContext.Provider value={value}>
            {children}
        </SchoolContext.Provider>
    );
};
