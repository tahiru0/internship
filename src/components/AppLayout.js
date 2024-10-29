import React, { useState, useEffect } from 'react';
import { Layout, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AppHeader from './Header';
import axiosInstance, { withAuth } from '../utils/axiosInstance';

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [appliedProjects, setAppliedProjects] = useState([]);
  const [acceptedProjects, setAcceptedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    setIsLoading(true);
    const accessToken = Cookies.get('accessToken');
    if (accessToken) {
      try {
        const [meResponse, projectsResponse] = await Promise.all([
          axiosInstance.get('/student/me', withAuth()),
          axiosInstance.get('/student/applied-and-accepted-projects', withAuth())
        ]);

        if (meResponse.data && meResponse.data.student) {
          setIsLoggedIn(true);
          setStudentData(meResponse.data.student);
        } else {
          setIsLoggedIn(false);
          setStudentData(null);
        }

        if (projectsResponse.data) {
          setAppliedProjects(projectsResponse.data.appliedProjects || []);
          setAcceptedProjects(projectsResponse.data.acceptedProjects || []);
        } else {
          setAppliedProjects([]);
          setAcceptedProjects([]);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error.message);
        setIsLoggedIn(false);
        setStudentData(null);
        setAppliedProjects([]);
        setAcceptedProjects([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoggedIn(false);
      setStudentData(null);
      setAppliedProjects([]);
      setAcceptedProjects([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogout = () => {
    Cookies.remove('accessToken');
    setIsLoggedIn(false);
    setStudentData(null);
    setAppliedProjects([]);
    setAcceptedProjects([]);
    navigate('/');
  };

  const updateAppliedProjects = (newProject) => {
    setAppliedProjects(prevProjects => [...prevProjects, newProject]);
  };

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        isLoggedIn,
        studentData,
        appliedProjects,
        acceptedProjects,
        updateAppliedProjects,
        studentData ,
        onLogout: handleLogout
      });
    }
    return child;
  });

  return (
    <Layout>
      <AppHeader 
        isLoggedIn={isLoggedIn} 
        studentData={studentData} 
        onLogout={handleLogout}
        appliedProjects={appliedProjects}
        acceptedProjects={acceptedProjects}
      />
      <Content style={{ marginTop: 64 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" />
          </div>
        ) : (
          childrenWithProps
        )}
      </Content>
    </Layout>
  );
};

export default AppLayout;