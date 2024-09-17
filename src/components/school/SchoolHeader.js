import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { BellOutlined, LogoutOutlined, SearchOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Dropdown, Input, Menu, Modal, Typography, Skeleton } from 'antd';
import NotificationMenu from '../../layout/NotificationMenu';
import SettingsDrawer from '../../layout/SettingsDrawer';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const { Text } = Typography;

function SchoolHeader({ handleSidenavColor, handleSidenavType, handleFixedNavbar }) {
    const { schoolData, loading, logout } = useSchool();
    const { unreadCount, fetchUnreadCount } = useNotification();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [notificationDropdownVisible, setNotificationDropdownVisible] = useState(false);

    useEffect(() => {
        if (schoolData) {
            fetchUnreadCount();
        }
    }, [schoolData, fetchUnreadCount]);

    useEffect(() => {
        console.log('Current unreadCount in SchoolHeader:', unreadCount);
    }, [unreadCount]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Skeleton.Avatar active size="large" style={{ marginRight: '10px' }} />
                <Skeleton.Input active style={{ width: 30, marginRight: '10px' }} />
                <div style={{ display: 'flex', marginLeft: 'auto' }}>
                    <Skeleton.Button active style={{ marginRight: '16px', width: 40, height: 40 }} />
                    <Skeleton.Button active style={{ marginRight: '16px', width: 40, height: 40 }} />
                    <Skeleton.Button active style={{ width: 40, height: 40 }} />
                </div>
            </div>
        );
    }

    const userName = schoolData?.account?.name || '';
    const userEmail = schoolData?.account?.email || '';
    const userRole = schoolData?.account?.role?.name || ''; // Thay đổi ở đây
    const schoolName = schoolData?.school?.name || '';
    const schoolLogo = schoolData?.school?.logo || '';

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

    const logoStyle = {
        width: '50px',
        height: 'auto',
        borderRadius: '8px',
        marginRight: '10px',
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
                {schoolLogo && (
                    <img
                        src={schoolLogo}
                        alt="School Logo"
                        style={{ width: '20px', height: 'auto', borderRadius: '8px', marginRight: '10px' }}
                    />
                )}
                <Text strong style={{ fontSize: '16px', marginLeft: '10px' }}>{schoolName}</Text>
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
                    <UserOutlined style={iconStyle} />
                </Dropdown>
            </div>
            <Modal
                title="Tìm kiếm"
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm..." />
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
};

export default SchoolHeader;