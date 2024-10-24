import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Dropdown, Menu, DatePicker, Avatar, Descriptions, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined, UserOutlined } from '@ant-design/icons';
import { useSchool } from '../../context/SchoolContext';
import moment from 'moment';
import styled from 'styled-components';

const { Option } = Select;
const { Title } = Typography;

const StyledButton = styled(Button)`
  margin-right: 8px;
`;


const StyledTag = styled(Tag)`
  min-width: 70px;
  text-align: center;
`;

const AccountManagement = () => {
    const { api } = useSchool();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingAccountId, setEditingAccountId] = useState(null);
    const [accountDetail, setAccountDetail] = useState(null);
    const [faculties, setFaculties] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    useEffect(() => {
        fetchAccounts();
        fetchFaculties();
    }, [pagination.current, pagination.pageSize]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/school/accounts', {
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize
                }
            });
            setAccounts(response.data.data);
            setPagination({
                ...pagination,
                total: response.data.total
            });
        } catch (error) {
            message.error('Lỗi khi lấy danh sách tài khoản: ' + error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchFaculties = async () => {
        try {
            const response = await api.get('/school/faculties');
            setFaculties(response.data);
        } catch (error) {
            message.error('Lỗi khi lấy danh sách khoa: ' + error.response?.data?.message || error.message);
        }
    };

    const handleCreate = () => {
        setEditingAccountId(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingAccountId(record._id);
        form.setFieldsValue({
            ...record,
            dateOfBirth: record.dateOfBirth ? moment(record.dateOfBirth) : null,
            role: record.role?.name,
            faculty: record.role?.faculty?._id
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/school/accounts/${id}`);
            message.success('Xóa tài khoản thành công');
            fetchAccounts();
        } catch (error) {
            message.error('Lỗi khi xóa tài khoản: ' + error.response?.data?.message || error.message);
        }
    };

    const handleSubmit = async (values) => {
        try {
            const data = {
                ...values,
                role: {
                    name: values.role,
                    faculty: values.faculty
                },
                dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
            };

            if (editingAccountId) {
                await api.put(`/school/accounts/${editingAccountId}`, data);
                message.success('Cập nhật tài khoản thành công');
            } else {
                await api.post('/school/accounts', data);
                message.success('Tạo tài khoản mới thành công');
            }
            setModalVisible(false);
            fetchAccounts();
        } catch (error) {
            message.error('Lỗi: ' + error.response?.data?.message || error.message);
        }
    };

    const handleViewDetail = async (id) => {
        try {
            const response = await api.get(`/school/accounts/${id}`);
            setAccountDetail(response.data);
            setDetailModalVisible(true);
        } catch (error) {
            message.error('Lỗi khi lấy chi tiết tài khoản: ' + error.response?.data?.message || error.message);
        }
    };

    const handleTableChange = (pagination) => {
        setPagination(pagination);
    };

    const columns = [
        { 
            title: 'Tên', 
            dataIndex: 'name', 
            key: 'name', 
            width: 150,
            render: (text, record) => (
                <span>
                    <Avatar src={record.avatar} icon={<UserOutlined />} style={{ marginRight: 8 }} />
                    {text}
                </span>
            )
        },
        { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
        { 
            title: 'Vai trò', 
            dataIndex: ['role', 'name'], 
            key: 'role', 
            width: 120,
            render: (role) => {
                if (!role) return 'N/A';
                let color = role.includes('admin') ? 'gold' : role.includes('head') ? 'green' : 'blue';
                return <StyledTag color={color}>{role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}</StyledTag>;
            }
        },
        { 
            title: 'Khoa', 
            dataIndex: ['role', 'faculty', 'name'], 
            key: 'faculty', 
            width: 150,
            render: (text, record) => record.role?.faculty?.name || 'N/A'
        },
        { 
            title: 'Trạng thái', 
            dataIndex: 'isActive', 
            key: 'isActive', 
            width: 120,
            render: (isActive) => (
                <StyledTag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Hoạt động' : 'Không hoạt động'}
                </StyledTag>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Dropdown overlay={
                    <Menu>
                        <Menu.Item key="1" onClick={() => handleViewDetail(record._id)} icon={<EyeOutlined />}>
                            Chi tiết
                        </Menu.Item>
                        <Menu.Item key="2" onClick={() => handleEdit(record)} icon={<EditOutlined />}>
                            Sửa
                        </Menu.Item>
                        <Menu.Item key="3" onClick={() => handleDelete(record._id)} icon={<DeleteOutlined />} danger>
                            Xóa
                        </Menu.Item>
                    </Menu>
                } trigger={['click']}>
                    <Button icon={<MoreOutlined />} />
                </Dropdown>
            ),
        },
    ];

    return (
        <div>
            <StyledButton type="primary" onClick={handleCreate} icon={<PlusOutlined />}>
                Tạo tài khoản mới
            </StyledButton>
            <div style={{ marginTop: 16, width: '100%', overflowX: 'auto' }}>
                <Table 
                    columns={columns} 
                    dataSource={accounts} 
                    rowKey="_id" 
                    loading={loading}
                    scroll={{ x: 1000 }}
                    pagination={pagination}
                    onChange={handleTableChange}
                />
            </div>
            <Modal
                title={<Title level={4}>{editingAccountId ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</Title>}
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    {!editingAccountId && (
                        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
                        <Select>
                            <Option value="faculty-head">Trưởng khoa</Option>
                            <Option value="faculty-staff">Nhân viên khoa</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="faculty" label="Khoa" rules={[{ required: true }]}>
                        <Select>
                            {faculties.map(faculty => (
                                <Option key={faculty._id} value={faculty._id}>{faculty.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Số điện thoại">
                        <Input />
                    </Form.Item>
                    <Form.Item name="dateOfBirth" label="Ngày sinh">
                        <DatePicker format="YYYY-MM-DD" />
                    </Form.Item>
                    <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                        <Select>
                            <Option value={true}>Hoạt động</Option>
                            <Option value={false}>Không hoạt động</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {editingAccountId ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={<Title level={4}>Chi tiết tài khoản</Title>}
                visible={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {accountDetail && (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="Avatar" span={2}>
                            <Avatar src={accountDetail.avatar} size={64} icon={<UserOutlined />} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Tên">{accountDetail.name}</Descriptions.Item>
                        <Descriptions.Item label="Email">{accountDetail.email}</Descriptions.Item>
                        <Descriptions.Item label="Vai trò">
                            <StyledTag color={accountDetail.role.name.includes('admin') ? 'gold' : accountDetail.role.name.includes('head') ? 'green' : 'blue'}>
                                {accountDetail.role.name.charAt(0).toUpperCase() + accountDetail.role.name.slice(1).replace('-', ' ')}
                            </StyledTag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Khoa">{accountDetail.role.faculty?.name || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <StyledTag color={accountDetail.isActive ? 'green' : 'red'}>
                                {accountDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </StyledTag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{accountDetail.phoneNumber || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">{accountDetail.dateOfBirth || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Đăng nhập cuối">{moment(accountDetail.lastLogin).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{moment(accountDetail.createdAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lần cuối">{moment(accountDetail.updatedAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default AccountManagement;
