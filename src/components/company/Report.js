import React, { useState, useEffect } from 'react';
import { Table, Modal, Tabs, Avatar, Button, Tag } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import { faker } from '@faker-js/faker/locale/vi';

const generateFakeTasks = () => {
    return Array.from({ length: 15 }, () => ({
        id: faker.datatype.uuid(),
        name: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['Đang làm', 'Đã xong', 'Đã hủy']),
    }));
};

const generateFakeData = () => {
    const data = [];
    for (let i = 0; i < 10; i++) {
        data.push({
            id: i,
            avatar: faker.image.avatar(),
            employeeName: faker.person.fullName(),
            projectName: faker.company.name(),
            progress: Math.floor(Math.random() * 100),
            tasks: generateFakeTasks(),
        });
    }
    return data;
};

const Report = () => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [visible, setVisible] = useState(false);
    const [tasksPagination, setTasksPagination] = useState({ current: 1, pageSize: 5 });

    useEffect(() => {
        setReports(generateFakeData());
    }, []);

    const handleViewDetail = (report) => {
        setSelectedReport(report);
        setVisible(true);
    };

    const handleEdit = (report) => {
        console.log('Edit report:', report);
    };

    const columns = [
        {
            title: 'Avatar',
            dataIndex: 'avatar',
            render: (avatar) => <Avatar src={avatar} />,
        },
        {
            title: 'Tên nhân viên',
            dataIndex: 'employeeName',
        },
        {
            title: 'Tên dự án',
            dataIndex: 'projectName',
        },
        {
            title: 'Tiến độ',
            dataIndex: 'progress',
            render: (progress) => <progress value={progress} max="100" />,
        },
        {
            title: 'Hành động',
            render: (record) => (
                <div>
                    <Button 
                        icon={<EyeOutlined />} 
                        onClick={() => handleViewDetail(record)} 
                        style={{ marginRight: 8 }}
                    >
                        Xem chi tiết
                    </Button>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)} 
                    >
                        Chỉnh sửa
                    </Button>
                </div>
            ),
        },
    ];

    const taskColumns = [
        {
            title: 'Tên nhiệm vụ',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color;
                switch (status) {
                    case 'Đang làm':
                        color = 'blue';
                        break;
                    case 'Đã xong':
                        color = 'green';
                        break;
                    case 'Đã hủy':
                        color = 'red';
                        break;
                    default:
                        color = 'gray';
                }
                return <Tag color={color}>{status}</Tag>;
            },
        },
    ];

    const handleTableChange = (pagination) => {
        setTasksPagination(pagination);
    };

    return (
        <div>
            <Table columns={columns} dataSource={reports} />

            <Modal
                title="Báo cáo chi tiết"
                visible={visible}
                onCancel={() => setVisible(false)}
                footer={null}
                width={800}
            >
                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab="List Task" key="1">
                        <Table
                            dataSource={selectedReport?.tasks}
                            columns={taskColumns}
                            pagination={tasksPagination}
                            onChange={handleTableChange}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Nội dung" key="2">
                        <p>Nội dung báo cáo</p>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Đánh giá sinh viên thực tập" key="3">
                        <p>Đánh giá sinh viên thực tập</p>
                    </Tabs.TabPane>
                </Tabs>
            </Modal>
        </div>
    );
};

export default Report;
