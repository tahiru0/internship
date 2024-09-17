import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalProjects: 0,
        totalInstructors: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const accessToken = Cookies.get('schoolAccessToken');
                const response = await axios.get('http://localhost:5000/api/school/dashboard', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setStats(response.data.stats);
                setRecentProjects(response.data.recentProjects);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu dashboard:', error);
            }
        };

        fetchDashboardData();
    }, []);

    const columns = [
        {
            title: 'Tên dự án',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Sinh viên',
            dataIndex: 'student',
            key: 'student',
        },
        {
            title: 'Giảng viên',
            dataIndex: 'instructor',
            key: 'instructor',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
        },
    ];

    return (
        <div>
            <h1>Dashboard Trường học</h1>
            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng số sinh viên"
                            value={stats.totalStudents}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng số dự án"
                            value={stats.totalProjects}
                            prefix={<ProjectOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Tổng số giảng viên"
                            value={stats.totalInstructors}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
            </Row>
            <h2 style={{ marginTop: '20px' }}>Dự án gần đây</h2>
            <Table columns={columns} dataSource={recentProjects} />
        </div>
    );
};

export default Dashboard;