import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Progress, Spin, Typography, Empty } from 'antd';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ProjectOutlined, TeamOutlined, CheckCircleOutlined, StarOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../../utils/axiosInstance';
import { useCompany } from '../../../context/CompanyContext';

const { Title } = Typography;

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { companyData } = useCompany();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('/company/dashboard', withAuth());
        setDashboardData(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Spin size="large" />;
  }

  if (!dashboardData) {
    return <Empty description="Không thể tải dữ liệu dashboard" />;
  }

  const { companyInfo, projectStats, taskStats } = dashboardData;

  const projectStatusData = [
    { name: 'Đang tuyển', value: projectStats.recruitingProjects },
    { name: 'Đang tiến hành', value: projectStats.ongoingProjects },
    { name: 'Đã hoàn thành', value: projectStats.completedProjects },
  ];

  const taskStatusData = [
    { name: 'Đang chờ', value: taskStats.pendingTasks },
    { name: 'Đang thực hiện', value: taskStats.inProgressTasks },
    { name: 'Đã hoàn thành', value: taskStats.completedTasks },
    { name: 'Quá hạn', value: taskStats.overdueTasks },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="dashboard-container" style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số dự án"
              value={projectStats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Số lượng Mentor"
              value={companyInfo.mentorCount}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sinh viên được chọn"
              value={projectStats.totalSelectedStudents}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đánh giá trung bình"
              value={taskStats.avgRating !== null ? taskStats.avgRating.toFixed(1) : 'N/A'}
              prefix={<StarOutlined />}
              suffix={taskStats.avgRating !== null ? "/ 5" : null}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} md={12}>
          <Card title="Trạng thái dự án">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Trạng thái công việc">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={taskStatusData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
        <Col xs={24} md={12}>
          <Card title="Tiến độ hoàn thành dự án">
            <Progress
              type="dashboard"
              percent={((projectStats.completedProjects / projectStats.totalProjects) * 100).toFixed(2)}
              width={180}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Tiến độ hoàn thành công việc">
            <Progress
              type="dashboard"
              percent={((taskStats.completedTasks / taskStats.totalTasks) * 100).toFixed(2)}
              width={180}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdminDashboard;