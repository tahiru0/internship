import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Main from '../layout/Main';
import Dashboard from '../components/school/Dashboard';
import FacultyManagement from '../components/school/FacultyManagement';
import AccountManagement from '../components/school/AccountManagement';
import StudentManagement from '../components/school/StudentManagement';
import NotFound from '../common/Notfound';
import { RequireSchoolAuth } from './RequireSchoolAuth'; // Giả sử bạn có RequireSchoolAuth để kiểm tra xác thực
import { SchoolProvider, useSchool } from '../context/SchoolContext';
import FullScreenLoader from '../common/FullScreenLoader';
import { NotificationProvider } from '../context/NotificationContext';
import { FaTachometerAlt, FaUserGraduate, FaUniversity, FaUserCog } from 'react-icons/fa';

const navItems = [
    { key: "1", to: "/school/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { key: "2", to: "/school/students", label: "Quản lý sinh viên", icon: <FaUserGraduate /> },
    { key: "3", to: "/school/faculties", label: "Quản lý khoa", icon: <FaUniversity /> },
    { key: "4", to: "/school/accounts", label: "Quản lý tài khoản", icon: <FaUserCog /> },
];

function School() {
    return (
        <SchoolProvider>
            <Routes>
                <Route path="/login" element={<Navigate to="/school/login" replace />} /> {/* Route cho trang đăng nhập */}
                <Route path="/*" element={
                    <RequireSchoolAuth>
                        <Main navItems={navItems}>
                            <Routes>
                                <Route path="/" element={<Navigate to="/school/dashboard" replace />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/students" element={<StudentManagement />} />
                                <Route path="/faculties" element={<FacultyManagement />} />
                                <Route path="/accounts" element={<AccountManagement />} />
                                <Route path="*" element={<NotFound homeLink={"/school/dashboard"} />} />
                            </Routes>
                        </Main>
                    </RequireSchoolAuth>
                } />
            </Routes>
        </SchoolProvider>
    );
}

export default School;