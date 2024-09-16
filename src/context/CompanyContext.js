import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { debounce } from 'lodash';

const CompanyContext = createContext();

export const useCompany = () => {
    return useContext(CompanyContext);
};

export const CompanyProvider = ({ children }) => {
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const logout = useCallback(() => {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setCompanyData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        navigate('/company/login');
    }, [navigate]);

    const refreshToken = async () => {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
            console.error('Không có refresh token');
            return null;
        }
        try {
            const response = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            Cookies.set('accessToken', accessToken, { expires: 1/24 });
            Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
            setRefreshAttempts(0);
            return { accessToken, refreshToken: newRefreshToken };
        } catch (error) {
            console.error('Lỗi khi làm mới token:', error);
            setRefreshAttempts(prev => prev + 1);
            return null;
        }
    };

    const checkAuthStatus = useCallback(async () => {
        setLoading(true);
        try {
            let accessToken = Cookies.get('accessToken');
            if (!accessToken) {
                throw new Error('Không có access token');
            }
            
            try {
                const response = await axios.get('http://localhost:5000/api/company/me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setCompanyData(response.data);
                setUserRole(response.data.account.role);
                setRefreshAttempts(0);
            } catch (error) {
                if (refreshAttempts < 1) {
                    console.log('Access token không hợp lệ, đang thử refresh...');
                    const newTokens = await refreshToken();
                    if (newTokens) {
                        const response = await axios.get('http://localhost:5000/api/company/me', {
                            headers: { Authorization: `Bearer ${newTokens.accessToken}` }
                        });
                        setCompanyData(response.data);
                        setUserRole(response.data.account.role);
                    } else {
                        throw new Error('Không thể refresh token');
                    }
                } else {
                    throw new Error('Đã thử refresh token nhưng không thành công');
                }
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái xác thực:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout, refreshAttempts]);

    useEffect(() => {
        if (
            location.pathname !== '/company/forgot-password' &&
            !location.pathname.startsWith('/company/forgot-password')
        ) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, [checkAuthStatus, location.pathname]);

    const fetchAccounts = async (params) => {
        setLoading(true);
        try {
            const accessToken = Cookies.get('accessToken');
            const response = await axios.get('http://localhost:5000/api/company/accounts', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách tài khoản:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

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
        }, 1000), // Đợi 1 giây trước khi thực hiện lại
        [setUnreadCount]
    );

    useEffect(() => {
        if (companyData) {
            fetchUnreadCount();
        }
    }, [companyData, fetchUnreadCount]);

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
                
                // Thử kết nối lại sau 5 giây
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

        // Thiết lập kết nối lại định kỳ (ví dụ: mỗi 30 phút)
        const reconnectInterval = setInterval(() => {
            console.log('Đang kết nối lại theo định kỳ...');
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            connectEventSource();
        }, 30 * 60 * 1000); // 30 phút

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
        if (companyData) {
            fetchUnreadNotifications();
            fetchUnreadCount();
            const cleanup = startNotificationStream();
            return cleanup;
        }
    }, [companyData, startNotificationStream]);

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
        companyData,
        loading,
        userRole,
        logout,
        checkAuthStatus,
        fetchAccounts,
        notifications,
        unreadCount,
        setUnreadCount,
        fetchNotifications: fetchUnreadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        restoreNotification,
        fetchUnreadCount // Make sure this is included
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};