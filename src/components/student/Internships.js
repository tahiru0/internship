import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Modal, Spin, Empty, message, Card, Row, Col, Typography, Tag, Space, Avatar, Button, Tabs, List, Form, Input, Upload, Radio, Divider } from 'antd';
import { UserOutlined, DownloadOutlined, ProjectOutlined, ClockCircleOutlined, CheckCircleOutlined, UploadOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import styled from 'styled-components';
import MultipleChoice from './task/MultipleChoice';
import EssayTask from './task/EssayTask';
import FileUploadTask from './task/FileUploadTask';
import GeneralTask from './task/GeneralTask';

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
      const response = await axiosInstance.get('/student/current-project', withAuth());
      setCurrentProject(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        message.info('Bạn chưa tham gia dự án nào.');
      } else {
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin dự án.';
        message.error(errorMessage);
      }
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get('/student/tasks', withAuth());
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin nhiệm vụ.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/student/tasks/${taskId}/status`, { status: newStatus }, withAuth());
      message.success('Cập nhật trạng thái nhiệm vụ thành công');
      fetchTasks();
      setModalVisible(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái nhiệm vụ.';
      message.error(errorMessage);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned':
        return '#4a90e2'; // Màu xanh dương nhạt hơn
      case 'Submitted':
        return '#5bc0de'; // Màu xanh lam nhạt hơn
      case 'Evaluated':
        return '#5cb85c'; // Màu xanh lá cây nhạt hơn
      case 'Overdue':
        return '#d9534f'; // Màu đỏ nhạt hơn
      case 'Completed':
        return '#5cb85c'; // Màu xanh lá cây nhạt hơn
      default:
        return '#95a5a6'; // Màu xám nhạt hơn
    }
  };

  const events = tasks.map(task => ({
    id: task._id,
    title: `${task.name} (${getStatusText(task.status)})`,
    start: new Date(task.deadline),
    end: moment(task.deadline).add(1, 'hour').toDate(), // Thêm 1 giờ để hiển thị sự kiện
    allDay: false, // Đổi thành false để hiển thị theo giờ
    resource: task,
    backgroundColor: getStatusColor(task.status),
    borderColor: getStatusColor(task.status),
  }));

  const showTaskDetails = async (task) => {
    await fetchTaskDetails(task._id);
    setTaskModalVisible(true);
  };

  const TaskInfo = ({ task }) => {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>{task.name}</Title>
          <Text type="secondary">{task.description}</Text>
        </div>
        <Space>
          <Tag icon={<ProjectOutlined />} color="blue">{task.project.title}</Tag>
          <Tag icon={<ClockCircleOutlined />} color="orange">
            Hạn chót: {new Date(task.deadline).toLocaleDateString()}
          </Tag>
          <StatusTag color={getStatusColor(task.status)}>{task.status}</StatusTag>
        </Space>
        {task.materialFile && (
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => window.open(task.materialFile, '_blank')}
          >
            Tải tài liệu
          </Button>
        )}
        <Divider />
      </Space>
    );
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axiosInstance.get(`/student/tasks/${taskId}`, withAuth());
      setCurrentTask(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin nhiệm vụ.';
      message.error(errorMessage);
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

      const response = await axiosInstance.post(`/student/tasks/${currentTask._id}/submit`, data, withAuth());

      message.success(response.data.message || 'Đã nộp bài làm thành công');
      setTaskModalVisible(false);
      fetchTasks(); // Cập nhật lại danh sách nhiệm vụ
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi nộp bài làm.';
      message.error(errorMessage);
    }
  };

  const getVietnameseStatus = (status) => {
    switch (status) {
      case 'Assigned': return 'Đã giao';
      case 'Submitted': return 'Đã nộp';
      case 'Evaluated': return 'Đã đánh giá';
      case 'Overdue': return 'Quá hạn';
      case 'Completed': return 'Hoàn thành';
      default: return status;
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
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.backgroundColor,
              borderColor: event.borderColor,
            },
          })}
          defaultView="week" // Đặt mặc định là view theo tuần
          views={['month', 'week', 'day']} // Cho phép người dùng chọn các chế độ xem khác nhau
          formats={{
            timeGutterFormat: (date, culture, localizer) =>
              localizer.format(date, 'HH:mm', culture),
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
          }}
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
                <StatusTag color={getStatusColor(currentProject.status)}>{currentProject.status}</StatusTag>
                <Tag icon={<ClockCircleOutlined />}>
                  {moment(currentProject.startDate).format('DD/MM/YYYY')} - {moment(currentProject.endDate).format('DD/MM/YYYY')}
                </Tag>
              </Space>
              <Text style={{ display: 'block', marginTop: '12px' }}>{currentProject.description}</Text>
              <Divider />
              
            </Col>
            <Col >
            <Title level={4}>Mục tiêu dự án</Title>
              <Text>{currentProject.objectives}</Text>
              <Title level={4} style={{ marginTop: '16px' }}>Kỹ năng yêu cầu</Title>
              <Space wrap>
                {currentProject.requiredSkills.map((skill, index) => (
                  <Tag key={index} color="blue">{skill}</Tag>
                ))}
              </Space>
              <Title level={4} style={{ marginTop: '16px' }}>Chuyên ngành liên quan</Title>
              <Space wrap>
                {currentProject.relatedMajors.map((major, index) => (
                  <Tag key={index} color="purple">{major}</Tag>
                ))}
              </Space>
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

  const renderTaskModal = () => {
    if (!currentTask) return null;

    const commonProps = {
      task: currentTask,
      visible: taskModalVisible,
      onCancel: () => setTaskModalVisible(false),
      handleTaskSubmit: handleTaskSubmit,
    };

    switch (currentTask.taskType) {
      case 'multipleChoice':
        return (
          <MultipleChoice
            {...commonProps}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
          />
        );
      case 'essay':
        return (
          <EssayTask
            {...commonProps}
            taskAnswer={taskAnswer}
            setTaskAnswer={setTaskAnswer}
          />
        );
      case 'fileUpload':
        return (
          <FileUploadTask
            {...commonProps}
            fileList={fileList}
            setFileList={setFileList}
          />
        );
      case 'general':
      default:
        return (
          <GeneralTask
            {...commonProps}
            taskAnswer={taskAnswer}
            setTaskAnswer={setTaskAnswer}
          />
        );
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
            <StatusTag color={getStatusColor(selectedTask.status)}>{getVietnameseStatus(selectedTask.status)}</StatusTag>
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

      {renderTaskModal()}
    </PageContainer>
  );
};

export default Internships;
