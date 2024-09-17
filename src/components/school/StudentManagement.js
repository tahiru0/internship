import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message } from 'antd';
import { SearchOutlined, UserAddOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách học sinh:', error);
      message.error('Không thể lấy danh sách học sinh');
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    // Thực hiện tìm kiếm ở đây (có thể gọi API hoặc lọc dữ liệu local)
  };

  const handleAdd = () => {
    // Xử lý thêm học sinh mới
    message.info('Chức năng thêm học sinh đang được phát triển');
  };

  const handleEdit = (record) => {
    // Xử lý chỉnh sửa học sinh
    message.info(`Chỉnh sửa học sinh: ${record.name}`);
  };

  const handleDelete = (record) => {
    // Xử lý xóa học sinh
    message.info(`Xóa học sinh: ${record.name}`);
  };

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Lớp',
      dataIndex: 'class',
      key: 'class',
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'birthDate',
      key: 'birthDate',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)}>Xóa</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>Quản lý học sinh</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm kiếm học sinh"
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd}>
          Thêm học sinh
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={students}
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
};

export default StudentManagement;