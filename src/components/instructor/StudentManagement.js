import React, { useState } from 'react';
import { Table, Input, Button, Tabs, Card, Space, Popconfirm, message, Progress, Avatar, Dropdown, Menu, Modal, Form, Input as AntInput, DatePicker, Select } from 'antd';
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faGraduationCap, faBriefcase, faCogs, faLanguage, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faker } from '@faker-js/faker';
import 'bootstrap/dist/css/bootstrap.min.css';
import moment from 'moment';

const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const generateStudentData = () => {
    return Array.from({ length: 50 }).map((_, index) => ({
        key: index,
        studentName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        projectName: faker.commerce.productName(),
        status: faker.helpers.arrayElement(['Chờ duyệt', 'Đã duyệt', 'Từ chối']),
        progress: faker.datatype.number({ min: 0, max: 100 }),
        tasks: faker.datatype.number({ min: 1, max: 5 }),
        avatar: faker.image.avatar(),
        taskList: Array.from({ length: faker.datatype.number({ min: 1, max: 5 }) }).map((_, taskIndex) => ({
            key: taskIndex,
            name: faker.commerce.productName(),
            assignedTo: faker.name.fullName(),
            status: faker.helpers.arrayElement(['Chưa thực hiện', 'Đang thực hiện', 'Hoàn thành']),
            deadline: faker.date.future().toLocaleDateString(),
        })),
        cv: {
            education: faker.lorem.sentence(),
            experience: faker.lorem.sentences(2),
            skills: faker.lorem.words(5),
            languages: faker.lorem.words(3),
            contact: faker.phone.number(),
            email: faker.internet.email()
        }
    }));
};

