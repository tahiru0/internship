import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Avatar, Typography, Card, Tag, Popconfirm, Switch, Pagination, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, UserOutlined, MailOutlined, LockOutlined, SearchOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import { useCompany } from '../../context/CompanyContext';

import { useMediaQuery } from 'react-responsive'; // Import useMediaQuery

const { Title } = Typography;
const { Option } = Select;

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingAccount, setEditingAccount] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    role: [],
    isActive: [],
    search: '',
    sortBy: null,
    order: null,
  });
  const { companyData, axiosInstance } = useCompany();
  const isMobileView = useMediaQuery({ maxWidth: 767 }); // Define isMobileView

  useEffect(() => {
    const resizeObserverError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
        return;
      }
      resizeObserverError(...args);
    };

    return () => {
      console.error = resizeObserverError;
    };
  }, []);

  const fetchAccounts = useCallback(async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filters.role.length > 0 && { role: filters.role.join(',') }),
        ...(filters.isActive.length > 0 && { isActive: filters.isActive.join(',') }),
        ...(filters.search && { search: filters.search }),
        ...(filters.sortBy && filters.order && { 
          sortBy: filters.sortBy,
          order: filters.order 
        })
      });

      const response = await axiosInstance.get(
        `/company/accounts?${queryParams.toString()}`, 
        withAuth()
      );

      if (response.data && Array.isArray(response.data.data)) {
        setAccounts(response.data.data);
        setPagination({
          current: response.data.page,
          pageSize: response.data.limit,
          total: response.data.total,
        });
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchAccounts();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleTableChange = (pagination, filters, sorter) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      role: filters.role || [],
      isActive: filters.isActive || [],
      sortBy: sorter.field || null,
      order: sorter.order ? (sorter.order === 'ascend' ? 'asc' : 'desc') : null,
    }));
    setPagination(prevPagination => ({
      ...prevPagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    }));
  };

  const handleSearch = (value) => {
    setFilters(prevFilters => ({ ...prevFilters, search: value }));
    setPagination(prevPagination => ({ ...prevPagination, current: 1 }));
  };

  const handleAddEdit = async (values) => {
    setLoading(true);
    try {
      if (editingAccount) {
        const { role, ...updateValues } = values;
        const response = await axiosInstance.put(
          `/company/accounts/${editingAccount._id}`, 
          updateValues,
          withAuth()
        );
        message.success(response.message || 'Cập nhật tài khoản thành công');
      } else {
        const response = await axiosInstance.post(
          '/company/accounts', 
          values,
          withAuth()
        );
        message.success(response.message || 'Thêm tài khoản mới thành công');
      }
      setModalVisible(false);
      fetchAccounts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const response = await axiosInstance.delete(
        `/company/accounts/${id}`,
        withAuth()
      );
      message.success(response.message || 'Xóa tài khoản thành công');
      fetchAccounts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (record) => {
    setLoading(true);
    try {
      const response = await axiosInstance.patch(
        `/company/accounts/${record._id}/toggle-active`,
        {},
        withAuth()
      );
      message.success(response.message || 'Cập nhật trạng thái tài khoản thành công');
      fetchAccounts(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar) => <Avatar src={avatar || 'https://joeschmoe.io/api/v1/random'} />
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Mentor', value: 'mentor' },
        { text: 'Sub-admin', value: 'sub-admin' },
      ],
      filteredValue: filters.role,
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <span style={{ 
          fontWeight: role === 'admin' ? 'bold' : 'normal',
          color: role === 'admin' ? '#1890ff' : 'inherit'
        }}>
          {role}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: 'Hoạt động', value: 'true' },
        { text: 'Không hoạt động', value: 'false' },
      ],
      filteredValue: filters.isActive,
      onFilter: (value, record) => record.isActive === value,
      render: (isActive, record) => (
        <Popconfirm
          title={`Bạn có chắc chắn muốn ${isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản này không?`}
          onConfirm={() => handleToggleActive(record)}
          okText="Có"
          cancelText="Không"
          disabled={record.role === 'admin'}
        >
          <Switch
            checked={isActive}
            disabled={record.role === 'admin'}
            loading={loading}
          />
        </Popconfirm>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      render: (createdAt) => new Date(createdAt).toLocaleDateString('vi-VN')
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => {
            setEditingAccount(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }} />
          {record.role !== 'admin' && (
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa tài khoản này không?"
              onConfirm={() => handleDelete(record._id)}
              okText="Có"
              cancelText="Không"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
        </>
      ),
    },
  ];

  return (
    <Card style={{ height: isMobileView ? 'auto' : 'calc(100vh - 100px)' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />} 
            onClick={() => {
              setEditingAccount(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            {isMobileView ? null : 'Thêm tài khoản mới'}
          </Button>
        </Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Input.Search
            placeholder="Tìm kiếm theo tên hoặc email"
            onSearch={handleSearch}
            style={{ width: '100%', maxWidth: 300 }}
          />
        </Col>
      </Row>
      <Table 
          columns={columns} 
          dataSource={accounts} 
          loading={loading} 
          rowKey="_id" 
          pagination={pagination}
          onChange={handleTableChange}
          rowClassName={(record) => record.role === 'admin' ? 'admin-row' : ''}
          scroll={{ x: 'max-content', y: isMobileView ? '100%' : 'calc(100vh - 310px)' }}
        />
      <Modal
        title={editingAccount ? "Sửa tài khoản" : "Thêm tài khoản mới"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddEdit} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          {!editingAccount && (
            <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
              <Select>
                <Option value="mentor">Mentor</Option>
                <Option value="sub-admin">Sub-admin</Option>
              </Select>
            </Form.Item>
          )}
          {!editingAccount && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={editingAccount ? <EditOutlined /> : <UserAddOutlined />}>
              {editingAccount ? "Cập nhật" : "Thêm mới"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default AccountManagement;