import React from 'react';
import { Row, Col, Card, Table, Statistic, Button, Avatar, Tabs, Progress } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Chart from 'react-apexcharts';
import { faker } from '@faker-js/faker/locale/vi';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const cardStyle = (borderColor) => ({
    borderLeft: `5px solid ${borderColor}`,
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    height: '100%',
});

const students = Array.from({ length: 20 }, () => ({
    key: faker.datatype.uuid(),
    name: faker.name.fullName(),
    project: faker.commerce.productName(),
    avatar: faker.image.avatar(),
    status: faker.datatype.boolean(),
}));

const projects = Array.from({ length: 5 }, () => ({
    key: faker.datatype.uuid(),
    title: faker.commerce.productName(),
    progress: faker.datatype.number({ min: 0, max: 100 }),
    members: Array.from({ length: 3 }, () => ({
        name: faker.name.fullName(),
        avatar: faker.image.avatar(),
    })),
    tasks: Array.from({ length: 5 }, () => ({
        title: faker.hacker.phrase(),
        assignee: {
            name: faker.name.fullName(),
            avatar: faker.image.avatar(),
        },
        progress: faker.datatype.number({ min: 0, max: 100 }),
    })),
}));

const Dashboard = () => {
    const localizer = momentLocalizer(moment);

    const projectColumns = [
        {
            title: 'Dự án',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Tiến độ',
            dataIndex: 'progress',
            key: 'progress',
            render: (text) => `${text}%`,
        },
        {
            title: 'Thành viên',
            dataIndex: 'members',
            key: 'members',
            render: (members) => (
                <Avatar.Group maxCount={2}>
                    {members.map((member, index) => (
                        <Avatar key={index} src={member.avatar} />
                    ))}
                </Avatar.Group>
            ),
        },
    ];

    const studentColumns = [
        {
            title: 'Ảnh đại diện',
            dataIndex: 'avatar',
            key: 'avatar',
            render: (text) => <Avatar src={text} />,
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Dự án',
            dataIndex: 'project',
            key: 'project',
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <>
                    <Button type="primary" className="me-2">
                        Chấp nhận
                    </Button>
                    <Button danger>Từ chối</Button>
                </>
            ),
        },
    ];

    const taskColumns = [
        {
            title: 'Nhiệm vụ',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Người thực hiện',
            dataIndex: 'assignee',
            key: 'assignee',
            render: (assignee) => (
                <>
                    <Avatar src={assignee.avatar} className="me-2" />
                    {assignee.name}
                </>
            ),
        },
        {
            title: 'Tiến độ',
            dataIndex: 'progress',
            key: 'progress',
            render: (progress) => <Progress percent={progress} size="small" />,
        },
    ];

    const lineSeries = [
        {
            name: 'Tăng trưởng dự án',
            data: Array.from({ length: 12 }, () => faker.datatype.number({ min: 20, max: 100 })),
        },
    ];

    const lineOptions = {
        chart: {
            type: 'line',
        },
        xaxis: {
            categories: Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`),
        },
    };

    const pieSeries = [44, 55, 13, 43];

    const pieOptions = {
        chart: {
            type: 'pie',
        },
        labels: ['Dự án A', 'Dự án B', 'Dự án C', 'Dự án D'],
    };

    const areaSeries = [
        {
            name: 'Hoàn thành task',
            data: Array.from({ length: 7 }, () => faker.datatype.number({ min: 0, max: 100 })),
        },
    ];

    const areaOptions = {
        chart: {
            type: 'area',
        },
        xaxis: {
            categories: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
        },
    };

    return (
        <div className="container">
            <Row gutter={16} className="mb-4">
                <Col span={6}>
                    <Card style={cardStyle('#f56a00')}>
                        <Statistic
                            title="Tổng số dự án"
                            value={projects.length}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#f56a00' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={cardStyle('#1890ff')}>
                        <Statistic
                            title="Số sinh viên trong dự án"
                            value={students.length}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={cardStyle('#52c41a')}>
                        <Statistic
                            title="Số lượng duyệt chờ"
                            value={students.filter((s) => !s.status).length}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card style={cardStyle('#eb2f96')}>
                        <Statistic
                            title="Deadline sắp tới"
                            value={faker.datatype.number({ min: 1, max: 10 })}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#eb2f96' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="Dự án và Tiến độ" key="1">
                <Row gutter={16}>
                <Col xs={24} sm={12} md={12} lg={12}>
                            <Card title="Timeline dự án" className="mb-4">
                                <Calendar
                                    localizer={localizer}
                                    events={projects.map((project) => ({
                                        title: project.title,
                                        start: faker.date.soon(),
                                        end: faker.date.future(),
                                    }))}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: 500 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={12}>
                            <Card title="Thành viên" className="mb-4" style={{ height: 500 }}>
                                <Table
                                    columns={projectColumns}
                                    dataSource={projects}
                                    pagination={false}
                                    className="table-responsive"
                                />
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={12} lg={12}>
                            <Card title="Danh sách nhiệm vụ" className="mb-4">
                                <Table
                                    columns={taskColumns}
                                    dataSource={projects.flatMap((project) => project.tasks)}
                                    pagination={{ pageSize: 5 }}
                                    className="table-responsive"
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={12}>
                            <Card title="Sinh viên chờ duyệt">
                                <Table
                                    columns={studentColumns}
                                    dataSource={students}
                                    pagination={{ pageSize: 5 }}
                                    className="table-responsive"
                                />
                            </Card>
                        </Col>
                    </Row>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Biểu đồ" key="2">
                <Row gutter={16}>
                <Col xs={24} sm={12} md={12} lg={12}>
                            <Card title="Tăng trưởng dự án (Biểu đồ đường)" className="mb-4">
                                <Chart options={lineOptions} series={lineSeries} type="line" height={300} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={12} lg={12}>
                            <Card title="Phân bổ dự án (Biểu đồ tròn)" className="mb-4">
                                <Chart options={pieOptions} series={pieSeries} type="pie" height={300} />
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                    <Col xs={24}>
                            <Card title="Tiến độ dự án (Biểu đồ cột)" className="mb-4">
                                <Chart options={areaOptions} series={areaSeries} type="area" height={300} />
                            </Card>
                        </Col>
                    </Row>
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
};

export default Dashboard;
