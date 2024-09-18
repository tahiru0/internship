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
  const reconnectAttemptsRef = React.useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      if (!accessToken) {
        console.log('Không có accessToken, bỏ qua việc fetch thông báo');
        return [];
      }
      const response = await axios.get('http://localhost:5000/api/notification/unread', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setNotifications(response.data.notifications);
      return response.data.notifications;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thông báo chưa đọc:', error);
      return [];
    }
  }, []);

  const fetchUnreadCount = useCallback(
    debounce(async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        if (!accessToken) {
          console.log('Không có accessToken, bỏ qua việc fetch số lượng thông báo chưa đọc');
          return 0;
        }
        const response = await axios.get('http://localhost:5000/api/notification/unread-count', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const count = response.data.unreadCount;
        console.log('Số lượng thông báo chưa đọc:', count);
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
    if (!accessToken) {
      console.log('Không có accessToken, bỏ qua việc kết nối SSE');
      return;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const connectEventSource = () => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Đã đạt đến số lần thử kết nối tối đa. Dừng kết nối.');
        return;
      }

      const eventSource = new EventSourcePolyfill('http://localhost:5000/api/notification/stream', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.notification) {
          setNotifications(prev => {
            const index = prev.findIndex(notif => notif._id === data.notification._id);
            if (index !== -1) {
              const updatedNotifications = [...prev];
              updatedNotifications[index] = data.notification;
              return updatedNotifications;
            } else {
              return [data.notification, ...prev];
            }
          });
          setUnreadCount(prev => {
            // Kiểm tra xem thông báo mới có đã đọc chưa
            const isNewUnread = !data.notification.isRead;
            // Nếu là thông báo mới chưa đọc, tăng số lượng lên 1
            return isNewUnread ? prev + 1 : prev;
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error('Lỗi kết nối SSE:', error);
        eventSource.close();
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Đang thử kết nối lại... (Lần thử ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connectEventSource, 5000);
        } else {
          console.log('Đã đạt đến số lần thử kết nối tối đa. Dừng kết nối.');
        }
      };

      eventSource.onopen = () => {
        console.log('Kết nối SSE thành công');
        reconnectAttemptsRef.current = 0;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      eventSourceRef.current = eventSource;
    };

    connectEventSource();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchUnreadNotifications();
    fetchUnreadCount();
    const cleanup = startNotificationStream();
    return cleanup;
  }, [fetchUnreadNotifications, fetchUnreadCount, startNotificationStream]);

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

  const resetNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = {
    notifications,
    unreadCount,
    setUnreadCount,
    fetchNotifications: fetchUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    restoreNotification,
    fetchUnreadCount,
    resetNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};