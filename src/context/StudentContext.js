import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useNotification } from './NotificationContext';
import axiosInstance, { withAuth, setTokenNames } from '../utils/axiosInstance';

const StudentContext = createContext();

export const useStudent = () => {
    return useContext(StudentContext);
};

// Provider không bắt buộc auth -> đổi tên thành PublicStudentProvider
export const PublicStudentProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [appliedProjects, setAppliedProjects] = useState([]);
    const navigate = useNavigate();
    const { resetNotifications } = useNotification() || {};

    useEffect(() => {
        setTokenNames('std_token', 'std_refresh');
    }, []);

    const fetchAppliedProjects = async () => {
        try {
            const response = await axiosInstance.get('/student/applied-projects', withAuth());
            setAppliedProjects(response.data || []);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách dự án đã ứng tuyển:', error);
            return [];
        }
    };

    const login = useCallback(async () => {
        const token = Cookies.get('std_token');
        if (token) {
            await fetchUserData();
            await fetchAppliedProjects();
        }
    }, []);

    const logout = useCallback(() => {
        Cookies.remove('std_token');
        Cookies.remove('std_refresh');
        setUserData(null);
        setUserRole(null);
        setAppliedProjects([]);
        setLoading(false);
        if (resetNotifications) {
            resetNotifications();
        }
        navigate('/login');
    }, [navigate, resetNotifications]);

    const fetchUserData = useCallback(async () => {
        const token = Cookies.get('std_token');
        if (!token) {
            setLoading(false);
            return null;
        }

        try {
            const response = await axiosInstance.get('/student/me', withAuth());
            const studentData = response.data.student;
            setUserData(studentData);
            setUserRole('student');
            await fetchAppliedProjects();
            return studentData;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error.message);
            setUserData(null);
            setUserRole(null);
            setAppliedProjects([]);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initializeData = async () => {
            const token = Cookies.get('std_token');
            if (token) {
                await fetchUserData();
            } else {
                setLoading(false);
            }
        };
        initializeData();
    }, []);

    useEffect(() => {
        if (userData) {
            fetchAppliedProjects();
        }
    }, [userData]);

    const value = {
        userData,
        loading,
        userRole,
        logout,
        login,
        fetchUserData,
        appliedProjects,
        fetchAppliedProjects,
        isAuthenticated: !!userData
    };

    return (
        <StudentContext.Provider value={value}>
            {children}
        </StudentContext.Provider>
    );
};

// Provider yêu cầu xác thực -> đổi tên thành StudentProvider (như yêu cầu)
export const StudentProvider = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { resetNotifications, reloadNotifications } = useNotification() || {};

    useEffect(() => {
        setTokenNames('std_token', 'std_refresh');
    }, []);

    const logout = useCallback(() => {
        Cookies.remove('std_token');
        Cookies.remove('std_refresh');
        setUserData(null);
        setUserRole(null);
        setLoading(false);
        if (resetNotifications) {
            resetNotifications();
        }
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
    }, [navigate, location.pathname, resetNotifications]);

    const fetchUserData = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/student/me', withAuth());
            setUserData(response.data.student);
            setUserRole('student');
            if (reloadNotifications) {
                reloadNotifications();
            }
            return response.data.student;
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error.message);
            logout();
            return null;
        } finally {
            setLoading(false);
        }
    }, [logout, reloadNotifications]);

    useEffect(() => {
        const initializeData = async () => {
            await fetchUserData();
        };
        initializeData();
    }, []);

    const value = {
        userData,
        loading,
        userRole,
        logout,
        fetchUserData
    };

    return (
        <StudentContext.Provider value={value}>
            {children}
        </StudentContext.Provider>
    );
};
