import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Tag, Space, Button, message, Spin, Divider, Row, Col, Card, Timeline, Avatar, Dropdown, Menu, Modal, List, Select } from 'antd';
import { 
  LeftOutlined, 
  SwapOutlined, 
  CalendarOutlined,
  FileOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  ShareAltOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import { CONFIG } from '../utils/axiosInstance';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import './TaskView.css';  // Tạo file CSS riêng

const { Title, Text, Paragraph } = Typography;
dayjs.locale('vi');

const publicAxios = axios.create({
    baseURL: CONFIG.API_URL,
    timeout: CONFIG.TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
});

const TaskView = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [showOtherAccount, setShowOtherAccount] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedUserModel, setSelectedUserModel] = useState('Student');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [shareType, setShareType] = useState('view');
  const [sharing, setSharing] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const initializeUserData = async () => {
    const companyToken = Cookies.get('com_token');
    const studentToken = Cookies.get('std_token');

    try {
      let hasCompanyAccess = false;
      let hasStudentAccess = false;

      // Fetch company data nếu có token
      if (companyToken) {
        try {
          const companyResponse = await publicAxios.get('/company/me', {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          setCompanyData(companyResponse.data);
          hasCompanyAccess = true;
        } catch (err) {
          console.log('Company token invalid');
        }
      }

      // Fetch student data nếu có token
      if (studentToken) {
        try {
          const studentResponse = await publicAxios.get('/student/me', {
            headers: { Authorization: `Bearer ${studentToken}` }
          });
          setStudentData(studentResponse.data);
          hasStudentAccess = true;
        } catch (err) {
          console.log('Student token invalid');
        }
      }

      // Set userType theo thứ tự ưu tiên: company > student > guest
      if (hasCompanyAccess) {
        setUserType('company');
      } else if (hasStudentAccess) {
        setUserType('student');
      } else {
        setUserType('guest');
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserType('guest');
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      let response;
      const companyToken = Cookies.get('com_token');
      const studentToken = Cookies.get('std_token');
      
      // Luôn thử fetch với company token trước nếu có
      if (companyToken) {
        try {
          response = await publicAxios.get(`/task/${taskId}`, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          setTask(response.data);
          setUserType('company');
          return;
        } catch (err) {
          console.log('Company không có quyền xem');
        }
      }

      // Nếu company không được thì thử student
      if (studentToken) {
        try {
          response = await publicAxios.get(`/task/${taskId}`, {
            headers: { Authorization: `Bearer ${studentToken}` }
          });
          setTask(response.data);
          setUserType('student');
          return;
        } catch (err) {
          console.log('Student không có quyền xem');
        }
      }
      
      // Cuối cùng mới thử guest
      try {
        response = await publicAxios.get(`/guest/task/${taskId}`);
        setTask(response.data);
        setUserType('guest');
        message.info('Đang xem ở chế độ khách');
      } catch (err) {
        message.error('Bạn không có quyền xem task này');
        setTask(null);
      }
      
    } catch (error) {
      console.error('Error fetching task:', error);
      message.error(error.response?.data?.message || 'Không thể tải thông tin task');
    } finally {
      setLoading(false);
    }
  };

  // Khởi tạo dữ liệu khi component mount
  useEffect(() => {
    initializeUserData();
  }, []);

  // Sửa lại useEffect để không phụ thuộc vào userType ban đầu
  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]); // Chỉ phụ thuộc vào taskId

  const handleSwitchUser = async () => {
    const newType = userType === 'company' ? 'student' : 'company';
    
    // Reset states
    setShowOtherAccount(false);
    setMenuVisible(false);
    setUserType(newType);

    // Fetch lại task với token mới
    try {
      setLoading(true);
      const token = Cookies.get(newType === 'company' ? 'com_token' : 'std_token');
      const response = await publicAxios.get(`/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task after switch:', error);
      message.error('Tài khoản này không có quyền xem task');
      // Giữ nguyên userType đã chuyển nhưng set task về null
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Assigned': 'blue',
      'Submitted': 'orange',
      'Completed': 'green',
      'In Progress': 'processing',
      'Pending': 'warning',
      'Rejected': 'red',
      'Overdue': 'error'
    };
    return colors[status] || 'default';
  };

  const statusMapping = {
    'Assigned': 'Đã giao',
    'In Progress': 'Đang thực hiện',
    'Submitted': 'Đã nộp',
    'Completed': 'Hoàn thành',
    'Pending': 'Chờ duyệt',
    'Rejected': 'Từ chối',
    'Overdue': 'Quá hạn'
  };

  const renderTaskStatus = () => (
    <Tag color={getStatusColor(task.status)}>
      {statusMapping[task.status]}
    </Tag>
  );

  const renderTimelineItem = (date, text, icon) => ({
    children: (
      <>
        <Text type="secondary">{dayjs(date).format('DD/MM/YYYY HH:mm')}</Text>
        <br />
        <Text>{text}</Text>
      </>
    ),
    dot: icon
  });

  const getCurrentUserData = () => {
    return userType === 'company' ? companyData : studentData;
  };

  const getOtherUserData = () => {
    return userType === 'company' ? studentData : companyData;
  };

  const MenuContainer = () => {
    const currentUser = getCurrentUserData();
    const otherUser = getOtherUserData();

    return (
      <div className="account-menu-overlay" onClick={() => setMenuVisible(false)}>
        <div className="account-menu" onClick={e => e.stopPropagation()}>
          <div className={`menu-container ${showOtherAccount ? 'slide' : ''}`}>
            {/* Menu Chính */}
            <div className="menu-section">
              <div className="user-info">
                <Avatar 
                  src={userType === 'company' 
                    ? currentUser?.account?.avatar 
                    : currentUser?.student?.avatar
                  }
                  icon={<UserOutlined />}
                  size={40}
                />
                <div className="user-details">
                  <Text strong>
                    {userType === 'company' 
                      ? currentUser?.account?.name 
                      : currentUser?.student?.name
                    }
                  </Text>
                  <Text type="secondary">
                    {userType === 'company' 
                      ? `${currentUser?.company?.name} - ${currentUser?.account?.role === 'mentor' ? 'Mentor' : 'Admin'}`
                      : `${currentUser?.student?.studentId} - ${otherUser?.student?.school?.name}`
                    }
                  </Text>
                </div>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div className="menu-items">
                {otherUser && (
                  <Button 
                    type="text" 
                    icon={<SwapOutlined />} 
                    block
                    onClick={() => setShowOtherAccount(true)}
                  >
                    Đăng nhập bằng tài khoản khác
                  </Button>
                )}
              </div>
            </div>

            {/* Menu Tài Khoản Khác */}
            <div className="menu-section">
              <div className="section-header">
                <Button 
                  type="text" 
                  icon={<LeftOutlined />}
                  onClick={() => setShowOtherAccount(false)}
                >
                  Tất cả tài khoản
                </Button>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              {otherUser && (
                <div 
                  className="user-info clickable"
                  onClick={handleSwitchUser}
                >
                  <Avatar 
                    src={userType === 'student' 
                      ? otherUser?.account?.avatar 
                      : otherUser?.student?.avatar
                    }
                    icon={<UserOutlined />}
                    size={40}
                  />
                  <div className="user-details">
                    <Text strong>
                      {userType === 'student' 
                        ? otherUser?.account?.name 
                        : otherUser?.student?.name
                      }
                    </Text>
                    <Text type="secondary">
                      {userType === 'student'
                        ? `${otherUser?.company?.name} - ${otherUser?.account?.role === 'mentor' ? 'Mentor' : 'Admin'}`
                        : `${otherUser?.student?.studentId} - ${otherUser?.student?.school?.name}`
                      }
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserInfo = () => {
    const currentUser = getCurrentUserData();
    
    if (userType === 'guest' || !currentUser) return null;

    return (
      <div className="account-trigger">
        <Space 
          style={{ cursor: 'pointer' }} 
          onClick={() => setMenuVisible(true)}
        >
          <Avatar 
            src={userType === 'company' 
              ? currentUser?.account?.avatar 
              : currentUser?.student?.avatar
            }
            icon={<UserOutlined />}
          />
          <span>
            {userType === 'company' 
              ? currentUser?.account?.name 
              : currentUser?.student?.name
            }
          </span>
        </Space>
        {menuVisible && <MenuContainer />}
      </div>
    );
  };

  // Sửa lại component hiển thị khi không có quyền xem
  const renderNoPermission = () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '50px',
      background: '#fff',
      borderRadius: '8px',
      margin: '24px'
    }}>
      <Title level={4}>Tài khoản của bạn không có quyền xem task này</Title>
      <Text type="secondary">
        {getOtherUserData() 
          ? 'Bạn có thể thử chuyển sang tài khoản khác để xem'
          : 'Vui lòng liên hệ qun trị viên để được cấp quyền'}
      </Text>
      <br />
      <Space style={{ marginTop: '16px' }}>
        <Button 
          type="primary"
          onClick={() => window.history.back()}
        >
          Quay lại
        </Button>
        {getOtherUserData() && (
          <Button 
            onClick={() => handleSwitchUser()}
            icon={<SwapOutlined />}
          >
            Chuyển tài khoản
          </Button>
        )}
      </Space>
    </div>
  );

  // Helper function để kiểm tra permission
  const hasPermission = (permissionName) => {
    return task.permissions?.includes(permissionName);
  };

  // Sửa lại phần render permissions
  const renderPermissions = (task) => {
    const permissionTags = [];

    if (hasPermission('editAll')) permissionTags.push(<Tag color="gold">Quản lý toàn quyền</Tag>);
    if (hasPermission('editStatus')) permissionTags.push(<Tag color="blue">Chỉnh sửa trạng thái</Tag>);
    if (hasPermission('addFiles')) permissionTags.push(<Tag color="blue">Thêm tệp</Tag>);
    if (hasPermission('removeFiles')) permissionTags.push(<Tag color="blue">Xóa tệp</Tag>);
    if (hasPermission('addComments')) permissionTags.push(<Tag color="blue">Thêm bình luận</Tag>);
    if (hasPermission('editComments')) permissionTags.push(<Tag color="blue">Sửa bình luận</Tag>);
    if (hasPermission('editFeedback')) permissionTags.push(<Tag color="blue">Chỉnh sửa phản hồi</Tag>);
    if (hasPermission('manageSharing')) permissionTags.push(<Tag color="gold">Quản lý chia sẻ</Tag>);
    if (hasPermission('deleteTask')) permissionTags.push(<Tag color="red">Xóa task</Tag>);

    return permissionTags;
  };

  const ShareModal = () => (
    <Modal
      title="Chia sẻ task"
      open={shareModalVisible}
      onCancel={() => {
        setShareModalVisible(false);
        setSelectedUserId(null);
        setSelectedUserModel('Student');
        setShareType('view');
      }}
      footer={[
        <Button key="cancel" onClick={() => setShareModalVisible(false)}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={sharing}
          onClick={handleShare}
        >
          Chia sẻ
        </Button>
      ]}
      maskClosable={false}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
        <Select
          placeholder={loadingMembers ? "Đang tải..." : "Chọn người dùng"}
          value={selectedUserId}
          onChange={setSelectedUserId}
          style={{ width: '100%' }}
          loading={loadingMembers}
          disabled={loadingMembers}
          showSearch
          optionFilterProp="children"
        >
          {projectMembers.map(member => (
            <Select.Option 
              key={member._id} 
              value={member._id}
            >
              <Space>
                <Avatar size="small" src={member.avatar} icon={<UserOutlined />} />
                <span>{member.name}</span>
              </Space>
            </Select.Option>
          ))}
        </Select>

        <Select
          value={shareType}
          onChange={setShareType}
          style={{ width: '100%' }}
        >
          <Select.Option value="view">Chỉ xem</Select.Option>
          <Select.Option value="edit">Chỉnh sửa</Select.Option>
        </Select>
      </Space>
    </Modal>
  );

  // Thêm các functions xử lý share
  const handleShare = async () => {
    if (!selectedUserId) {
      message.error('Vui lòng chọn người dùng');
      return;
    }

    try {
      setSharing(true);
      const response = await publicAxios.post(
        `/task/${taskId}/share`,
        {
          userId: selectedUserId,
          userModel: selectedUserModel,
          accessType: shareType
        },
        {
          headers: { 
            Authorization: `Bearer ${Cookies.get('com_token')}` 
          }
        }
      );
      
      setTask({
        ...task,
        shareSettings: {
          ...task.shareSettings,
          sharedWith: response.data.sharedWith
        }
      });
      
      message.success('Đã chia sẻ task thành công');
      setShareModalVisible(false);
      
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể chia sẻ task');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (userId, userModel) => {
    try {
      const response = await publicAxios.delete(
        `/task/${taskId}/share/${userId}`,
        {
          headers: { 
            Authorization: `Bearer ${Cookies.get('com_token')}` 
          },
          data: { userModel }
        }
      );
      
      // Cập nhật lại task với shareSettings mới
      setTask({
        ...task,
        shareSettings: {
          ...task.shareSettings,
          sharedWith: response.data.sharedWith
        }
      });
      
      message.success('Đã xóa quyền truy cập');
      
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể xóa quyền truy cập');
    }
  };

  const fetchProjectMembers = async () => {
    if (!task?.project?._id) return;
    
    try {
      setLoadingMembers(true);
      const response = await publicAxios.get(
        `/mentor/projects/${task.project._id}`,
        {
          headers: { 
            Authorization: `Bearer ${Cookies.get('com_token')}` 
          }
        }
      );
      
      // Lấy danh sách members từ response
      setProjectMembers(response.data.members || []);
      
    } catch (error) {
      console.error('Error fetching project members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleOpenShareModal = () => {
    setShareModalVisible(true);
    fetchProjectMembers();
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Spin size="large" />
    </div>
  );

  if (!task) return renderNoPermission();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Button icon={<LeftOutlined />} onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </Col>
        <Col>
          <Space>
            {/* Sửa điều kiện kiểm tra permission */}
            {hasPermission('manageSharing') && (
              <Button 
                icon={<ShareAltOutlined />}
                onClick={handleOpenShareModal}
                type="primary"
              >
                Chia sẻ
              </Button>
            )}
            {userType !== 'guest' && (
              <div className="account-trigger">
                <Space 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => setMenuVisible(true)}
                >
                  <Avatar 
                    src={userType === 'company' 
                      ? getCurrentUserData()?.account?.avatar 
                      : getCurrentUserData()?.student?.avatar
                    }
                    icon={<UserOutlined />}
                  />
                  <span>
                    {userType === 'company' 
                      ? getCurrentUserData()?.account?.name 
                      : getCurrentUserData()?.student?.name
                    }
                  </span>
                </Space>
                {menuVisible && <MenuContainer />}
              </div>
            )}
          </Space>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={24}>
        <Col span={16}>
          <Card>
            <Title level={3}>{task.name}</Title>
            <Space split={<Divider type="vertical" />} style={{ marginBottom: 16 }}>
              {renderTaskStatus()}
              <Space>
                <CalendarOutlined /> 
                <Text>Hạn nộp: {dayjs(task.deadline).format('DD/MM/YYYY HH:mm')}</Text>
              </Space>
            </Space>
            
            <Divider />
            
            <Title level={5}>Mô tả</Title>
            <Paragraph>{task.description || 'Không có mô tả'}</Paragraph>

            {task.materialFiles?.length > 0 && (
              <>
                <Divider />
                <Title level={5}>Tài liệu đính kèm</Title>
                <Space direction="vertical">
                  {task.materialFiles.map((file, index) => (
                    <Space key={index}>
                      <FileOutlined />
                      <Text>{file.name}</Text>
                    </Space>
                  ))}
                </Space>
              </>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Hoạt động">
            <Timeline
              items={[
                renderTimelineItem(
                  task.createdAt,
                  'Tạo nhiệm vụ',
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                ),
                ...(task.submittedAt ? [
                  renderTimelineItem(
                    task.submittedAt,
                    'Đã nộp bài',
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  )
                ] : []),
                renderTimelineItem(
                  task.deadline,
                  'Hạn nộp',
                  <CalendarOutlined style={{ color: '#ff4d4f' }} />
                )
              ]}
            />
          </Card>

          <Card title="Quyền hạn" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {renderPermissions(task)}
            </Space>
          </Card>

          {/* Sửa điều kiện hiển thị card shared users */}
          {hasPermission('manageSharing') && task.shareSettings?.sharedWith?.length > 0 && (
            <Card title="Đã chia sẻ với" style={{ marginTop: 16 }}>
              <Space direction="vertical">
                {task.shareSettings.sharedWith.map((share, index) => (
                  <div key={index}>
                    <Space>
                      <UserOutlined />
                      <Text>{share.userModel === 'Student' ? 'Sinh viên' : 'Mentor'}</Text>
                      <Text strong>{share.userId}</Text>
                      <Tag color={share.accessType === 'edit' ? 'green' : 'blue'}>
                        {share.accessType === 'edit' ? 'Chỉnh sửa' : 'Xem'}
                      </Tag>
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {/* Sửa điều kiện hiển thị modal */}
      {hasPermission('manageSharing') && <ShareModal />}
    </div>
  );
};

export default TaskView;
