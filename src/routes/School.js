import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/school/Dashboard';
import NotFound from '../common/Notfound';
import { FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaProjectDiagram } from 'react-icons/fa';
import { Spin } from 'antd';
import SchoolHeader from '../components/school/SchoolHeader';
import { SchoolProvider, useSchool } from '../context/SchoolContext';
import { NotificationProvider } from '../context/NotificationContext';
import Cookies from 'js-cookie';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import StudentManagement from '../components/school/StudentManagement';
import ApiConfig from '../components/school/ApiConfig';
import { debounce } from 'lodash';

const delayedRequest = (func, delay = 1000) => {
    return debounce(func, delay, { leading: true, trailing: false });
};

const getNavItems = (userRole) => {
    const items = [
        { key: "1", to: "/school/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
        { key: "2", to: "/school/students", label: "Quản lý sinh viên", icon: <FaUserGraduate /> },
        { key: "3", to: "/school/api-config", label: "Cấu hình API", icon: <FaProjectDiagram /> },
    ];
    return items;
};

const isAuthenticated = () => {
    return Boolean(Cookies.get('accessToken'));
};

function PrivateRoute({ children }) {
    const { loading, checkAuthStatus, schoolData, isAuthChecked } = useSchool();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthChecked) {
            checkAuthStatus();
        }
    }, [checkAuthStatus, isAuthChecked]);

    useEffect(() => {
        if (isAuthChecked && !schoolData) {
            navigate('/school/login', { replace: true });
        }
    }, [isAuthChecked, schoolData, navigate]);

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    if (!isAuthChecked || loading) {
        return <Spin size="large" />;
    }

    return children;
}

function School() {
    return (
        <SchoolProvider>
            <Routes>
                <Route path="/*" element={<PrivateRoute><ProtectedRoutes /></PrivateRoute>} />
            </Routes>
        </SchoolProvider>
    );
}

function ProtectedRoutes() {
    const { schoolData, loading, userRole, logout } = useSchool();
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        const loadData = delayedRequest(async () => {
            // Thực hiện các request cần thiết ở đây
            setIsDataLoaded(true);
        });

        loadData();

        return () => loadData.cancel();
    }, []);

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    const navItems = getNavItems(userRole);

    if (!isDataLoaded) {
        return <Spin size="large" />;
    }

    return (
        <NotificationProvider>
            <Main navItems={navItems} RightComponent={SchoolHeader} logout={logout}>
                <Routes>
                    <Route path="/" element={<Navigate to="/school/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/students" element={<StudentManagement />} />
                    <Route path="/api-config" element={<ApiConfig />} />
                    <Route path="*" element={<NotFound homeLink={"/school/dashboard"} />} />
                </Routes>
            </Main>
        </NotificationProvider>
    );
}

export default School;