import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';
import axiosInstance, { withAuth, CONFIG } from '../utils/axiosInstance';
import Cookies from 'js-cookie';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationInProgress = useRef(false);
  const [isUnreadCountInitialized, setIsUnreadCountInitialized] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (isUnreadCountInitialized) return unreadCount;
    try {
      const response = await axiosInstance.get('/notification/unread-count', withAuth());
      const count = response.data.unreadCount;
      setUnreadCount(count);
      setIsUnreadCountInitialized(true);
      return count;
    } catch (error) {
      console.error('Lỗi khi tải số lượng thông báo chưa đọc:', error.message);
      return 0;
    }
  }, [isUnreadCountInitialized, unreadCount]);

  const fetchUnreadNotifications = useCallback(async (reset = false) => {
    if (isFetching || (!hasMore && !reset)) return;
    
    setIsFetching(true);
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await axiosInstance.get(
        `/notification/unread?page=${currentPage}&limit=${LIMIT}`,
        withAuth()
      );
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
      console.error('Lỗi khi tải thông báo:', error.message);
      return [];
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [hasMore, page, isFetching]);

  const markNotificationAsRead = async (_id) => {
    if (!_id) return null;
    try {
      const response = await axiosInstance.patch(
        `/notification/${_id}/read`,
        {},
        withAuth()
      );
      
      if (response.data?.unreadCount !== undefined) {
        setUnreadCount(parseInt(response.data.unreadCount, 10));
      } else {
        setUnreadCount(prev => Math.max((prev || 0) - 1, 0));
      }
      
      setNotifications(prev => prev.map(notif => 
        notif._id === _id ? { ...notif, isRead: true } : notif
      ));

      return response;
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', error.message);
      return null;
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axiosInstance.patch('/notification/read-all', {}, withAuth());
      setUnreadCount(0);
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', error.message);
    }
  };

  const deleteNotification = async (_id) => {
    try {
      const response = await axiosInstance.delete(`/notification/${_id}`, withAuth());
      setNotifications(prev => prev.filter(notif => notif._id !== _id));
      
      if (response.data?.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      } else {
        setUnreadCount(prev => prev - (notifications.find(n => n._id === _id)?.isRead ? 0 : 1));
      }
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error.message);
      return null;
    }
  };

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

      const eventSource = new EventSourcePolyfill(`${CONFIG.API_URL}/notification/stream`, {
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
  useEffect(() => {
    initialize();
    startNotificationStream();
  }, [initialize, startNotificationStream]);

  const restoreNotification = async (_id) => {
    try {
      const response = await axiosInstance.patch(
        `/notification/${_id}/restore`,
        {},
        withAuth()
      );
      
      if (response.data?.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      }
      
      await fetchUnreadNotifications();
    } catch (error) {
      console.error('Lỗi khi khôi phục thông báo:', error.message);
      return null;
    }
  };

  const reloadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await fetchUnreadCount();
      await fetchUnreadNotifications(true);
      startNotificationStream();
    } catch (error) {
      console.error('Lỗi khi tải lại thông báo:', error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadCount, fetchUnreadNotifications, startNotificationStream]);

  const resetNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setPage(1);
    setHasMore(true);
    setIsInitialized(false);
    setIsUnreadCountInitialized(false);
  }, []);

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
    resetNotifications,
    reloadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
