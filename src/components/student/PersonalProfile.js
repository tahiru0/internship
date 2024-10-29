import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Row, Col, Tabs, Form, Input, Button, Upload, message, Spin, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, UploadOutlined, EditOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useStudent } from '../../context/StudentContext';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PersonalProfile = () => {
  const [form] = Form.useForm();
  const { userData, fetchUserData } = useStudent();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [cv, setCv] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/student/update-profile', withAuth());
        const data = response.data;
        form.setFieldsValue({
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          address: data.address,
          skills: data.skills,
          experience: data.experience,
          education: data.education,
          major: data.major?.name,
        });
        setAvatar(data.avatar);
        setCv(data.cv);
        setLoading(false);
      } catch (error) {
        message.error('Lỗi khi lấy thông tin cá nhân');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const onFinish = async (values) => {
    setLoading(true);
    setFieldErrors({});
    try {
      const response = await axiosInstance.put('/student/update-profile', values, withAuth());
      message.success('Cập nhật thông tin thành công');
      await fetchUserData();
      setEditing(false);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;
        const fieldError = {};
        const field = errorMessage.split(':')[1].split(' ')[0]; // Lấy tên field từ message
        fieldError[field] = errorMessage.replace(`Validation failed: ${field}: `, ''); // Loại bỏ phần dư thừa
        setFieldErrors(fieldError);
      } else {
        message.error('Lỗi khi cập nhật thông tin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (info) => {
    if (info.file.status === 'done') {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', info.file.originFileObj);
        const response = await axiosInstance.put('/student/update-avatar', formData, {
          ...withAuth(),
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setAvatar(response.data.avatar);
        message.success('Cập nhật avatar thành công');
        await fetchUserData();
      } catch (error) {
        message.error('Lỗi khi cập nhật avatar');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCvUpload = async (info) => {
    if (info.file.status === 'done') {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('cv', info.file.originFileObj);
        const response = await axiosInstance.put('/student/update-cv', formData, {
          ...withAuth(),
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setCv(response.data.cv);
        message.success('Cập nhật CV thành công');
        await fetchUserData();
      } catch (error) {
        message.error('Lỗi khi cập nhật CV');
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchCV = async () => {
    try {
      const response = await axiosInstance.get('/student/get-cv', withAuth());
      setCv(response.data.cv);
    } catch (error) {
      console.error('Lỗi khi lấy CV:', error);
      if (error.response && error.response.status === 404) {
        message.info('Bạn chưa có CV.');
      } else {
        message.error('Có lỗi xảy ra khi lấy CV.');
      }
    }
  };

  useEffect(() => {
    fetchCV();
  }, []);

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <Card>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8} md={6}>
          <div style={{ textAlign: 'center' }}>
            <Avatar size={200} src={avatar} icon={<UserOutlined />} />
            <Upload
              showUploadList={false}
              customRequest={async ({ file, onSuccess }) => {
                const formData = new FormData();
                formData.append('avatar', file);
                try {
                  const response = await axiosInstance.put('/student/update-avatar', formData, {
                    ...withAuth(),
                    headers: { 'Content-Type': 'multipart/form-data' }
                  });
                  onSuccess(response, file);
                } catch (error) {
                  message.error('Lỗi khi cập nhật avatar');
                }
              }}
              onChange={handleAvatarUpload}
            >
              <Button icon={<UploadOutlined />} style={{ marginTop: 16 }}>
                Cập nhật Avatar
              </Button>
            </Upload>
          </div>
        </Col>
        <Col xs={24} sm={16} md={18}>
          <Title level={2}>{userData.name}</Title>
          <Text type="secondary">{userData.major?.name}</Text>
          <Divider />
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong><MailOutlined /> Email:</Text> {userData.email}
            </Col>
            <Col span={12}>
              <Text strong><PhoneOutlined /> Số điện thoại:</Text> {userData.phoneNumber}
            </Col>
            <Col span={12}>
              <Text strong><HomeOutlined /> Địa chỉ:</Text> {userData.address}
            </Col>
            {cv && (
              <Col span={12}>
                <Text strong><FilePdfOutlined /> CV:</Text>
                <a href={cv} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                  <Button icon={<FilePdfOutlined />}>Xem CV</Button>
                </a>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" style={{ marginTop: 24 }}>
        <TabPane tab="Thông tin cá nhân" key="1">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={userData}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Họ và tên"
                  rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                >
                  <Input disabled={!editing} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, message: 'Vui lòng nhập email' }]}
                >
                  <Input disabled={!editing} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phoneNumber"
                  label="Số điện thoại"
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                  validateStatus={fieldErrors.phoneNumber ? 'error' : ''}
                  help={fieldErrors.phoneNumber}
                >
                  <Input disabled={!editing} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="address"
                  label="Địa chỉ"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                >
                  <Input disabled={!editing} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="skills" label="Kỹ năng">
              <Input.TextArea disabled={!editing} />
            </Form.Item>
            <Form.Item name="experience" label="Kinh nghiệm">
              <Input.TextArea disabled={!editing} />
            </Form.Item>
            <Form.Item name="education" label="Học vấn">
              <Input.TextArea disabled={!editing} />
            </Form.Item>
            {editing ? (
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Lưu thay đổi
                </Button>
                <Button style={{ marginLeft: 8 }} onClick={() => setEditing(false)}>
                  Hủy
                </Button>
              </Form.Item>
            ) : (
              <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
                Chỉnh sửa
              </Button>
            )}
          </Form>
        </TabPane>
        <TabPane tab="CV" key="2">
          {cv ? (
            <div>
              <Text strong>CV hiện tại:</Text>
              <a href={cv} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                <Button icon={<FilePdfOutlined />}>Xem CV</Button>
              </a>
            </div>
          ) : (
            <Text>Chưa có CV</Text>
          )}
          <Upload
            accept=".pdf"
            showUploadList={false}
            customRequest={async ({ file, onSuccess }) => {
              const formData = new FormData();
              formData.append('cv', file);
              try {
                const response = await axiosInstance.put('/student/update-cv', formData, {
                  ...withAuth(),
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                onSuccess(response, file);
                setCv(response.data.cv);
                message.success('Cập nhật CV thành công');
              } catch (error) {
                message.error('Lỗi khi cập nhật CV');
              }
            }}
          >
            <Button icon={<UploadOutlined />} style={{ marginTop: 16 }}>
              {cv ? 'Cập nhật CV' : 'Tải lên CV'}
            </Button>
          </Upload>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default PersonalProfile;