import React, { useState } from 'react';
import { Layout, Typography, Button, Avatar, Menu, Dropdown, Badge, Space } from 'antd';
import { UserOutlined, LogoutOutlined, FileOutlined, MenuOutlined, BellOutlined, DashboardOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useStudent } from '../context/StudentContext';

const { Header } = Layout;
const { Title, Text } = Typography;

const StyledHeader = styled(Header)`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  width: 100%;
  z-index: 1000;
  height: 70px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
`;

const HeaderLogoImage = styled.img`
  height: 40px;
  margin-right: 10px;
`;

const NavMenu = styled.div`
  display: flex;
  align-items: center;
`;

const MenuButton = styled(Button)`
  background: #1890ff;
  border: 2px solid #1890ff;
  color: #fff;
  font-weight: bold;
  height: 36px;
  padding: 0 15px;
  border-radius: 18px;
  transition: all 0.3s ease;

  &:hover, &:focus {
    background: #fff;
    border-color: #1890ff;
    color: #1890ff;
  }
`;

const UserAvatar = styled(Avatar)`
  border: 2px solid #1890ff;
`;

const MobileMenuButton = styled(Button)`
  display: none;
  @media (max-width: 768px) {
    display: block;
    background: #1890ff;
    border: 2px solid #1890ff;
    color: #fff;

    &:hover, &:focus {
      background: #fff;
      border-color: #1890ff;
      color: #1890ff;
    }
  }
`;

const DesktopMenu = styled.div`
  display: flex;
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const AppHeader = ({ appliedProjects = [], acceptedProjects = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  
  // Lấy dữ liệu từ StudentContext
  const { userData, logout, loading } = useStudent();
  const isLoggedIn = !!userData;

  const appliedMenu = (
    <Menu>
      <Menu.ItemGroup title="Dự án đã ứng tuyển">
        {appliedProjects.length > 0 ? (
          appliedProjects.map(project => (
            <Menu.Item key={project._id} onClick={() => navigate(`/project/${project._id}`)}>
              {project.title}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item disabled>Không có dự án nào</Menu.Item>
        )}
      </Menu.ItemGroup>
    </Menu>
  );

  const profileMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <StyledHeader>
      <Logo to="/">
        <HeaderLogoImage src="/logo.png" alt="Logo" />
        <Title level={3} style={{ margin: 0, color: 'rgb(6, 2, 112)' }}>Internship</Title>
      </Logo>
      <NavMenu>
        {isLoggedIn ? (
          <>
            <DesktopMenu>
              <Space size="middle">
                <MenuButton 
                  icon={<DashboardOutlined />} 
                  onClick={() => navigate('/student/dashboard')}
                >
                  Bảng điều khiển
                </MenuButton>
                <Dropdown overlay={appliedMenu} placement="bottomCenter">
                  <MenuButton icon={<FileOutlined />}>
                    Đã ứng tuyển ({appliedProjects.length})
                  </MenuButton>
                </Dropdown>
                <Dropdown overlay={profileMenu} placement="bottomRight">
                  <Space>
                    <UserAvatar size={36} src={userData?.avatar} icon={<UserOutlined />} />
                    <Text strong>{userData?.name || 'Người dùng'}</Text>
                  </Space>
                </Dropdown>
              </Space>
            </DesktopMenu>
            <MobileMenuButton 
              icon={<MenuOutlined />} 
              onClick={() => setMobileMenuVisible(!mobileMenuVisible)}
            />
            {mobileMenuVisible && (
              <MobileMenu>
                <MenuButton 
                  icon={<DashboardOutlined />} 
                  onClick={() => navigate('/student/dashboard')}
                  block
                >
                  Bảng điều khiển
                </MenuButton>
                <Dropdown overlay={appliedMenu} placement="bottomCenter">
                  <MenuButton icon={<FileOutlined />} block>
                    Đã ứng tuyển ({appliedProjects.length})
                  </MenuButton>
                </Dropdown>
                <MenuButton 
                  icon={<LogoutOutlined />}
                  onClick={logout}
                  block
                >
                  Đăng xuất
                </MenuButton>
              </MobileMenu>
            )}
          </>
        ) : (
          <MenuButton 
            icon={<UserOutlined />}
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}>
            Đăng nhập
          </MenuButton>
        )}
      </NavMenu>
    </StyledHeader>
  );
};

export default AppHeader;
