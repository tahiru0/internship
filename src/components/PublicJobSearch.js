import React, { useState, useEffect } from 'react';
import { Layout, Input, Card, Tag, Button, Row, Col, Pagination, Spin, Select, Typography, Space, Tooltip, Modal, message, Empty } from 'antd';
import { SearchOutlined, ClockCircleOutlined, TeamOutlined, CalendarOutlined, UserOutlined, AimOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../utils/axiosInstance';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

// Định nghĩa màu chủ đề
const primaryColor = '#4A90E2';
const secondaryColor = '#F5A623';
const backgroundColor = '#F0F2F5';

const StyledLayout = styled(Layout)`
  background-color: ${backgroundColor};
`;

const StickyCol = styled(Col)`
  position: sticky;
  top: 88px; // Điều chỉnh giá trị này để phù hợp với chiều cao của header
  height: calc(100vh - 120px);
  overflow-y: auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const StyledTag = styled(Tag)`
  margin: 4px;
  border-radius: 12px;
  padding: 4px 8px;
`;

const StyledButton = styled(Button)`
  background-color: ${secondaryColor};
  border-color: ${secondaryColor};
  color: #fff;
  border-radius: 20px;

  &:hover, &:focus {
    background-color: #E09600;
    border-color: #E09600;
    color: #fff;
  }
`;

const CompanyLogo = styled.div`
  width: 100px;
  height: 100px;
  margin-right: 16px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
`;

const CompanyLogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const ModalSection = styled.div`
  margin-bottom: 24px;
`;

const ModalTitle = styled(Title)`
  color: ${primaryColor};
  margin-bottom: 16px !important;
`;

const ModalSubtitle = styled(Title)`
  font-size: 18px;
  margin-bottom: 12px !important;
`;

const ModalText = styled(Text)`
  display: block;
  margin-bottom: 8px;
`;

const ModalTag = styled(Tag)`
  margin: 4px;
  padding: 4px 8px;
  border-radius: 12px;
`;

const FilterTagsContainer = styled.div`
  margin-top: 16px;
  max-width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 8px;
`;

const FilterTag = styled(Tag)`
  margin: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  max-width: calc(100% - 8px);
`;

const FilterTagContent = styled.span`
  max-width: calc(100% - 24px); // Để lại không gian cho nút đóng
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PublicJobSearch = ({ studentData, isLoggedIn }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    skills: [],
    status: '',
    major: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [skills, setSkills] = useState([]);
  const [majors, setMajors] = useState([]);
  const navigate = useNavigate();
  const [isRecommended, setIsRecommended] = useState(false);

  useEffect(() => {
    if (isLoggedIn && studentData && studentData.major) {
      setFilters(prevFilters => ({
        ...prevFilters,
        major: studentData.major._id
      }));
      setIsRecommended(true);
    }
  }, [isLoggedIn, studentData]);

  useEffect(() => {
    fetchProjects();
    fetchSkills();
    fetchMajors();
  }, [searchQuery, filters, pagination.current]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/guest/projects', {
        params: {
          query: searchQuery,
          skills: filters.skills.join(','),
          status: filters.status,
          major: filters.major,
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });
      setProjects(response.data.projects || []);
      setPagination({
        ...pagination,
        total: response.data.totalProjects || 0,
      });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách dự án:', error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Không thể lấy danh sách dự án');
      }
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await axiosInstance.get('/guest/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách kỹ năng:', error);
      message.error('Không thể lấy danh sách kỹ năng');
    }
  };

  const fetchMajors = async () => {
    try {
      const response = await axiosInstance.get('/guest/majors');
      setMajors(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách ngành học:', error);
      message.error('Không thể lấy danh sách ngành học');
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleFilterChange = (value, filterType) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
    setPagination({ ...pagination, current: 1 });
    if (filterType === 'major') {
      setIsRecommended(value === studentData?.major?._id);
    } else {
      setIsRecommended(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, current: page });
  };

  const showProjectDetails = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProject(null);
  };

  const removeFilter = (filterType) => {
    setFilters({ ...filters, [filterType]: filterType === 'skills' ? [] : '' });
    setPagination({ ...pagination, current: 1 });
    if (filterType === 'major') {
      setIsRecommended(false);
    }
  };

  const handleApply = (projectId) => {
    navigate(`/login?redirect=/project/${projectId}`);
  };

  const handleSkillClick = (skillId, skillName) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      skills: prevFilters.skills.includes(skillId) 
        ? prevFilters.skills.filter(s => s !== skillId)
        : [...prevFilters.skills, skillId]
    }));
    setPagination({ ...pagination, current: 1 });
    setIsRecommended(false);
  };

  const handleMajorClick = (majorId) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      major: prevFilters.major === majorId ? '' : majorId
    }));
    setPagination({ ...pagination, current: 1 });
    setIsRecommended(majorId === studentData?.major?._id);
  };

  const renderFilterTags = () => (
    <FilterTagsContainer>
      {filters.skills.length > 0 && (
        <FilterTag
          closable
          onClose={() => removeFilter('skills')}
          color="blue"
        >
          <FilterTagContent>
            Kỹ năng: {filters.skills.map(skillId => skills.find(skill => skill._id === skillId)?.name).join(', ')}
          </FilterTagContent>
        </FilterTag>
      )}
      {filters.status && (
        <FilterTag
          closable
          onClose={() => removeFilter('status')}
          color="green"
        >
          <FilterTagContent>
            Trạng thái: {filters.status === 'active' ? 'Đang tuyển' : 'Đã đóng'}
          </FilterTagContent>
        </FilterTag>
      )}
      {filters.major && (
        <FilterTag
          closable
          onClose={() => removeFilter('major')}
          color="orange"
        >
          <FilterTagContent>
            Ngành: {majors.find(major => major._id === filters.major)?.name}
          </FilterTagContent>
        </FilterTag>
      )}
    </FilterTagsContainer>
  );

  return (
    <StyledLayout>
      <Content style={{ padding: '24px 50px' }}>
        <Row gutter={24}>
          <StickyCol span={6}>
            <Input.Search
              placeholder="Tìm kiếm dự án thực tập mơ ước"
              onSearch={handleSearch}
              style={{ width: '100%', marginBottom: 16 }}
              size="large"
              enterButton={<SearchOutlined />}
            />
            <StyledCard title="Lọc tìm kiếm">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn kỹ năng"
                  mode="multiple"
                  value={filters.skills}
                  onChange={(value) => handleFilterChange(value, 'skills')}
                >
                  {skills.map(skill => (
                    <Option key={skill._id} value={skill._id}>{skill.name}</Option>
                  ))}
                </Select>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn trạng thái"
                  value={filters.status}
                  onChange={(value) => handleFilterChange(value, 'status')}
                >
                  <Option value="active">Đang tuyển</Option>
                  <Option value="closed">Đã đóng</Option>
                </Select>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn chuyên ngành"
                  value={filters.major}
                  onChange={(value) => handleFilterChange(value, 'major')}
                >
                  {majors.map(major => (
                    <Option key={major._id} value={major._id}>{major.name}</Option>
                  ))}
                </Select>
              </Space>
              {renderFilterTags()}
            </StyledCard>
          </StickyCol>
          <StickyCol span={18}>
            {isRecommended && (
              <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                Công việc thực tập gợi ý cho bạn
              </Title>
            )}
            <Spin spinning={loading}>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <StyledCard key={project._id} hoverable>
                    <Row gutter={[16, 16]} align="middle">
                      <Col span={4}>
                        <CompanyLogo>
                          <CompanyLogoImage src={project.companyLogo} alt={project.companyName} />
                        </CompanyLogo>
                      </Col>
                      <Col span={14}>
                        <Title level={4} style={{ marginBottom: 8 }}>{project.title}</Title>
                        <Paragraph style={{ marginBottom: 8 }}>{project.companyName}</Paragraph>
                        <Space wrap>
                          <Tooltip title="Trạng thái">
                            <StyledTag color={project.isRecruiting ? 'green' : 'red'}>
                              <ClockCircleOutlined /> {project.isRecruiting ? 'Đang tuyển' : 'Đã đóng'}
                            </StyledTag>
                          </Tooltip>
                          <Tooltip title="Số lượng vị trí">
                            <StyledTag color="blue">
                              <TeamOutlined /> {project.availablePositions} vị trí
                            </StyledTag>
                          </Tooltip>
                          <Tooltip title="Hạn nộp hồ sơ">
                            <StyledTag color="purple">
                              <CalendarOutlined /> {new Date(project.applicationEnd).toLocaleDateString('vi-VN')}
                            </StyledTag>
                          </Tooltip>
                        </Space>
                        {project.requiredSkills && project.requiredSkills.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Text strong>Kỹ năng yêu cầu: </Text>
                            {project.requiredSkills.map((skill) => (
                              <StyledTag 
                                key={skill._id} 
                                color="cyan" 
                                onClick={() => handleSkillClick(skill._id, skill.name)}
                                style={{ cursor: 'pointer' }}
                              >
                                {skill.name}
                              </StyledTag>
                            ))}
                          </div>
                        )}
                        {project.relatedMajors && project.relatedMajors.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Text strong>Ngành học liên quan: </Text>
                            {project.relatedMajors.map((major) => (
                              <StyledTag 
                                key={major._id} 
                                color="orange"
                                onClick={() => handleMajorClick(major._id)}
                                style={{ cursor: 'pointer' }}
                              >
                                {major.name}
                              </StyledTag>
                            ))}
                          </div>
                        )}
                      </Col>
                      <Col span={6} style={{ textAlign: 'right' }}>
                        <Space direction="vertical">
                          <StyledButton onClick={() => showProjectDetails(project._id)}>
                            Xem chi tiết
                          </StyledButton>
                          <Text strong style={{ color: primaryColor }}>{project.status}</Text>
                        </Space>
                      </Col>
                    </Row>
                  </StyledCard>
                ))
              ) : (
                <Empty description="Không có dự án nào phù hợp với tìm kiếm của bạn" />
              )}
            </Spin>
            {projects.length > 0 && (
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onChange={handlePageChange}
                style={{ marginTop: 24, textAlign: 'center' }}
              />
            )}
          </StickyCol>
        </Row>
      </Content>
      <Modal
        title={null}
        visible={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
        bodyStyle={{ padding: 0 }}
      >
        {selectedProject && (
          <ModalContent>
            <ModalSection>
              <ModalTitle level={3}>{selectedProject.title}</ModalTitle>
              <Space align="center" size="large">
                <CompanyLogo style={{ width: 80, height: 80 }}>
                  <CompanyLogoImage src={selectedProject.companyLogo} alt={selectedProject.companyName} />
                </CompanyLogo>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{selectedProject.companyName}</Title>
                  <Space>
                    <Tag color={selectedProject.isRecruiting ? 'green' : 'red'}>
                      <ClockCircleOutlined /> {selectedProject.isRecruiting ? 'Đang tuyển' : 'Đã đóng'}
                    </Tag>
                    <Tag color="blue">
                      <TeamOutlined /> {selectedProject.availablePositions} vị trí
                    </Tag>
                  </Space>
                </div>
              </Space>
            </ModalSection>

            <ModalSection>
              <ModalSubtitle level={5}>Mô tả dự án</ModalSubtitle>
              <Paragraph>{selectedProject.description}</Paragraph>
            </ModalSection>

            <ModalSection>
              <ModalSubtitle level={5}>Mục tiêu</ModalSubtitle>
              <Paragraph>{selectedProject.objectives}</Paragraph>
            </ModalSection>

            <ModalSection>
              <ModalSubtitle level={5}>Kỹ năng yêu cầu</ModalSubtitle>
              <div style={{ marginBottom: 8 }}>
                {selectedProject.requiredSkills.map((skill) => (
                  <ModalTag key={skill} color="cyan">{skill}</ModalTag>
                ))}
              </div>
              <Paragraph>{selectedProject.skillRequirements}</Paragraph>
            </ModalSection>

            <ModalSection>
              <ModalSubtitle level={5}>Thông tin thêm</ModalSubtitle>
              <Space direction="vertical">
                <ModalText>
                  <CalendarOutlined /> Thời gian: {new Date(selectedProject.startDate).toLocaleDateString('vi-VN')} - {new Date(selectedProject.endDate).toLocaleDateString('vi-VN')}
                </ModalText>
                <ModalText>
                  <UserOutlined /> Chuyên ngành: {selectedProject.relatedMajors.join(', ')}
                </ModalText>
                <ModalText>
                  <AimOutlined /> Trạng thái dự án: {selectedProject.projectStatus}
                </ModalText>
              </Space>
            </ModalSection>

            <StyledButton type="primary" block size="large" onClick={() => handleApply(selectedProject._id)}>
              Ứng tuyển ngay
            </StyledButton>
          </ModalContent>
        )}
      </Modal>
    </StyledLayout>
  );
};

export default PublicJobSearch;