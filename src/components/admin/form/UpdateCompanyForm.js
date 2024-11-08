import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const UpdateCompanyForm = ({ initialValues, onSubmit }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    // Thiết lập giá trị ban đầu cho form
    form.setFieldsValue({
      name: initialValues.name,
      email: initialValues.email,
      projectCount: initialValues.projectCount,
      description: initialValues.description,
      website: initialValues.website,
    });

    // Nếu có logo, hiển thị logo trong fileList
    if (initialValues.logo) {
      setFileList([{
        uid: '-1',
        name: 'logo.png',
        status: 'done',
        url: initialValues.logo,
      }]);
    }
  }, [initialValues, form]);

  const handleFinish = (values) => {
    // Thêm logo vào values
    const updatedValues = {
      ...values,
      logo: fileList.length > 0 ? fileList[0].url : null, // Lấy URL của logo
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
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item
        name="name"
        label="Tên công ty"
        rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Mô tả"
      >
        <Input.TextArea />
      </Form.Item>
      <Form.Item
        name="website"
        label="Website"
        rules={[{ type: 'url', message: 'Vui lòng nhập một URL hợp lệ' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="logo"
        label="Logo"
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
          <Button icon={<UploadOutlined />}>Tải lên Logo</Button>
        </Upload>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Cập nhật công ty
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UpdateCompanyForm;