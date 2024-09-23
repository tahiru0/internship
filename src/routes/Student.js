import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
    return Boolean(Cookies.get('accessToken'));
};

function PrivateRoute({ children }) {
    const { loading } = useStudent();

    useEffect(() => {
        if (loading) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    }, [loading]);

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
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
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Spin size="large" />
                </div>
            ) : (
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
            )}
        </Main>
    );
}

export default Student;