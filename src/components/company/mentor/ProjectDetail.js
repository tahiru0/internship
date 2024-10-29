import React, { memo, useState, useEffect, useCallback } from 'react';
import { Card, Button, Descriptions, Tag, Switch, Divider, Table, Spin, Avatar, Tooltip, Modal, DatePicker, InputNumber, message, Form, Select, Input, Dropdown, Menu, Alert, Checkbox, Rate, Space, Progress, Timeline, Comment, Row, Col, Empty, List, Typography, Popconfirm, Upload } from 'antd';
import { PlusOutlined, UserOutlined, SearchOutlined, InfoCircleOutlined, DownloadOutlined, StarOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CalendarOutlined, ManOutlined, BankOutlined, ProjectOutlined, UnlockOutlined, LockOutlined, TeamOutlined, BulbOutlined, UserAddOutlined, UnorderedListOutlined, ToolOutlined, DeleteOutlined, InboxOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'js-cookie';
import CreateTaskModal from './project/CreateTaskModal';
import TaskDetailModal from './project/TaskDetailModal';
import StudentDetailModal from './project/StudentDetailModal';
import RemoveStudentModal from './project/RemoveStudentModal';
import ApplicantsModal from './project/ApplicantsModal';
import MembersListModal from './project/MembersListModal';
import RecruitingModal from './project/RecruitingModal';
import ConfirmStatusChangeModal from './project/ConfirmStatusChangeModal';
import RatingModal from './project/RatingModal';
import ConfirmCloseRecruitingModal from './project/ConfirmCloseRecruitingModal';
import { ModalProvider, useModal } from '../../../context/ModalContext';
import { useCompany } from '../../../context/CompanyContext';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
  const [modalZIndex, setModalZIndex] = useState(1000);
  const [highestZIndex, setHighestZIndex] = useState(1000);
  const [taskDetail, setTaskDetail] = useState(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filterName, setFilterName] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDeadlineStart, setFilterDeadlineStart] = useState(null);
  const [filterDeadlineEnd, setFilterDeadlineEnd] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const { axiosInstance } = useCompany();
  

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

  const fetchTasks = async (currentPage = page, pageSize = limit, filters = {}, sorter = {}) => {
    setTaskLoading(true);
    try {
      const response = await axiosInstance.get(`/mentor/projects/${project.id}/tasks`, {
        params: {
          page: currentPage,
          limit: pageSize,
          assignedTo: filters.assignedTo || undefined,
          status: filters.status || undefined,
          deadlineStart: filters.deadlineStart || undefined,
          deadlineEnd: filters.deadlineEnd || undefined,
          sortField: sorter.field || sortBy,
          sortOrder: sorter.order || sortOrder
        }
      });

      setTasks(response.data.tasks);
      setTotal(response.data.total);
      setPage(currentPage);
      setLimit(pageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách task');
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
      const response = await axiosInstance.get(`/mentor/students/${studentId}`);
      setSelectedStudent(response.data);
      setStudentModalVisible(true);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể lấy thông tin sinh viên');
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
            </Tooltip>
          );
        })}
      </Avatar.Group>
    );
  };

  const statusMapping = {
    'Pending': 'Đang chờ',
    'In Progress': 'Đang tiến hành',
    'Assigned': 'Đã giao',
    'Submitted': 'Đã nộp',
    'Evaluated': 'Đã đánh giá',
    'Overdue': 'Quá hạn',
    'Completed': 'Hoàn thành'
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'orange';
      case 'In Progress':
        return 'blue';
      case 'Assigned':
        return 'blue';
      case 'Submitted':
        return 'cyan';
      case 'Evaluated':
        return 'purple';
      case 'Overdue':
        return 'red';
      case 'Completed':
        return 'green';
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
      const response = await axiosInstance.put(`/task/${taskId}/status`, {
        status: newStatus
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
      const response = await axiosInstance.post(`/task/${ratingTask._id}/evaluate`, {
        rating: Math.round(rating * 2),
        comment
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

  const handleViewTaskDetail = (task) => {
    setViewingTask(task);
    fetchTaskDetail(task._id);
  };

  const handleViewStudentDetail = (studentId) => {
    if (studentId) {
      fetchStudentDetail(studentId);
    } else {
      message.warning('Không thể xem chi tiết. ID sinh viên không hợp lệ.');
    }
  };

  const columns = [
    {
      title: 'Tên nhiệm vụ',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Tìm kiếm tên nhiệm vụ"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Tìm
          </Button>
          <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
            Đặt lại
          </Button>
        </div>
      ),
      onFilter: (value, record) => record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Người được giao',
      dataIndex: ['assignedTo', 'name'],
      key: 'assignedTo',
      filters: project && project.members ? project.members.map(member => ({ text: member.name, value: member._id })) : [],
      filteredValue: filterAssignedTo ? [filterAssignedTo] : null,
      render: (name, record) => (
        <Button
          type="link"
          onClick={() => handleViewStudentDetail(record.assignedTo._id)}
        >
          {name}
        </Button>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: Object.keys(statusMapping).map(status => ({ text: statusMapping[status], value: status })),
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{statusMapping[status] || status}</Tag>
      ),
    },
    {
      title: 'Hạn chót',
      dataIndex: 'deadline',
      key: 'deadline',
      sorter: true,
      render: (deadline) => moment(deadline).format('DD/MM/YYYY HH:mm'),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            value={selectedKeys[0]}
            onChange={(dates) => {
              setSelectedKeys(dates ? [dates] : []);
            }}
            onOk={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Lọc
          </Button>
          <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
            Đặt lại
          </Button>
        </div>
      ),
      onFilter: (value, record) => {
        if (!value || value.length !== 2) return true;
        const deadlineDate = moment(record.deadline);
        return deadlineDate.isBetween(value[0], value[1], null, '[]');
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewTaskDetail(record)}
          >
            Chi tiết
          </Button>
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
      const response = await axiosInstance.patch(`/company/projects/${project.id}/stop-recruiting`, {});
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
      const response = await axiosInstance.patch(`/company/projects/${project.id}/start-recruiting`, {
        applicationEnd: applicationEnd.format('YYYY-MM-DD'),
        maxApplicants
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

  const handleTaskSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append('projectId', project._id);
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('deadline', values.deadline.toISOString());
      formData.append('assignedTo', values.assignedTo);
      formData.append('status', 'Assigned');

      if (values.file && values.file.fileList) {
        values.file.fileList.forEach(file => {
          formData.append('files', file.originFileObj);
        });
      }

      const response = await axiosInstance.post('/task', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      message.success(response.data.message || 'Đã thêm task mới');
      setTaskModalVisible(false);
      taskForm.resetFields();
      fetchTasks();

    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo task');
    }
  };

  const fetchApplicants = async () => {
    if (!project || !project.id) return;
    setApplicantsLoading(true);
    try {
      const response = await axiosInstance.get(`/mentor/projects/${project.id}/applicants`);
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
      const response = await axiosInstance.post(`/mentor/projects/${project.id}/applicants/${applicantId}/${action}`, {});
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
      const response = await axiosInstance.post(
        `/mentor/projects/${project.id}/remove-student/${studentId}`,
        { reason: removeReason }
      );
      message.success(response.data.message || 'Đã xóa sinh viên khỏi dự án thành công');
      // Gọi fetchProjects ể cập nhật thông tin dự án trong component cha
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
      const response = await axiosInstance.get(`/mentor/projects/${projectId}`);
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

  const getNextZIndex = useCallback(() => {
    setHighestZIndex(prevZIndex => prevZIndex + 1);
    return highestZIndex + 1;
  }, [highestZIndex]);

  const fetchTaskDetail = async (taskId) => {
    setTaskDetailLoading(true);
    try {
      const response = await axiosInstance.get(`/task/${taskId}`);
      setTaskDetail(response.data);
      setViewingTask(response.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể lấy chi tiết task');
    } finally {
      setTaskDetailLoading(false);
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    fetchTasks(pagination.current, pagination.pageSize, filters, sorter);
  };

  const parseQuestionsText = (text) => {
    const questions = [];
    const lines = text.split('\n');
    let currentQuestion = null;

    for (let line of lines) {
      line = line.trim();
      if (line === '') {
        if (currentQuestion) {
          questions.push(currentQuestion);
          currentQuestion = null;
        }
      } else if (!currentQuestion) {
        currentQuestion = { question: line, options: [], correctAnswer: null };
      } else if (line.match(/^[A-Z]\./)) {
        currentQuestion.options.push(line.substring(2).trim());
      } else if (line.startsWith('Đáp án:')) {
        const answer = line.substring(7).trim();
        currentQuestion.correctAnswer = answer.charCodeAt(0) - 'A'.charCodeAt(0);
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  };

  const FilterSection = () => (
    <Space wrap>
      <Input
        placeholder="Tên nhiệm vụ"
        value={filterName}
        onChange={(e) => {
          setFilterName(e.target.value);
          fetchTasks(1, limit);
        }}
        style={{ width: 200 }}
      />
      <Select
        style={{ width: 200 }}
        placeholder="Người được giao"
        value={filterAssignedTo}
        onChange={(value) => {
          setFilterAssignedTo(value);
          fetchTasks(1, limit);
        }}
      >
        <Option value="">Tất cả</Option>
        {project && project.members && project.members.map(member => (
          <Option key={member.id} value={member.id}>{member.name}</Option>
        ))}
      </Select>
      <Select
        style={{ width: 200 }}
        placeholder="Trạng thái"
        value={filterStatus}
        onChange={(value) => {
          setFilterStatus(value);
          fetchTasks(1, limit);
        }}
      >
        <Option value="">Tất cả</Option>
        {Object.keys(statusMapping).map(status => (
          <Option key={status} value={status}>{statusMapping[status]}</Option>
        ))}
      </Select>
      <RangePicker
        onChange={(dates) => {
          setFilterDeadlineStart(dates ? dates[0].format('YYYY-MM-DD') : null);
          setFilterDeadlineEnd(dates ? dates[1].format('YYYY-MM-DD') : null);
          fetchTasks(1, limit);
        }}
      />
    </Space>
  );

  const SortSection = () => (
    <Space>
      <Select
        style={{ width: 200 }}
        value={sortBy}
        onChange={setSortBy}
      >
        <Option value="createdAt">Ngày tạo</Option>
        <Option value="deadline">Hạn chót</Option>
        <Option value="name">Tên nhiệm vụ</Option>
      </Select>
      <Select
        style={{ width: 120 }}
        value={sortOrder}
        onChange={setSortOrder}
      >
        <Option value="asc">Tăng dần</Option>
        <Option value="desc">Giảm dần</Option>
      </Select>
      <Button type="primary" onClick={() => fetchTasks(1, limit)}>
        Sắp xếp
      </Button>
    </Space>
  );

  if (loading) {
    return <Spin size="large" />;
  }

  if (!project) {
    return <div>Vui lòng chọn một dự án để xem chi tiết.</div>;
  }

  return (
    <ModalProvider>
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
              <Button onClick={() => {
                setMembersModalVisible(true);
              }} icon={<UnorderedListOutlined />}>
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
          columns={columns}
          dataSource={tasks}
          rowKey="_id"
          pagination={{
            current: page,
            pageSize: limit,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} nhiệm vụ`,
          }}
          onChange={(pagination, filters, sorter) => {
            fetchTasks(pagination.current, pagination.pageSize, filters, sorter);
          }}
          loading={taskLoading}
          scroll={{ x: true }}
        />

        <CreateTaskModal
          visible={taskModalVisible}
          onCancel={() => {
            setTaskModalVisible(false);
            taskForm.resetFields();
          }}
          onSubmit={handleTaskSubmit}
          form={taskForm}
          project={project}
          zIndex={modalZIndex}
        />

        <TaskDetailModal
          visible={!!viewingTask}
          onCancel={() => {
            setViewingTask(null);
            setTaskDetail(null);
          }}
          task={taskDetail || viewingTask}
          loading={taskDetailLoading}
          getStatusColor={getStatusColor}
          statusMapping={statusMapping}
          getRatingColor={getRatingColor}
          zIndex={modalZIndex}
          onRate={handleRateTask}  // Thêm dòng này
        />

        <RecruitingModal
          visible={recruitingModalVisible}
          onCancel={() => setRecruitingModalVisible(false)}
          onSubmit={handleRecruitingSubmit}
          applicationEnd={applicationEnd}
          setApplicationEnd={setApplicationEnd}
          maxApplicants={maxApplicants}
          setMaxApplicants={setMaxApplicants}
          recruitingError={recruitingError}
          zIndex={modalZIndex}
        />

        <ConfirmStatusChangeModal
          visible={confirmModalVisible}
          onCancel={() => setConfirmModalVisible(false)}
          onOk={handleConfirmStatusChange}
          taskToUpdate={taskToUpdate}
          statusMapping={statusMapping}
          rememberChoice={rememberChoice}
          onRememberChoiceChange={handleRememberChoiceChange}
          zIndex={modalZIndex}
        />

        <RatingModal
          visible={ratingModalVisible}
          onCancel={() => setRatingModalVisible(false)}
          onSubmit={handleRatingSubmit}
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
          zIndex={modalZIndex}
          taskType={ratingTask?.taskType} 
        />

        <StudentDetailModal
          visible={studentModalVisible}
          onCancel={() => setStudentModalVisible(false)}
          student={selectedStudent}
          zIndex={modalZIndex}
        />

        <ApplicantsModal
          visible={applicantsModalVisible}
          onCancel={() => setApplicantsModalVisible(false)}
          applicants={applicants}
          loading={applicantsLoading}
          onAccept={(applicantId) => handleApplicantAction(applicantId, 'accept')}
          onReject={(applicantId) => handleApplicantAction(applicantId, 'reject')}
          onViewDetail={fetchStudentDetail}
          zIndex={modalZIndex}
        />

        <ConfirmCloseRecruitingModal
          visible={confirmCloseModalVisible}
          onCancel={() => setConfirmCloseModalVisible(false)}
          onConfirm={handleConfirmCloseRecruiting}
          zIndex={modalZIndex}
        />

        <RemoveStudentModal
          visible={removeStudentModalVisible}
          onCancel={() => {
            setRemoveStudentModalVisible(false);
            setRemoveReason('');
          }}
          onConfirm={() => {
            handleRemoveStudent(studentToRemove.id);
            setRemoveStudentModalVisible(false);
            setRemoveReason('');
          }}
          studentName={studentToRemove?.name}
          reason={removeReason}
          onReasonChange={(e) => setRemoveReason(e.target.value)}
          zIndex={modalZIndex}
        />

        <MembersListModal
          visible={membersModalVisible}
          onCancel={() => setMembersModalVisible(false)}
          members={project.members}
          onViewDetail={fetchStudentDetail}
          onRemove={(member) => {
            setStudentToRemove(member);
            setRemoveStudentModalVisible(true);
          }}
          zIndex={modalZIndex}
        />
      </Card>
    </ModalProvider>
  );
});

export default ProjectDetail;
