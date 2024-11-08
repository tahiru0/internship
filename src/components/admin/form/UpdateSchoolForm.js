import React, { useState } from 'react';
import { Form, Input, Button, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const UpdateSchoolForm = ({ initialValues, onSubmit }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState(initialValues.logo ? [{
    uid: '-1', // unique identifier
    name: 'logo.png', // or any name you want
    status: 'done',
    url: initialValues.logo, // URL của logo đã tải lên
  }] : []);

  // Thiết lập giá trị ban đầu cho form
  React.useEffect(() => {
    form.setFieldsValue({
      name: initialValues.name,
      address: initialValues.address,
      website: initialValues.website,
      description: initialValues.description,
    });
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
        label="Tên trường"
        rules={[{ required: true, message: 'Vui lòng nhập tên trường' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="address"
        label="Địa chỉ"
        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="website"
        label="Website"
        rules={[{ type: 'url', message: 'Vui lòng nhập một URL hợp lệ' }]}
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
          Cập nhật
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UpdateSchoolForm;