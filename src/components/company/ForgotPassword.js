import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Typography, Steps, Space } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import { useNavigate, useParams, Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { Step } = Steps;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { resetToken } = useParams();

  useEffect(() => {
    if (resetToken) {
      setCurrentStep(2);
    } else {
      setCurrentStep(0);
    }
  }, [resetToken]);

  const onForgotPassword = async (values) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/forgot-password/company', values);
      message.success(response.data.message || 'Kiểm tra email của bạn');
      setCurrentStep(1);
    } catch (error) {
      console.error('Lỗi khi yêu cầu quên mật khẩu:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (values) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`/api/auth/reset-password/company/${resetToken}`, {
        password: values.password
      }, withAuth());
      message.success(response.data.message || 'Đặt lại mật khẩu thành công');
      setTimeout(() => {
        navigate('/company/login');
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi đặt lại mật khẩu:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderForgotPasswordForm = () => (
    <Form
      name="forgot_password"
      onFinish={onForgotPassword}
      layout="vertical"
    >
      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Vui lòng nhập email của bạn!' },
          { type: 'email', message: 'Email không hợp lệ!' }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Gửi yêu cầu
        </Button>
      </Form.Item>
    </Form>
  );

  const renderResetPasswordForm = () => (
    <Form name="reset_password" onFinish={onResetPassword} layout="vertical">
      <Form.Item
        name="password"
        rules={[
          { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
          { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
      </Form.Item>

      <Form.Item
        name="confirm"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Hai mật khẩu không khớp!'));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Đặt lại mật khẩu
        </Button>
      </Form.Item>
    </Form>
  );

  const steps = [
    {
      title: 'Yêu cầu',
      content: renderForgotPasswordForm(),
    },
    {
      title: 'Kiểm tra',
      content: (
        <div>
          <p>Vui lòng kiểm tra email của bạn để nhận link đặt lại mật khẩu.</p>
        </div>
      ),
    },
    {
      title: 'Đặt lại',
      content: renderResetPasswordForm(),
    },
  ];

  return (
    <div style={{ 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          maxWidth: 450,
          width: '100%', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '8px'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <SafetyOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={2} style={{ marginTop: '16px', marginBottom: '8px' }}>
              {currentStep === 2 ? 'Đặt lại mật khẩu' : 'Quên mật khẩu'}
            </Title>
            <Paragraph type="secondary">
              {currentStep === 0 && "Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu."}
              {currentStep === 1 && "Chúng tôi đã gửi hướng dẫn đến email của bạn."}
              {currentStep === 2 && "Nhập mật khẩu mới để đặt lại tài khoản của bạn."}
            </Paragraph>
          </div>

          {currentStep < 2 && (
            <Steps current={currentStep} style={{ marginBottom: '24px' }}>
              {steps.map(item => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>
          )}

          <div>{steps[currentStep].content}</div>

          {currentStep === 0 && (
            <Paragraph type="secondary" style={{ textAlign: 'center', marginTop: '16px' }}>
              Nhớ mật khẩu? <Link to="/company/login">Đăng nhập</Link>
            </Paragraph>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default ForgotPassword;
