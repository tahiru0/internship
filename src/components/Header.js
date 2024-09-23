import React from 'react';
import { Layout, Typography, Button, Avatar, Menu, Dropdown, Badge, Space } from 'antd';
import { UserOutlined, LogoutOutlined, FileOutlined, CheckCircleOutlined, BellOutlined, DashboardOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const { Header } = Layout;
const { Title, Text } = Typography;

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: fixed;
  width: 100%;
  z-index: 1000;
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

const IconWrapper = styled.div`
  margin-right: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const StyledBadge = styled(Badge)`
  .ant-badge-count {
    background-color: #52c41a;
  }
`;

const AppHeader = ({ isLoggedIn, studentData, onLogout, appliedProjects = [], acceptedProjects = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
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
          <Space size="large">
            <Button 
              icon={<DashboardOutlined />} 
              onClick={() => navigate('/student/dashboard')}
            >
              Bảng điều khiển
            </Button>
            <Dropdown overlay={appliedMenu} placement="bottomCenter">
              <IconWrapper>
                <StyledBadge count={appliedProjects.length} overflowCount={99}>
                  <Button icon={<FileOutlined />}>Đã ứng tuyển</Button>
                </StyledBadge>
              </IconWrapper>
            </Dropdown>
            <Dropdown overlay={profileMenu} placement="bottomRight">
              <Space>
                <Avatar src={studentData?.avatar} icon={<UserOutlined />} />
                <Text strong>{studentData?.name || 'Người dùng'}</Text>
              </Space>
            </Dropdown>
          </Space>
        ) : (
          <Button 
            type="primary" 
            icon={<UserOutlined />}
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}>
            Đăng nhập
          </Button>
        )}
      </NavMenu>
    </StyledHeader>
  );
};

export default AppHeader;