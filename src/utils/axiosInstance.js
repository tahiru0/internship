import axios from 'axios';
import Cookies from 'js-cookie';

// Cấu hình mặc định
const CONFIG = {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 5000,
};

const refreshToken = async () => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
        console.error('Không có refresh token');
        return null;
    }
    try {
        const response = await axios.post(`${CONFIG.API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        Cookies.set('accessToken', accessToken, { expires: 1/24 });
        Cookies.set('refreshToken', newRefreshToken, { expires: 7 });
        
        return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Lỗi khi làm mới token';
        console.error(errorMessage);
        return null;
    }
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
    const token = Cookies.get('accessToken');
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
        const token = Cookies.get('accessToken');
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
                }
            } catch (refreshError) {
                const errorMessage = refreshError.response?.data?.message || 'Lỗi xác thực';
                return Promise.reject({ message: errorMessage, error: refreshError });
            }
        }

        // Xử lý các lỗi khác
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Đã xảy ra lỗi';

        // Trả về object có cấu trúc rõ ràng
        return Promise.reject({
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data,
            error: error
        });
    }
);

// Export cả instance gốc và hàm withAuth
export { withAuth, withFormData, CONFIG };
export default axiosInstance;