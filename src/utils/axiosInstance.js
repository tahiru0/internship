import axios from 'axios';
import Cookies from 'js-cookie';

// Cấu hình mặc định
const CONFIG = {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 5000,
};

// Thêm cấu hình cho token names
const TOKEN_NAMES = {
    access: 'accessToken',
    refresh: 'refreshToken'
};

// Hàm để set token names
export const setTokenNames = (accessTokenName, refreshTokenName) => {
    TOKEN_NAMES.access = accessTokenName;
    TOKEN_NAMES.refresh = refreshTokenName;
};

const refreshToken = async () => {
    const refreshToken = Cookies.get(TOKEN_NAMES.refresh);
    if (!refreshToken) {
        console.error('Không có refresh token');
        handleAuthError();
        return null;
    }
    try {
        const response = await axios.post(`${CONFIG.API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        Cookies.set(TOKEN_NAMES.access, accessToken, { expires: 1/24 });
        Cookies.set(TOKEN_NAMES.refresh, newRefreshToken, { expires: 7 });
        
        return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Lỗi khi làm mới token';
        console.error(errorMessage);
        handleAuthError();
        return null;
    }
};

// Thêm hàm xử lý lỗi auth
const handleAuthError = () => {
    // Xóa tokens
    Cookies.remove(TOKEN_NAMES.access);
    Cookies.remove(TOKEN_NAMES.refresh);

    // Lấy current path để redirect sau khi login
    const currentPath = window.location.pathname;
    
    // Xác định login path dựa vào current path
    let loginPath = '/login';
    if (currentPath.includes('/company')) {
        loginPath = '/company/login';
    } else if (currentPath.includes('/school')) {
        loginPath = '/school/login';
    }

    // Chuyển hướng về trang login tương ứng với redirect path
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`;
};

const axiosInstance = axios.create({
    baseURL: CONFIG.API_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Tạo hàm withAuth để wrap các request cần xác thực
const withAuth = (options = {}) => {
    const token = Cookies.get(TOKEN_NAMES.access);
    const config = {
        headers: {
            ...options.headers
        }
    };

    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
};

// Tạo hàm withFormData để wrap các request upload file
const withFormData = (options = {}) => {
    return {
        ...withAuth(options),
        headers: {
            ...options.headers,
            'Content-Type': 'multipart/form-data'
        }
    };
};

axiosInstance.interceptors.request.use(
    (config) => {
        const token = Cookies.get(TOKEN_NAMES.access);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        const errorMessage = error.response?.data?.message || 'Lỗi khi gửi yêu cầu';
        return Promise.reject({ message: errorMessage, error });
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        // Trả về message thành công nếu có
        if (response.data?.message) {
            return {
                ...response,
                message: response.data.message
            };
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Xử lý refresh token khi 401
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const newTokens = await refreshToken();
                if (newTokens) {
                    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
                    return axiosInstance(originalRequest);
                } else {
                    // Nếu không refresh được token, chuyển về login
                    handleAuthError();
                    return Promise.reject({
                        message: 'Phiên đăng nhập đã hết hạn',
                        status: 401
                    });
                }
            } catch (refreshError) {
                // Nếu có lỗi khi refresh, chuyển về login
                handleAuthError();
                return Promise.reject({
                    message: 'Lỗi xác thực, vui lòng đăng nhập lại',
                    status: 401,
                    error: refreshError
                });
            }
        }

        // Xử lý các lỗi khác
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Đã xảy ra lỗi';

        // Nếu là lỗi 401 khác, cũng chuyển về login
        if (error.response?.status === 401) {
            handleAuthError();
        }

        return Promise.reject({
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
            error: error
        });
    }
);

// Export cả instance gốc và hàm withAuth
export { withAuth, withFormData, CONFIG, TOKEN_NAMES };
export default axiosInstance;