import React, { useState } from 'react';
import { Form, Input, Button, Upload, Select } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const UpdateUserForm = ({ initialValues, onSubmit }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const handleFinish = (values) => {
    // Thêm avatar vào values nếu có
    const updatedValues = {
      ...values,
      avatar: fileList.length > 0 ? fileList[0].originFileObj : null, // Lấy file avatar từ fileList
    };
    onSubmit(updatedValues);
  };

  const handleChange = ({ fileList: newFileList }) => {
    // Nếu có file mới, xóa file cũ
    if (newFileList.length > 0) {
      setFileList([newFileList[0]]); // Chỉ giữ lại file mới
    } else {
      setFileList([]);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleFinish}>
      <Form.Item
        name="name"
        label="Tên người dùng"
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="password"
        label="Mật khẩu"
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        name="role"
        label="Vai trò"
      >
        <Select placeholder="Chọn vai trò">
          <Option value="student">Học sinh</Option>
          <Option value="school_account">Tài khoản trường</Option>
          <Option value="company_account">Tài khoản công ty</Option>
          <Option value="admin">Quản trị viên</Option>
          <Option value="faculty">Giáo viên</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="avatar"
        label="Avatar"
      >
        <Upload
          beforeUpload={() => false} // Ngăn không cho tự động upload
          fileList={fileList}
          onChange={handleChange}
          showUploadList={{
            showPreviewIcon: false,
            showRemoveIcon: true,
          }}
        >
          <Button icon={<UploadOutlined />}>Tải lên Avatar</Button>
        </Upload>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Cập nhật người dùng
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UpdateUserForm;