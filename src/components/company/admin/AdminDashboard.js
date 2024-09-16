import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Progress } from 'antd';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { faker } from '@faker-js/faker';

function AdminDashboard() {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [mentorData, setMentorData] = useState([]);
  const [projectData, setProjectData] = useState([]);

  useEffect(() => {
    const generateMentors = () => {
      const mentors = Array.from({ length: 50 }, () => ({
        key: faker.datatype.uuid(),
        name: faker.person.fullName(),
        project: faker.commerce.productName(),
        students: faker.number.int({ min: 5, max: 20 }),
      }));
      setMentorData(mentors);
      return mentors.length;
    };

    const generateProjects = () => {
      return Array.from({ length: 25 }, () => ({
        key: faker.datatype.uuid(),
        name: faker.commerce.productName(),
        mentor: faker.person.fullName(),
        status: faker.helpers.arrayElement(['Đang tiến hành', 'Đã hoàn thành', 'Bị trì hoãn']),
        students: faker.number.int({ min: 5, max: 20 }),
      }));
    };

    const mentorsCount = generateMentors();
    setProjectData(generateProjects());

    const employeesCount = mentorsCount + faker.number.int({ min: 10, max: 100 });
    setTotalEmployees(employeesCount);
  }, []);

  const ongoingCount = projectData.filter(project => project.status === 'Đang tiến hành').length;
  const completedCount = projectData.filter(project => project.status === 'Đã hoàn thành').length;
  const delayedCount = projectData.filter(project => project.status === 'Bị trì hoãn').length;

  const chartData = [
    { name: 'Đang tiến hành', value: ongoingCount },
    { name: 'Đã hoàn thành', value: completedCount },
    { name: 'Bị trì hoãn', value: delayedCount },
  ];

  const COLORS = ['#1890ff', '#52c41a', '#faad14'];

  return (
    <div className="dashboard-container" style={{ padding: '24px' }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số nhân viên"
              value={totalEmployees}
              valueStyle={{ color: totalEmployees > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Mentors đang hoạt động"
              value={mentorData.filter(mentor => mentor.students > 0).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Dự án đang tiến hành"
              value={ongoingCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Dự án đã hoàn thành"
              value={completedCount}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '20px' }}>
        <Col span={12}>
          <Card title="Tổng quan trạng thái dự án">
            <PieChart width={400} height={300}>
              <Pie
                data={chartData}
                cx={200}
                cy={150}
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Tiến độ hoàn thành">
            <Progress
              type="dashboard"
              percent={(
                (completedCount / projectData.length) * 100
              ).toFixed(2)}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AdminDashboard;
