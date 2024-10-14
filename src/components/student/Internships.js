import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal, Spin, Empty, message, Card, Row, Col, Typography, Tag, Space, Avatar, Button, Tabs, List, Form, Input, Upload, Radio, Divider } from 'antd';
import { UserOutlined, ProjectOutlined, ClockCircleOutlined, CheckCircleOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import styled from 'styled-components';
import MultipleChoice from './task/MultipleChoice';
import Cookies from 'js-cookie';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

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
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskAnswer, setTaskAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [fileList, setFileList] = useState([]);

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

  const showTaskDetails = async (task) => {
    await fetchTaskDetails(task._id);
    setTaskModalVisible(true);
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/student/tasks/${taskId}`);
      setCurrentTask(response.data);
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải thông tin nhiệm vụ.');
    }
  };

  const handleTaskSubmit = async () => {
    if (!currentTask || !currentTask._id) {
      message.error('Không thể xác định nhiệm vụ hiện tại');
      return;
    }

    try {
      let data;
      if (currentTask.taskType === 'multipleChoice') {
        const unansweredIndex = selectedOptions.findIndex(option => option === null || option === undefined);
        if (unansweredIndex !== -1) {
          message.error('Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài.');
          scrollToUnansweredQuestion(unansweredIndex);
          return;
        }
        data = { answer: selectedOptions };
      } else if (currentTask.taskType === 'fileUpload') {
        const formData = new FormData();
        fileList.forEach(file => {
          formData.append('file', file.originFileObj);
        });
        data = formData;
      } else {
        data = { answer: taskAnswer };
      }

      const accessToken = Cookies.get('accessToken');
      await axios.post(`http://localhost:5000/api/tasks/${currentTask._id}/submit`, data, {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': currentTask.taskType === 'fileUpload' ? 'multipart/form-data' : 'application/json'
        }
      });
      message.success('Đã nộp bài làm thành công');
      setTaskModalVisible(false);
      fetchTasks(); // Cập nhật lại danh sách nhiệm vụ
    } catch (error) {
      message.error('Có lỗi xảy ra khi nộp bài làm.');
    }
  };

  const renderTaskForm = () => {
    if (!currentTask) return null;

    switch (currentTask.taskType) {
      case 'multipleChoice':
        return (
          <MultipleChoice
            questions={currentTask.questions}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            taskName={currentTask.name}
            taskDescription={currentTask.description}
          />
        );
      case 'essay':
        return (
          <TextArea
            rows={4}
            value={taskAnswer}
            onChange={(e) => setTaskAnswer(e.target.value)}
            placeholder="Nhập câu trả lời của bạn"
          />
        );
      case 'fileUpload':
        return (
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>
        );
      default:
        return (
          <TextArea
            rows={4}
            value={taskAnswer}
            onChange={(e) => setTaskAnswer(e.target.value)}
            placeholder="Nhập câu trả lời của bạn"
          />
        );
    }
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

  const scrollToUnansweredQuestion = (index) => {
    if (currentTask.taskType === 'multipleChoice') {
      const questionElement = document.querySelector(`#question-${index}`);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

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

      <Modal
        title={<Title level={4}>{currentTask?.name}</Title>}
        visible={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTaskModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleTaskSubmit}>
            Nộp bài
          </Button>,
        ]}
        width={1200}
        style={{ top: 20 }}
      >
        {currentTask && (
          <>
            {renderTaskForm()}
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default Internships;