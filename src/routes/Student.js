import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/student/Dashboard';
import NotFound from '../common/Notfound';
import { FaTachometerAlt, FaProjectDiagram, FaUser, FaFileAlt, FaCog } from 'react-icons/fa';
import StudentHeader from '../components/student/StudentHeader';
import { StudentProvider, useStudent } from '../context/StudentContext';
import { NotificationProvider } from '../context/NotificationContext';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import PersonalProfile from '../components/student/PersonalProfile';
import Applications from '../components/student/Applications';
import Settings from '../components/student/Settings';
import CurrentProjects from '../components/student/CurrentProjects';
import CurrentProjectDetail from '../components/student/CurrentProjectDetail';

const getNavItems = () => {
    return [
        { key: "1", to: "/student/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
        { key: "3", to: "/student/current-projects", label: "Dự án hiện tại", icon: <FaProjectDiagram /> },
        { key: "4", to: "/student/applications", label: "Đơn ứng tuyển", icon: <FaFileAlt /> },
        { key: "5", to: "/student/profile", label: "Hồ sơ cá nhân", icon: <FaUser /> },
        { key: "6", to: "/student/settings", label: "Cài đặt", icon: <FaCog /> },
    ];
};

function StudentRoutes() {
    const { userData, loading, logout } = useStudent();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navItems = getNavItems();

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);


    return (
        <Main navItems={navItems} RightComponent={StudentHeader} logout={logout}>
            <Routes>
                <Route path="/" element={<Navigate to="dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/current-projects" element={<CurrentProjects />} />
                <Route path="/current-projects/:id" element={<CurrentProjectDetail />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/profile" element={<PersonalProfile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound homeLink={"/student/dashboard"} />} />
            </Routes>
        </Main>
    );
}

function Student() {
    return (
        <NotificationProvider>
            <StudentProvider>
                <StudentRoutes />
            </StudentProvider>
        </NotificationProvider>
    );
}

export default Student;
