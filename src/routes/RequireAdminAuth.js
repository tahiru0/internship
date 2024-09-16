import React, { useState, useEffect, createContext, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { message, Skeleton } from 'antd';
import { Layout, Menu } from 'antd';
import { UserOutlined, FileOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';

const { Header, Content, Sider } = Layout;

const AuthorizationContext = createContext(null);

const RequireAdminAuth = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = Cookies.get('adminAccessToken');
    if (storedToken) {
      setToken(storedToken);
    } else {
      navigate('/admin/login', { replace: true });
    }
    setLoading(false);
  }, [navigate]);

  const handleAuthError = (error) => {
    console.error('Auth error:', error);
    Cookies.remove('adminAccessToken');
    Cookies.remove('adminRefreshToken');
    setToken(null);
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
      
      // Cập nhật axiosInstance với token mới
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { accessToken, refreshToken: newRefreshToken, user };
    } catch (error) {
      console.error('Lỗi khi làm mới token:', error);
      handleAuthError(error);
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
          }
        } catch (refreshError) {
          return Promise.reject(refreshError);
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
      } else {
        const newTokens = await refreshToken();
        if (newTokens) {
          setToken(newTokens.accessToken);
        } else {
          navigate('/admin/login', { replace: true });
        }
      }
      setLoading(false);
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
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={256} style={{ background: '#fff' }}>
          <Menu mode="inline" defaultSelectedKeys={['1']}>
            <Menu.Item key="1" icon={<UserOutlined />}>
              User
            </Menu.Item>
            <Menu.Item key="2" icon={<FileOutlined />}>
              Files
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ padding: '0 16px', background: '#fff' }}>
            <Skeleton.Input style={{ width: 200 }} active />
          </Header>
          <Content style={{ padding: '16px', margin: '16px', background: '#fff' }}>
            <Skeleton active paragraph={{ rows: 4 }} />
            <Skeleton active paragraph={{ rows: 4 }} />
            <Skeleton active paragraph={{ rows: 4 }} />
          </Content>
        </Layout>
      </Layout>
    );
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