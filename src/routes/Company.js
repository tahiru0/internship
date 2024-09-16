import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/company/Dashboard';
import CompanyProfile from '../components/company/CompanyProfile';
import Settings from '../components/company/Settings';
import NotFound from '../common/Notfound';
import { FaTachometerAlt, FaUsers, FaProjectDiagram, FaUser, FaBuilding } from 'react-icons/fa';
import { Spin } from 'antd';
import Login from '../components/company/Login';
import CompanyHeader from '../components/company/CompanyHeader';
import ProjectManagement from '../components/company/ProjectManagement';
import { CompanyProvider, useCompany } from '../context/CompanyContext';
import Cookies from 'js-cookie';
import PersonalProfile from '../components/company/PersonalProfile';
import { useEffect } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import AccountManagement from '../components/company/AccountManagement';
import ForgotPassword from '../components/company/ForgotPassword';
import CompanyInfo from '../components/company/CompanyInfo';

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

const isAuthenticated = () => {
    return Boolean(Cookies.get('accessToken'));
};

function PrivateRoute({ children }) {
    const { loading } = useCompany();

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    if (loading) {
        return null; // Không hiển thị gì khi đang tải
    }

    return isAuthenticated() ? children : <Navigate to="/company/login" replace />;
}

function Company() {
    return (
        <CompanyProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/forgot-password/step2/:resetToken" element={<ForgotPassword />} />
                <Route path="/*" element={<PrivateRoute><ProtectedRoutes /></PrivateRoute>} />
            </Routes>
        </CompanyProvider>
    );
}

function ProtectedRoutes() {
    const { companyData, loading, userRole, logout } = useCompany(); // Destructure companyData, loading, userRole, and logout

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    if (loading) return null; // Không hiển thị gì khi đang tải

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

export default Company;