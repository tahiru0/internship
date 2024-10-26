import React from 'react';
import Main from '../layout/Main';
import Dashboard from '../components/admin/Dashboard';
import Company from '../components/admin/Company';
import { RequireAdminAuth } from './RequireAdminAuth';
import Login from '../components/admin/AdminLoginPage';
import School from '../components/admin/School';
import Contact from '../components/admin/Contact';
import NotificationManager from '../components/admin/NotificationManager';
import NotFound from '../common/Notfound';
import Email from '../components/admin/Email';
import { FaTachometerAlt, FaBuilding, FaUniversity, FaBell, FaEnvelope, FaCog } from 'react-icons/fa';
import { RiBuilding2Fill } from 'react-icons/ri';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import FullScreenLoader from '../common/FullScreenLoader';
import { UploadOutlined } from '@ant-design/icons';
import DataUpload from '../components/admin/DataUpload';
import AdminHeader from '../components/admin/Header';
import Backup from '../components/admin/Backup';
import { FaDatabase } from 'react-icons/fa';

const navItems = [
  { key: "1", to: "/admin/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { key: "2", to: "/admin/company", label: "Công ty", icon: <RiBuilding2Fill /> },
  { key: "3", to: "/admin/school", label: "Trường đại học", icon: <FaUniversity /> },
  { key: "6", to: "/admin/email", label: "Email", icon: <FaEnvelope /> },
  { key: "8", to: "/admin/data-upload", label: "Tải lên dữ liệu", icon: <UploadOutlined /> },
  { key: "10", to: "/admin/backup", label: "Sao lưu", icon: <FaDatabase /> },
];

function Admin() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} /> 
      <Route path="/*" element={
        <React.Suspense fallback={<FullScreenLoader />}>
          <RequireAdminAuth>
            <Main navItems={navItems} RightComponent={AdminHeader}>
              <Routes>
                <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/company" element={<Company />} /> 
                <Route path="/school" element={<School />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/notifications" element={<NotificationManager />} />
                <Route path="/email" element={<Email />} /> 
                <Route path="/data-upload" element={<DataUpload />} />
                <Route path="/backup" element={<Backup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Main>
          </RequireAdminAuth>
        </React.Suspense>
      } />
    </Routes>
  );
}

export default Admin;
