import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';

const getAccessToken = () => {
  const accessToken = Cookies.get('accessToken');
  const adminAccessToken = Cookies.get('adminAccessToken');
  
  return accessToken || adminAccessToken;
};

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const eventSourceRef = React.useRef(null);
  const reconnectTimeoutRef = React.useRef(null);
  const reconnectAttemptsRef = React.useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const LIMIT = 10;
  const fetchingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationInProgress = useRef(false);
  const [isUnreadCountInitialized, setIsUnreadCountInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (isUnreadCountInitialized) return unreadCount;
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return 0;
      const response = await axios.get('http://localhost:5000/api/notification/unread-count', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const count = response.data.unreadCount;
      setUnreadCount(count);
      setIsUnreadCountInitialized(true);
      return count;
    } catch (error) {
      console.error('Lỗi khi tải số lượng thông báo chưa đọc:', error);
      return 0;
    }
  }, [isUnreadCountInitialized, unreadCount]);

  const fetchUnreadNotifications = useCallback(async (reset = false) => {
    if (isFetching || (!hasMore && !reset)) return;
    
    setIsFetching(true);
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        return [];
      }
      const currentPage = reset ? 1 : page;
      const response = await axios.get(`http://localhost:5000/api/notification/unread?page=${currentPage}&limit=${LIMIT}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const newNotifications = response.data.notifications;
      
      if (reset) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setHasMore(newNotifications.length === LIMIT && currentPage < response.data.totalPages);
      setPage(prev => reset ? 2 : prev + 1);
      return newNotifications;
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
      return [];
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [hasMore, page, isFetching]);

  const initialize = useCallback(async () => {
    if (isInitialized || initializationInProgress.current) return;
    
    initializationInProgress.current = true;
    setLoading(true);
    try {
      await fetchUnreadCount();
      await fetchUnreadNotifications(true);
      setIsInitialized(true);
    } finally {
      setLoading(false);
      initializationInProgress.current = false;
    }
  }, [fetchUnreadCount, fetchUnreadNotifications]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const startNotificationStream = useCallback(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
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
          if (data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          } else {
            setUnreadCount(prev => prev + 1);
          }
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

  const markNotificationAsRead = async (_id) => {
    if (!_id) {
      console.error('ID thông báo không hợp lệ');
      return null;
    }
    try {
      const accessToken = getAccessToken();
      const response = await axios.patch(`http://localhost:5000/api/notification/${_id}/read`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data && response.data.unreadCount !== undefined) {
        const unreadCount = parseInt(response.data.unreadCount, 10);
        if (!isNaN(unreadCount)) {
          setUnreadCount(unreadCount);
        } else {
          console.error('Giá trị unreadCount không hợp lệ:', response.data.unreadCount);
        }
      } else {
        // Nếu server không trả về unreadCount, giảm số lượng đi 1
        setUnreadCount(prev => Math.max((prev || 0) - 1, 0));
      }
      
      setNotifications(prev => prev.map(notif => 
        notif._id === _id ? { ...notif, isRead: true } : notif
      ));

      return response;
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      return null;
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const accessToken = getAccessToken();
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
      const accessToken = getAccessToken();
      const response = await axios.delete(`http://localhost:5000/api/notification/${_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      setNotifications(prev => prev.filter(notif => notif._id !== _id));
      
      // Cập nhật số lượng thông báo chưa đọc từ response
      if (response.data && typeof response.data.unreadCount === 'number') {
        setUnreadCount(response.data.unreadCount);
      } else {
        // Nếu server không trả về unreadCount, giảm số lượng nếu thông báo chưa đọc
        setUnreadCount(prev => prev - (notifications.find(n => n._id === _id)?.isRead ? 0 : 1));
      }
    } catch (error) {
      return null;
    }
  };

  const restoreNotification = async (_id) => {
    try {
      const accessToken = getAccessToken();
      const response = await axios.patch(`http://localhost:5000/api/notification/${_id}/restore`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Cập nhật số lượng thông báo chưa đọc từ response
      if (response.data && typeof response.data.unreadCount === 'number') {
        setUnreadCount(response.data.unreadCount);
      }
      
      await fetchUnreadNotifications();
    } catch (error) {
      return null;
    }
  };

  const resetNotifications = useCallback(() => {
    if (fetchingRef.current) return;
    setNotifications([]);
    setPage(1);
    setHasMore(true);
    fetchUnreadNotifications(true);
  }, [fetchUnreadNotifications]);

  const value = {
    notifications,
    unreadCount,
    setUnreadCount,
    loading,
    hasMore,
    fetchNotifications: fetchUnreadNotifications,
    initialize,
    isInitialized,
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