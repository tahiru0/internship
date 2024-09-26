import React, { memo, useState, useEffect, useCallback } from 'react';
import { Card, Button, Descriptions, Tag, Switch, Divider, Table, Spin, Avatar, Tooltip, Modal, DatePicker, InputNumber, message, Form, Select, Input, Dropdown, Menu, Alert, Checkbox, Rate, Space, Progress, Timeline, Comment, Row, Col, Empty, List, Typography, Popconfirm } from 'antd';
import { PlusOutlined, UserOutlined, FilePdfOutlined, InfoCircleOutlined,DownloadOutlined, StarOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CalendarOutlined, ManOutlined, BankOutlined, ProjectOutlined, UnlockOutlined, LockOutlined, TeamOutlined, BulbOutlined, UserAddOutlined, UnorderedListOutlined, ToolOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'js-cookie';

const { TextArea } = Input;
const { Option } = Select;

const ProjectDetail = memo(({ project, loading, onBack, isMobile, fetchProjects }) => {
  const [applicationEnd, setApplicationEnd] = useState(null);
  const [maxApplicants, setMaxApplicants] = useState(project?.maxApplicants || 0);
  const [isRecruiting, setIsRecruiting] = useState(project?.isRecruiting || false);
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskForm] = Form.useForm();
  const [viewingTask, setViewingTask] = useState(null);
  const [recruitingModalVisible, setRecruitingModalVisible] = useState(false);
  const [recruitingError, setRecruitingError] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [rememberChoice, setRememberChoice] = useState(Cookies.get('rememberChoice') === 'true');
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingTask, setRatingTask] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [applicantsModalVisible, setApplicantsModalVisible] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [confirmCloseModalVisible, setConfirmCloseModalVisible] = useState(false);
  const [removeStudentModalVisible, setRemoveStudentModalVisible] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [membersModalVisible, setMembersModalVisible] = useState(false);

  useEffect(() => {
    if (project) {
      setIsRecruiting(project.isRecruiting);
      setMaxApplicants(project.maxApplicants);
    }
  }, [project]);

  useEffect(() => {
    if (project && project.id) {
      fetchTasks();
    }
  }, [project]);

  const fetchTasks = async () => {
    if (!project || !project.id) return; // Kiểm tra nếu project hoặc project.id là null hoặc undefined
    setTaskLoading(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get(`http://localhost:5000/api/mentor/projects/${project.id}/tasks`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setTasks(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể lấy danh sách task';
      console.error('Lỗi khi lấy danh sách task:', error);
      message.error(errorMessage);
    } finally {
      setTaskLoading(false);
    }
  };

  const fetchStudentDetail = async (studentId) => {
    if (!studentId) {
      message.error('Không thể lấy thông tin sinh viên. ID sinh viên không hợp lệ.');
      return;
    }
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get(`http://localhost:5000/api/mentor/students/${studentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSelectedStudent(response.data);
      setStudentModalVisible(true);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể lấy thông tin sinh viên';
      console.error('Lỗi khi lấy thông tin sinh viên:', error);
      message.error(errorMessage);
    }
  };

  const renderMembers = (members) => {
    if (!members || !Array.isArray(members)) return null; // Kiểm tra nếu members là null, undefined hoặc không phải là mảng
    const maxDisplay = 3;
    return (
      <Avatar.Group
        maxCount={maxDisplay}
        maxStyle={{
          color: '#f56a00',
          backgroundColor: '#fde3cf',
        }}
      >
        {members.map((member) => {
          if (!member) return null; // Kiểm tra nếu member là null hoặc undefined
          const memberId = member.id || member._id; // Lấy id hoặc _id
          if (!memberId) return null; // Kiểm tra nếu không có id
          return (
            <Tooltip title={member.name} key={memberId}>
              <Avatar
                src={member.avatar}
                icon={<UserOutlined />}
                onClick={() => fetchStudentDetail(memberId)}
                style={{ cursor: 'pointer' }}
              />
              <Button
                type="link"
                icon={<DeleteOutlined />}
                onClick={() => {
                  setStudentToRemove(member);
                  setRemoveStudentModalVisible(true);
                }}
                style={{ marginLeft: 8 }}
              />
            </Tooltip>
          );
        })}
      </Avatar.Group>
    );
  };

  const statusMapping = {
    'Pending': 'Đang chờ',
    'In Progress': 'Đang tiến hành',
    'Completed': 'Hoàn thành',
    'Overdue': 'Quá hạn'
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'orange';
      case 'In Progress':
        return 'blue';
      case 'Completed':
        return 'green';
      case 'Overdue':
        return 'red';
      default:
        return 'default';
    }
  };

  const handleStatusChange = async (taskId, newStatus, currentStatus, taskName) => {
    if (rememberChoice) {
      await updateTaskStatus(taskId, newStatus);
    } else {
      setTaskToUpdate({ taskId, newStatus, currentStatus, taskName });
      setConfirmModalVisible(true);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.put(`http://localhost:5000/api/mentor/tasks/${taskId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success(response.data.message || 'Đã cập nhật trạng thái task');
      fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật trạng thái task';
      console.error('Lỗi khi cập nhật trạng thái task:', error);
      message.error(errorMessage);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (taskToUpdate) {
      await updateTaskStatus(taskToUpdate.taskId, taskToUpdate.newStatus);
      setConfirmModalVisible(false);
      setTaskToUpdate(null);
    }
  };

  const handleRememberChoiceChange = (e) => {
    setRememberChoice(e.target.checked);
    Cookies.set('rememberChoice', e.target.checked);
  };

  const calculateDeadlineCountdown = (deadline) => {
    const now = moment();
    const end = moment(deadline);
    const duration = moment.duration(end.diff(now));
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    if (days < 0 || hours < 0 || minutes < 0) {
      return 'Quá hạn';
    } else if (days > 1) {
      return `Còn ${days} ngày`;
    } else if (days === 1) {
      return 'Ngày mai';
    } else if (hours > 0) {
      return `Còn ${hours} giờ`;
    } else if (minutes > 0) {
      return `Còn ${minutes} phút`;
    } else {
      return 'Hết hạn';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 9) return '#52c41a';
    if (rating >= 7) return '#1890ff';
    if (rating >= 5) return '#faad14';
    return '#f5222d';
  };

  const handleRateTask = (task) => {
    setRatingTask(task);
    setRating(task.rating || 0);
    setComment(task.comment || '');
    setRatingModalVisible(true);
  };

  const handleRatingSubmit = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.post(`http://localhost:5000/api/mentor/tasks/${ratingTask._id}/rate`, {
        rating: Math.round(rating * 2),
        comment
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success(response.data.message || 'Đã đánh giá task thành công');
      setRatingModalVisible(false);
      fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể đánh giá task';
      console.error('Lỗi khi đánh giá task:', error);
      message.error(errorMessage);
    }
  };

  const updatedTaskColumns = [
    {
      title: 'Tên task',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Người được giao',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => renderMembers([assignedTo]),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Dropdown
          overlay={
            <Menu onClick={({ key }) => handleStatusChange(record._id, key, status, record.name)}>
              {status === 'In Progress' && <Menu.Item key="Completed">Hoàn thành</Menu.Item>}
            </Menu>
          }
        >
          <Tag color={getStatusColor(status)}>{statusMapping[status] || status}</Tag>
        </Dropdown>
      ),
    },
    {
      title: 'Hạn chót',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline) => (
        <Tooltip title={`Hạn chót: ${moment(deadline).format('DD/MM/YYYY HH:mm')}`}>
          <span>{calculateDeadlineCountdown(deadline)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => rating ? (
        <Tooltip title={`Điểm: ${rating}/10`}>
          <span style={{ color: getRatingColor(rating) }}>{rating}/10</span>
        </Tooltip>
      ) : 'Chưa đánh giá',
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<InfoCircleOutlined />} onClick={() => setViewingTask(record)} />
          {record.status === 'Completed' && (
            <Button icon={<StarOutlined />} onClick={() => handleRateTask(record)} />
          )}
        </Space>
      ),
    },
  ];

  const handleToggleRecruiting = useCallback(async () => {
    if (!project || !project.id) {
      message.error('Không thể thực hiện thao tác này. Thông tin dự án không hợp lệ.');
      return;
    }

    if (isRecruiting) {
      // Hiển thị modal xác nhận khi đóng ứng tuyển
      setConfirmCloseModalVisible(true);
    } else {
      // Mở modal để chọn ngày kết thúc tuyển dụng và số ứng viên tối đa
      setRecruitingModalVisible(true);
    }
  }, [project, isRecruiting]);

  const handleConfirmCloseRecruiting = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      if (!accessToken) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      const response = await axios.patch(`http://localhost:5000/api/company/projects/${project.id}/stop-recruiting`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success(response.data.message || 'Đã tắt trạng thái tuyển dụng');
      setIsRecruiting(false);
      setConfirmCloseModalVisible(false);
      if (typeof fetchProjects === 'function') {
        fetchProjects();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể thay đổi trạng thái tuyển dụng';
      console.error('Lỗi khi thay đổi trạng thái tuyển dụng:', error);
      message.error(errorMessage);
    }
  };

  const handleRecruitingSubmit = async () => {
    if (!applicationEnd) {
      message.error('Vui lòng chọn ngày kết thúc tuyển dụng');
      return;
    }

    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.patch(`http://localhost:5000/api/company/projects/${project.id}/start-recruiting`, {
        applicationEnd: applicationEnd.format('YYYY-MM-DD'),
        maxApplicants
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success(response.data.message || 'Đã bật trạng thái tuyển dụng');
      setIsRecruiting(true);
      setRecruitingModalVisible(false);
      setApplicationEnd(null);
      setMaxApplicants(0);
      setRecruitingError('');
      if (typeof fetchProjects === 'function') {
        fetchProjects();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể bật trạng thái tuyển dụng';
      console.error('Lỗi khi bật trạng thái tuyển dụng:', error);
      setRecruitingError(errorMessage);
    }
  };

  const handleAddTask = () => {
    setTaskModalVisible(true);
  };

  const handleTaskSubmit = async () => {
    try {
      const values = await taskForm.validateFields();
      const accessToken = Cookies.get('accessToken');
      const response = await axios.post(`http://localhost:5000/api/mentor/projects/${project.id}/tasks`, {
        ...values,
        deadline: values.deadline.toISOString()
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      message.success(response.data.message || 'Đã thêm task mới');
      setTaskModalVisible(false);
      taskForm.resetFields();
      fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể thêm task';
      console.error('Lỗi khi thêm task:', error);
      message.error(errorMessage);
    }
  };

  const fetchApplicants = async () => {
    if (!project || !project.id) return;
    setApplicantsLoading(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get(`http://localhost:5000/api/mentor/projects/${project.id}/applicants`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setApplicants(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể lấy danh sách ứng viên';
      console.error('Lỗi khi lấy danh sách ứng viên:', error);
      message.error(errorMessage);
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleApplicantAction = async (applicantId, action) => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.post(`http://localhost:5000/api/mentor/projects/${project.id}/applicants/${applicantId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success(response.data.message);
      fetchApplicants();
      // Gọi hàm fetchProjects để cập nhật thông tin dự án, bao gồm danh sách thành viên
      if (typeof fetchProjects === 'function') {
        fetchProjects();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Không thể ${action === 'accept' ? 'chấp nhận' : 'từ chối'} ứng viên`;
      console.error(`Lỗi khi ${action === 'accept' ? 'chấp nhận' : 'từ chối'} ứng viên:`, error);
      message.error(errorMessage);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.post(
        `http://localhost:5000/api/mentor/projects/${project.id}/remove-student/${studentId}`,
        { reason: removeReason },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      message.success(response.data.message || 'Đã xóa sinh viên khỏi dự án thành công');
      // Gọi fetchProjects để cập nhật thông tin dự án trong component cha
      if (typeof fetchProjects === 'function') {
        fetchProjects();
      }
      setMembersModalVisible(false);
      setRemoveStudentModalVisible(false);
      setRemoveReason('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể xóa sinh viên khỏi dự án';
      console.error('Lỗi khi xóa sinh viên khỏi dự án:', error);
      message.error(errorMessage);
    }
  };

  const fetchProjectDetail = async (projectId) => {
    if (!projectId) {
      message.error('Không thể lấy thông tin dự án. ID dự án không hợp lệ.');
      return;
    }
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get(`http://localhost:5000/api/mentor/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // Thay vì setProject, chúng ta gọi fetchProjects để cập nhật dự án trong component cha
      if (typeof fetchProjects === 'function') {
        fetchProjects();
      }
      setTasks(response.data.tasks || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể lấy thông tin dự án';
      console.error('Lỗi khi lấy thông tin dự án:', error);
      message.error(errorMessage);
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!project) {
    return <div>Vui lòng chọn một dự án để xem chi tiết.</div>;
  }

  return (
    <Card
      title={
        <Space size="large">
          <Typography.Title level={4} style={{ margin: 0 }}>
            <ProjectOutlined /> {project.title}
          </Typography.Title>
          <Tag color={project.status === 'Open' ? 'green' : 'red'}>
            {project.status === 'Open' ? <UnlockOutlined /> : <LockOutlined />} {project.status}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>
            Thêm Task
          </Button>
          <Button
            onClick={() => {
              setApplicantsModalVisible(true);
              fetchApplicants();
            }}
            icon={<TeamOutlined />}
          >
            Ứng viên ({project.applicantsCount})
          </Button>
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title={<><InfoCircleOutlined /> Thông tin dự án</>} size="small">
            <Descriptions column={1}>
              <Descriptions.Item label="Mô tả">{project.description}</Descriptions.Item>
              <Descriptions.Item label="Chuyên ngành">
                {project.relatedMajors.map(major => (
                  <Tag key={major.id} color="blue">{major.name}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật">
                <ClockCircleOutlined /> {moment(project.updatedAt).fromNow()}
              </Descriptions.Item>
              <Descriptions.Item label={<><ToolOutlined /> Kỹ năng yêu cầu</>}>
                {project.requiredSkills && project.requiredSkills.length > 0 ? (
                  project.requiredSkills.map(skill => (
                    <Tag key={skill.id} color="green">{skill.name}</Tag>
                  ))
                ) : (
                  <span>Không có kỹ năng yêu cầu cụ thể</span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><TeamOutlined /> Thành viên dự án</>} size="small" extra={
            <Button onClick={() => setMembersModalVisible(true)} icon={<UnorderedListOutlined />}>
              Xem danh sách
            </Button>
          }>
            <Avatar.Group
              maxCount={5}
              maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}
            >
              {project.members.map(member => (
                <Tooltip key={member.id} title={member.name}>
                  <Avatar
                    src={member.avatar}
                    icon={<UserOutlined />}
                    onClick={() => fetchStudentDetail(member.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </Tooltip>
              ))}
            </Avatar.Group>
            {project.members.length === 0 && <Empty description="Chưa có thành viên" />}
          </Card>
          <Card
            title={<><BulbOutlined /> Trạng thái tuyển dụng</>}
            size="small"
            style={{ marginTop: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Switch
                checked={isRecruiting}
                onChange={handleToggleRecruiting}
                checkedChildren="Đang tuyển"
                unCheckedChildren="Ngừng tuyển"
              />
              {isRecruiting && (
                <>
                  <Typography.Text>
                    <UserAddOutlined /> Số lượng ứng viên tối đa: {maxApplicants}
                  </Typography.Text>
                  <Typography.Text>
                    <CalendarOutlined /> Hạn nộp đơn: {moment(project.applicationEnd).format('DD/MM/YYYY')}
                  </Typography.Text>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider orientation="left"><UnorderedListOutlined /> Danh sách Task</Divider>
      <Table
        columns={updatedTaskColumns}
        dataSource={tasks}
        rowKey="_id"
        pagination={{ pageSize: 5 }}
        scroll={{ x: 'max-content' }}
        loading={taskLoading}
      />

      <Modal
        title="Thêm Task mới"
        visible={taskModalVisible}
        onOk={handleTaskSubmit}
        onCancel={() => {
          setTaskModalVisible(false);
          taskForm.resetFields();
        }}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item
            name="name"
            label="Tên task"
            rules={[{ required: true, message: 'Vui lòng nhập tên task' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="Hạn chót"
            rules={[{ required: true, message: 'Vui lòng chọn hạn chót' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="assignedTo"
            label="Người được giao"
            rules={[{ required: true, message: 'Vui lòng chọn người được giao' }]}
          >
            <Select>
              {project?.members.map(member => (
                <Option key={member.id} value={member.id}>{member.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <TaskDetailModal
        task={viewingTask}
        visible={!!viewingTask}
        onCancel={() => setViewingTask(null)}
        getStatusColor={getStatusColor}
        statusMapping={statusMapping}
        getRatingColor={getRatingColor}
      />
      <Modal
        title="Bật trạng thái tuyển dụng"
        visible={recruitingModalVisible}
        onOk={handleRecruitingSubmit}
        onCancel={() => setRecruitingModalVisible(false)}
      >
        <DatePicker
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Chọn ngày kết thúc tuyển dụng"
          onChange={(date) => setApplicationEnd(date)}
        />
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          placeholder="Số lượng ứng viên tối đa"
          onChange={(value) => setMaxApplicants(value)}
        />
        {recruitingError && (
          <Alert message={recruitingError} type="error" showIcon style={{ marginTop: 16 }} />
        )}
      </Modal>
      <Modal
        title="Xác nhận cập nhật trạng thái"
        visible={confirmModalVisible}
        onOk={handleConfirmStatusChange}
        onCancel={() => setConfirmModalVisible(false)}
      >
        {taskToUpdate && (
          <p>Bạn có chắc chắn muốn cập nhật trạng thái của task "{taskToUpdate.taskName}" từ "{statusMapping[taskToUpdate.currentStatus] || taskToUpdate.currentStatus}" sang "{statusMapping[taskToUpdate.newStatus] || taskToUpdate.newStatus}"?</p>
        )}
        <Checkbox checked={rememberChoice} onChange={handleRememberChoiceChange}>
          Ghi nhớt lựa chọn của tôi
        </Checkbox>
      </Modal>
      <Modal
        title="Đánh giá Task"
        visible={ratingModalVisible}
        onOk={handleRatingSubmit}
        onCancel={() => setRatingModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Đánh giá">
            <Rate
              allowHalf
              onChange={(value) => setRating(value)}
              value={rating / 2}
            />
            <span className="ant-rate-text">{rating}/10</span>
          </Form.Item>
          <Form.Item label="Bình luận">
            <TextArea rows={4} onChange={(e) => setComment(e.target.value)} value={comment} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={null}
        visible={studentModalVisible}
        onCancel={() => setStudentModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ padding: 0 }}
      >
        {selectedStudent && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px',
            color: 'white'
          }}>
            <Row gutter={[24, 24]} align="middle">
              <Col span={8}>
                <Avatar size={200} src={selectedStudent.avatar} icon={<UserOutlined />} />
              </Col>
              <Col span={16}>
                <h1 style={{ fontSize: '2.5em', margin: 0 }}>{selectedStudent.name}</h1>
                <h2 style={{ fontSize: '1.5em', fontWeight: 'normal', margin: '10px 0' }}>{selectedStudent.major}</h2>
                <p><MailOutlined /> {selectedStudent.email}</p>
                <p><PhoneOutlined /> {selectedStudent.phoneNumber}</p>
                <p><IdcardOutlined /> {selectedStudent.studentId}</p>
                {selectedStudent.cv && (
                  <p>
                    <FilePdfOutlined style={{ marginRight: 8 }} />
                    <a
                      href={selectedStudent.cv}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 15px',
                        fontSize: '14px',
                        borderRadius: '2px',
                        color: '#fff',
                        backgroundColor: '#1890ff',
                        border: '1px solid #1890ff',
                        textDecoration: 'none'
                      }}
                    >
                      <DownloadOutlined style={{ marginRight: '8px' }} />
                      Tải CV
                    </a>
                  </p>
                )}
              </Col>
            </Row>
          </div>
        )}
        {selectedStudent && (
          <div style={{ padding: '40px' }}>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Card title="Thông tin cá nhân" bordered={false}>
                  <p><CalendarOutlined /> Ngày sinh: {moment(selectedStudent.dateOfBirth).format('DD/MM/YYYY')}</p>
                  <p><ManOutlined /> Giới tính: {selectedStudent.gender}</p>
                  <p><BankOutlined /> Trường: {selectedStudent.school.name}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Kỹ năng" bordered={false}>
                  {selectedStudent.skills.length > 0 ? (
                    selectedStudent.skills.map((skill, index) => (
                      <Tag key={index} color="blue" style={{ margin: '5px' }}>{skill}</Tag>
                    ))
                  ) : (
                    <Empty description="Chưa có kỹ năng nào được thêm" />
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
      <Modal
        title="Danh sách ứng viên"
        visible={applicantsModalVisible}
        onCancel={() => setApplicantsModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          loading={applicantsLoading}
          itemLayout="horizontal"
          dataSource={applicants}
          renderItem={applicant => (
            <List.Item
              actions={[
                <Button type="primary" onClick={() => handleApplicantAction(applicant.id, 'accept')}>Chấp nhận</Button>,
                <Button danger onClick={() => handleApplicantAction(applicant.id, 'reject')}>Từ chối</Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={applicant.avatar} icon={<UserOutlined />} />}
                title={<a onClick={() => fetchStudentDetail(applicant.id)}>{applicant.name}</a>}
                description={
                  <Space direction="vertical">
                    <span>{applicant.major} - {applicant.school.name}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
      <Modal
        title="Xác nhận đóng ứng tuyển"
        visible={confirmCloseModalVisible}
        onOk={handleConfirmCloseRecruiting}
        onCancel={() => setConfirmCloseModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <p>
          <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
          Bạn có chắc chắn muốn đóng ứng tuyển cho dự án này?
        </p>
        <p>Lưu ý: Tất cả danh sách ứng tuyển hiện tại sẽ bị xóa.</p>
      </Modal>
      <Modal
        title="Xóa sinh viên khỏi dự án"
        visible={removeStudentModalVisible}
        onOk={() => {
          handleRemoveStudent(studentToRemove.id);
          setRemoveStudentModalVisible(false);
          setRemoveReason('');
        }}
        onCancel={() => {
          setRemoveStudentModalVisible(false);
          setRemoveReason('');
        }}
      >
        <p>Bạn có chắc chắn muốn xóa sinh viên {studentToRemove?.name} khỏi dự án?</p>
        <Input.TextArea
          placeholder="Nhập lý do xóa sinh viên"
          value={removeReason}
          onChange={(e) => setRemoveReason(e.target.value)}
          rows={4}
        />
      </Modal>
      <Modal
        title="Danh sách thành viên dự án"
        visible={membersModalVisible}
        onCancel={() => setMembersModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          itemLayout="horizontal"
          dataSource={project.members}
          renderItem={member => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  danger
                  onClick={() => {
                    setStudentToRemove(member);
                    setRemoveStudentModalVisible(true);
                  }}
                >
                  Xóa
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={member.avatar} icon={<UserOutlined />} />}
                title={<a onClick={() => fetchStudentDetail(member.id)}>{member.name}</a>}
                description={member.email}
              />
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
});


const TaskDetailModal = ({ task, visible, onCancel, getStatusColor, statusMapping, getRatingColor }) => {
  if (!task) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <ClockCircleOutlined style={{ color: 'orange' }} />;
      case 'In Progress':
        return <SyncOutlined spin style={{ color: 'blue' }} />;
      case 'Completed':
        return <CheckCircleOutlined style={{ color: 'green' }} />;
      case 'Overdue':
        return <ExclamationCircleOutlined style={{ color: 'red' }} />;
      default:
        return null;
    }
  };


  const getProgressPercent = () => {
    const total = moment(task.deadline).diff(moment(task.createdAt), 'days');
    const elapsed = moment().diff(moment(task.createdAt), 'days');
    return Math.min(Math.round((elapsed / total) * 100), 100);
  };


  return (
    <Modal
      title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>{task.name}</span>}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Trạng thái">
            <Tag color={getStatusColor(task.status)} icon={getStatusIcon(task.status)}>
              {statusMapping[task.status] || task.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả">{task.description}</Descriptions.Item>
          <Descriptions.Item label="Người được giao">
            <Avatar src={task.assignedTo.avatar} icon={<UserOutlined />} /> {task.assignedTo.name}
          </Descriptions.Item>
          <Descriptions.Item label="Tiến độ">
            <Progress percent={getProgressPercent()} status={task.status === 'Completed' ? 'success' : 'active'} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: '20px' }}>
        <Timeline>
          <Timeline.Item color="green">Tạo task: {moment(task.createdAt).format('DD/MM/YYYY HH:mm')}</Timeline.Item>
          <Timeline.Item color="blue">Hạn chót: {moment(task.deadline).format('DD/MM/YYYY HH:mm')}</Timeline.Item>
          {task.status === 'Completed' && (
            <Timeline.Item color="green">
              Hoàn thành: {moment(task.updatedAt).format('DD/MM/YYYY HH:mm')}
            </Timeline.Item>
          )}
        </Timeline>
      </Card>

      {task.rating && (
        <Card style={{ marginTop: '20px' }}>
          <h3>Đánh giá</h3>
          <Rate disabled defaultValue={task.rating / 2} />
          <span style={{ marginLeft: '10px', color: getRatingColor(task.rating) }}>{task.rating}/10</span>
          {task.comment && (
            <div style={{ marginTop: '10px' }}>
              <strong>Nhận xét:</strong>
              <p>{task.comment}</p>
            </div>
          )}
        </Card>
      )}
    </Modal>
  );
};


export default ProjectDetail;