import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Select, Table, Input, DatePicker, Tag, Modal } from 'antd';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  UserOutlined, 
  BankOutlined, 
  TeamOutlined, 
  ProjectOutlined,
  LoginOutlined,
  UserAddOutlined,
  FileAddOutlined
} from '@ant-design/icons';
import { faker } from '@faker-js/faker/locale/vi';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Generate fake data
const generateProjectStats = () => {
  return Array.from({ length: 5 }, (_, index) => ({
    thang: `T${index + 1}`,
    dangTuyenDung: faker.number.int({ min: 5, max: 20 }),
    dongTuyenDung: faker.number.int({ min: 3, max: 15 }),
    sinhVienThamGia: faker.number.int({ min: 40, max: 100 })
  }));
};

const generateProjects = () => {
  return Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    name: faker.company.name(),
    company: faker.company.name(),
    students: faker.number.int({ min: 5, max: 50 })
  }));
};

const generateTaskStatsByProject = (projectCount) => {
  const stats = {};
  for (let i = 1; i <= projectCount; i++) {
    stats[i] = Array.from({ length: 5 }, (_, index) => ({
      thang: `T${index + 1}`,
      hoanThanh: faker.number.int({ min: 2, max: 10 }),
      dangLam: faker.number.int({ min: 1, max: 5 }),
      chuaBatDau: faker.number.int({ min: 1, max: 3 })
    }));
  }
  return stats;
};

const generateTasksByProject = (projectCount) => {
  const tasks = {};
  for (let i = 1; i <= projectCount; i++) {
    tasks[i] = Array.from({ length: faker.number.int({ min: 3, max: 8 })}, (_, index) => ({
      id: faker.string.uuid(),
      name: faker.lorem.words(3),
      status: faker.helpers.arrayElement(['Đang làm', 'Hoàn thành', 'Chưa bắt đầu']),
      dueDate: faker.date.future().toISOString().split('T')[0]
    }));
  }
  return tasks;
};

const projectStats = generateProjectStats();
const projects = generateProjects();
const taskStatsByProject = generateTaskStatsByProject(projects.length);
const tasksByProject = generateTasksByProject(projects.length);

const taskColumns = [
  {
    title: 'Tên Task',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Trạng Thái',
    dataIndex: 'status',
    key: 'status',
    render: status => {
      let color = status === 'Hoàn thành' ? 'green' : status === 'Đang làm' ? 'geekblue' : 'volcano';
      return (
        <Tag color={color}>
          {status.toUpperCase()}
        </Tag>
      );
    },
  },
  {
    title: 'Ngày Hết Hạn',
    dataIndex: 'dueDate',
    key: 'dueDate',
  },
];

const Dashboard = () => {
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const projectColumns = [
    {
      title: 'Tên Dự Án',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Công Ty',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <a onClick={() => {
          setSelectedProject(record.id);
          setIsModalVisible(true);
        }}>Xem Tasks</a>
      ),
    },
  ];

  useEffect(() => {
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.company.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchText]);

  const filteredTasks = selectedProject && tasksByProject[selectedProject].filter(task => {
    const matchesDateRange = dateRange 
      ? (new Date(task.dueDate) >= dateRange[0] && new Date(task.dueDate) <= dateRange[1])
      : true;
    return matchesDateRange;
  });

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedProject(null);
  };

  return (
    <div className="container">
      <h3 className="mb-4">Dashboard Quản Lý Dự Án Thực Tập</h3>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={{ borderLeft: '5px solid #722ed1', borderRadius: '8px' }}>
            <Statistic
              title="Sinh Viên"
              value={faker.number.int({ min: 1000, max: 5000 })}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={{ borderLeft: '5px solid #13c2c2', borderRadius: '8px' }}>
            <Statistic
              title="Công Ty"
              value={faker.number.int({ min: 50, max: 200 })}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={{ borderLeft: '5px solid #fa8c16', borderRadius: '8px' }}>
            <Statistic
              title="Trường Đại Học"
              value={faker.number.int({ min: 10, max: 50 })}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card style={{ borderLeft: '5px solid #52c41a', borderRadius: '8px' }}>
            <Statistic
              title="Người Hướng Dẫn"
              value={faker.number.int({ min: 50, max: 200 })}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} md={8}>
          <Card title="Đăng Ký Mới">
            <Statistic
              value={faker.number.int({ min: 50, max: 150 })}
              prefix={<UserAddOutlined />}
              suffix="người/ngày"
            />
            <Progress percent={faker.number.int({ min: 60, max: 90 })} showInfo={false} />
            <p className="mt-2">Tăng {faker.number.int({ min: 5, max: 20 })}% so với hôm qua</p>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Lượt Đăng Nhập">
            <Statistic
              value={faker.number.int({ min: 800, max: 2000 })}
              prefix={<LoginOutlined />}
              suffix="lượt/ngày"
            />
            <Progress percent={faker.number.int({ min: 70, max: 95 })} showInfo={false} />
            <p className="mt-2">Tăng {faker.number.int({ min: 2, max: 10 })}% so với hôm qua</p>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Dự Án Mới">
            <Statistic
              value={faker.number.int({ min: 10, max: 30 })}
              prefix={<FileAddOutlined />}
              suffix="dự án/tuần"
            />
            <Progress percent={faker.number.int({ min: 50, max: 80 })} showInfo={false} />
            <p className="mt-2">Tăng {faker.number.int({ min: 10, max: 30 })}% so với tuần trước</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} lg={12}>
          <Card title="Biểu Đồ Thống Kê Dự Án">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={projectStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="thang" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="dangTuyenDung" name="Đang tuyển dụng" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="dongTuyenDung" name="Đóng tuyển dụng" fill="#82ca9d" />
                <Line yAxisId="right" type="monotone" dataKey="sinhVienThamGia" name="Sinh viên tham gia" stroke="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Danh Sách Dự Án">
            <Input.Search
              placeholder="Tìm kiếm dự án hoặc công ty"
              onSearch={setSearchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Table 
              columns={projectColumns} 
              dataSource={filteredProjects}
              pagination={{ pageSize: 5 }}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={`Tasks của ${projects.find(p => p.id === selectedProject)?.name}`}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <RangePicker 
          onChange={setDateRange}
          style={{ marginBottom: 16, width: '100%' }}
        />
        <Table 
          columns={taskColumns} 
          dataSource={filteredTasks}
          pagination={{ pageSize: 5 }}
          rowKey="id"
        />
      </Modal>

    </div>
  );
};

export default Dashboard;