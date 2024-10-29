import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Avatar, DatePicker, Tag, Descriptions, Typography, Dropdown, Menu, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UserOutlined, EllipsisOutlined } from '@ant-design/icons';
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
    const { api, userRole, schoolData } = useSchool();
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
        if (userRole !== 'admin' && userRole !== 'faculty-head') {
            message.error('Bạn không có quyền tạo tài khoản mới');
            return;
        }
        setEditingAccountId(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = async (record) => {
        if (userRole === 'admin' ||
            (userRole === 'faculty-head') ||
            record._id === schoolData.account._id) {
            setEditingAccountId(record._id);
            try {
                const response = await api.get(`/school/accounts/${record._id}`);
                const accountData = response.data;
                form.setFieldsValue({
                    name: accountData.name,
                    email: accountData.email,
                    role: accountData.role.name,
                    faculty: accountData.role.faculty?._id,
                    isActive: accountData.isActive,
                    // Thêm các trường khác nếu cần
                });
                setModalVisible(true);
            } catch (error) {
                message.error('Lỗi khi lấy thông tin tài khoản: ' + error.response?.data?.message || error.message);
            }
        }
    };

    const handleDelete = async (id) => {
        if (userRole !== 'admin') {
            message.error('Chỉ admin mới có quyền xóa tài khoản');
            return;
        }
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
            let data = { ...values };
            
            if (userRole === 'admin') {
                data.role = {
                    name: values.role,
                    faculty: values.faculty
                };
            } else {
                // Nếu không phải admin, giữ nguyên role và faculty
                const currentAccount = await api.get(`/school/accounts/${editingAccountId}`);
                data.role = currentAccount.data.role;
            }

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
            dataIndex: 'role',
            key: 'role',
            width: 120,
            render: (role) => {
                if (!role) return 'N/A';
                let color = role === 'admin' ? 'gold' : role === 'faculty-head' ? 'green' : 'blue';
                let displayRole = role === 'admin' ? 'Admin' : role === 'faculty-head' ? 'Trưởng khoa' : 'Nhân viên khoa';
                return <StyledTag color={color}>{displayRole}</StyledTag>;
            }
        },
        {
            title: 'Khoa',
            dataIndex: ['faculty', 'name'],
            key: 'faculty',
            width: 150,
            render: (text) => text || 'N/A'
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
            render: (_, record) => (
                <Dropdown
                    overlay={
                        <Menu>
                            <Menu.Item key="view" icon={<EyeOutlined />} onClick={() => handleViewDetail(record._id)}>
                                Chi tiết
                            </Menu.Item>
                            {(userRole === 'admin' ||
                                (userRole === 'faculty-head' && record.role?.faculty?._id === schoolData?.faculty?._id) ||
                                record._id === schoolData?._id) && (
                                    <Menu.Item key="edit" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                                        Sửa
                                    </Menu.Item>
                                )}
                            {userRole === 'admin' && record.role?.name !== 'admin' && (
                                <Menu.Item key="delete" icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)}>
                                    Xóa
                                </Menu.Item>
                            )}
                        </Menu>
                    }
                    trigger={['click']}
                >
                    <Button type="text" icon={<EllipsisOutlined style={{ fontSize: '24px' }} />} style={{ width: '40px', height: '40px' }} />
                </Dropdown>
            ),
        },
    ];

    return (
        <div>
            {(userRole === 'admin' || userRole === 'faculty-head') && (
                <Button type="primary" onClick={handleCreate} icon={<PlusOutlined />}>
                    Tạo tài khoản mới
                </Button>
            )}
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
                width={800}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    {!editingAccountId && (
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                                    <Input.Password />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
                                <Select disabled={userRole !== 'admin'}>
                                    <Option value="admin">Admin</Option>
                                    <Option value="faculty-head">Trưởng khoa</Option>
                                    <Option value="faculty-staff">Nhân viên khoa</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="faculty" label="Khoa" rules={[{ required: true }]}>
                                <Select disabled={userRole !== 'admin'}>
                                    {faculties.map(faculty => (
                                        <Option key={faculty._id} value={faculty._id}>{faculty.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phoneNumber" label="Số điện thoại">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="dateOfBirth" label="Ngày sinh">
                                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
                                <Select>
                                    <Option value={true}>Hoạt động</Option>
                                    <Option value={false}>Không hoạt động</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
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
                        <Descriptions.Item label="Avatar">
                            <Avatar src={accountDetail.avatar} size={64} icon={<UserOutlined />} />
                        </Descriptions.Item>
                        <Descriptions.Item label="Tên">{accountDetail.name}</Descriptions.Item>
                        <Descriptions.Item label="Email">{accountDetail.email}</Descriptions.Item>
                        <Descriptions.Item label="Vai trò">
                            <StyledTag color={accountDetail.role.name === 'admin' ? 'gold' : accountDetail.role.name === 'faculty-head' ? 'green' : 'blue'}>
                                {accountDetail.role.name === 'admin' ? 'Admin' : accountDetail.role.name === 'faculty-head' ? 'Trưởng khoa' : 'Nhân viên khoa'}
                            </StyledTag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Khoa">{accountDetail.role.faculty?.name || 'N/A'}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <StyledTag color={accountDetail.isActive ? 'green' : 'red'}>
                                {accountDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </StyledTag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{moment(accountDetail.createdAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lần cuối">{moment(accountDetail.updatedAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default AccountManagement;
