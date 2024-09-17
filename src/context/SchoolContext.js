import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';

const SchoolContext = createContext();

export const useSchool = () => {
    return useContext(SchoolContext);
};

export const SchoolProvider = ({ children }) => {
    const [schoolData, setSchoolData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [refreshAttempts, setRefreshAttempts] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    const logout = useCallback(() => {
        Cookies.remove('schoolAccessToken');
        Cookies.remove('schoolRefreshToken');
        setSchoolData(null);
        setUserRole(null);
        setRefreshAttempts(0);
        navigate('/school/login');
    }, [navigate]);

    const refreshToken = async () => {
        const refreshToken = Cookies.get('schoolRefreshToken');
        if (!refreshToken) {
            console.error('Không có refresh token');
            return null;
        }
        try {
            const response = await axios.post('http://localhost:5000/api/auth/refresh-token', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            Cookies.set('schoolAccessToken', accessToken, { expires: 1/24 });
            Cookies.set('schoolRefreshToken', newRefreshToken, { expires: 7 });
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
            let accessToken = Cookies.get('schoolAccessToken');
            if (!accessToken) {
                throw new Error('Không có access token');
            }
            
            try {
                const response = await axios.get('http://localhost:5000/api/school/me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setSchoolData(response.data);
                setUserRole(response.data.account.role);
                setRefreshAttempts(0);
            } catch (error) {
                if (refreshAttempts < 1) {
                    console.log('Access token không hợp lệ, đang thử refresh...');
                    const newTokens = await refreshToken();
                    if (newTokens) {
                        const response = await axios.get('http://localhost:5000/api/school/me', {
                            headers: { Authorization: `Bearer ${newTokens.accessToken}` }
                        });
                        setSchoolData(response.data);
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
        if (location.pathname !== '/school/forgot-password' && !location.pathname.startsWith('/school/forgot-password')) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, [checkAuthStatus, location.pathname]);

    const fetchStudents = async (params) => {
        setLoading(true);
        try {
            const accessToken = Cookies.get('schoolAccessToken');
            const response = await axios.get('http://localhost:5000/api/school/students', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params
            });
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sinh viên:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        schoolData,
        loading,
        userRole,
        logout,
        checkAuthStatus,
        fetchStudents
    };
    
    return (
        <SchoolContext.Provider value={value}>
            {children}
        </SchoolContext.Provider>
    );
};