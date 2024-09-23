import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import AppHeader from './Header';

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [appliedProjects, setAppliedProjects] = useState([]);
  const [acceptedProjects, setAcceptedProjects] = useState([]);

  const fetchUserData = async () => {
    const accessToken = Cookies.get('accessToken');
    if (accessToken) {
      try {
        const [meResponse, projectsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/student/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          axios.get('http://localhost:5000/api/student/applied-and-accepted-projects', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        ]);

        if (meResponse.data && meResponse.data.student) {
          setIsLoggedIn(true);
          setStudentData(meResponse.data.student);
        }

        if (projectsResponse.data) {
          setAppliedProjects(projectsResponse.data.appliedProjects || []);
          setAcceptedProjects(projectsResponse.data.acceptedProjects || []);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
      }
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
      return React.cloneElement(child, { updateAppliedProjects });
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
        {childrenWithProps}
      </Content>
    </Layout>
  );
};

export default AppLayout;