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
import { useEffect } from 'react';
import { Modal } from 'antd';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import CompanyLogin from './components/company/Login';
import SchoolLogin from './components/school/Login';
import { CompanyProvider } from './context/CompanyContext';
import { SchoolProvider } from './context/SchoolContext';

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
    if (!location.pathname.match(/^\/(admin|company|instructor|school)/)) {
      resetNotifications();
    }
  }, [location, resetNotifications]);

  useEffect(() => {
    // Reset notifications when location changes
    if (!location.pathname.match(/^\/(admin|company|instructor|school)/)) {
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
    </Routes>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/*" element={<Admin />} /> 
      <Route path="/*" element={
        <NotificationProvider>
          <ProtectedRoutes />
        </NotificationProvider>
      } />
    </Routes>
  );
}

function App() {
  return <AppContent />;
}

export default App;