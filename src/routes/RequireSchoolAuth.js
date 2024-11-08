import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import FullScreenLoader from '../common/FullScreenLoader';
import Cookies from 'js-cookie';
import axiosInstance from '../utils/axiosInstance';

const AuthorizationContext = createContext(null);

const RequireSchoolAuth = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleAuthError = (error) => {
    console.error('Lỗi xác thực:', error);
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setToken(null);
    setUser(null);
    navigate('/school/login', { replace: true });
    message.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  };

  const refreshToken = async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      console.error('Không có refresh token');
      return null;
    }
    try {
      const response = await axiosInstance.post('/auth/refresh-token', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      
      Cookies.set('accessToken', accessToken, { expires: 1/24 });
      Cookies.set('schoolRefreshToken', newRefreshToken, { expires: 7 });
      setToken(accessToken);
      setUser(user);
      
      return { accessToken, refreshToken: newRefreshToken, user };
    } catch (error) {
      console.error('Lỗi khi làm mới token:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const storedToken = Cookies.get('accessToken');
      const storedUser = Cookies.get('User');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } else {
        try {
          const newTokens = await refreshToken();
          if (newTokens) {
            setToken(newTokens.accessToken);
            setUser(newTokens.user);
          } else {
            handleAuthError(new Error('Không thể làm mới token'));
          }
        } catch (error) {
          handleAuthError(error);
        } finally {
          setLoading(false);
        }
      }
    };

    checkAndRefreshToken();
  }, []);

  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  }, [token]);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!token) {
    return <Navigate to="/school/login" replace />;
  }

  return (
    <AuthorizationContext.Provider value={{ token, user }}>
      {children}
    </AuthorizationContext.Provider>
  );
};

const useAuthorization = () => useContext(AuthorizationContext);

export { RequireSchoolAuth, useAuthorization };