import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/student/Dashboard';
import NotFound from '../common/Notfound';
import { FaTachometerAlt, FaUserGraduate, FaProjectDiagram, FaUser, FaFileAlt, FaCog } from 'react-icons/fa';
import { Spin } from 'antd';
import StudentHeader from '../components/student/StudentHeader';
import { StudentProvider, useStudent } from '../context/StudentContext';
import Cookies from 'js-cookie';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import PersonalProfile from '../components/student/PersonalProfile';
import Internships from '../components/student/Internships';
import InternshipDetails from '../components/student/InternshipDetails';
import Applications from '../components/student/Applications';
import Settings from '../components/student/Settings';
import { NotificationProvider } from '../context/NotificationContext'; // Import NotificationProvider
import { debounce } from 'lodash';
import axios from 'axios';

const delayedRequest = (func, delay = 1000) => {
    return debounce(func, delay, { leading: true, trailing: false });
};

const getNavItems = () => {
    return [
        { key: "1", to: "/student/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
        { key: "2", to: "/student/internships", label: "Thực tập", icon: <FaProjectDiagram /> },
        { key: "3", to: "/student/applications", label: "Đơn ứng tuyển", icon: <FaFileAlt /> },
        { key: "4", to: "/student/profile", label: "Hồ sơ cá nhân", icon: <FaUser /> },
        { key: "5", to: "/student/settings", label: "Cài đặt", icon: <FaCog /> },
    ];
};

const isAuthenticated = () => {
    console.log('Checking authentication status');
    return Boolean(Cookies.get('accessToken'));
};



function PrivateRoute({ children }) {
    const { loading, checkAuthStatus, userData, isAuthChecked, isUserDataFetched } = useStudent();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthChecked && !isUserDataFetched) {
            checkAuthStatus();
        }
    }, [checkAuthStatus, isAuthChecked, isUserDataFetched]);

    useEffect(() => {
        if (isAuthChecked && !userData) {
            navigate('/login', { replace: true });
        }
    }, [isAuthChecked, userData, navigate]);

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    return userData ? <NotificationProvider>{children}</NotificationProvider> : null;
}

function Student() {
    return (
        <StudentProvider>
            <Routes>
                <Route path="/*" element={<PrivateRoute><ProtectedRoutes /></PrivateRoute>} />
            </Routes>
        </StudentProvider>
    );
}

function ProtectedRoutes() {
    const { studentData, loading, logout } = useStudent();
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

    const navItems = getNavItems();


    return (
        <Main navItems={navItems} RightComponent={StudentHeader} logout={logout}>
            <Routes>
                <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/internships" element={<Internships />} />
                <Route path="/internships/:id" element={<InternshipDetails />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/profile" element={<PersonalProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound homeLink={"/student/dashboard"} />} />
            </Routes>
        </Main>
    );
}

export default Student;
