import React, { useState } from 'react';
import { Form, Input, Button, Upload, DatePicker } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const CreateSchoolForm = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const handleFinish = (values) => {
    // Thêm logo vào values
    const updatedValues = {
      ...values,
      logo: fileList.length > 0 ? fileList[0].originFileObj : null, // Lấy file logo từ fileList
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

  const formFields = [
    { name: 'name', label: 'Tên trường', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập tên trường' }] },
    { name: 'symbol', label: 'Symbol', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập ký hiệu viết tắt của trường' }] },
    { name: 'email', label: 'Email', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập email' }] },
    { name: 'address', label: 'Địa chỉ', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập địa chỉ' }] },
    { name: 'website', label: 'Website', type: 'link' },
    { name: 'establishedDate', label: 'Ngày thành lập', type: 'date' },
    { name: 'logo', label: 'Logo', type: 'upload', accept: 'image/*', colSpan: 24 },
  ];

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      {formFields.map(field => {
        switch (field.type) {
          case 'text':
            return (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                rules={field.rules}
              >
                <Input />
              </Form.Item>
            );
          case 'link':
            return (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                rules={[{ type: 'url', message: 'Vui lòng nhập một URL hợp lệ' }]}
              >
                <Input />
              </Form.Item>
            );
          case 'date':
            return (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            );
          case 'upload':
            return (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
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
            );
          default:
            return null;
        }
      })}
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Tạo trường học
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CreateSchoolForm;