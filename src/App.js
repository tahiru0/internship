import './App.css';
import HomePage from './components/HomePage';
import Login from './components/Login';
import { Routes, Route, useLocation } from 'react-router-dom';
import Admin from './routes/Admin';
import Company from './routes/Company';
import Instructor from './routes/Instructor';
import School from './routes/School';
import Register from './components/company/Register';
import SchoolRegister from './components/school/Register';
import StudentRegister from './components/student/Register';
import { useEffect } from 'react';
import { Modal } from 'antd';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import CompanyLogin from './components/company/Login';
import SchoolLogin from './components/school/Login';
import { CompanyProvider } from './context/CompanyContext';
import { SchoolProvider } from './context/SchoolContext';
import JobSearch from './components/PublicJobSearch';
import { StudentProvider } from './context/StudentContext'; // Thêm dòng này
import ForgotPassword from './components/company/ForgotPassword'; // Thêm dòng này
import Student from './routes/Student'; // Thêm dòng này
import ProjectDetail from './components/ProjectDetail'; // Thêm dòng này
import AppLayout from './components/AppLayout'; // Thêm dòng này
import NotFound from './components/NotFound'; // Thêm dòng này

function ProtectedRoutes() {
  const location = useLocation();
  const { resetNotifications } = useNotification();

  useEffect(() => {
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

    // Reset notifications when not in protected routes
    if (!location.pathname.match(/^\/(admin|company|instructor|school|student)/)) {
      resetNotifications();
    }
  }, [location, resetNotifications]);

  useEffect(() => {
    // Reset notifications when location changes
    if (!location.pathname.match(/^\/(admin|company|instructor|school|student)/)) {
      resetNotifications();
    }
  }, [location.pathname, resetNotifications]);

  return (
    <Routes>
      <Route
        path="/company/*"
        element={<Company />}
      />
      <Route path="/instructor/*" element={<Instructor />} />
      <Route
        path="/school/*"
        element={<School />}
      />
      <Route
        path="/student/*"
        element={<Student />}
      />
    </Routes>
  );
}

function AppContent() {
  return (
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
      
      {/* Thay đổi route này */}
      <Route path="/company/*" element={
        <NotificationProvider>
          <ProtectedRoutes />
        </NotificationProvider>
      } />
      <Route path="/instructor/*" element={
        <NotificationProvider>
          <ProtectedRoutes />
        </NotificationProvider>
      } />
      <Route path="/school/*" element={
        <NotificationProvider>
          <ProtectedRoutes />
        </NotificationProvider>
      } />
      <Route path="/student/*" element={
        <NotificationProvider>
          <ProtectedRoutes />
        </NotificationProvider>
      } />
      
      {/* Đặt route cho trang 404 xuống cuối cùng */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return <AppContent />;
}

export default App;