import React, { useContext } from 'react';
import { LogoutOutlined, ToolOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Menu, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import { MaintenanceContext } from '../../context/MaintenanceContext';
import Cookies from 'js-cookie';

function AdminHeader() {
    const { user } = useAuthorization();
    const navigate = useNavigate();
    const { maintenanceMode, setMaintenanceMode } = useContext(MaintenanceContext);

    const handleLogout = () => {
        // Xóa tất cả các token
        Cookies.remove('adminAccessToken');
        Cookies.remove('adminRefreshToken');
        // Chuyển hướng về trang đăng nhập
        navigate('/admin/login', { replace: true });
        message.success('Đã đăng xuất thành công');
    };

    const toggleMaintenance = () => {
        const newMaintenanceMode = {
            isActive: !maintenanceMode.isActive,
            message: maintenanceMode.message || 'Hệ thống đang trong chế độ bảo trì'
        };
        setMaintenanceMode(newMaintenanceMode);
        message.success(`Bảo trì hệ thống đã được ${newMaintenanceMode.isActive ? 'bật' : 'tắt'}`);
    };

    const userMenu = (
        <Menu>
            <Menu.Item key="1" icon={<LogoutOutlined />} onClick={handleLogout}>
                Đăng xuất
            </Menu.Item>
        </Menu>
    );

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 16px',
        height: '64px',
    };

    const avatarStyle = {
        cursor: 'pointer',
        backgroundColor: '#1890ff',
        marginLeft: '16px',
    };

    return (
        <div style={headerStyle}>
            {maintenanceMode.isActive && (
                <Button
                    type="primary"
                    danger
                    icon={<ToolOutlined style={{ color: 'white' }} />}
                    onClick={toggleMaintenance}
                    style={{ marginRight: '16px' }}
                >
                    Tắt Bảo trì hệ thống
                </Button>
            )}
            <Dropdown overlay={userMenu} trigger={['click']}>
                <Avatar style={avatarStyle}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </Avatar>
            </Dropdown>
        </div>
    );
}

export default AdminHeader;
