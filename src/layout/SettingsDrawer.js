import React, { useState, useEffect } from 'react';
import { Drawer, Typography, Button, Switch } from 'antd';
import styled from 'styled-components';
import Cookies from 'js-cookie';

const ButtonContainer = styled.div`
  .ant-btn-primary {
    background-color: #1890ff;
  }
  .ant-btn-success {
    background-color: #52c41a;
  }
  .ant-btn-yellow {
    background-color: #fadb14;
  }
  .ant-btn-black {
    background-color: #262626;
    color: #fff;
    border: 0px;
    border-radius: 5px;
  }
  .ant-switch-active {
    background-color: #1890ff;
  }
`;

const SettingsDrawer = ({ visible, onClose, handleSidenavColor, handleSidenavType, handleFixedNavbar }) => {
  const [sidenavType, setSidenavType] = useState(Cookies.get('sidenavType') || "transparent");
  const [sidenavColor, setSidenavColor] = useState(Cookies.get('sidenavColor') || "#1890ff");
  const [isNavbarFixed, setIsNavbarFixed] = useState(Cookies.get('isNavbarFixed') === 'true');

  useEffect(() => {
    handleSidenavColor(sidenavColor);
    handleSidenavType(sidenavType);
    handleFixedNavbar(isNavbarFixed);
  }, [sidenavColor, sidenavType, isNavbarFixed, handleSidenavColor, handleSidenavType, handleFixedNavbar]);

  const handleSidenavColorChange = (color) => {
    setSidenavColor(color);
    Cookies.set('sidenavColor', color, { expires: 7 });
    handleSidenavColor(color);
  };

  const handleSidenavTypeChange = (type) => {
    setSidenavType(type);
    Cookies.set('sidenavType', type, { expires: 7 });
    handleSidenavType(type);
  };

  const handleFixedNavbarChange = (isFixed) => {
    setIsNavbarFixed(isFixed);
    Cookies.set('isNavbarFixed', isFixed, { expires: 7 });
    handleFixedNavbar(isFixed);
  };

  return (
    <Drawer
      className="settings-drawer"
      mask={true}
      width={360}
      onClose={onClose}
      placement="right"
      visible={visible}
    >
      <div layout="vertical">
        <Typography.Title level={4}>
          Cấu hình
        </Typography.Title>
        <Typography.Title level={5}>Màu sắc thanh bên</Typography.Title>
        <div className="theme-color mb-2">
          <ButtonContainer>
            <Button type="primary" onClick={() => handleSidenavColorChange("#1890ff")}>Xanh dương</Button>
            <Button type="success" onClick={() => handleSidenavColorChange("#52c41a")}>Xanh lá</Button>
            <Button type="danger" onClick={() => handleSidenavColorChange("#d9363e")}>Đỏ</Button>
            <Button type="yellow" onClick={() => handleSidenavColorChange("#fadb14")}>Vàng</Button>
            <Button type="black" onClick={() => handleSidenavColorChange("#111")}>Đen</Button>
          </ButtonContainer>
        </div>
        <div className="sidebarnav-color mb-2">
          <Typography.Title level={5}>Loại thanh bên</Typography.Title>
          <Typography.Text>Chọn giữa 2 loại thanh bên khác nhau.</Typography.Text>
          <ButtonContainer className="trans">
            <Button
              type={sidenavType === "transparent" ? "primary" : "white"}
              onClick={() => handleSidenavTypeChange("transparent")}
            >
              TRONG SUỐT
            </Button>
            <Button
              type={sidenavType === "white" ? "primary" : "white"}
              onClick={() => handleSidenavTypeChange("white")}
            >
              TRẮNG
            </Button>
          </ButtonContainer>
        </div>
        <div className="fixed-nav mb-2">
          <Typography.Title level={5}>Thanh điều hướng cố định</Typography.Title>
          <Switch checked={isNavbarFixed} onChange={handleFixedNavbarChange} />
        </div>
      </div>
    </Drawer>
  );
};

export default SettingsDrawer;
