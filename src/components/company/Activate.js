import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import { message } from 'antd';
import ActivationLoader from '../common/ActivationLoader';

const Activate = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const activateAccount = async () => {
      try {
        const response = await axiosInstance.get(`/api/company/activate/${token}`, withAuth());
        message.success(response.data.message);
        setTimeout(() => {
          navigate(`/company/login?message=${encodeURIComponent(response.data.message)}`);
        }, 3000);
      } catch (error) {
        console.error('Lỗi kích hoạt tài khoản:', error);
        const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi kích hoạt tài khoản.';
        setTimeout(() => {
          navigate(`/company/login?error=${encodeURIComponent(errorMessage)}`);
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    activateAccount();
  }, [token, navigate]);

  return <ActivationLoader message="Đang xử lý kích hoạt tài khoản công ty..." />;
};

export default Activate;
