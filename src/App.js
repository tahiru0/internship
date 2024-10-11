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
  }, [location]);

  return (
    <Routes>
      <Route path="/company/*" element={<Company />} />
      <Route path="/instructor/*" element={<Instructor />} />
      <Route path="/school/*" element={<School />} />
      <Route path="/student/*" element={<Student />} />
      <Route path="*" element={<NotFound />} /> {/* Catch-all route for NotFound */}
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
      
      <Route path="/*" element={<ProtectedRoutes />} />
      
    </Routes>
  );
}

function App() {
  return <AppContent />;
}

export default App; 
