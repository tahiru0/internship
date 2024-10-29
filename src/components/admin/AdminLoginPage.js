import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Layout, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import FloatingLabelInput from '../../common/FloatingLabelInput';
import axiosInstance from '../../utils/axiosInstance';

const { Content } = Layout;
const { Title } = Typography;

const AdminLoginPage = () => {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      const response = await axiosInstance.post('/auth/login/admin', values);
      const { accessToken, refreshToken, user } = response.data;

      // Lưu tokens và thông tin user vào cookies
      Cookies.set('adminAccessToken', accessToken, { expires: 1 / 24 });
      Cookies.set('adminRefreshToken', refreshToken, { expires: 7 });
      Cookies.set('adminUser', JSON.stringify(user), { expires: 7 });

      // Cập nhật header mặc định cho axiosInstance
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      message.success('Đăng nhập thành công!');
      navigate('/admin');
    } catch (error) {
      setError(error.message);
      message.error(`Đăng nhập thất bại: ${error.message}`);
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
                placeholder=" "
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
                placeholder=" "
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