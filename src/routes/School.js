import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/school/Dashboard';
import NotFound from '../common/Notfound';
import { FaTachometerAlt, FaUserGraduate, FaChalkboardTeacher, FaProjectDiagram } from 'react-icons/fa';
import { Spin } from 'antd';
import SchoolHeader from '../components/school/SchoolHeader';
import { SchoolProvider, useSchool } from '../context/SchoolContext';
import Cookies from 'js-cookie';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import StudentManagement from '../components/school/StudentManagement';
import ApiConfig from '../components/school/ApiConfig';

const getNavItems = (userRole) => {
    const items = [
        { key: "1", to: "/school/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
        { key: "2", to: "/school/students", label: "Quản lý sinh viên", icon: <FaUserGraduate /> },
        { key: "3", to: "/school/api-config", label: "Cấu hình API", icon: <FaProjectDiagram /> },
    ];
    return items;
};

const isAuthenticated = () => {
    return Boolean(Cookies.get('schoolAccessToken'));
};

function PrivateRoute({ children }) {
    const { loading } = useSchool();

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    if (!isAuthenticated()) {
        return <Navigate to="/school/login" replace />;
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

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    const navItems = getNavItems(userRole);

    return (
        <Main navItems={navItems} RightComponent={SchoolHeader} logout={logout}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Routes>
                    <Route path="/" element={<Navigate to="/school/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/students" element={<StudentManagement />} />
                    <Route path="/api-config" element={<ApiConfig />} />
                    <Route path="*" element={<NotFound homeLink={"/school/dashboard"} />} />
                </Routes>
            )}
        </Main>
    );
}

export default School;