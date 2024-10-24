import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Avatar, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, BookOutlined, CloseCircleOutlined } from '@ant-design/icons';
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
    const [submitLoading, setSubmitLoading] = useState(false);
    const [facultyDetails, setFacultyDetails] = useState(null);
    const [majorsFetching, setMajorsFetching] = useState(false);
    const [majorsPage, setMajorsPage] = useState(1);
    const [majorsHasMore, setMajorsHasMore] = useState(true);

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
        if (!majorsHasMore && page !== 1) return;
        setMajorsFetching(true);
        try {
            const response = await api.get('/school/majors', {
                params: { page, limit: 20, search }
            });
            const newMajors = response.data.majors;
            setMajors(prevMajors => page === 1 ? newMajors : [...prevMajors, ...newMajors]);
            setMajorsPage(page);
            setMajorsHasMore(page < response.data.totalPages);
        } catch (error) {
            message.error('Lỗi khi lấy danh sách ngành học: ' + error.response?.data?.message || error.message);
        } finally {
            setMajorsFetching(false);
        }
    };

    const debouncedFetchMajors = debounce((search) => fetchMajors(1, search), 300);

    const handleMajorsSearch = (search) => {
        debouncedFetchMajors(search);
    };

    const handleMajorsScroll = (event) => {
        const { target } = event;
        if (target.scrollTop + target.offsetHeight === target.scrollHeight) {
            fetchMajors(majorsPage + 1);
        }
    };

    const fetchFacultyDetails = async (facultyId) => {
        try {
            const response = await api.get(`/school/faculties/${facultyId}`);
            setFacultyDetails(response.data);
            return response.data;
        } catch (error) {
            message.error('Lỗi khi lấy chi tiết khoa: ' + error.response?.data?.message || error.message);
        }
    };

    const handleCreate = () => {
        setEditingFacultyId(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = async (facultyId) => {
        setEditingFacultyId(facultyId);
        const details = await fetchFacultyDetails(facultyId);
        if (details) {
            // Thêm các ngành học của khoa vào danh sách majors nếu chưa có
            setMajors(prevMajors => {
                const newMajors = [...prevMajors];
                details.majors.forEach(major => {
                    if (!newMajors.some(m => m._id === major._id)) {
                        newMajors.push(major);
                    }
                });
                return newMajors;
            });

            form.setFieldsValue({
                name: details.name,
                description: details.description,
                majors: details.majors.map(major => major._id),
                facultyHeadId: details.head?._id,
            });
            setFacultyDetails(details);
            setModalVisible(true);
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

    const handleMajorsChange = (value, option) => {
        const newMajors = value.filter(v => 
            typeof v === 'string' && 
            !majors.some(m => m._id === v || m.name === v)
        );
        if (newMajors.length > 0) {
            const updatedMajors = [...majors];
            newMajors.forEach(newMajor => {
                if (!updatedMajors.some(m => m.name === newMajor)) {
                    updatedMajors.push({ 
                        _id: `new-${Date.now()}-${newMajor}`, 
                        name: newMajor
                    });
                }
            });
            setMajors(updatedMajors);
        }
        form.setFieldsValue({ majors: value });
    };

    const handleSubmit = async (values) => {
        setSubmitLoading(true);
        try {
            const formattedMajors = values.majors.map(majorId => {
                const major = majors.find(m => m._id === majorId);
                return major && major._id.startsWith('new-') ? { name: major.name } : majorId;
            });

            const dataToSubmit = {
                ...values,
                majors: formattedMajors,
            };

            if (editingFacultyId) {
                await api.put(`/school/faculties/${editingFacultyId}`, dataToSubmit);
                message.success('Cập nhật thông tin khoa thành công');
            } else {
                await api.post('/school/create-faculty', dataToSubmit);
                message.success('Tạo khoa mới thành công');
            }
            setModalVisible(false);
            fetchFaculties();
        } catch (error) {
            message.error(error.response?.data?.message || error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const columns = [
        {
            title: 'Tên khoa',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    {text}
                </Space>
            ),
        },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Trưởng khoa',
            dataIndex: 'headName',
            key: 'headName',
            render: (text, record) => text || 'Chưa có trưởng khoa'
        },
        {
            title: 'Số ngành học',
            dataIndex: 'majorsCount',
            key: 'majorsCount',
            render: (count) => (
                <Space>
                    <BookOutlined />
                    {count}
                </Space>
            ),
        },
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
                    <Form.Item name="majors" label="Ngành học">
                        <Select 
                            mode="tags" 
                            style={{ width: '100%' }} 
                            placeholder="Chọn hoặc nhập ngành học mới"
                            onSearch={handleMajorsSearch}
                            onPopupScroll={handleMajorsScroll}
                            loading={majorsFetching}
                            onChange={handleMajorsChange}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            tagRender={(props) => {
                                const { label, value, closable, onClose } = props;
                                const onPreventMouseDown = (event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                };
                                return (
                                    <Tag
                                        color="blue"
                                        onMouseDown={onPreventMouseDown}
                                        closable={closable}
                                        onClose={onClose}
                                        style={{ marginRight: 3 }}
                                    >
                                        {label || value}
                                    </Tag>
                                );
                            }}
                        >
                            {majors.map(major => (
                                <Option key={major._id} value={major._id} label={major.name}>
                                    {major.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="facultyHeadId" label="Trưởng khoa">
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Chọn trưởng khoa"
                            allowClear
                        >
                            {facultyDetails?.head && (
                                <Option key={facultyDetails.head._id} value={facultyDetails.head._id}>
                                    {facultyDetails.head.name} (Trưởng khoa)
                                </Option>
                            )}
                            {facultyDetails?.staff?.map(staff => (
                                <Option key={staff._id} value={staff._id}>
                                    {staff.name} (Giáo vụ khoa)
                                </Option>
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