const StudentManagement = () => {
    const [dataSource, setDataSource] = useState(generateStudentData());
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [form] = Form.useForm();

    const handleAction = (action, record) => {
        if (action === 'approve') {
            message.info(`Đã duyệt sinh viên ${record.studentName}`);
            setDataSource(dataSource.map(student => student.key === record.key ? { ...student, status: 'Đã duyệt' } : student));
        } else if (action === 'reject') {
            message.info(`Đã từ chối sinh viên ${record.studentName}`);
            setDataSource(dataSource.map(student => student.key === record.key ? { ...student, status: 'Từ chối' } : student));
        }
    };

    const handleMenuClick = (action, record) => {
        if (action === 'details') {
            setCurrentStudent(record);
            setIsModalVisible(true);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setIsCreateTaskModalVisible(false);
    };

    const handleCreateTask = () => {
        setIsCreateTaskModalVisible(true);
    };

    const handleFinishCreateTask = (values) => {
        message.info('Tạo nhiệm vụ mới...');
        setIsCreateTaskModalVisible(false);
        form.resetFields();
    };

    const memberColumns = [
        {
            title: 'Tên Sinh Viên',
            dataIndex: 'studentName',
            key: 'studentName',
            sorter: (a, b) => a.studentName.localeCompare(b.studentName),
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} />
                    {text}
                </Space>
            ),
        },
        {
            title: 'Tên Dự Án',
            dataIndex: 'projectName',
            key: 'projectName',
        },
        {
            title: 'Tiến Độ',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress) => (
                <div>
                    <div>{progress}%</div>
                    <Progress percent={progress} showInfo={false} />
                </div>
            ),
        },
        {
            key: 'action',
            render: (_, record) => (
                <Dropdown
                    overlay={
                        <Menu onClick={({ key }) => handleMenuClick(key, record)}>
                            <Menu.Item key="details" icon={<EyeOutlined />}>Xem Chi Tiết</Menu.Item>
                        </Menu>
                    }
                    trigger={['click']}
                >
                    <div>
                        <FontAwesomeIcon icon={faEllipsisV} style={{ fontSize: '15px', cursor: 'pointer' }} />
                    </div>
                </Dropdown>
            ),
        },
    ];

    const pendingColumns = [
        {
            title: 'Tên Sinh Viên',
            dataIndex: 'studentName',
            key: 'studentName',
            sorter: (a, b) => a.studentName.localeCompare(b.studentName),
            render: (text, record) => (
                <Space>
                    <Avatar src={record.avatar} />
                    {text}
                </Space>
            ),
        },
        {
            title: 'Tên Dự Án',
            dataIndex: 'projectName',
            key: 'projectName',
        },
        {
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Popconfirm
                        title={`Bạn có chắc chắn muốn duyệt sinh viên ${record.studentName}?`}
                        onConfirm={() => handleAction('approve', record)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button icon={<CheckCircleOutlined />} type="primary">Duyệt</Button>
                    </Popconfirm>
                    <Popconfirm
                        title={`Bạn có chắc chắn muốn từ chối sinh viên ${record.studentName}?`}
                        onConfirm={() => handleAction('reject', record)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button icon={<CloseCircleOutlined />} type="danger">Từ Chối</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="container">
            <Card style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTask}>
                            Tạo Nhiệm Vụ Mới
                        </Button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Search
                            placeholder="Tìm kiếm theo tên sinh viên"
                            onSearch={(value) => {
                                const filteredData = generateStudentData().filter((data) =>
                                    data.studentName.toLowerCase().includes(value.toLowerCase())
                                );
                                setDataSource(filteredData);
                            }}
                            style={{ marginRight: 16 }}
                        />
                    </div>
                </div>
                <Tabs defaultActiveKey="1">
                    <TabPane tab="Thành Viên Trong Dự Án" key="1">
                        <Table
                            columns={memberColumns}
                            dataSource={dataSource.filter(student => student.status === 'Đã duyệt')}
                            pagination={{ pageSize: 10 }}
                            rowKey="key"
                            onRow={(record) => ({
                                onDoubleClick: () => handleMenuClick('details', record),
                            })}
                        />
                    </TabPane>
                    <TabPane tab="Đang Chờ Duyệt" key="2">
                        <Table
                            columns={pendingColumns}
                            dataSource={dataSource.filter(student => student.status === 'Chờ duyệt')}
                            pagination={{ pageSize: 10 }}
                            rowKey="key"
                        />
                    </TabPane>
                </Tabs>
            </Card>

            {/* Modal Xem Chi Tiết */}
            <Modal
                title="Chi Tiết Sinh Viên"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
            >
                {currentStudent && (
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Thông Tin CV" key="1">
                            <div className="student-details">
                                <div className="student-details-header row">
                                    <div className="student-details-avatar col-4">
                                        <Avatar src={currentStudent.avatar} size={100} />
                                    </div>
                                    <div className="student-details-info col-8">
                                        <h3>{currentStudent.studentName}</h3>
                                        <p><strong>Dự Án:</strong> {currentStudent.projectName}</p>
                                        <p><strong>Tiến Độ:</strong> {currentStudent.progress}%</p>
                                    </div>
                                </div>
                                <div className="student-details-content">
                                    <div className="student-details-section">
                                        <FontAwesomeIcon icon={faGraduationCap} style={{ marginRight: '8px' }} />
                                        <strong>Học Vấn:</strong> {currentStudent.cv.education}
                                    </div>
                                    <div className="student-details-section">
                                        <FontAwesomeIcon icon={faBriefcase} style={{ marginRight: '8px' }} />
                                        <strong>Kinh Nghiệm:</strong> {currentStudent.cv.experience}
                                    </div>
                                    <div className="student-details-section">
                                        <FontAwesomeIcon icon={faCogs} style={{ marginRight: '8px' }} />
                                        <strong>Kỹ Năng:</strong> {currentStudent.cv.skills}
                                    </div>
                                    <div className="student-details-section">
                                        <FontAwesomeIcon icon={faLanguage} style={{ marginRight: '8px' }} />
                                        <strong>Ngôn Ngữ:</strong> {currentStudent.cv.languages}
                                    </div>
                                    <div className="student-details-section">
                                        <FontAwesomeIcon icon={faPhone} style={{ marginRight: '8px' }} />
                                        <strong>Liên Hệ:</strong> {currentStudent.cv.contact}
                                    </div>
                                    <div className="student-details-section">
                                        <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '8px' }} />
                                        <strong>Email:</strong> {currentStudent.cv.email}
                                    </div>
                                </div>
                            </div>
                        </TabPane>

                        <TabPane tab="Danh Sách Nhiệm Vụ" key="2">
                            <Table
                                columns={[
                                    { title: 'Tên Nhiệm Vụ', dataIndex: 'name', key: 'name' },
                                    { title: 'Người Được Giao', dataIndex: 'assignedTo', key: 'assignedTo' },
                                    { title: 'Trạng Thái', dataIndex: 'status', key: 'status' },
                                    { title: 'Hạn Cuối', dataIndex: 'deadline', key: 'deadline' }
                                ]}
                                dataSource={currentStudent.taskList}
                                pagination={{ pageSize: 5 }}
                                rowKey="key"
                            />
                        </TabPane>
                    </Tabs>
                )}
            </Modal>

            {/* Modal Tạo Nhiệm Vụ Mới */}
            <Modal
                title="Tạo Nhiệm Vụ Mới"
                visible={isCreateTaskModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={600}
            >
                <Form form={form} onFinish={handleFinishCreateTask}>
                    <Form.Item name="members" label="Chọn Thành Viên" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thành viên!' }]}>
                        <Select mode="multiple" placeholder="Chọn thành viên">
                            {dataSource.map(student => (
                                <Option key={student.key} value={student.key}>{student.studentName}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="taskName" label="Tên Nhiệm Vụ" rules={[{ required: true, message: 'Vui lòng nhập tên nhiệm vụ!' }]}>
                        <AntInput />
                    </Form.Item>
                    <Form.Item name="deadline" label="Hạn Cuối" rules={[{ required: true, message: 'Vui lòng chọn hạn cuối!' }]}>
                        <DatePicker format="YYYY-MM-DD" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">Tạo Nhiệm Vụ</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default StudentManagement;
