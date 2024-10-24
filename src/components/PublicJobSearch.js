import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Input, Card, Tag, Button, Row, Col, Pagination, Spin, Select, Typography, Space, Tooltip, Modal, message, Empty, Drawer, Skeleton } from 'antd';
import { SearchOutlined, ClockCircleOutlined, TeamOutlined, CalendarOutlined, UserOutlined, AimOutlined, CloseCircleOutlined, FilterOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import axiosInstance from '../utils/axiosInstance';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import NoProjectsFound from '../layout/NoProjectsFound';
import { debounce } from 'lodash';

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
  height: calc(100vh - 115px);
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

const MobileFilterButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 50%;
  width: 50px !important;
  height: 50px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: none;
  color: #fff;

  &:hover, &:focus {
    background-color: #E09600;
    color: #fff;
  }
`;

const MobileFilterDrawer = styled(Drawer)`
  .ant-drawer-body {
    padding: 24px;
  }
`;

const SkeletonCard = () => (
  <Card style={{ marginBottom: 16 }}>
    <Skeleton avatar active paragraph={{ rows: 4 }} />
  </Card>
);

// Thêm styled components cho nút điều hướng
const NavigationButton = styled(Button)`
  margin-left: 8px;
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const PublicJobSearch = ({ studentData, isLoggedIn }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [majorSearchValue, setMajorSearchValue] = useState('');
  const [filteredMajors, setFilteredMajors] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isXLScreen = useMediaQuery({ minWidth: 1200 });

  useEffect(() => {
    if (isLoggedIn && studentData && studentData.major) {
      setFilters(prevFilters => ({
        ...prevFilters,
        major: studentData.major._id
      }));
      setIsRecommended(true);
      // Thêm dòng này để cập nhật giá trị hiển thị của Select
      setMajorSearchValue(studentData.major.name);
    }
  }, [isLoggedIn, studentData]);

  const debouncedFetchProjects = useCallback(
    debounce(async () => {
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
        setPagination(prev => ({
          ...prev,
          total: response.data.totalProjects || 0,
        }));
      } catch (error) {
        console.error('Lỗi khi lấy danh sách dự án:', error);
        if (error.response?.data?.error) {
          message.error(error.response.data.error);
        } else {
          message.error('Không thể lấy danh sách dự án');
        }
        setProjects([]);
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }, 500),
    [searchQuery, filters, pagination.current, pagination.pageSize]
  );

  useEffect(() => {
    debouncedFetchProjects();
    return () => debouncedFetchProjects.cancel();
  }, [debouncedFetchProjects]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (skills.length === 0) {
        await fetchSkills();
      }
      if (majors.length === 0) {
        await fetchMajors();
      }
    };
    fetchInitialData();
  }, []);

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
      [filterType]: value === null || value === undefined ? '' : value
    }));
    setPagination({ ...pagination, current: 1 });
    if (filterType === 'major') {
      setIsRecommended(value === studentData?.major?._id);
    } else {
      setIsRecommended(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
    window.scrollTo(0, 0);
  };

  const handlePrevPage = () => {
    if (pagination.current > 1) {
      handlePageChange(pagination.current - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.current < Math.ceil(pagination.total / pagination.pageSize)) {
      handlePageChange(pagination.current + 1);
    }
  };

  const showProjectDetails = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProject(null);
  };

  const removeFilter = (filterType) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: filterType === 'skills' ? [] : ''
    }));
    setPagination({ ...pagination, current: 1 });
    if (filterType === 'major') {
      setIsRecommended(false);
      setMajorSearchValue(''); // Thêm dòng này để reset giá trị hiển thị của Select
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
    const selectedMajor = majors.find(major => major._id === majorId);
    if (selectedMajor) {
      setFilters(prevFilters => {
        const newMajor = prevFilters.major === majorId ? '' : majorId;
        
        // Cập nhật majorSearchValue
        if (newMajor) {
          setMajorSearchValue(selectedMajor.name);
        } else {
          setMajorSearchValue('');
        }

        return {
          ...prevFilters,
          major: newMajor
        };
      });
      
      setPagination({ ...pagination, current: 1 });
      setIsRecommended(majorId === studentData?.major?._id);
    }
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

  const toggleMobileFilter = () => {
    setMobileFilterVisible(!mobileFilterVisible);
  };

  const handleMajorSearch = (value) => {
    setMajorSearchValue(value);
    if (value) {
      const filtered = majors.filter(major => 
        major.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMajors(filtered);
    } else {
      setFilteredMajors(majors);
    }
  };

  const handleMajorSelect = (value, option) => {
    handleFilterChange(value, 'major');
    setMajorSearchValue(option.children);
    setFilteredMajors(majors);
  };

  const handleMajorDropdownVisibleChange = (open) => {
    if (open) {
      setFilteredMajors(majors);
    }
  };

  const renderFilters = () => (
    <>
      <FilterHeader>
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>Lọc tìm kiếm</Title>
          <Text type="secondary">
            {pagination.total} dự án • Trang {pagination.current}/{Math.ceil(pagination.total / pagination.pageSize)}
          </Text>
        </div>
        {isXLScreen && (
          <Space>
            <NavigationButton 
              icon={<LeftOutlined />} 
              onClick={handlePrevPage}
              disabled={pagination.current === 1 || loading}
            />
            <NavigationButton 
              icon={<RightOutlined />} 
              onClick={handleNextPage}
              disabled={pagination.current === Math.ceil(pagination.total / pagination.pageSize) || loading}
            />
          </Space>
        )}
      </FilterHeader>
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
          showSearch
          value={filters.major || undefined}
          onSearch={handleMajorSearch}
          onSelect={handleMajorSelect}
          onDropdownVisibleChange={handleMajorDropdownVisibleChange}
          filterOption={false}
          notFoundContent={null}
          searchValue={majorSearchValue}
        >
          {filteredMajors.length === 0 ? (
            <Option disabled value="">Không tìm thấy chuyên ngành phù hợp</Option>
          ) : (
            filteredMajors.map(major => (
              <Option key={major._id} value={major._id}>{major.name}</Option>
            ))
          )}
        </Select>
      </Space>
      {renderFilterTags()}
    </>
  );

  const renderProjectCards = () => {
    if (loading) {
      return Array(5).fill(null).map((_, index) => (
        <SkeletonCard key={`skeleton-${index}`} />
      ));
    }

    if (initialLoadComplete && projects.length === 0) {
      return <NoProjectsFound />;
    }

    return projects.map(project => (
      <StyledCard key={project._id} hoverable>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={6} sm={6} md={4}>
            <CompanyLogo style={{ margin: isMobile ? '0 auto 16px' : '0' }}>
              <CompanyLogoImage src={project.companyLogo} alt={project.companyName} />
            </CompanyLogo>
          </Col>
          <Col xs={18} sm={18} md={14}>
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
          <Col xs={24} sm={24} md={6} style={{ textAlign: isMobile ? 'center' : 'right' }}>
            <Space direction={isMobile ? 'horizontal' : 'vertical'}>
              <StyledButton onClick={() => showProjectDetails(project._id)}>
                Xem chi tiết
              </StyledButton>
            </Space>
          </Col>
        </Row>
      </StyledCard>
    ));
  };

  return (
    <StyledLayout>
      <Content style={{ padding: isMobile ? '16px' : '24px 50px' }}>
        <Row gutter={24}>
          {!isMobile && (
            <StickyCol span={6}>
              <Input.Search
                placeholder="Tìm kiếm dự án thực tập mơ ước"
                onSearch={handleSearch}
                style={{ width: '100%', marginBottom: 16 }}
                size="large"
                enterButton={<SearchOutlined />}
              />
              <StyledCard>
                {renderFilters()}
              </StyledCard>
            </StickyCol>
          )}
          <Col span={isMobile ? 24 : 18}>
            {isMobile && (
              <Input.Search
                placeholder="Tìm kiếm dự án thực tập mơ ước"
                onSearch={handleSearch}
                style={{ width: '100%', marginBottom: 16 }}
                size="large"
                enterButton={<SearchOutlined />}
              />
            )}
            {isRecommended && (
              <Title level={4} style={{ marginBottom: 16, color: '#1890ff' }}>
                Công việc thực tập gợi ý cho bạn
              </Title>
            )}
            {renderProjectCards()}
            {!loading && projects.length > 0 && (
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                onChange={handlePageChange}
                style={{ marginTop: 24, textAlign: 'center' }}
              />
            )}
          </Col>
        </Row>
      </Content>
      {isMobile && (
        <>
          <MobileFilterButton type="primary" icon={<FilterOutlined />} onClick={toggleMobileFilter} />
          <MobileFilterDrawer
            title="Lọc tìm kiếm"
            placement="right"
            onClose={toggleMobileFilter}
            visible={mobileFilterVisible}
          >
            {renderFilters()}
          </MobileFilterDrawer>
        </>
      )}
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
                  <ModalTag key={skill._id} color="cyan">{skill.name}</ModalTag>
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
                  <UserOutlined /> Chuyên ngành: {selectedProject.relatedMajors.map(major => major.name).join(', ')}
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
