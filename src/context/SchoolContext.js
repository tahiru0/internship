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
        if (isCheckingAuth.current || isAuthChecked) return;
        
        isCheckingAuth.current = true;
        setLoading(true);
        
        try {

            const response = await axiosInstance.get('/school/dashboard', withAuth());
            setSchoolData(response.data.data);
            console.log(response.data.data);
            setUserRole(response.data.account.role);
            setRefreshAttempts(0);
            if (reloadNotifications) {
                reloadNotifications();
            }
        } catch (error) {
            console.error('Auth error:', error.message);
            setSchoolData(null);
            setUserRole(null);
        } finally {
            setIsAuthChecked(true);
            setLoading(false);
            isCheckingAuth.current = false;
        }
    }, [isAuthChecked, reloadNotifications]);

    useEffect(() => {
        const isLoginPage = location.pathname.includes('/login');
        const isForgotPasswordPage = location.pathname.includes('/forgot-password');
        
        if (!isLoginPage && !isForgotPasswordPage) {
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
