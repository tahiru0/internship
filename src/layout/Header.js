import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import {
  Breadcrumb,
  Col,
  Row,
  Typography,
  Button // Thêm Button từ antd
} from "antd";

import { ClockCircleOutlined, CreditCardOutlined, WifiOutlined, MenuUnfoldOutlined, MenuFoldOutlined, MenuOutlined } from '@ant-design/icons'; // Thêm icon collapse

import { NavLink } from "react-router-dom";


const clockIcon = <ClockCircleOutlined />;
const wifiIcon = <WifiOutlined />;
const creditIcon = <CreditCardOutlined />;

function Header({ onPress, name, subName, handleSidenavColor, handleSidenavType, handleFixedNavbar, RightComponent, toggleSidenav, sidenavOpen }) {
  const { Title } = Typography;
  const navigate = useNavigate();

  const nameParts = name.split('/').filter(part => part);

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <Row gutter={[24, 0]}>
        <Col span={24} md={6}>
          <Breadcrumb>
            <Breadcrumb.Item>
              <NavLink to="/">Home</NavLink>
            </Breadcrumb.Item>
            {nameParts.map((part, index) => {
              const isLast = index === nameParts.length - 1;
              const path = `/${nameParts.slice(0, index + 1).join('/')}`;
              return (
                <Breadcrumb.Item key={index} style={{ textTransform: "capitalize" }}>
                  {isLast ? (
                    part
                  ) : (
                    <NavLink to={path}>{part}</NavLink>
                  )}
                </Breadcrumb.Item>
              );
            })}
          </Breadcrumb>
          <div className="ant-page-header-heading">
            <span
              className="ant-page-header-heading-title"
              style={{ textTransform: "capitalize" }}
            >
              {subName.split('/').pop()}
            </span>
          </div>
        </Col>
        <Col span={24} md={18} className="header-control">
          {isSmallScreen && (
            <MenuOutlined
              style={{ fontSize: '24px', cursor: 'pointer', marginLeft: '16px' }} 
              onClick={toggleSidenav}
            />
          )}
          {RightComponent && (
            <RightComponent
              handleSidenavColor={handleSidenavColor}
              handleSidenavType={handleSidenavType}
              handleFixedNavbar={handleFixedNavbar}
            />
          )}
        </Col>
      </Row>
    </>
  );
}

export default Header;

