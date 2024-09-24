import React from 'react';
import { LogoutOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthorization } from '../../routes/RequireAdminAuth';

function AdminHeader() {
    const { user, axiosInstance } = useAuthorization();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
            navigate('/admin/login', { replace: true });
        } catch (error) {
            console.error('Lỗi khi đăng xuất:', error);
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
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
    };

    const avatarStyle = {
        cursor: 'pointer',
        backgroundColor: '#1890ff',
    };

    return (
        <div style={headerStyle}>
            <Dropdown overlay={userMenu} trigger={['click']}>
                <Avatar style={avatarStyle}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </Avatar>
            </Dropdown>
        </div>
    );
}

export default AdminHeader;