import React, { useState, useEffect } from 'react';
import { Card, Avatar, Form, Input, Button, message, Upload } from 'antd';
import { UserOutlined, UploadOutlined, MailOutlined, HomeOutlined, PhoneOutlined } from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import axios from 'axios';
import Cookies from 'js-cookie';

const PersonalProfile = () => {
  const [form] = Form.useForm();
  const { companyData, setCompanyData, checkAuthStatus } = useCompany();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (companyData) {
      form.setFieldsValue({
        name: companyData.account.name,
        email: companyData.account.email,
        address: companyData.account.address ?? '',
        phone: companyData.account.phone ?? '',
      });
      setAvatar(companyData.account.avatar || '');
    }
  }, [companyData, form]);

  const onFinish = async (values) => {
    setLoading(true);
    setFieldErrors({});
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.put('http://localhost:5000/api/company/account', values, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.data) {
        await checkAuthStatus();
        message.success(response.data.message || 'Cập nhật thông tin thành công');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errors = {};
        error.response.data.errors.forEach(err => {
          errors[err.path] = err.msg;
        });
        setFieldErrors(errors);
      } else {
        message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12 col-md-4 col-lg-3 mb-4 mb-md-0">
            <div className="text-center">
              <Avatar
                size={120}
                src={avatar}
                icon={!avatar && <UserOutlined />}
              />
              <div className="mt-3">
                <Upload
                  beforeUpload={() => false}
                  onChange={(info) => {
                    if (info.file.status !== 'removed') {
                      setAvatar(URL.createObjectURL(info.file.originFileObj));
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />}>Thay đổi ảnh đại diện</Button>
                </Upload>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-8 col-lg-9">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <div className="row">
                <div className="col-12 col-md-6">
                  <Form.Item
                    name="name"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    help={fieldErrors.name}
                    validateStatus={fieldErrors.name ? 'error' : ''}
                  >
                    <Input prefix={<UserOutlined />} />
                  </Form.Item>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                    help={fieldErrors.email}
                    validateStatus={fieldErrors.email ? 'error' : ''}
                  >
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>
                </div>
              </div>
              <div className="row">
                <div className="col-12 col-md-6">
                  <Form.Item
                    name="address"
                    label="Địa chỉ"
                    help={fieldErrors.address}
                    validateStatus={fieldErrors.address ? 'error' : ''}
                  >
                    <Input prefix={<HomeOutlined />} />
                  </Form.Item>
                </div>
                <div className="col-12 col-md-6">
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    help={fieldErrors.phone}
                    validateStatus={fieldErrors.phone ? 'error' : ''}
                  >
                    <Input prefix={<PhoneOutlined />} />
                  </Form.Item>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Cập nhật thông tin
                    </Button>
                  </Form.Item>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PersonalProfile;