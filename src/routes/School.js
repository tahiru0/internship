import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/school/Dashboard';
import NotFound from '../common/Notfound';
import { FaTachometerAlt, FaUserGraduate, FaUniversity, FaUserCog } from 'react-icons/fa';
import { Spin } from 'antd';
import SchoolHeader from '../components/school/SchoolHeader';
import { SchoolProvider, useSchool } from '../context/SchoolContext';
import { NotificationProvider } from '../context/NotificationContext';
import Cookies from 'js-cookie';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { debounce } from 'lodash';
import FullScreenLoader from '../common/FullScreenLoader';
import FacultyManagement from '../components/school/FacultyManagement';
import AccountManagement from '../components/school/AccountManagement';

// Import StudentManagement component cho admin
import AdminStudentManagement from '../components/school/StudentManagement';
// Import StudentManagement component cho trưởng khoa
import FacultyHeadStudentManagement from '../components/school/faculty-head/StudentManagement';

const delayedRequest = (func, delay = 1000) => {
    return debounce(func, delay, { leading: true, trailing: false });
};

const getNavItems = (userRole) => {
    const commonItems = [
        { key: "1", to: "/school/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    ];

    const adminItems = [
        { key: "2", to: "/school/students", label: "Quản lý sinh viên", icon: <FaUserGraduate /> },
        { key: "3", to: "/school/faculties", label: "Quản lý khoa", icon: <FaUniversity /> },
        { key: "4", to: "/school/accounts", label: "Quản lý tài khoản", icon: <FaUserCog /> },
    ];

    const facultyHeadItems = [
        { key: "2", to: "/school/students", label: "Quản lý sinh viên", icon: <FaUserGraduate /> },
        { key: "3", to: "/school/accounts", label: "Quản lý tài khoản", icon: <FaUserCog /> },
    ];

    if (userRole === 'admin') {
        return [...commonItems, ...adminItems];
    } else if (userRole === 'faculty-head') {
        return [...commonItems, ...facultyHeadItems];
    }

    return commonItems;
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

    if (loading) {
        return <Spin size="large" />;
    }

    return schoolData ? children : null;
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
            <Suspense fallback={<FullScreenLoader />}>
                <Main navItems={navItems} RightComponent={SchoolHeader} logout={logout}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/school/dashboard" replace />} />
                        <Route path="/dashboard" element={
                            <Suspense fallback={<FullScreenLoader />}>
                                <Dashboard />
                            </Suspense>
                        } />
                        {userRole === 'admin' && (
                            <>
                                <Route path="/students" element={<AdminStudentManagement />} />
                                <Route path="/faculties" element={
                                    <Suspense fallback={<FullScreenLoader />}>
                                        <FacultyManagement />
                                    </Suspense>
                                } />
                                <Route path="/accounts" element={
                                    <Suspense fallback={<FullScreenLoader />}>
                                        <AccountManagement />
                                    </Suspense>
                                } />
                            </>
                        )}
                        {userRole === 'faculty-head' && (
                            <Route path="/students" element={<FacultyHeadStudentManagement />} />
                        )}
                        {(userRole === 'admin' || userRole === 'faculty-head' ) && (
                            <Route path="/accounts" element={
                                <Suspense fallback={<FullScreenLoader />}>
                                    <AccountManagement />
                                </Suspense>
                            } />
                        )}
                        <Route path="*" element={<NotFound homeLink={"/school/dashboard"} />} />
                    </Routes>
                </Main>
            </Suspense>
        </NotificationProvider>
    );
}

export default School;
