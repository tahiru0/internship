import React, { useState } from 'react';
import { Table, Input, Button, Dropdown, Menu, Avatar, Space, Modal, Tabs, message, Card, Progress } from 'antd';
import { EyeOutlined, PushpinOutlined, StopOutlined, PlayCircleOutlined, HighlightOutlined, PlusOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { faker } from '@faker-js/faker';
import 'bootstrap/dist/css/bootstrap.min.css';

const { Search } = Input;
const { TabPane } = Tabs;

const generateData = () => {
    return Array.from({ length: 50 }).map((_, index) => ({
        key: index,
        projectName: faker.commerce.productName(),
        members: Array.from({ length: 3 }).map(() => faker.image.avatar()),
        tasks: faker.datatype.number({ min: 5, max: 20 }),
        status: faker.helpers.arrayElement(['Hoạt động', 'Không hoạt động']),
    }));
};

const ProjectManagement = () => {
    const [dataSource, setDataSource] = useState(generateData());
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [filteredStatus, setFilteredStatus] = useState(null);

    const handleMenuClick = (action, record) => {
        switch (action) {
            case 'pin':
                message.info(`Đã ghim dự án ${record.projectName}`);
                break;
            case 'details':
                setCurrentProject(record);
                setIsModalVisible(true);
                break;
            case 'toggleRecruitment':
                message.info(`Tuyển dụng được chuyển đổi cho dự án ${record.projectName}`);
                break;
            case 'close':
                message.info(`Dự án đã đóng ${record.projectName}`);
                break;
            case 'highlight':
                setSelectedRowKeys([record.key]);
                message.info(`Dự án nổi bật ${record.projectName}`);
                break;
            default:
                break;
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleCreateProject = () => {
        // Xử lý logic tạo dự án mới
        message.info('Tạo dự án mới...');
    };

    const handleFilterStatus = (status) => {
        setFilteredStatus(status);
        const filteredData = generateData().filter((data) => data.status === status);
        setDataSource(filteredData);
    };

    const handleRowDoubleClick = (record) => {
        setCurrentProject(record);
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Tên Dự Án',
            dataIndex: 'projectName',
            key: 'projectName',
            sorter: (a, b) => a.projectName.localeCompare(b.projectName),
            render: (text, record) => (
                <Space>
                    <Avatar.Group size="small" maxCount={3}>
                        {record.members && record.members.map((member, index) => (
                            <Avatar key={index} src={member} />
                        ))}
                    </Avatar.Group>
                    {text}
                </Space>
            ),
        },
        {
            title: 'Số Nhiệm Vụ',
            dataIndex: 'tasks',
            key: 'tasks',
            sorter: (a, b) => a.tasks - b.tasks,
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Hoạt động', value: 'Hoạt động' },
                { text: 'Không hoạt động', value: 'Không hoạt động' },
            ],
            onFilter: (value, record) => record.status.includes(value),
        },
        {
            key: 'action',
            render: (_, record) => (
                <Dropdown
                    overlay={
                        <Menu onClick={({ key }) => handleMenuClick(key, record)}>
                            <Menu.Item key="pin" icon={<PushpinOutlined />}>Ghim Dự Án</Menu.Item>
                            <Menu.Item key="details" icon={<EyeOutlined />}>Xem Chi Tiết</Menu.Item>
                            <Menu.Item key="toggleRecruitment" icon={<PlayCircleOutlined />}>Chuyển Đổi Tuyển Dụng</Menu.Item>
                            <Menu.Item key="close" icon={<StopOutlined />}>Đóng Dự Án</Menu.Item>
                            <Menu.Item key="highlight" icon={<HighlightOutlined />}>Nổi Bật</Menu.Item>
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

    const onChange = (pagination, filters, sorter) => {
        console.log('Params', pagination, filters, sorter);
    };

    return (
        <div className="container">
            <Card style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject}>
                            Tạo Dự Án Mới
                        </Button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Search
                            placeholder="Tìm kiếm theo tên dự án"
                            onSearch={(value) => {
                                const filteredData = generateData().filter((data) =>
                                    data.projectName.toLowerCase().includes(value.toLowerCase())
                                );
                                setDataSource(filteredData);
                            }}
                            style={{ marginRight: 16 }}
                        />
                        <Dropdown
                            overlay={
                                <Menu>
                                    <Menu.Item key="active" onClick={() => handleFilterStatus('Hoạt động')}>
                                        Hoạt động
                                    </Menu.Item>
                                    <Menu.Item key="inactive" onClick={() => handleFilterStatus('Không hoạt động')}>
                                        Không hoạt động
                                    </Menu.Item>
                                </Menu>
                            }
                            trigger={['click']}
                        >
                            <Button>Lọc Theo Trạng Thái</Button>
                        </Dropdown>
                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    pagination={{ pageSize: 10 }}
                    rowKey="key"
                    onChange={onChange}
                    rowClassName={(record) => (selectedRowKeys.includes(record.key) ? 'highlight-row' : '')}
                    onRow={(record) => ({
                        onDoubleClick: () => handleRowDoubleClick(record),
                    })}
                />
            </Card>
            <Modal
                title="Chi Tiết Dự Án"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={800}
            >
                {currentProject && (
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Tổng Quan" key="1">
                            <h3>{currentProject.projectName}</h3>
                            <Avatar.Group size="large">
                                {currentProject.members && currentProject.members.map((member, index) => (
                                    <Avatar key={index} src={member} />
                                ))}
                            </Avatar.Group>
                            <p><strong>Số Nhiệm Vụ:</strong> {currentProject.tasks}</p>
                            <p><strong>Trạng Thái:</strong> {currentProject.status}</p>
                        </TabPane>
                        <TabPane tab="Thành Viên" key="2">
                            <h4>Thành Viên Dự Án</h4>
                            <Table
                                columns={[
                                    {
                                        title: 'Avatar',
                                        dataIndex: 'avatar',
                                        key: 'avatar',
                                        render: (avatar) => <Avatar src={avatar} />,
                                    },
                                    {
                                        title: 'Tên',
                                        dataIndex: 'name',
                                        key: 'name',
                                        render: () => faker.name.firstName() + ' ' + faker.name.lastName(),
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
                                ]}
                                dataSource={currentProject.members.map((member, index) => ({
                                    key: index,
                                    avatar: member,
                                    name: faker.name.firstName() + ' ' + faker.name.lastName(),
                                    progress: faker.datatype.number({ min: 0, max: 100 }),
                                }))}
                                pagination={false}
                            />
                        </TabPane>
                        <TabPane tab="Nhiệm Vụ" key="3">
                            <h4>Nhiệm Vụ Dự Án</h4>
                            <Table
                                columns={[
                                    {
                                        title: 'Tên Nhiệm Vụ',
                                        dataIndex: 'name',
                                        key: 'name',
                                        render: () => faker.commerce.productName(),
                                    },
                                    {
                                        title: 'Giao Cho',
                                        dataIndex: 'assignedTo',
                                        key: 'assignedTo',
                                        render: () => (
                                            <Avatar.Group size="small" maxCount={3}>
                                                {Array.from({ length: 3 }).map((_, index) => (
                                                    <Avatar key={index} src={faker.image.avatar()} />
                                                ))}
                                            </Avatar.Group>
                                        ),
                                    },
                                    {
                                        title: 'Trạng Thái',
                                        dataIndex: 'status',
                                        key: 'status',
                                        render: () => faker.helpers.arrayElement(['Chưa thực hiện', 'Đang thực hiện', 'Hoàn thành']),
                                    },
                                    {
                                        title: 'Hạn Chót',
                                        dataIndex: 'deadline',
                                        key: 'deadline',
                                        render: () => faker.date.future().toLocaleDateString(),
                                    },
                                ]}
                                dataSource={Array.from({ length: 5 }).map((_, index) => ({
                                    key: index,
                                }))}
                                pagination={false}
                            />
                        </TabPane>
                    </Tabs>
                )}
            </Modal>

            <style>{`
        .container {
          padding: 24px;
        }
        .highlight-row {
          background: #e6f7ff;
        }
      `}</style>
        </div>
    );
};

export default ProjectManagement;
