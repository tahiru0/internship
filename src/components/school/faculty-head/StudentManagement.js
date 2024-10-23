import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Button, Space, Modal, Form, Select, message, Popconfirm, Badge, Row, Col, Typography, Descriptions, List, Tabs, Tag, Tooltip } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, SwapOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSchool } from '../../../context/SchoolContext';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingStudentId, setEditingStudentId] = useState(null);
    const { api } = useSchool();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [approvalFilter, setApprovalFilter] = useState(true); // Mặc định hiển thị đã duyệt
    const [approvedCount, setApprovedCount] = useState(0);
    const [unapprovedCount, setUnapprovedCount] = useState(0);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/faculty/students', { 
                params: { 
                    page: pagination.current,
                    limit: pagination.pageSize,
                    search: searchText,
                    isApproved: approvalFilter 
                } 
            });
            setStudents(response.data.students);
            setPagination(prev => ({
                ...prev,
                total: response.data.totalStudents,
            }));
        } catch (error) {
            message.error('Lỗi khi tải danh sách sinh viên');
        }
        setLoading(false);
    }, [api, searchText, approvalFilter, pagination.current, pagination.pageSize]);

    useEffect(() => {
        fetchStudents();
        fetchMajors();
        fetchStudentCounts();
    }, [fetchTrigger, fetchStudents]);

    const fetchStudentCounts = async () => {
        try {
            const response = await api.get('/faculty/student-counts');
            setApprovedCount(response.data.approvedCount);
            setUnapprovedCount(response.data.unapprovedCount);
        } catch (error) {
            message.error('Lỗi khi tải số lượng sinh viên');
        }
    };

    const fetchMajors = async () => {
        try {
            const response = await api.get('/faculty/majors');
            setMajors(response.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách ngành học');
        }
    };

    const handleApprovalFilterChange = () => {
        setApprovalFilter(prev => !prev);
        setPagination(prev => ({ ...prev, current: 1 }));
        setFetchTrigger(prev => prev + 1);
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current: 1 }));
        setFetchTrigger(prev => prev + 1);
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        setPagination(newPagination);
        setFetchTrigger(prev => prev + 1);
    };

    const showModal = (record = null) => {
        setEditingStudentId(record ? record._id : null);
        if (record) {
            form.setFieldsValue(record);
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            setSubmitLoading(true);
            const values = await form.validateFields();
            if (editingStudentId) {
                await api.put(`/faculty/students/${editingStudentId}`, values);
                message.success('Cập nhật sinh viên thành công');
            } else {
                await api.post('/faculty/students', values);
                message.success('Thêm sinh viên mới thành công');
            }
            setIsModalVisible(false);
            fetchStudents();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Có lỗi xảy ra khi xử lý yêu cầu');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            setSubmitLoading(true);
            await api.delete(`/faculty/students/${id}`);
            message.success('Xóa sinh viên thành công');
            fetchStudents();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Lỗi khi xóa sinh viên');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setSubmitLoading(true);
            await api.put(`/faculty/approve-student/${id}`);
            message.success('Duyệt sinh viên thành công');
            fetchStudents();
            fetchStudentCounts();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Lỗi khi duyệt sinh viên');
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    const fetchInternshipReport = async (studentId) => {
        try {
            const response = await api.get(`/faculty/students/${studentId}/internship-report`);
            setCurrentReport(response.data);
            setReportModalVisible(true);
        } catch (error) {
            message.error('Lỗi khi tải báo cáo thực tập');
        }
    };

    const handleRowDoubleClick = (record) => {
        if (record.isApproved) {
            fetchInternshipReport(record._id);
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'evaluated': return 'processing';
            case 'submitted': return 'warning';
            case 'assigned': return 'default';
            case 'overdue': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return <CheckCircleOutlined />;
            case 'evaluated': return <CheckOutlined />;
            case 'submitted': return <ClockCircleOutlined />;
            case 'assigned': return <ExclamationCircleOutlined />;
            case 'overdue': return <CloseCircleOutlined />;
            default: return null;
        }
    };

    const getRatingTag = (rating) => {
        if (rating === undefined || rating === null) return null;
        const color = rating >= 8 ? 'green' : rating >= 6 ? 'blue' : rating >= 4 ? 'orange' : 'red';
        return <Tag color={color}>Đánh giá: {rating}/10</Tag>;
    };

    const columns = [
        {
            title: 'Tên',
            dataIndex: 'name',
            sorter: true,
            responsive: ['md'],
        },
        {
            title: 'Email',
            dataIndex: 'email',
            responsive: ['lg'],
        },
        {
            title: 'Mã sinh viên',
            dataIndex: 'studentId',
            responsive: ['sm'],
        },
        {
            title: 'Ngành học',
            dataIndex: ['major', 'name'],
            responsive: ['lg'],
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isApproved',
            render: (isApproved, record) => (
                <Space>
                    {isApproved ? 'Đã duyệt' : 'Chưa duyệt'}
                    {!isApproved && (
                        <Button 
                            icon={<CheckOutlined />} 
                            onClick={() => handleApprove(record._id)}
                            loading={submitLoading}
                        >
                            Duyệt
                        </Button>
                    )}
                </Space>
            ),
            responsive: ['sm'],
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
                    <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record._id)}>
                        <Button icon={<DeleteOutlined />} />
                    </Popconfirm>
                    {!record.isApproved && (
                        <Button 
                            icon={<CheckOutlined />} 
                            onClick={() => handleApprove(record._id)}
                            loading={submitLoading}
                        >
                            Duyệt
                        </Button>
                    )}
                </Space>
            ),
            responsive: ['sm'],
        },
    ];

    const ReportModal = () => (
        <Modal
            title="Báo cáo thực tập"
            visible={reportModalVisible}
            onCancel={() => setReportModalVisible(false)}
            width={800}
            footer={null}
        >
            {currentReport && (
                <Tabs defaultActiveKey="1">
                    <TabPane tab="Thông tin sinh viên" key="1">
                        <Descriptions bordered>
                            <Descriptions.Item label="Tên" span={3}>{currentReport.studentInfo.name}</Descriptions.Item>
                            <Descriptions.Item label="Mã sinh viên" span={3}>{currentReport.studentInfo.studentId}</Descriptions.Item>
                            <Descriptions.Item label="Ngành học" span={3}>{currentReport.studentInfo.major}</Descriptions.Item>
                        </Descriptions>
                    </TabPane>
                    <TabPane tab="Nhiệm vụ" key="2">
                        <List
                            dataSource={currentReport.tasks}
                            renderItem={task => (
                                <List.Item>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Space wrap>
                                            <Text strong>{task.name}</Text>
                                            <Tag icon={getStatusIcon(task.status)} color={getStatusColor(task.status)}>
                                                {task.status}
                                            </Tag>
                                            {getRatingTag(task.rating)}
                                            <Tooltip title="Hạn chót">
                                                <Tag icon={<ClockCircleOutlined />}>{new Date(task.deadline).toLocaleDateString()}</Tag>
                                            </Tooltip>
                                            {task.submissionDate && (
                                                <Tooltip title="Ngày nộp">
                                                    <Tag icon={<CheckCircleOutlined />}>
                                                        {new Date(task.submissionDate).toLocaleDateString()}
                                                    </Tag>
                                                </Tooltip>
                                            )}
                                        </Space>
                                        <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}>
                                            <Text strong>Mô tả:</Text> {task.description}
                                        </Paragraph>
                                        {task.comment && (
                                            <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}>
                                                <Text strong>Nhận xét:</Text> {task.comment}
                                            </Paragraph>
                                        )}
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </TabPane>
                    <TabPane tab="Báo cáo" key="3">
                        <List
                            dataSource={currentReport.reports}
                            renderItem={report => (
                                <List.Item>
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Space wrap>
                                            <Text strong>{report.title}</Text>
                                            <Tag icon={<ClockCircleOutlined />}>{new Date(report.createdAt).toLocaleDateString()}</Tag>
                                        </Space>
                                        <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'Xem thêm' }}>
                                            {report.content}
                                        </Paragraph>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </TabPane>
                    <TabPane tab="Điểm trung bình" key="4">
                        <Title level={3} style={{ textAlign: 'center' }}>
                            Điểm trung bình: {currentReport.averageScore || 'Chưa có đánh giá'}
                        </Title>
                    </TabPane>
                </Tabs>
            )}
        </Modal>
    );

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Input
                        placeholder="Tìm kiếm"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onPressEnter={handleSearch}
                        prefix={<SearchOutlined />}
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                        Thêm sinh viên
                    </Button>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Badge count={approvalFilter ? unapprovedCount : approvedCount}>
                        <Button icon={<SwapOutlined />} onClick={handleApprovalFilterChange}>
                            {approvalFilter ? 'Xem chưa duyệt' : 'Xem đã duyệt'}
                        </Button>
                    </Badge>
                </Col>
            </Row>
            <Table
                columns={columns}
                dataSource={students}
                rowKey="_id"
                pagination={pagination}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                    onDoubleClick: () => handleRowDoubleClick(record),
                })}
            />
            <Modal
                title={editingStudentId ? "Sửa thông tin sinh viên" : "Thêm sinh viên mới"}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={submitLoading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="studentId" label="Mã sinh viên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name={['major', '_id']} label="Ngành học" rules={[{ required: true }]}>
                        <Select>
                            {majors.map((major) => (
                                <Option key={major._id} value={major._id}>{major.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
            <ReportModal />
        </div>
    );
};

export default StudentManagement;
