import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Avatar, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import Cookies from 'js-cookie';

const CompanyInfo = () => {
  const [form] = Form.useForm();
  const { companyData, checkAuthStatus } = useCompany();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [backgroundImage, setBackgroundImage] = useState('');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    if (companyData && companyData.company) {
      form.setFieldsValue({
        name: companyData.company.name,
        address: companyData.company.address,
        email: companyData.company.email,
        website: companyData.company.website,
      });
      setBackgroundImage(companyData.company.backgroundImage || '');
      setLogo(companyData.company.logo || '');
    }
  }, [companyData, form]);

  const onFinish = async (values) => {
    setLoading(true);
    setFieldErrors({});
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axiosInstance.put('/api/company/company-info', values, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.data) {
        await checkAuthStatus();
        message.success('Cập nhật thông tin công ty thành công');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin công ty:', error);
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errors = {};
        error.response.data.errors.forEach(err => {
          errors[err.path] = err.msg;
        });
        setFieldErrors(errors);
      } else {
        message.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin công ty');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="container-fluid p-0">
        <div className="position-relative">
          <div style={{ height: '200px', overflow: 'hidden' }}>
            <img
              src={backgroundImage || 'https://via.placeholder.com/1000x200'}
              alt="Background"
              className="w-100 h-100 object-fit-cover"
            />
          </div>
          <Avatar
            src={logo || 'https://via.placeholder.com/150'}
            size={100}
            className="position-absolute"
            style={{
              bottom: '-50px',
              left: '24px',
              border: '4px solid white'
            }}
          />
        </div>
        <div className="mt-5 px-3">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <div className="row">
              <div className="col-12 col-md-6">
                <Form.Item
                  name="name"
                  label="Tên công ty"
                  rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                  help={fieldErrors.name}
                  validateStatus={fieldErrors.name ? 'error' : ''}
                >
                  <Input />
                </Form.Item>
              </div>
              <div className="col-12 col-md-6">
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email công ty' },
                    { type: 'email', message: 'Vui lòng nhập một địa chỉ email hợp lệ' }
                  ]}
                  help={fieldErrors.email}
                  validateStatus={fieldErrors.email ? 'error' : ''}
                >
                  <Input />
                </Form.Item>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-md-6">
                <Form.Item
                  name="address"
                  label="Địa chỉ"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ công ty' }]}
                  help={fieldErrors.address}
                  validateStatus={fieldErrors.address ? 'error' : ''}
                >
                  <Input />
                </Form.Item>
              </div>
              <div className="col-12 col-md-6">
                <Form.Item
                  name="website"
                  label="Website"
                  rules={[{ type: 'url', message: 'Vui lòng nhập một URL hợp lệ' }]}
                  help={fieldErrors.website}
                  validateStatus={fieldErrors.website ? 'error' : ''}
                >
                  <Input />
                </Form.Item>
              </div>
            </div>
            <div className="row">
              <div className="col-12 col-md-6">
                <Form.Item
                  name="backgroundImage"
                  label="Ảnh bìa"
                >
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                    onChange={(info) => {
                      if (info.file.status !== 'removed') {
                        setBackgroundImage(URL.createObjectURL(info.file.originFileObj));
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Tải lên ảnh bìa</Button>
                  </Upload>
                </Form.Item>
              </div>
              <div className="col-12 col-md-6">
                <Form.Item
                  name="logo"
                  label="Logo công ty"
                >
                  <Upload
                    listType="picture"
                    maxCount={1}
                    beforeUpload={() => false}
                    onChange={(info) => {
                      if (info.file.status !== 'removed') {
                        setLogo(URL.createObjectURL(info.file.originFileObj));
                      }
                    }}
                  >
                    <Button icon={<UploadOutlined />}>Tải lên logo</Button>
                  </Upload>
                </Form.Item>
              </div>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Cập nhật thông tin
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Card>
  );
};

export default CompanyInfo;