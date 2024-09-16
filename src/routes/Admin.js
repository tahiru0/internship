import Main from '../layout/Main';
import Dashboard from '../components/admin/Dashboard';
import Company from '../components/admin/Company';
import { RequireAdminAuth } from './RequireAdminAuth';
import Login from '../components/admin/AdminLoginPage';
import School from '../components/admin/School';
import Contact from '../components/admin/Contact';
import NotificationManager from '../components/admin/NotificationManager';
import NotFound from '../common/Notfound';
import Email from '../components/admin/Email'; // Thêm dòng này
import { FaTachometerAlt, FaBuilding, FaUniversity, FaBell, FaEnvelope } from 'react-icons/fa';
import { RiBuilding2Fill } from 'react-icons/ri';
import { FaBeer } from "react-icons/fa";
import { Routes, Route, Navigate } from 'react-router-dom'; 

const navItems = [
  { key: "1", to: "/admin/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { key: "2", to: "/admin/company", label: "Công ty", icon: <RiBuilding2Fill /> },
  { key: "3", to: "/admin/school", label: "Trường đại học", icon: <FaUniversity /> },
  // { key: "4", to: "/admin/contact", label: "Liên hệ", icon: <FaBeer /> },
  // { key: "5", to: "/admin/notifications", label: "Thông báo", icon: <FaBell /> }, 
  { key: "6", to: "/admin/email", label: "Email", icon: <FaEnvelope /> }, // Thêm mục mới
];

function Admin() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} /> 
      <Route path="/*" element={
        <RequireAdminAuth>
          <Main navItems={navItems}>
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/company" element={<Company />} /> 
              <Route path="/school" element={<School />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/notifications" element={<NotificationManager />} />
              <Route path="/email" element={<Email />} /> 
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Main>
        </RequireAdminAuth>
      } />
    </Routes>
  );
}

export default Admin;