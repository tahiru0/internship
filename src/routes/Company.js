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
    const [accessToken, setAccessToken] = useState(Cookies.get('accessToken'));
    const { loading, authState, companyData, userRole, logout, isAuthChecked, isRedirecting, setIsRedirecting, checkAuthStatus, refreshToken } = useCompany();
    const navigate = useNavigate();
    const location = useLocation();

    const isProtectedRoute = useCallback((path) => {
        return protectedRoutes.some(route => path.startsWith(route));
    }, []);

    useEffect(() => {
        const currentToken = Cookies.get('accessToken');
        setAccessToken(currentToken);

        if (authState === 'unauthenticated' && !currentToken && isProtectedRoute(location.pathname)) {
            console.log('Unauthenticated, redirecting to login...');
            navigate('/company/login', { replace: true });
        } else if (authState === 'unauthenticated' && currentToken) {
            console.log('Token exists but unauthenticated, checking auth status...');
            checkAuthStatus();
        }
    }, [authState, navigate, location.pathname, isProtectedRoute, checkAuthStatus]);

    useEffect(() => {
        if (location.pathname === '/company/login') {
            setIsRedirecting(false);
        }
    }, [location.pathname, setIsRedirecting]);

    useEffect(() => {
        if (authState === 'checking') {
            checkAuthStatus();
        }
    }, [authState, checkAuthStatus]);

    if (authState === 'checking') {
        return <FullScreenLoader />;
    }

    if (authState === 'unauthenticated') {
        console.log('Redirecting to login...');
        const refreshTokenExists = Cookies.get('refreshToken');
        if (refreshTokenExists && !isRedirecting) {
            setIsRedirecting(true);
            refreshToken().then(newTokens => {
                if (newTokens) {
                    checkAuthStatus();
                } else {
                    navigate('/company/login', { replace: true });
                }
            }).finally(() => {
                setIsRedirecting(false);
            });
        } else if (!isRedirecting) {
            setIsRedirecting(true);
            navigate('/company/login', { replace: true });
        }
        return <Navigate to="/company/login" replace />;
    }

    const navItems = getNavItems(userRole);

    return (
        <NotificationProvider>
            <Main navItems={navItems} RightComponent={CompanyHeader} logout={logout}>
                {authState === 'checking' ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                        <span>Đang tải...</span>
                    </div>
                ) : (
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
                )}
            </Main>
        </NotificationProvider>
    );
}

export default function CompanyWrapper() {
    return (
        <CompanyProvider>
            <Company />
        </CompanyProvider>
    );
}
