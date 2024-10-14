import React, { useState, useEffect } from 'react';
import { useStudent } from '../../context/StudentContext';
import { BellOutlined, LogoutOutlined, SearchOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Badge, Dropdown, Input, Menu, Modal, Typography, Avatar } from 'antd';
import NotificationMenu from '../../layout/NotificationMenu';
import SettingsDrawer from '../../layout/SettingsDrawer';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const { Text } = Typography;

function StudentHeader({ handleSidenavColor, handleSidenavType, handleFixedNavbar }) {
    const { userData, logout } = useStudent();
    const { unreadCount, fetchUnreadCount } = useNotification();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [settingsVisible, setSettingsVisible] = useState(false);
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [notificationDropdownVisible, setNotificationDropdownVisible] = useState(false);

    useEffect(() => {
        if (userData) {
            fetchUnreadCount();
        }
    }, [userData]);

    useEffect(() => {
        console.log('Current unreadCount in StudentHeader:', unreadCount);
    }, [unreadCount]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth <= 768;

    const userName = userData?.name || '';
    const userEmail = userData?.email || '';
    const studentId = userData?.studentId || '';
    const schoolName = userData?.school?.name || '';
    const schoolLogo = userData?.school?.logo || '';
    const userAvatar = userData?.avatar || '';

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
                {schoolLogo && (
                    <Avatar
                        src={schoolLogo}
                        alt="School Logo"
                        style={{ marginRight: '10px' }}
                    />
                )}
                <Text strong style={{ fontSize: '16px', marginLeft: '10px' }}>{schoolName}</Text>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="1" disabled>
                <Text strong>{userName} ({studentId})</Text>
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
                    <Avatar 
                        src={userAvatar} 
                        style={{ 
                            cursor: 'pointer', 
                            marginLeft: '16px',
                            backgroundColor: '#f56a00',
                        }}
                    >
                        {!userAvatar && userName.charAt(0)}
                    </Avatar>
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
}

export default StudentHeader;
