import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { debounce } from 'lodash';
import { useNotification } from './NotificationContext';
import axiosInstance, { withAuth } from '../utils/axiosInstance';

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

    const checkAuthStatus = useCallback(async () => {
        if (isAuthChecked) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get('/me', withAuth());
            setCompanyData(response.data);
            setUserRole(response.data.account.role);
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
        if (authState === 'checking') {
            checkAuthStatus();
        }
    }, [authState, checkAuthStatus]);

    const fetchAccounts = useCallback(async (params) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/company/accounts', withAuth(), { params });
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
        authState,
        axiosInstance,
        isAuthChecked,
        isRedirecting,
        setIsRedirecting,
    };
    
    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};
