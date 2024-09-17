import React, { useState, useEffect, useRef } from 'react';
import { Card, List, Avatar, Input, Select, message, Spin, Button, Tag, Descriptions, Switch, Modal, DatePicker, InputNumber, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, MenuFoldOutlined, MenuUnfoldOutlined, LeftOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import moment from 'moment';
import { debounce } from 'lodash';
import ProjectDetail from './ProjectDetail';

const { Option } = Select;

const MentorProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [recruitingModalVisible, setRecruitingModalVisible] = useState(false);
  const [recruitingProject, setRecruitingProject] = useState(null);
  const [applicationEnd, setApplicationEnd] = useState(null);
  const [maxApplicants, setMaxApplicants] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const loader = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProjects = async (pageNum = 1, append = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get('http://localhost:5000/api/mentor/projects', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          page: pageNum,
          limit: 10,
          sortBy: 'startDate',
          sortOrder: 'desc',
          search: searchTerm,
          status: statusFilter
        }
      });
      if (response.data && Array.isArray(response.data.projects)) {
        if (append) {
          setProjects(prev => [...prev, ...response.data.projects]);
        } else {
          setProjects(response.data.projects);
        }
        setTotal(response.data.total);
        setHasMore(response.data.projects.length === 10);
        setPage(pageNum);
      } else {
        console.error('Dữ liệu nhận được không hợp lệ:', response.data);
        message.error('Có lỗi xảy ra khi lấy danh sách dự án');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách dự án:', error);
      message.error('Không thể lấy danh sách dự án');
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
      const accessToken = Cookies.get('accessToken');
      const response = await axios.get(`http://localhost:5000/api/mentor/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSelectedProject(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết dự án:', error);
      message.error('Không thể lấy chi tiết dự án');
    } finally {
      setProjectDetailLoading(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    fetchProjectDetail(projectId);
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setCollapsed(false);
  };

  const handleToggleRecruiting = async (project) => {
    if (project.isRecruiting) {
      // Tắt trạng thái tuyển dụng
      try {
        const accessToken = Cookies.get('accessToken');
        await axios.patch(`http://localhost:5000/api/mentor/projects/${project.id}/stop-recruiting`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        message.success('Đã tắt trạng thái tuyển dụng');
        fetchProjects();
        if (selectedProject && selectedProject.id === project.id) {
          fetchProjectDetail(project.id);
        }
      } catch (error) {
        console.error('Lỗi khi tắt trạng thái tuyển dụng:', error);
        message.error('Không thể tắt trạng thái tuyển dụng');
      }
    } else {
      // Mở modal để chọn ngày kết thúc tuyển dụng và số ứng viên tối đa
      setRecruitingProject(project);
      setMaxApplicants(project.maxApplicants || 0);
      setRecruitingModalVisible(true);
    }
  };

  const handleStartRecruiting = async () => {
    if (!applicationEnd) {
      message.error('Vui lòng chọn ngày kết thúc tuyển dụng');
      return;
    }

    try {
      const accessToken = Cookies.get('accessToken');
      await axios.patch(`http://localhost:5000/api/mentor/projects/${recruitingProject.id}/start-recruiting`, {
        maxApplicants,
        applicationEnd: applicationEnd.format('YYYY-MM-DD')
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success('Đã bật trạng thái tuyển dụng');
      setRecruitingModalVisible(false);
      setRecruitingProject(null);
      fetchProjects();
      if (selectedProject && selectedProject.id === recruitingProject.id) {
        fetchProjectDetail(recruitingProject.id);
      }
    } catch (error) {
      console.error('Lỗi khi bật trạng thái tuyển dụng:', error);
      message.error('Không thể bật trạng thái tuyển dụng');
    }
  };

  const getAvatarColor = (name) => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#712fd1'];
    let total = 0;
    for (let i = 0; i < name.length; i++) {
      total += name.charCodeAt(i);
    }
    return colors[total % colors.length];
  };

  const getFirstLetter = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const renderMembers = (members) => {
    const maxDisplay = 5;
    return (
      <Avatar.Group
        maxCount={maxDisplay}
        maxStyle={{
          color: '#f56a00',
          backgroundColor: '#fde3cf',
        }}
      >
        {members.map((member) => (
          <Tooltip title={member.name} key={member.id}>
            <Avatar src={member.avatar} icon={<UserOutlined />} />
          </Tooltip>
        ))}
      </Avatar.Group>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: isMobile ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)',
    }}>
      <div style={{ 
        width: collapsed ? (isMobile ? '0px' : '80px') : (isMobile ? '100%' : '300px'), 
        transition: 'width 0.3s',
        overflowY: 'auto',
        borderRight: '1px solid #f0f0f0',
        padding: collapsed && !isMobile ? '20px 0' : '20px',
        display: collapsed && isMobile ? 'none' : 'block'
      }}>
        {!isMobile && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
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
              style={{ cursor: 'pointer', padding: collapsed && !isMobile ? '10px 0' : '10px' }}
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
                      <Tag color={project.status === 'Open' ? 'green' : 'red'}>
                        {project.status}
                      </Tag>
                      {renderMembers(project.members)}
                    </>
                  }
                />
              )}
            </List.Item>
          )}
        />
        {hasMore && <div ref={loader} style={{ height: 20 }}></div>}
      </div>
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        display: (isMobile && !selectedProject && !collapsed) ? 'none' : 'block',
        position: 'relative'  // Thêm position relative
      }}>
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
              onClick={collapsed ? handleBackToList : () => setCollapsed(true)}
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
        />
      </div>
      <Modal
        title="Chọn ngày kết thúc tuyển dụng và số lượng ứng viên tối đa"
        visible={recruitingModalVisible}
        onOk={handleStartRecruiting}
        onCancel={() => {
          setRecruitingModalVisible(false);
          setApplicationEnd(null);
          setMaxApplicants(0);
          setRecruitingProject(null);
        }}
      >
        <DatePicker
          value={applicationEnd}
          onChange={(date) => setApplicationEnd(date)}
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Chọn ngày kết thúc tuyển dụng"
        />
        <InputNumber
          min={1}
          value={maxApplicants}
          onChange={(value) => setMaxApplicants(value)}
          placeholder="Số lượng ứng viên tối đa"
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
};

export default MentorProjectManagement;