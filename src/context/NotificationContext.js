import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = React.useRef(null);
  const reconnectTimeoutRef = React.useRef(null);

  const fetchUnreadNotifications = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get('http://localhost:5000/api/notification/unread', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setNotifications(response.data.notifications);
      return response.data.notifications;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thông báo chưa đọc:', error);
      return [];
    }
  };

  const fetchUnreadCount = useCallback(
    debounce(async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        const response = await axios.get('http://localhost:5000/api/notification/unread-count', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const count = response.data.unreadCount;
        console.log('Fetched unread count:', count);
        setUnreadCount(count);
        return count;
      } catch (error) {
        console.error('Lỗi khi lấy số lượng thông báo chưa đọc:', error);
        return 0;
      }
    }, 1000),
    []
  );

  const startNotificationStream = useCallback(() => {
    const accessToken = Cookies.get('accessToken');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const connectEventSource = () => {
      const eventSource = new EventSourcePolyfill('http://localhost:5000/api/notification/stream', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.notification) {
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Lỗi kết nối SSE:', error);
        eventSource.close();
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Đang thử kết nối lại...');
          connectEventSource();
        }, 5000);
      };

      eventSource.onopen = () => {
        console.log('Kết nối SSE thành công');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      eventSourceRef.current = eventSource;
    };

    connectEventSource();

    const reconnectInterval = setInterval(() => {
      console.log('Đang kết nối lại theo định kỳ...');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      connectEventSource();
    }, 30 * 60 * 1000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(reconnectInterval);
    };
  }, []);

  useEffect(() => {
    const accessToken = Cookies.get('accessToken');
    if (accessToken) {
      fetchUnreadNotifications();
      fetchUnreadCount();
      const cleanup = startNotificationStream();
      return cleanup;
    }
  }, [startNotificationStream, fetchUnreadCount]);

  const markNotificationAsRead = async (_id) => {
    if (!_id) {
      console.error('ID thông báo không hợp lệ');
      return;
    }
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.patch(`http://localhost:5000/api/notification/${_id}/read`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUnreadCount(prev => Math.max((prev || 0) - 1, 0));
      setNotifications(prev => prev.map(notif => 
        notif._id === _id ? { ...notif, isRead: true } : notif
      ));
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.patch(`http://localhost:5000/api/notification/read-all`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
    }
  };

  const deleteNotification = async (_id) => {
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.delete(`http://localhost:5000/api/notification/${_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setNotifications(prev => prev.filter(notif => notif._id !== _id));
      setUnreadCount(prev => prev - (notifications.find(n => n._id === _id)?.isRead ? 0 : 1));
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
    }
  };

  const restoreNotification = async (_id) => {
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.patch(`http://localhost:5000/api/notification/${_id}/restore`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchUnreadNotifications();
    } catch (error) {
      console.error('Lỗi khi khôi phục thông báo:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    setUnreadCount,
    fetchNotifications: fetchUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    restoreNotification,
    fetchUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};