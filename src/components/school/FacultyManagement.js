import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Avatar, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, BookOutlined, InfoCircleOutlined } from '@ant-design/icons';
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
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [majorsOptions, setMajorsOptions] = useState([]);

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
            if (page === 1) {
                setMajorsOptions(newMajors);
            } else {
                setMajorsOptions(prevMajors => {
                    const uniqueMajors = newMajors.filter(major => 
                        !prevMajors.some(m => m._id === major._id)
                    );
                    return [...prevMajors, ...uniqueMajors];
                });
            }
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
        setIsEditing(false);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = async (facultyId) => {
        setEditingFacultyId(facultyId);
        setIsEditing(true);
        const details = await fetchFacultyDetails(facultyId);
        if (details) {
            setMajorsOptions(prevMajors => {
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

    const handleMajorsChange = (value) => {
        const newMajors = value.filter(v => 
            !majorsOptions.some(m => m._id === v || m.name === v)
        );
        if (newMajors.length > 0) {
            setMajorsOptions(prevMajors => [
                ...prevMajors,
                ...newMajors.map(newMajor => ({ 
                    _id: `new-${Date.now()}-${newMajor}`, 
                    name: newMajor
                }))
            ]);
        }
    };

    const handleSubmit = async (values) => {
        setSubmitLoading(true);
        try {
            if (isEditing) {
                // Giữ nguyên code xử lý cập nhật khoa
                const formattedMajors = values.majors.map(majorId => {
                    const major = majors.find(m => m._id === majorId);
                    return major && major._id.startsWith('new-') ? { name: major.name } : majorId;
                });

                const dataToSubmit = {
                    ...values,
                    majors: formattedMajors,
                    facultyHeadId: values.facultyHeadId || null
                };

                await api.put(`/school/faculties/${editingFacultyId}`, dataToSubmit);
                message.success('Cập nhật thông tin khoa thành công');
            } else {
                // Xử lý tạo khoa mới theo API mới
                const dataToSubmit = {
                    facultyName: values.name,
                    facultyDescription: values.description,
                    majors: values.majors.map(majorId => {
                        const major = majors.find(m => m._id === majorId);
                        return major ? major.name : majorId;
                    })
                };

                const response = await api.post('/school/create-faculty', dataToSubmit);
                message.success('Tạo khoa mới thành công');
                console.log('Khoa mới được tạo:', response.data.faculty);
            }
            setModalVisible(false);
            await fetchFaculties();
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
        },
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

    const showInfoModal = () => {
        setInfoModalVisible(true);
    };

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
                title={isEditing ? "Chỉnh sửa thông tin khoa" : "Thêm khoa mới"}
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingFacultyId(null);
                    setIsEditing(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item 
                        name="name" 
                        label="Tên khoa"
                        rules={[{ required: true, message: 'Vui lòng nhập tên khoa' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item 
                        name="description" 
                        label="Mô tả khoa"
                    >
                        <Input.TextArea />
                    </Form.Item>
                    <Form.Item 
                        name="majors" 
                        label="Ngành học"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một ngành học' }]}
                    >
                        <Select 
                            mode="tags" 
                            style={{ width: '100%' }} 
                            placeholder="Chọn hoặc nhập ngành học mới"
                            onSearch={handleMajorsSearch}
                            onPopupScroll={handleMajorsScroll}
                            loading={majorsFetching}
                            onChange={handleMajorsChange}
                            tokenSeparators={[',']}
                        >
                            {majorsOptions.map(major => (
                                <Option key={major._id} value={major._id}>
                                    {major.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {isEditing && (
                        <Form.Item 
                            name="facultyHeadId" 
                            label={
                                <Space>
                                    Trưởng khoa
                                    <Tooltip title="Xem hướng dẫn">
                                        <InfoCircleOutlined onClick={showInfoModal} style={{ cursor: 'pointer' }} />
                                    </Tooltip>
                                </Space>
                            }
                        >
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Chọn trưởng khoa"
                                allowClear
                            >
                                {facultyDetails?.head && (
                                    <Option key={facultyDetails.head._id} value={facultyDetails.head._id}>
                                        {facultyDetails.head.name} (Trưởng khoa hiện tại)
                                    </Option>
                                )}
                                {facultyDetails?.staff?.map(staff => (
                                    <Option key={staff._id} value={staff._id}>
                                        {staff.name} (Giáo vụ khoa)
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={submitLoading}>
                            {isEditing ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Hướng dẫn quản lý trưởng khoa"
                visible={infoModalVisible}
                onCancel={() => setInfoModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setInfoModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
            >
                <p>1. Để xóa trưởng khoa hiện tại: Chọn mục "Chọn trưởng khoa" và nhấn vào biểu tượng "x" để xóa lựa chọn. Sau đó lưu thay đổi.</p>
                <p>2. Để thay đổi trưởng khoa: Chọn một giáo vụ khoa từ danh sách để đặt làm trưởng khoa mới.</p>
                <p>3. Nếu không có trưởng khoa được chọn, hệ thống sẽ tự động đặt giá trị là null.</p>
            </Modal>
        </div>
    );
};

export default FacultyManagement;
