import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Space } from 'antd';
import axios from 'axios';
import Cookies from 'js-cookie';

const ApiConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    try {
      const accessToken = Cookies.get('schoolAccessToken');
      const response = await axios.get('http://localhost:5000/api/school/api-config', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      form.setFieldsValue(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy cấu hình hiện tại:', error);
      message.error('Không thể lấy cấu hình hiện tại');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const accessToken = Cookies.get('schoolAccessToken');
      await axios.post('http://localhost:5000/api/school/configure-guest-api', values, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success('Cấu hình API khách và quy tắc mật khẩu thành công');
    } catch (error) {
      console.error('Lỗi khi cấu hình API:', error);
      message.error('Không thể cấu hình API');
    }
    setLoading(false);
  };

  const testApiConfig = async () => {
    setTestLoading(true);
    try {
      const accessToken = Cookies.get('schoolAccessToken');
      const response = await axios.post('http://localhost:5000/api/school/test-api-config', 
        { studentId: form.getFieldValue(['apiConfig', 'fieldMappings', 'studentId']) },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      message.success('Kết nối API thành công');
      console.log('Dữ liệu sinh viên mẫu:', response.data.studentData);
    } catch (error) {
      console.error('Lỗi khi kiểm tra API:', error);
      message.error('Không thể kết nối API');
    }
    setTestLoading(false);
  };

  return (
    <Card title="Cấu hình API Khách và Quy tắc Mật khẩu">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name={['apiConfig', 'uri']} label="URL API Khách" rules={[{ required: true, message: 'Vui lòng nhập URL API' }]}>
          <Input placeholder="https://api.example-school.com/students" />
        </Form.Item>
        <Form.Item label="Ánh xạ trường dữ liệu">
          <Input.Group compact>
            <Form.Item name={['apiConfig', 'fieldMappings', 'name']} noStyle>
              <Input style={{ width: '50%' }} placeholder="Tên trường (name)" />
            </Form.Item>
            <Form.Item name={['apiConfig', 'fieldMappings', 'email']} noStyle>
              <Input style={{ width: '50%' }} placeholder="Email (email)" />
            </Form.Item>
          </Input.Group>
          <Input.Group compact>
            <Form.Item name={['apiConfig', 'fieldMappings', 'studentId']} noStyle>
              <Input style={{ width: '50%' }} placeholder="Mã sinh viên (studentId)" />
            </Form.Item>
            <Form.Item name={['apiConfig', 'fieldMappings', 'major']} noStyle>
              <Input style={{ width: '50%' }} placeholder="Ngành học (major)" />
            </Form.Item>
          </Input.Group>
          <Input.Group compact>
            <Form.Item name={['apiConfig', 'fieldMappings', 'dateOfBirth']} noStyle>
              <Input style={{ width: '50%' }} placeholder="Ngày sinh (dateOfBirth)" />
            </Form.Item>
            <Form.Item name={['apiConfig', 'fieldMappings', 'defaultPassword']} noStyle>
              <Input style={{ width: '50%' }} placeholder="Mật khẩu mặc định (defaultPassword)" />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item name={['passwordRule', 'template']} label="Mẫu mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mẫu mật khẩu' }]}>
          <Input placeholder="School${ngaysinh}2023" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu cấu hình
            </Button>
            <Button onClick={testApiConfig} loading={testLoading}>
              Kiểm tra kết nối
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ApiConfig;