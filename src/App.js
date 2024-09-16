import './App.css';
import HomePage from './components/HomePage';
import Login from './components/Login';
import { Routes, Route, useLocation } from 'react-router-dom';
import Admin from './routes/Admin';
import Company from './routes/Company';
import Instructor from './routes/Instructor';
import Register from './components/company/Register';
import { useEffect } from 'react';
import { Modal } from 'antd';
import { NotificationProvider } from './context/NotificationContext';

function App() {
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
    <NotificationProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<Admin />} /> 
        <Route path="/company/*" element={<Company />} />
        <Route path="/instructor/*" element={<Instructor />} />
        <Route path="/company/register/*" element={<Register/>}/>
      </Routes>
    </NotificationProvider>
  );
}

export default App;