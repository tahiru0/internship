import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useNotification } from './NotificationContext';
import axiosInstance, { withAuth, setTokenNames } from '../utils/axiosInstance';

const CompanyContext = createContext();

export const useCompany = () => {
    return useContext(CompanyContext);
};

// Provider không bắt buộc auth
export const PublicCompanyProvider = ({ children }) => {
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { resetNotifications } = useNotification() || {};

    useEffect(() => {
        setTokenNames('com_token', 'com_refresh');
    }, []);

    const logout = useCallback(() => {
        Cookies.remove('com_token');
        Cookies.remove('com_refresh');
        setCompanyData(null);
        setLoading(false);
        if (resetNotifications) {
            resetNotifications();
        }
        navigate('/company/login');
    }, [navigate, resetNotifications]);

    const fetchUserData = useCallback(async () => {
        const token = Cookies.get('com_token');
        if (!token) {
            setLoading(false);
            return null;
        }

        try {
            const response = await axiosInstance.get('/company/me', withAuth());
            setCompanyData(response.data);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error.message);
            setCompanyData(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const value = {
        companyData,
        loading,
        logout,
        fetchUserData,
        isAuthenticated: !!companyData
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};

// Provider yêu cầu xác thực
export const CompanyProvider = ({ children }) => {
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { resetNotifications, reloadNotifications } = useNotification() || {};

    useEffect(() => {
        setTokenNames('com_token', 'com_refresh');
    }, []);

    const logout = useCallback(() => {
        Cookies.remove('com_token');
        Cookies.remove('com_refresh');
        setCompanyData(null);
        if (resetNotifications) {
            resetNotifications();
        }
        const currentPath = location.pathname;
        if (currentPath !== '/company/login') {
            navigate(`/company/login?redirect=${encodeURIComponent(currentPath)}`);
        }
    }, [navigate, location.pathname, resetNotifications]);

    const fetchUserData = useCallback(async () => {
        const token = Cookies.get('com_token');
        if (!token) {
            setLoading(false);
            return null;
        }

        try {
            const response = await axiosInstance.get('/company/me', withAuth());
            setCompanyData(response.data);
            setUserRole(response.data.account?.role || null);
            if (reloadNotifications) {
                reloadNotifications();
            }
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error.message);
            logout();
            return null;
        } finally {
            setLoading(false);
        }
    }, [logout, reloadNotifications]);

    useEffect(() => {
        const token = Cookies.get('com_token');
        if (!token && location.pathname !== '/company/login') {
            const currentPath = location.pathname;
            navigate(`/company/login?redirect=${encodeURIComponent(currentPath)}`);
        } else {
            fetchUserData();
        }
    }, [fetchUserData, location.pathname, navigate]);

    const value = {
        companyData,
        loading,
        logout,
        fetchUserData,
        userRole,
        isAuthenticated: !!companyData
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};
