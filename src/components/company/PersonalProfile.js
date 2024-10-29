import React, { useState, useEffect, useCallback } from 'react';
import { Card, Avatar, Form, Input, Button, message, Upload, Modal } from 'antd';
import { UserOutlined, UploadOutlined, MailOutlined, HomeOutlined, PhoneOutlined } from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import Cookies from 'js-cookie';
import Cropper from 'react-easy-crop';

const PersonalProfile = () => {
  const [form] = Form.useForm();
  const { companyData, checkAuthStatus } = useCompany();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isCropModalVisible, setIsCropModalVisible] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imageSrc, setImageSrc] = useState(null);

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

  useEffect(() => {
    return () => {
      if (avatar && avatar.startsWith('blob:')) {
        URL.revokeObjectURL(avatar);
      }
    };
  }, [avatar]);

  const handleAvatarChange = (info) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target.result);
          setCrop({ x: 0, y: 0 });
          setIsCropModalVisible(true);
        };
        reader.readAsDataURL(file);
      } else {
        message.error('Vui lòng chọn một tệp hình ảnh hợp lệ.');
      }
    }
  };

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    console.log('Cropped area:', croppedArea);
    console.log('Cropped area pixels:', croppedAreaPixels);
  }, []);

  const handleCropConfirm = useCallback(() => {
    if (imageSrc) {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300; // Kích thước cố định cho avatar
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        const aspectRatio = image.width / image.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let drawX = 0;
        let drawY = 0;
        if (aspectRatio > 1) {
          drawWidth = canvas.height * aspectRatio;
          drawX = (canvas.width - drawWidth) / 2;
        } else if (aspectRatio < 1) {
          drawHeight = canvas.width / aspectRatio;
          drawY = (canvas.height - drawHeight) / 2;
        }
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        canvas.toBlob((blob) => {
          const newFile = new File([blob], 'avatar.png', { type: 'image/png' });
          setAvatarFile(newFile);
          setAvatar(URL.createObjectURL(blob));
          setIsCropModalVisible(false);
        }, 'image/png');
      };
      image.src = imageSrc;
    } else {
      setIsCropModalVisible(false);
    }
  }, [imageSrc]);

  const onFinish = async (values) => {
    setLoading(true);
    setFieldErrors({});
    try {
      const accessToken = Cookies.get('accessToken');
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile, 'avatar.png');
        await axiosInstance.put('/company/account/avatar', avatarFormData, {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      // Sau đó gửi các thông tin khác
      const response = await axiosInstance.put('/company/account', values, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
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
                  accept="image/*"
                  beforeUpload={() => false}
                  onChange={(info) => handleAvatarChange(info)}
                  showUploadList={false}
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
      <Modal
        visible={isCropModalVisible}
        onOk={handleCropConfirm}
        onCancel={() => setIsCropModalVisible(false)}
        title="Cắt ảnh đại diện"
        width={600}
        footer={[
          <Button key="back" onClick={() => setIsCropModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleCropConfirm}>
            Cập nhật ảnh đại diện
          </Button>,
        ]}
      >
        {imageSrc && (
          <div style={{ position: 'relative', width: '100%', height: 400 }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default PersonalProfile;
