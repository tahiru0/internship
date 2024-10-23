import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Menu, List, Typography, Button, Badge, Space, Empty, Spin } from 'antd';
import { useNotification } from '../context/NotificationContext';
import { 
    MdCheckCircle, 
    MdWork,
    MdSettings, 
    MdPerson,
    MdNotifications,
    MdClose
} from 'react-icons/md';
import moment from 'moment';
import 'moment/locale/vi';  // Import tiếng Việt cho moment
import ReactMarkdown from 'react-markdown';

const { Text } = Typography;

moment.locale('vi');  // Sử dụng tiếng Việt

const NotificationMenu = ({ isMobile, onClose }) => {
    const [isMenuOpened, setIsMenuOpened] = useState(false);
    const [expandedNotification, setExpandedNotification] = useState(null);
    const { 
        notifications, 
        markNotificationAsRead, 
        markAllNotificationsAsRead, 
        unreadCount,
        setUnreadCount,
        loading,
        hasMore,
        fetchNotifications,
        initialize,
        isInitialized,
        startNotificationStream,
    } = useNotification();
    const scrollTimeoutRef = useRef(null);
    const menuRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!isInitialized && !loading) {
          initialize();
          startNotificationStream();
        }
      }, [isInitialized, initialize, loading, startNotificationStream]);

    const handleScroll = useCallback((event) => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            const target = event.target;
            const { scrollTop, clientHeight, scrollHeight } = target;
            if (scrollHeight - scrollTop <= clientHeight + 50 && !loading && hasMore) {
                fetchNotifications();
                setCurrentPage(prevPage => prevPage + 1);
            }
        }, 200);
    }, [loading, hasMore, fetchNotifications]);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification._id);
        }
        setExpandedNotification(expandedNotification === notification._id ? null : notification._id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'task':
                return { icon: MdCheckCircle, color: '#52c41a', label: 'Nhiệm vụ' };
            case 'project':
                return { icon: MdWork, color: '#1890ff', label: 'Dự án' };
            case 'system':
                return { icon: MdSettings, color: '#faad14', label: 'Hệ thống' };
            case 'account':
                return { icon: MdPerson, color: '#722ed1', label: 'Tài khoản' };
            default:
                return { icon: MdNotifications, color: '#f5222d', label: 'Thông báo' };
        }
    };

    const truncateContent = (content, maxLength = 50) => {
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    };

    const getRelativeTime = (date) => {
        return moment(date).fromNow();
    };

    const renderContent = (content, isExpanded) => {
        return isExpanded ? (
            <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
            <ReactMarkdown>{truncateContent(content)}</ReactMarkdown>
        );
    };

    const menuStyle = {
        width: isMobile ? '100vw' : 300,
        maxHeight: isMobile ? '100vh' : 400,
        overflowY: 'auto',
        position: isMobile ? 'fixed' : 'static',
        top: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        bottom: isMobile ? 0 : 'auto',
        zIndex: isMobile ? 1000 : 'auto',
    };

    return (
        <Menu 
            style={menuStyle} 
            onScroll={handleScroll} 
            ref={menuRef}
        >
            <Menu.Item key="header" disabled style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>Thông báo</Text>
                    <Space>
                        <Button type="link" onClick={handleMarkAllAsRead}>Đánh dấu tất cả đã đọc</Button>
                        {isMobile && (
                            <Button type="text" icon={<MdClose />} onClick={onClose} />
                        )}
                    </Space>
                </div>
            </Menu.Item>
            <Menu.Divider />
            <List
                dataSource={notifications}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo mới" /> }}
                renderItem={item => {
                    const { icon: Icon, color } = getNotificationIcon(item.type);
                    const isExpanded = expandedNotification === item._id;
                    return (
                        <List.Item 
                            onClick={() => handleNotificationClick(item)} 
                            style={{ 
                                cursor: 'pointer',
                                backgroundColor: !item.isRead ? '#f0f0f0' : 'transparent',
                                transition: 'background-color 0.3s'
                            }}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Badge dot={!item.isRead}>
                                        <div 
                                            style={{ 
                                                backgroundColor: color,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%'
                                            }}
                                        >
                                            <Icon style={{ color: '#fff', fontSize: '18px' }} />
                                        </div>
                                    </Badge>
                                }
                                title={
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Text strong={!item.isRead}>{getNotificationIcon(item.type).label}</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{getRelativeTime(item.createdAt)}</Text>
                                    </Space>
                                }
                                description={
                                    <div>
                                        {renderContent(item.content, isExpanded)}
                                        {!isExpanded && item.content.length > 50 && (
                                            <Text type="link" style={{ marginLeft: 8 }}>Xem thêm</Text>
                                        )}
                                    </div>
                                }
                            />
                        </List.Item>
                    );
                }}
            />
            {loading && <Spin />}
            {!hasMore && notifications.length > 0 && currentPage > 1 && (
                <div style={{ textAlign: 'center', padding: '10px' }}>Không còn thông báo</div>
            )}
        </Menu>
    );
};

export default NotificationMenu;
