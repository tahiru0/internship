import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Input, Card, Switch, message, Row, Col } from 'antd';
import { SearchOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import axiosInstance from '../../utils/axiosInstance';
import UpdateUserForm from './form/UpdateUserForm';
import CreateUserForm from './form/CreateUserForm';
import moment from 'moment';

const User = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState({});
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/users', {
        params: {
          page: pagination.current,
          size: pagination.pageSize,
          search: searchText,
        },
      });
      const fetchedUsers = response.data.data.users;
      if (Array.isArray(fetchedUsers)) {
        setUsers(fetchedUsers);
      } else {
        throw new Error('Dữ liệu không hợp lệ');
      }
      setPagination(prev => ({
        ...prev,
        total: response.data.data.totalItems,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (newPagination) => {
    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    fetchData();
  };

  const handleCreate = async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Tạo người dùng thành công');
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo người dùng');
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      await axiosInstance.put(`/admin/users/${id}`, values);
      message.success('Cập nhật người dùng thành công');
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  const toggleActiveStatus = async (record) => {
    setLoadingUsers(prev => ({ ...prev, [record.id]: true }));
    try {
      const response = await axiosInstance.put(`/admin/users/${record.id}`, { 
        isActive: !record.isActive 
      });
      if (response.status === 200) {
        setUsers(prevUsers => prevUsers.map(user => 
          user.id === record.id ? { ...user, isActive: !record.isActive } : user
        ));
        message.success(response.data.message || 'Cập nhật trạng thái người dùng thành công');
      } else {
        throw new Error('Phản hồi không hợp lệ từ server');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái người dùng');
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === record.id ? { ...user, isActive: record.isActive } : user
      ));
    } finally {
      setLoadingUsers(prev => ({ ...prev, [record.id]: false }));
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      // render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (text) => text ? <img src={text} alt="Avatar" style={{ width: 50, height: 50 }} /> : 'N/A',
      width: 100,
    },
    {
      title: 'Tên người dùng',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (text, record) => (
        <Switch 
          checked={record.isActive} 
          onChange={() => toggleActiveStatus(record)} 
          checkedChildren="Active" 
          unCheckedChildren="Disable"
          loading={loadingUsers[record.id]}
          disabled={loadingUsers[record.id]}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <>
          <Button 
            onClick={() => { setSelectedUser(record); setIsModalVisible(true); }} 
            icon={<EditOutlined />} 
          />
          <Button 
            onClick={() => { setSelectedDetails(record); setDetailsVisible(true); }} 
            icon={<EyeOutlined />} 
            style={{ marginLeft: 8 }}
          />
        </>
      ),
      width: 120,
    },
  ];

  return (
    <div className='container'>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        <Button type="primary" onClick={() => { setSelectedUser(null); setIsModalVisible(true); }}>
          Tạo người dùng
        </Button>
        <Input
          placeholder="Tìm kiếm"
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200, marginLeft: 'auto' }}
        />
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={selectedUser ? 'Chỉnh sửa người dùng' : 'Tạo người dùng'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedUser ? 
          <UpdateUserForm initialValues={selectedUser} onSubmit={(values) => handleUpdate(selectedUser.id, values)} /> :
          <CreateUserForm onSubmit={handleCreate} />
        }
      </Modal>

      <Modal
        title="Chi tiết người dùng"
        visible={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[<Button key="back" onClick={() => setDetailsVisible(false)}>Đóng</Button>]}
        width={600}
      >
        {selectedDetails && (
          <div>
            <Row gutter={16}>
              <Col span={8}>
                <img src={selectedDetails.avatar} alt="Avatar" style={{ width: '100%', borderRadius: '8px' }} />
              </Col>
              <Col span={16}>
                <h2>{selectedDetails.name}</h2>
                <p><strong>Email:</strong> {selectedDetails.email}</p>
                <p><strong>Vai trò:</strong> {selectedDetails.role}</p>
                <p><strong>Trạng thái:</strong> {selectedDetails.isActive ? 'Active' : 'Inactive'}</p>
                {/* Thêm thông tin khác nếu cần */}
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default User;