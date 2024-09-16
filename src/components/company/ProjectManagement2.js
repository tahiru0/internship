import React, { useState, useEffect } from 'react';
import { Table, Modal, Progress, Button, Avatar, message, Tabs, Tag, Card, Spin, Dropdown, Menu, Input, Form, Row, Col } from 'antd';
import { UserAddOutlined, UserDeleteOutlined, InfoCircleOutlined, EllipsisOutlined, SearchOutlined } from '@ant-design/icons';
import { faker } from '@faker-js/faker';

const { TabPane } = Tabs;

const ProjectManagement = () => {
  const [visible, setVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
    const generateProjects = () => {
      const projectList = [];
      for (let i = 0; i < 10; i++) {
        projectList.push({
          key: i,
          name: faker.commerce.productName(),
          description: faker.lorem.sentence(10),
          businessRequirements: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => faker.lorem.word()),
          industry: faker.commerce.department(),
          members: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
            avatar: faker.image.avatar(),
            name: faker.person.fullName(),
          })),
          memberCount: faker.number.int({ min: 1, max: 10 }),
          pendingCount: faker.number.int({ min: 0, max: 5 }),
          createdAt: faker.date.past().toLocaleDateString(),
          progress: faker.number.int({ min: 0, max: 100 }),
          applicants: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
            avatar: faker.image.avatar(),
            name: faker.person.fullName(),
          })),
        });
      }
      setProjects(projectList);
      setFilteredProjects(projectList);
      setLoading(false);
    };

    generateProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  const handleRowClick = (record) => {
    setSelectedProject(record);
    setVisible(true);
  };

  const handleModalClose = () => {
    setVisible(false);
    setSelectedProject(null);
  };

  const handleAccept = (applicant) => {
    const updatedApplicants = selectedProject.applicants.filter(a => a.name !== applicant.name);
    setSelectedProject(prev => ({
      ...prev,
      applicants: updatedApplicants,
    }));
    message.success('Đã chấp nhận sinh viên vào dự án thành công');
  };

  const handleReject = (applicant) => {
    const updatedApplicants = selectedProject.applicants.filter(a => a.name !== applicant.name);
    setSelectedProject(prev => ({
      ...prev,
      applicants: updatedApplicants,
    }));
    message.success('Đã từ chối sinh viên vào dự án');
  };

  const handleMenuClick = (action) => {
    message.info(`Hành động "${action}" đã được thực hiện.`);
  };

  const menu = (project) => (
    <Menu>
      <Menu.Item key="close" onClick={() => handleMenuClick('Đóng dự án')}>
        Đóng dự án
      </Menu.Item>
      <Menu.Item key="open-recruitment" onClick={() => handleMenuClick('Mở tuyển dụng')}>
        Mở tuyển dụng
      </Menu.Item>
      <Menu.Item key="pin" onClick={() => handleMenuClick('Ghim dự án')}>
        Ghim dự án
      </Menu.Item>
    </Menu>
  );

  const handleCreateProject = (values) => {
    const newProject = {
      key: projects.length,
      name: values.name,
      description: values.description,
      businessRequirements: values.businessRequirements.split(',').map(req => req.trim()),
      industry: values.industry,
      members: [],
      memberCount: 0,
      pendingCount: 0,
      createdAt: new Date().toLocaleDateString(),
      progress: 0,
      applicants: [],
    };
    setProjects([...projects, newProject]);
    setFilteredProjects([...projects, newProject]);
    setCreateModalVisible(false);
    message.success('Dự án mới đã được tạo thành công!');
  };

  return (
    <div style={{ padding: '20px' }}>
      {loading ? (
        <Spin size="large" />
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <Input
              placeholder="Tìm kiếm dự án"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 300, marginRight: '10px' }}
            />
            <Button type="primary" onClick={() => setCreateModalVisible(true)}>
              Tạo dự án mới
            </Button>
          </div>
          <Table
            columns={[
              {
                title: 'Tên Project',
                dataIndex: 'name',
                key: 'name',
                render: (text) => <strong>{text}</strong>,
              },
              {
                title: 'Avatar Group',
                dataIndex: 'members',
                key: 'members',
                render: (members) => (
                  <Avatar.Group maxCount={3}>
                    {members.map((member, index) => (
                      <Avatar key={index} src={member.avatar} alt={member.name} />
                    ))}
                  </Avatar.Group>
                ),
              },
              {
                title: 'Số lượng thành viên',
                dataIndex: 'memberCount',
                key: 'memberCount',
              },
              {
                title: 'Số lượng đơn chưa duyệt',
                dataIndex: 'pendingCount',
                key: 'pendingCount',
                render: (text) => (
                  <span style={{ color: 'red', fontWeight: 'bold' }}>{text}</span>
                ),
              },
              {
                title: 'Hành động',
                key: 'action',
                render: (text, record) => (
                  <Dropdown overlay={menu(record)} trigger={['click']}>
                    <Button icon={<EllipsisOutlined />} />
                  </Dropdown>
                ),
              },
            ]}
            dataSource={filteredProjects}
            onRow={(record) => ({
              onClick: (event) => {
                if (!event.target.closest('.ant-dropdown-trigger')) {
                  handleRowClick(record);
                }
              },
            })}
            rowKey="key"
            pagination={{ pageSize: 5 }}
          />
        </>
      )}
      <Modal
        title="Thông tin chi tiết dự án"
        visible={visible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        {selectedProject && (
          <Tabs defaultActiveKey="1">
            <TabPane tab={<span><InfoCircleOutlined /> Thông tin dự án</span>} key="1">
              <Card>
                <Progress percent={selectedProject.progress} />
                <p>Ngày tạo: {selectedProject.createdAt}</p>
                <p>Số lượng thành viên: {selectedProject.memberCount}</p>
                <p>Số lượng đơn chưa duyệt: {selectedProject.pendingCount}</p>
                <p><strong>Mô tả dự án:</strong> {selectedProject.description}</p>
                <p>
                  <strong>Yêu cầu nghiệp vụ:</strong>
                  {selectedProject.businessRequirements.map((req, index) => (
                    <Tag key={index} color="blue">{req}</Tag>
                  ))}
                </p>
                <p>
                  <strong>Ngành:</strong>
                  <Tag color="green">{selectedProject.industry}</Tag>
                </p>
              </Card>
            </TabPane>
            <TabPane tab={<span><UserAddOutlined /> Danh sách chờ</span>} key="2">
              <Table
                dataSource={selectedProject.applicants}
                columns={[
                  {
                    title: 'Avatar',
                    dataIndex: 'avatar',
                    render: (text, record) => (
                      <Avatar src={record.avatar} size={40} alt="avatar" />
                    ),
                  },
                  {
                    title: 'Tên',
                    dataIndex: 'name',
                  },
                  {
                    title: 'Hành động',
                    render: (text, record) => (
                      <>
                        <Button type="primary" onClick={() => handleAccept(record)} icon={<UserAddOutlined />}>Chấp nhận</Button>
                        <Button type="danger" onClick={() => handleReject(record)} icon={<UserDeleteOutlined />}>Từ chối</Button>
                      </>
                    ),
                  },
                ]}
                scroll={{ y: 240 }}
              />
            </TabPane>
            <TabPane tab={<span><UserAddOutlined /> Danh sách thành viên</span>} key="3">
              <Table
                dataSource={selectedProject.members}
                columns={[
                  {
                    title: 'Avatar',
                    dataIndex: 'avatar',
                    render: (text, record) => (
                      <Avatar src={record.avatar} size={40} alt="avatar" />
                    ),
                  },
                  {
                    title: 'Tên',
                    dataIndex: 'name',
                  },
                ]}
                scroll={{ y: 240 }}
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Create Project Modal */}
      <Modal
        title="Tạo Dự Án Mới"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleCreateProject}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên Dự Án"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên dự án!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ngành"
                name="industry"
                rules={[{ required: true, message: 'Vui lòng chọn ngành!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Mô Tả"
                name="description"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Yêu Cầu Nghiệp Vụ (cách nhau bằng dấu phẩy)"
                name="businessRequirements"
                rules={[{ required: true, message: 'Vui lòng nhập yêu cầu nghiệp vụ!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Tạo Dự Án
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectManagement;
