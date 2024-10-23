import React, { Suspense, lazy, useState, useEffect, useContext } from 'react';
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { CompanyProvider } from './context/CompanyContext';
import { SchoolProvider } from './context/SchoolContext';
import { StudentProvider } from './context/StudentContext';
import FullScreenLoader from './common/FullScreenLoader';
import axios from 'axios';
import { MaintenanceContext, MaintenanceProvider } from './context/MaintenanceContext';

const HomePage = lazy(() => import('./components/HomePage'));
const Login = lazy(() => import('./components/Login'));
const Admin = lazy(() => import('./routes/Admin'));
const Company = lazy(() => import('./routes/Company'));
const Instructor = lazy(() => import('./routes/Instructor'));
const School = lazy(() => import('./routes/School'));
const Register = lazy(() => import('./components/company/Register'));
const SchoolRegister = lazy(() => import('./components/school/Register'));
const StudentRegister = lazy(() => import('./components/student/Register'));
const CompanyLogin = lazy(() => import('./components/company/Login'));
const SchoolLogin = lazy(() => import('./components/school/Login'));
const JobSearch = lazy(() => import('./components/PublicJobSearch'));
const ForgotPassword = lazy(() => import('./components/company/ForgotPassword'));
const Student = lazy(() => import('./routes/Student'));
const ProjectDetail = lazy(() => import('./components/ProjectDetail'));
const AppLayout = lazy(() => import('./components/AppLayout'));
const NotFound = lazy(() => import('./components/NotFound'));
const MaintenancePage = lazy(() => import('./components/MaintenancePage'));

function ProtectedRoutes() {
  const location = useLocation();

  React.useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const error = queryParams.get('error');
    const message = queryParams.get('message');

    if (error) {
      Modal.error({
        title: 'Lỗi',
        content: error,
      });
    }

    if (message) {
      Modal.success({
        title: 'Thông báo',
        content: message,
      });
    }
  }, [location]);

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/company/*" element={<Company />} />
        <Route path="/instructor/*" element={<Instructor />} />
        <Route path="/school/*" element={<School />} />
        <Route path="/student/*" element={<Student />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function AppContent() {
  const { maintenanceMode, setMaintenanceMode } = useContext(MaintenanceContext);
  const location = useLocation();

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/health-check');
        setMaintenanceMode({
          isActive: false,
          message: ''
        });
      } catch (error) {
        if (error.response && error.response.status === 503) {
          setMaintenanceMode({
            isActive: true,
            message: error.response.data.message || 'Hệ thống đang trong chế độ bảo trì'
          });
        }
      }
    };

    checkMaintenanceStatus();
  }, [location, setMaintenanceMode]); // Thêm location vào dependencies

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (maintenanceMode.isActive && !isAdminRoute) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <MaintenancePage message={maintenanceMode.message} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route 
          path="/login" 
          element={
            <StudentProvider>
              <Login />
            </StudentProvider>
          } 
        />
        <Route 
          path="/company/login" 
          element={
            <CompanyProvider>
              <CompanyLogin />
            </CompanyProvider>
          } 
        />
        <Route 
          path="/school/login" 
          element={
            <SchoolProvider>
              <SchoolLogin />
            </SchoolProvider>
          } 
        />
        <Route path="/company/register/*" element={<Register/>}/>
        <Route path="/school/register/*" element={<SchoolRegister/>}/>
        <Route path="/student/register/*" element={<StudentRegister/>}/>
        <Route path="/company/forgot-password" element={<ForgotPassword />} />
        <Route path="/company/reset-password/:resetToken" element={<ForgotPassword />} />
        <Route path="/jobs" element={
          <AppLayout>
            <JobSearch />
          </AppLayout>
        } />
        <Route path="/project/:id" element={
          <AppLayout>
            <ProjectDetail />
          </AppLayout>
        } />
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/*" element={<Admin />} /> 
        
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <MaintenanceProvider>
      <AppContent />
    </MaintenanceProvider>
  );
}

export default App;
