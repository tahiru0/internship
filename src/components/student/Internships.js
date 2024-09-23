import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal, Spin, Empty, message, Card, Row, Col, Typography, Tag, Space, Avatar, Button, Tabs, List } from 'antd';
import { UserOutlined, ProjectOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const PageContainer = styled.div`
  padding: 24px;
  min-height: calc(100vh - 150px);
`;

const StyledCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const CompanyLogo = styled(Avatar)`
  width: 80px;
  height: 80px;
`;

const StatusTag = styled(Tag)`
  margin-right: 0;
`;

const localizer = momentLocalizer(moment);
moment.locale('vi');

const Internships = () => {
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchCurrentProject();
    fetchTasks();
  }, []);

  const fetchCurrentProject = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/student/current-project');
      setCurrentProject(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        message.info('Bạn chưa tham gia dự án nào.');
      } else {
        message.error('Có lỗi xảy ra khi tải thông tin dự án.');
      }
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/student/tasks');
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải thông tin nhiệm vụ.');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/student/tasks/${taskId}/status`, { status: newStatus });
      message.success('Cập nhật trạng thái nhiệm vụ thành công');
      fetchTasks();
      setModalVisible(false);
    } catch (error) {
      message.error('Có lỗi xảy ra khi cập nhật trạng thái nhiệm vụ.');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Completed': return 'Hoàn thành';
      case 'In Progress': return 'Đang thực hiện';
      case 'Not Started': return 'Chưa bắt đầu';
      default: return status;
    }
  };

  const events = tasks.map(task => ({
    id: task._id,
    title: `${task.name} (${getStatusText(task.status)})`,
    start: new Date(task.deadline),
    end: new Date(task.deadline),
    allDay: true,
    resource: task,
  }));

  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'green';
      case 'In Progress': return 'blue';
      case 'Not Started': return 'orange';
      default: return 'default';
    }
  };

  const renderCalendarTab = () => (
    <>
      <Title level={3} style={{ marginTop: '24px', marginBottom: '16px' }}>Lịch nhiệm vụ</Title>
      {tasks.length > 0 ? (
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectEvent={event => showTaskDetails(event.resource)}
        />
      ) : (
        <Empty 
          description="Bạn chưa có nhiệm vụ nào" 
          style={{ background: 'white', padding: '24px', borderRadius: '8px' }}
        />
      )}
    </>
  );

  const renderInfoTab = () => (
    <>
      <Title level={3}>Thông tin dự án</Title>
      {currentProject ? (
        <StyledCard>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={6} md={4}>
              <CompanyLogo src={currentProject.companyLogo} icon={<UserOutlined />} />
            </Col>
            <Col xs={24} sm={18} md={20}>
              <Title level={3}>{currentProject.title}</Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>{currentProject.companyName}</Text>
              <Space wrap style={{ marginTop: '12px' }}>
                <StatusTag color="blue">{currentProject.status}</StatusTag>
                <Tag icon={<ClockCircleOutlined />}>
                  {new Date(currentProject.startDate).toLocaleDateString()} - {new Date(currentProject.endDate).toLocaleDateString()}
                </Tag>
              </Space>
              <Text style={{ display: 'block', marginTop: '12px' }}>{currentProject.description}</Text>
            </Col>
          </Row>
        </StyledCard>
      ) : (
        <Empty
          description="Bạn chưa tham gia dự án nào"
          style={{ marginBottom: '24px', background: 'white', padding: '24px', borderRadius: '8px' }}
        />
      )}

      <Title level={3} style={{ marginTop: '24px', marginBottom: '16px' }}>Danh sách nhiệm vụ</Title>
      <List
        itemLayout="horizontal"
        dataSource={tasks}
        renderItem={task => (
          <List.Item
            actions={[
              <Button onClick={() => showTaskDetails(task)}>Xem chi tiết</Button>
            ]}
          >
            <List.Item.Meta
              title={task.name}
              description={
                <Space>
                  <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
                  <Text><ClockCircleOutlined /> Hạn chót: {new Date(task.deadline).toLocaleDateString()}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <PageContainer>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Lịch" key="1">
          {renderCalendarTab()}
        </TabPane>
        <TabPane tab="Thông tin & Nhiệm vụ" key="2">
          {renderInfoTab()}
        </TabPane>
      </Tabs>

      <Modal
        title={<Title level={4}>Chi tiết nhiệm vụ</Title>}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTask && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={3}>{selectedTask.name}</Title>
            <Text><ProjectOutlined /> Dự án: {selectedTask.project.title}</Text>
            <Text><ClockCircleOutlined /> Hạn chót: {new Date(selectedTask.deadline).toLocaleDateString()}</Text>
            <StatusTag color={getStatusColor(selectedTask.status)}>{selectedTask.status}</StatusTag>
            <Text>{selectedTask.description}</Text>
            <Space>
              <Text strong>Cập nhật trạng thái:</Text>
              <Button onClick={() => updateTaskStatus(selectedTask._id, 'Not Started')}>Chưa bắt đầu</Button>
              <Button onClick={() => updateTaskStatus(selectedTask._id, 'In Progress')} type="primary">Đang thực hiện</Button>
              <Button onClick={() => updateTaskStatus(selectedTask._id, 'Completed')} type="primary" icon={<CheckCircleOutlined />}>Hoàn thành</Button>
            </Space>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};

export default Internships;