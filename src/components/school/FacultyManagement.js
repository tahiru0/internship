import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSchool } from '../../context/SchoolContext';
import debounce from 'lodash/debounce';

const { Option } = Select;

const FacultyManagement = () => {
    const { api } = useSchool();
    const [faculties, setFaculties] = useState([]);
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingFacultyId, setEditingFacultyId] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [newMajors, setNewMajors] = useState([]);
    const [majorLoading, setMajorLoading] = useState(false);
    const [majorPage, setMajorPage] = useState(1);
    const [hasMoreMajors, setHasMoreMajors] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        fetchFaculties();
        fetchMajors();
    }, []);

    const fetchFaculties = async () => {
        setLoading(true);
        try {
            const response = await api.get('/school/faculties');
            setFaculties(response.data);
        } catch (error) {
            message.error('Lỗi khi lấy danh sách khoa: ' + error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMajors = async (page = 1, search = '') => {
        setMajorLoading(true);
        try {
            const response = await api.get('/school/majors', {
                params: { page, limit: 10, search }
            });
            const newMajors = response.data.majors;
            setMajors(prevMajors => (page === 1 ? newMajors : [...prevMajors, ...newMajors]));
            setHasMoreMajors(page < response.data.totalPages);
            setMajorPage(page);
        } catch (error) {
            message.error('Lỗi khi lấy danh sách ngành học: ' + error.response?.data?.message || error.message);
        } finally {
            setMajorLoading(false);
        }
    };

    const debouncedFetchMajors = debounce((search) => fetchMajors(1, search), 300);

    const handleCreate = () => {
        setEditingFacultyId(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = async (facultyId) => {
        setLoading(true);
        try {
            const response = await api.get(`/school/faculties/${facultyId}`);
            const faculty = response.data;
            setEditingFacultyId(facultyId);
            form.setFieldsValue({
                name: faculty.name,
                description: faculty.description,
                majors: faculty.majors.map(major => major.name),
                headName: faculty.head.name,
                email: faculty.head.email,
            });
            setModalVisible(true);
        } catch (error) {
            console.error('Lỗi khi lấy thông tin khoa:', error);
            message.error('Lỗi khi lấy thông tin khoa: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (facultyId) => {
        try {
            await api.delete(`/school/faculties/${facultyId}`);
            message.success('Đã xóa khoa thành công');
            fetchFaculties();
        } catch (error) {
            message.error('Lỗi khi xóa khoa: ' + error.response?.data?.message || error.message);
        }
    };

    const handleSubmit = async (values) => {
        setSubmitLoading(true);
        try {
            // Xử lý dữ liệu ngành học để loại bỏ trùng lặp
            const uniqueMajors = Array.from(new Set([
                ...values.majors,
                ...newMajors
            ])).map(major => ({ name: major }));

            const dataToSend = {
                facultyName: values.name,
                facultyDescription: values.description,
                headName: values.headName,
                email: values.email,
                password: values.password,
                majors: uniqueMajors
            };

            if (editingFacultyId) {
                await api.put(`/school/faculties/${editingFacultyId}`, dataToSend);
                message.success('Cập nhật thông tin khoa thành công');
            } else {
                await api.post('/school/create-faculty', dataToSend);
                message.success('Tạo khoa mới thành công');
            }
            setModalVisible(false);
            setNewMajors([]);
            fetchFaculties();
            fetchMajors();
        } catch (error) {
            message.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const columns = [
        { title: 'Tên khoa', dataIndex: 'name', key: 'name' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        { title: 'Số ngành học', dataIndex: 'majorsCount', key: 'majorsCount' },
        { title: 'Trưởng khoa', dataIndex: 'headName', key: 'headName' }, // Thêm cột mới này
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record._id)}>
                        Sửa
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa khoa này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button icon={<DeleteOutlined />} danger>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleCreate}
                style={{ marginBottom: 16 }}
            >
                Thêm khoa mới
            </Button>
            <Table 
                columns={columns} 
                dataSource={faculties} 
                rowKey="_id"
                loading={loading}
            />
            <Modal
                title={editingFacultyId ? "Chỉnh sửa thông tin khoa" : "Thêm khoa mới"}
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingFacultyId(null);
                    form.resetFields();
                    setNewMajors([]);
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item name="name" label="Tên khoa" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
                        <Input.TextArea />
                    </Form.Item>
                    {!editingFacultyId && (
                        <>
                            <Form.Item name="headName" label="Tên trưởng khoa" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="email" label="Email trưởng khoa" rules={[{ required: true, type: 'email' }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="password" label="Mật khẩu trưởng khoa" rules={[{ required: true }]}>
                                <Input.Password />
                            </Form.Item>
                        </>
                    )}
                    <Form.Item name="majors" label="Ngành học">
                        <Select
                            mode="tags"
                            style={{ width: '100%' }}
                            placeholder="Chọn hoặc nhập ngành học mới"
                            onChange={(values) => {
                                const existingMajors = majors.map(m => m.name);
                                const newMajorValues = values.filter(v => !existingMajors.includes(v));
                                setNewMajors(newMajorValues);
                            }}
                            onSearch={debouncedFetchMajors}
                            onPopupScroll={(event) => {
                                const target = event.target;
                                if (target.scrollTop + target.offsetHeight === target.scrollHeight && !majorLoading && hasMoreMajors) {
                                    fetchMajors(majorPage + 1);
                                }
                            }}
                            loading={majorLoading}
                        >
                            {majors.map(major => (
                                <Option key={major._id} value={major.name}>{major.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={submitLoading}>
                            {editingFacultyId ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default FacultyManagement;
