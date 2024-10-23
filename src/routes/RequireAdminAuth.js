import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message } from 'antd';
import FullScreenLoader from '../common/FullScreenLoader';
import Cookies from 'js-cookie';

const AuthorizationContext = createContext(null);

const RequireAdminAuth = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleAuthError = (error) => {
    console.error('Lỗi xác thực:', error);
    Cookies.remove('adminAccessToken');
    Cookies.remove('adminRefreshToken');
    setToken(null);
    setUser(null);
    navigate('/admin/login', { replace: true });
    message.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  };

  const refreshToken = async () => {
    const refreshToken = Cookies.get('adminRefreshToken');
    if (!refreshToken) {
      console.error('Không có refresh token');
      return null;
    }
    try {
      const response = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken, user } = response.data;
      Cookies.set('adminAccessToken', accessToken, { expires: 1/24 });
      Cookies.set('adminRefreshToken', newRefreshToken, { expires: 7 });
      setToken(accessToken);
      setUser(user);
      
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { accessToken, refreshToken: newRefreshToken, user };
    } catch (error) {
      console.error('Lỗi khi làm mới token:', error);
      return null;
    }
  };

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = Cookies.get('adminAccessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newTokens = await refreshToken();
          if (newTokens) {
            axiosInstance.defaults.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
            return axiosInstance(originalRequest);
          } else {
            handleAuthError(error);
          }
        } catch (refreshError) {
          handleAuthError(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const storedToken = Cookies.get('adminAccessToken');
      if (storedToken) {
        setToken(storedToken);
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
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <AuthorizationContext.Provider value={{ axiosInstance, token, user }}>
      {children}
    </AuthorizationContext.Provider>
  );
};

const useAuthorization = () => useContext(AuthorizationContext);

export { RequireAdminAuth, useAuthorization };
