import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, Divider, Progress } from 'antd';
import { UserOutlined, CheckCircleOutlined, FileDoneOutlined, FileSearchOutlined, HomeOutlined, GlobalOutlined, CalendarOutlined } from '@ant-design/icons';
import { useSchool } from '../../context/SchoolContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const { Title, Text } = Typography;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅 Chào buổi sáng';
  if (hour < 18) return '☀️ Chào buổi chiều';
  return '🌙 Chào buổi tối';
};

const Dashboard = () => {
  const { api, schoolData } = useSchool();
  const [studentStatistics, setStudentStatistics] = useState(null);
  const [schoolDetails, setSchoolDetails] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // Cập nhật mỗi phút

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/school/dashboard');
        setStudentStatistics(response.data.studentStatistics);
        setSchoolDetails(response.data.schoolDetails);
      } catch (error) {
        console.error('Lỗi khi fetch dữ liệu:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [api]);

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const totalInterns = studentStatistics.totalInterns ?? 0;
  const totalApplications = studentStatistics.totalApplications ?? 0;
  const internsApplicationsText = totalApplications > 0 ? `${totalInterns}/${totalApplications}` : 'Không có dữ liệu';

  return (
    <div style={{ padding: '24px' }}>
      <h3 className="mb-4">{`${greeting}, ${schoolData?.account?.name || 'Người dùng'}!`}</h3>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'linear-gradient(135deg, #fff9c4 0%, #ffecb3 100%)' }}>
            <Statistic
              title="Tổng số sinh viên"
              value={studentStatistics.totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#ff6f00', fontWeight: 'bold' }}
              titleStyle={{ color: '#ff8f00' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
            <Statistic
              title="Sinh viên đã duyệt"
              value={studentStatistics.approvedStudents}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1565c0', fontWeight: 'bold' }}
              titleStyle={{ color: '#1976d2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'linear-gradient(135deg, #f8bbd0 0%, #f48fb1 100%)' }}>
            <Statistic
              title="Tổng số ứng tuyển"
              value={studentStatistics.totalApplications}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: '#c2185b', fontWeight: 'bold' }}
              titleStyle={{ color: '#d81b60' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)' }}>
            <Statistic
              title="Thực tập"
              value={internsApplicationsText}
              prefix={<FileSearchOutlined />}
              valueStyle={{ color: '#2e7d32', fontWeight: 'bold' }}
              titleStyle={{ color: '#388e3c' }}
            />
          </Card>
        </Col>
      </Row>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Top Ngành Học">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={studentStatistics.topMajors}
                  dataKey="studentCount"
                  nameKey="majorName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {studentStatistics.topMajors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Tất cả Ngành Học">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentStatistics.allMajors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="majorName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="studentCount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Thông tin chi tiết về trường">
            <Text strong><HomeOutlined /> Tên trường: </Text>{schoolDetails.name}<br />
            <Text strong><GlobalOutlined /> Địa chỉ: </Text>{schoolDetails.address}<br />
            <Text strong><GlobalOutlined /> Website: </Text><a href={schoolDetails.website} target="_blank" rel="noopener noreferrer">{schoolDetails.website}</a><br />
            <Text strong><CalendarOutlined /> Ngày thành lập: </Text>{new Date(schoolDetails.establishedDate).toLocaleDateString()}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;