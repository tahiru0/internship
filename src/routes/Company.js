import React, { useEffect, useCallback, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/company/Dashboard';
import CompanyProfile from '../components/company/CompanyProfile';
import Settings from '../components/company/Settings';
import NotFound from '../common/Notfound';
import { FaTachometerAlt, FaUsers, FaProjectDiagram, FaUser, FaBuilding } from 'react-icons/fa';
import { Spin } from 'antd';
import CompanyHeader from '../components/company/CompanyHeader';
import ProjectManagement from '../components/company/ProjectManagement';
import { CompanyProvider, useCompany } from '../context/CompanyContext';
import { NotificationProvider } from '../context/NotificationContext';
import Cookies from 'js-cookie';
import PersonalProfile from '../components/company/PersonalProfile';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import AccountManagement from '../components/company/AccountManagement';
import CompanyInfo from '../components/company/CompanyInfo';
import FullScreenLoader from '../common/FullScreenLoader';
import ForgotPassword from '../components/company/ForgotPassword';

const getNavItems = (userRole) => {
    const items = [
        { key: "1", to: "/company/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
        { key: "3", to: "/company/projects", label: "Quản lý dự án", icon: <FaProjectDiagram /> },
        { key: "4", to: "/company/personal", label: "Hồ sơ", icon: <FaUser /> },
    ];

    if (userRole === 'admin') {
        items.push({ key: "2", to: "/company/account", label: "Quản lý tài khoản", icon: <FaUsers /> });
        items.push({ key: "5", to: "/company/company-info", label: "Thông tin công ty", icon: <FaBuilding /> });
    }
    return items;
};

const protectedRoutes = [
  '/company/dashboard',
  '/company/account',
  '/company/company-info',
  '/company/projects',
  '/company/profile',
  '/company/setting',
  '/company/personal'
];

function Company() {
    const { loading, companyData, userRole, logout } = useCompany();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = Cookies.get('com_token');
        if (!token && location.pathname !== '/company/login') {
            navigate('/company/login');
        }
    }, [location.pathname, navigate]);

    if (loading) {
        return <FullScreenLoader />;
    }

    if (!companyData && location.pathname !== '/company/login') {
        return <Navigate to="/company/login" replace />;
    }

    const navItems = getNavItems(userRole);

    return (
        <Main navItems={navItems} RightComponent={CompanyHeader} logout={logout}>
            <Routes>
                <Route path="/" element={<Navigate to="/company/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {userRole === 'admin' && (
                    <>
                        <Route path="/account" element={<AccountManagement />} />
                        <Route path="/company-info" element={<CompanyInfo />} />
                    </>
                )}
                <Route path="/projects" element={<ProjectManagement />} />
                <Route path="/profile" element={<CompanyProfile />} />
                <Route path="/setting" element={<Settings />} />
                <Route path="/personal" element={<PersonalProfile />} />
                <Route path="*" element={<NotFound homeLink={"/company/dashboard"} />} />
            </Routes>
        </Main>
    );
}

export default function CompanyWrapper() {
    return (
        <CompanyProvider>
            <NotificationProvider>
                <Company />
            </NotificationProvider>
        </CompanyProvider>
    );
}
