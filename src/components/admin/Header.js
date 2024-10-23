import React, { useState, useEffect, useContext } from 'react';
import { LogoutOutlined, ToolOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Menu, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import { MaintenanceContext } from '../../context/MaintenanceContext'; // Tạo context này

function AdminHeader() {
    const { user, axiosInstance } = useAuthorization();
    const navigate = useNavigate();
    const { maintenanceMode, setMaintenanceMode } = useContext(MaintenanceContext);

    useEffect(() => {
        fetchMaintenanceStatus();
    }, []);

    const fetchMaintenanceStatus = async () => {
        try {
            const response = await axiosInstance.get('/admin/maintenance');
            setMaintenanceMode(response.data.config || { isActive: false, message: '' });
        } catch (error) {
            console.error('Lỗi khi lấy trạng thái bảo trì:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
            navigate('/admin/login', { replace: true });
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
        }
    };

    const toggleMaintenance = async () => {
        try {
            const response = await axiosInstance.post('/admin/maintenance', { 
                isActive: !maintenanceMode.isActive,
                message: maintenanceMode.message || ''
            });
            const newMaintenanceMode = response.data.config || { isActive: false, message: '' };
            setMaintenanceMode(newMaintenanceMode);
            message.success(`Bảo trì hệ thống đã được ${newMaintenanceMode.isActive ? 'bật' : 'tắt'}`);
        } catch (error) {
            console.error('Lỗi khi thay đổi trạng thái bảo trì:', error);
            message.error(error.response?.data?.message || 'Không thể thay đổi trạng thái bảo trì');
        }
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
