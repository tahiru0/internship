import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, message } from 'antd';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import dayjs from 'dayjs';

const CurrentProjects = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/student/current-projects');
      console.log('API Response:', response.data);
      setProjects(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const columns = [
    {
      title: 'Tên dự án',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Link to={`/student/current-projects/${record._id}`}>{text}</Link>
      ),
    },
    {
      title: 'Công ty',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color;
        switch (status?.toLowerCase()) {
          case 'open':
            color = 'green';
            break;
          case 'in progress':
            color = 'processing';
            break;
          case 'completed':
            color = 'success';
            break;
          case 'pending':
            color = 'warning';
            break;
          case 'closed':
            color = 'default';
            break;
          default:
            color = 'blue';
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A',
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary">
            <Link to={`/student/current-projects/${record._id}`}>Chi tiết</Link>
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Dự án thực tập hiện tại">
      <Table
        loading={loading}
        columns={columns}
        dataSource={projects}
        rowKey="_id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} dự án`
        }}
      />
    </Card>
  );
};

export default CurrentProjects; 