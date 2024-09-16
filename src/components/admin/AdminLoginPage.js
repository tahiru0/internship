import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Layout, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import FloatingLabelInput from '../../common/FloatingLabelInput';

const { Content } = Layout;
const { Title } = Typography;

const AdminLoginPage = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login/admin', values);
      const { accessToken, refreshToken, user } = response.data;

      Cookies.set('adminAccessToken', accessToken, { expires: 1 / 24 });
      Cookies.set('adminRefreshToken', refreshToken, { expires: 7 });
      Cookies.set('adminUser', JSON.stringify(user), { expires: 7 });

      // Cập nhật axiosInstance với token mới
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      message.success('Đăng nhập thành công!');
      navigate('/admin');
    } catch (err) {
      let errorMessage = 'Đã xảy ra lỗi không xác định';
      if (err.response && err.response.data) {
        errorMessage = err.response.data.error || err.response.data.message || errorMessage;
      } else if (err.request) {
        errorMessage = 'Không có phản hồi từ máy chủ';
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error('Lỗi đăng nhập:', errorMessage);
      setError(errorMessage);
      message.error(`Đăng nhập thất bại: ${errorMessage}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 400, boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
            Đăng nhập
          </Title>
          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
              style={{paddingBottom:14}}
            >
              <FloatingLabelInput
                label="Tên đăng nhập"
                icon={<UserOutlined />}
                placeholder=" " // Add an empty placeholder to activate the floating label
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <FloatingLabelInput
                label="Mật khẩu"
                type="password"
                icon={<LockOutlined />}
                placeholder=" " // Add an empty placeholder to activate the floating label
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%', marginTop:10 }}>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </Card>
      </Content>
    </Layout>
  );
};

export default AdminLoginPage;