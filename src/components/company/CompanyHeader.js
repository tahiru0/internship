import React, { useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { BellOutlined, LogoutOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { Avatar, Badge, Dropdown, Input, Menu, Modal, Typography } from 'antd';
import NotificationMenu from '../../layout/NotificationMenu';
import SettingsDrawer from '../../layout/SettingsDrawer';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const { Text } = Typography;

function CompanyHeader({ handleSidenavColor, handleSidenavType, handleFixedNavbar }) {
    const { companyData, logout, isAuthChecked } = useCompany();
    const { unreadCount, fetchUnreadCount } = useNotification();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [notificationDropdownVisible, setNotificationDropdownVisible] = useState(false);

    useEffect(() => {
        if (companyData && isAuthChecked) {
            fetchUnreadCount();
        }
    }, [companyData, fetchUnreadCount, isAuthChecked]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const userName = companyData?.account?.name || '';
    const userEmail = companyData?.account?.email || '';
    const userRole = companyData?.account?.role || '';
    const companyName = companyData?.company?.name || '';
    const companyLogo = companyData?.company?.logo || '';
    const userAvatar = companyData?.account?.avatar || '';

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const showSettingsDrawer = () => {
        setSettingsVisible(true);
    };

    const hideSettingsDrawer = () => {
        setSettingsVisible(false);
    };

    const handleLogout = () => {
        logout();
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    };

    const iconStyle = {
        fontSize: '24px',
        marginLeft: '16px',
        cursor: 'pointer',
        transition: 'color 0.3s',
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="0" disabled>
                {companyLogo && (
                    <img
                        src={companyLogo}
                        alt="Company Logo"
                        style={{ width: '20px', height: 'auto', borderRadius: '8px', marginRight: '10px' }}
                    />
                )}
                <Text strong style={{ fontSize: '16px', marginLeft: '10px' }}>{companyName}</Text>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="1" disabled>
                <Text strong>{userName} ({userRole})</Text>
            </Menu.Item>
            <Menu.Item key="2" disabled>
                <Text type="secondary">{userEmail}</Text>
            </Menu.Item>
            <Menu.Item key="3" icon={<SettingOutlined />} onClick={showSettingsDrawer}>
                Cài đặt
            </Menu.Item>
            <Menu.Item key="4" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
            </Menu.Item>
        </Menu>
    );

    const handleNotificationDropdownVisibleChange = (visible) => {
        setNotificationDropdownVisible(visible);
    };

    const closeNotificationDropdown = () => {
        setNotificationDropdownVisible(false);
    };

    return (
        <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Badge size="small" count={unreadCount || 0} overflowCount={99}>
                    <Dropdown 
                        overlay={<NotificationMenu isMobile={isMobile} onClose={closeNotificationDropdown} />} 
                        trigger={['click']}
                        placement={isMobile ? 'bottomLeft' : 'bottomRight'}
                        getPopupContainer={() => document.body}
                        visible={notificationDropdownVisible}
                        onVisibleChange={handleNotificationDropdownVisibleChange}
                    >
                        <BellOutlined style={iconStyle} />
                    </Dropdown>
                </Badge>
                <SearchOutlined style={iconStyle} onClick={showModal} />
                <Dropdown overlay={userMenu} trigger={['click']}>
                    <Avatar src={userAvatar} style={{ ...iconStyle, cursor: 'pointer' }}>
                        {!userAvatar && userName.charAt(0)}
                    </Avatar>
                </Dropdown>
            </div>
            <Modal
                title="Search"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <Input prefix={<SearchOutlined />} placeholder="Search..." />
            </Modal>
            <SettingsDrawer
                visible={settingsVisible}
                onClose={hideSettingsDrawer}
                handleSidenavColor={handleSidenavColor}
                handleSidenavType={handleSidenavType}
                handleFixedNavbar={handleFixedNavbar}
            />
        </div>
    );
}

export default CompanyHeader;
