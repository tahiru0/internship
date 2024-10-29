import React, { useState, useLayoutEffect, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, List, Avatar, Input, Select, message, Skeleton, Button, Tag, Descriptions, Switch, Modal, DatePicker, InputNumber, Popconfirm, Tooltip, Table, Form, Space, Divider, Upload } from 'antd';
import { SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LeftOutlined, UserOutlined, PlusOutlined, UploadOutlined, FileOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../../utils/axiosInstance';
import moment from 'moment';
import { debounce } from 'lodash';
import { useCompany } from '../../../context/CompanyContext';
import ProjectDetail from './ProjectDetail';

const { Option } = Select;
const { TextArea } = Input;

const MentorProjectManagement = () => {
  // Thêm statusMapping vào đây
  const statusMapping = {
    'Assigned': 'Đã giao',
    'Submitted': 'Đã nộp',
    'Graded': 'Đã chấm điểm'
  };

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const loader = useRef(null);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskForm] = Form.useForm();
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [taskFiles, setTaskFiles] = useState([]);

  const listRef = useRef(null);
  const resizeTimeout = useRef(null);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const { axiosInstance } = useCompany();

  const handleResize = useCallback(() => {
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }
    resizeTimeout.current = setTimeout(() => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMobile(window.innerWidth <= 768);
    }, 100);
  }, []);

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(false); // Hiển thị danh sách trước
        setSelectedProject(null); // Reset selected project on mobile resize
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        // Xử lý resize ở đây nếu cần
      });
      resizeObserver.observe(listRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const fetchProjects = async (pageNum = 1, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get('/mentor/projects', {
        params: {
          page: pageNum,
          limit: 10,
          sort: 'createdAt',
          order: 'desc',
          status: statusFilter,
          search: searchTerm
        }
      });

      const { projects, total } = response.data;

      if (append) {
        setProjects(prev => [...prev, ...projects]);
      } else {
        setProjects(projects);
      }
      setTotal(total);
      setHasMore(pageNum * 10 < total);
      setPage(pageNum);

      // Mở dự án đầu tiên sau khi tải về
      if (projects.length > 0 && !selectedProject) {
        handleProjectSelect(projects[0].id);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể lấy danh sách dự án';
      console.error('Lỗi khi lấy danh sách dự án:', error);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchProjects = debounce(() => fetchProjects(1, false), 300);

  useEffect(() => {
    debouncedFetchProjects();
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0
    };

    const observer = new IntersectionObserver(handleObserver, options);
    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, []);

  const handleObserver = (entities) => {
    const target = entities[0];
    if (target.isIntersecting && hasMore) {
      fetchProjects(page + 1, true);
    }
  };

  const fetchProjectDetail = async (projectId) => {
    setProjectDetailLoading(true);
    try {
      const response = await axiosInstance.get(`/mentor/projects/${projectId}`);
      setSelectedProject(response.data);
      // Cập nhật project trong danh sách projects
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === projectId ? { ...p, members: response.data.members } : p)
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể lấy chi tiết dự án';
      console.error('Lỗi khi lấy chi tiết dự án:', error);
      message.error(errorMessage);
    } finally {
      setProjectDetailLoading(false);
    }
  };

  const handleProjectSelect = useCallback((projectId) => {
    fetchProjectDetail(projectId);
    if (isMobile) {
      setTimeout(() => setCollapsed(true), 0);
    }
  }, [isMobile, fetchProjectDetail]);

  const handleBackToList = () => {
    setSelectedProject(null);
    setCollapsed(false);
  };

  const getAvatarColor = (name) => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#712fd1'];
    let total = 0;
    for (let i = 0; name && i < name.length; i++) {
      total += name.charCodeAt(i);
    }
    return colors[total % colors.length];
  };

  const getFirstLetter = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const handleAddTask = () => {
    setTaskModalVisible(true);
  };

  const handleTaskSubmit = async () => {
    try {
      const values = await taskForm.validateFields();
      
      const formData = new FormData();
      formData.append('projectId', selectedProject._id);
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('deadline', values.deadline.toISOString());
      formData.append('assignedTo', values.assignedTo);

      // Xử lý file đính kèm
      if (taskFiles.length > 0) {
        taskFiles.forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await axiosInstance.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      message.success('Tạo task thành công');
      setTaskModalVisible(false);
      taskForm.resetFields();
      setTaskFiles([]);
      refreshProjectDetails();

    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo task');
    }
  };

  const taskColumns = [
    {
      title: 'Tên task',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Người được giao',
      dataIndex: ['assignedTo', 'name'],
      key: 'assignedTo',
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline) => moment(deadline).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {statusMapping[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Tài liệu',
      dataIndex: 'materialFiles',
      key: 'materialFiles',
      render: (files) => (
        <Space>
          {files?.map((file, index) => (
            <a key={index} href={file.url} target="_blank" rel="noopener noreferrer">
              <FileOutlined /> {file.url.split('/').pop()}
            </a>
          ))}
        </Space>
      ),
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'Assigned': 'warning',
      'Submitted': 'success', 
      'Graded': 'processing'
    };
    return colors[status] || 'default';
  };

  const fetchStudentDetail = async (studentId) => {
    try {
      const response = await axiosInstance.get(
        `/mentor/students/${studentId}`, 
        withAuth()
      );
      setSelectedStudent(response.data);
      setStudentModalVisible(true);
    } catch (error) {
      message.error(error.message);
    }
  };

  const renderMembers = (members) => {
    if (!members || !Array.isArray(members)) return null; // Kiểm tra nếu members là null, undefined hoặc không phải là mảng
    return (
      <Avatar.Group
        maxCount={5}
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

  const listStyle = useMemo(() => ({
    width: collapsed ? (isMobile ? '0px' : '80px') : (isMobile ? '100%' : '300px'),
    transition: 'width 0.3s',
    overflowY: 'auto',
    borderRight: '1px solid #f0f0f0',
    padding: collapsed && !isMobile ? '20px 0' : '20px',
    display: collapsed && isMobile ? 'none' : 'block'
  }), [collapsed, isMobile]);

  const detailStyle = useMemo(() => ({
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: (isMobile && !selectedProject && !collapsed) ? 'none' : 'block',
    position: 'relative'
  }), [isMobile, selectedProject, collapsed]);

  const handleCollapse = useCallback(() => {
    setTimeout(() => setCollapsed(!collapsed), 0);
  }, [collapsed]);

  // Hàm này sẽ được truyền xuống ProjectDetail component
  const refreshProjectDetails = () => {
    if (selectedProject) {
      fetchProjectDetail(selectedProject.id);
    }
  };

  const renderSkills = (skills) => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return null;
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {skills.map(skill => (
          <Tag key={skill} color="blue" style={{ margin: '2px 0' }}>{skill}</Tag>
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: isMobile ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)',
    }}>
      <div ref={listRef} style={listStyle}>
        {!isMobile && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={handleCollapse}
            style={{ marginBottom: 16, width: '100%' }}
          />
        )}
        {(!collapsed || isMobile) && (
          <>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm dự án"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Select
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%', marginBottom: 16 }}
              allowClear
            >
              <Option value="Open">Đang mở</Option>
              <Option value="Closed">Đã đóng</Option>
            </Select>
          </>
        )}
        <List
          itemLayout="horizontal"
          dataSource={projects}
          loading={loading}
          renderItem={(project) => (
            <List.Item
              onClick={() => handleProjectSelect(project.id)}
              style={{
                cursor: 'pointer',
                padding: collapsed && !isMobile ? '10px 0' : '10px',
                borderRadius: selectedProject?.id === project.id ? '8px' : '0',
                boxShadow: selectedProject?.id === project.id ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                backgroundColor: selectedProject?.id === project.id ? '#ffffff' : 'transparent'
              }}
            >
              {collapsed && !isMobile ? (
                <Tooltip title={project.title} placement="right">
                  <Avatar
                    style={{
                      backgroundColor: getAvatarColor(project.title),
                      verticalAlign: 'middle',
                      margin: '0 auto'
                    }}
                  >
                    {getFirstLetter(project.title)}
                  </Avatar>
                </Tooltip>
              ) : (
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{
                        backgroundColor: getAvatarColor(project.title),
                        verticalAlign: 'middle'
                      }}
                    >
                      {getFirstLetter(project.title)}
                    </Avatar>
                  }
                  title={project.title}
                  description={
                    <>
                      {renderMembers(project.members)}
                      {renderSkills(project.requiredSkills || [])}
                    </>
                  }
                />
              )}
            </List.Item>
          )}
        />
        {hasMore && <div ref={loader} style={{ height: 20 }}></div>}
      </div>
      <div style={detailStyle}>
        {isMobile && (
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: '#fff',
            padding: '10px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Button
              icon={collapsed ? <MenuUnfoldOutlined /> : <LeftOutlined />}
              onClick={collapsed ? handleBackToList : handleCollapse}
            >
              {collapsed ? 'Quay lại danh sách' : 'Đóng danh sách'}
            </Button>
          </div>
        )}
        <ProjectDetail
          project={selectedProject}
          loading={projectDetailLoading}
          onBack={handleBackToList}
          isMobile={isMobile}
          handleAddTask={handleAddTask}
          taskColumns={taskColumns}
          fetchProjects={refreshProjectDetails}  // Truyền hàm này xuống ProjectDetail
        />
      </div>
      
      <Modal
        title="Thêm Task mới"
        visible={taskModalVisible}
        onOk={handleTaskSubmit}
        onCancel={() => {
          setTaskModalVisible(false);
          taskForm.resetFields();
          setTaskFiles([]);
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
            name="assignedTo"
            label="Người được giao"
            rules={[{ required: true, message: 'Vui lòng chọn người được giao' }]}
          >
            <Select>
              {selectedProject?.members?.map(member => (
                <Option key={member._id} value={member._id}>{member.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Deadline"
            rules={[{ required: true, message: 'Vui lòng chọn deadline' }]}
          >
            <DatePicker 
              showTime 
              format="DD/MM/YYYY HH:mm"
              disabledDate={current => current && current < moment().startOf('day')}
            />
          </Form.Item>

          <Form.Item label="Tài liệu đính kèm">
            <Upload
              multiple
              beforeUpload={(file) => {
                setTaskFiles(prev => [...prev, file]);
                return false;
              }}
              onRemove={(file) => {
                setTaskFiles(prev => prev.filter(f => f !== file));
              }}
              fileList={taskFiles}
            >
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
      
    </div>
  );
};

export default MentorProjectManagement;
