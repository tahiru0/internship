import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout, Typography, Space, Tag, Button, message, Spin, Row, Col, Avatar, Card, Divider } from 'antd';
import { Container } from 'react-bootstrap';
import { ClockCircleOutlined, TeamOutlined, CalendarOutlined, UserOutlined, AimOutlined, GlobalOutlined, EnvironmentOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import styled from 'styled-components';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledContent = styled(Content)`
  padding: 24px 0;
  margin-top: 64px;
`;

const ProjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const CompanyLogo = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 24px;
`;

const CompanyLogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StyledFooter = styled(Footer)`
  text-align: center;
  background: #f0f2f5;
`;

const BackButton = styled(Button)`
  margin-bottom: 20px;
`;

const ProjectDetail = ({ isLoggedIn, studentData, appliedProjects, updateAppliedProjects }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
  }, [id]); // Chỉ phụ thuộc vào id

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const accessToken = Cookies.get('accessToken');
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const response = await axios.get(`http://localhost:5000/api/guest/projects/${id}`, { headers });
      setProject(response.data);
      // Giả sử thông tin công ty được lấy riêng
      if (response.data.companyId) {
        const companyResponse = await axios.get(`http://localhost:5000/api/guest/companies/${response.data.companyId}`);
        setCompany(companyResponse.data);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết dự án:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể lấy thông tin dự án');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!isLoggedIn) {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập với redirect
      const currentPath = encodeURIComponent(window.location.pathname);
      navigate(`/login?redirect=${currentPath}`);
      return;
    }

    try {
      const accessToken = Cookies.get('accessToken');
      await axios.post(`http://localhost:5000/api/student/apply/${id}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success('Ứng tuyển thành công!');
      setProject(prevProject => ({ ...prevProject, hasApplied: true }));
      
      if (updateAppliedProjects) {
        updateAppliedProjects({
          _id: project._id,
          title: project.title
        });
      }
    } catch (error) {
      console.error('Lỗi khi ứng tuyển:', error);
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          message.error(error.response.data.error);
        } else if (error.response.data.message) {
          message.error(error.response.data.message);
        } else {
          message.error('Không thể ứng tuyển. Vui lòng thử lại sau.');
        }
      } else {
        message.error('Không thể ứng tuyển. Vui lòng thử lại sau.');
      }
    }
  };

  const handleCancelApply = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      await axios.delete(`http://localhost:5000/api/student/projects/${id}/apply`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success('Đã hủy ứng tuyển thành công');
      setProject(prevProject => ({ ...prevProject, hasApplied: false }));
      
      if (updateAppliedProjects) {
        updateAppliedProjects({
          _id: project._id,
          title: project.title
        }, true); // Thêm tham số true để chỉ ra rằng đây là hành động hủy
      }
    } catch (error) {
      console.error('Lỗi khi hủy ứng tuyển:', error);
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Không thể hủy ứng tuyển. Vui lòng thử lại sau.');
      }
    }
  };

  const handleBack = () => {
    navigate('/jobs');
  };

  if (loading) {
    return (
      <StyledLayout>
        <StyledContent>
          <Container>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
              <Spin size="large" />
            </div>
          </Container>
        </StyledContent>
      </StyledLayout>
    );
  }

  if (!project) {
    return (
      <StyledLayout>
        <StyledContent>
          <Container>
            <div>Không tìm thấy dự án</div>
          </Container>
        </StyledContent>
      </StyledLayout>
    );
  }

  return (
    <StyledLayout>
      <StyledContent>
        <Container>
          <BackButton type="link" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Quay lại danh sách dự án
          </BackButton>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={16}>
              <ProjectHeader>
                <Space align="start">
                  <CompanyLogo>
                    <CompanyLogoImage src={project.companyLogo} alt={project.companyName} />
                  </CompanyLogo>
                  <div>
                    <Title level={2}>{project.title}</Title>
                    <Title level={4}>{project.companyName}</Title>
                  </div>
                </Space>
              </ProjectHeader>

              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space wrap>
                  <Tag color={project.isRecruiting ? 'green' : 'red'}>
                    <ClockCircleOutlined /> {project.isRecruiting ? 'Đang tuyển' : 'Đã đóng'}
                  </Tag>
                  <Tag color="blue">
                    <TeamOutlined /> {project.availablePositions === 0 ? 'Đã đủ người' : `${project.availablePositions || project.maxApplicants || 'Không xác định'} vị trí`}
                  </Tag>
                  <Tag color="purple">
                    <CalendarOutlined /> Bắt đầu: {new Date(project.applicationStart).toLocaleDateString('vi-VN')}
                  </Tag>
                </Space>

                <div>
                  <Title level={4}>Mô tả dự án</Title>
                  <Paragraph>{project.description}</Paragraph>
                </div>

                <div>
                  <Title level={4}>Mục tiêu</Title>
                  <Paragraph>{project.objectives}</Paragraph>
                </div>

                {project.requiredSkills && project.requiredSkills.length > 0 && (
                  <div>
                    <Title level={4}>Kỹ năng yêu cầu</Title>
                    <Space wrap>
                      {project.requiredSkills.map((skill, index) => (
                        <Tag key={index} color="cyan">{skill}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                <div>
                  <Title level={4}>Thông tin thêm</Title>
                  <Space direction="vertical">
                    <Text>
                      <CalendarOutlined /> Thời gian: {new Date(project.startDate).toLocaleDateString('vi-VN')} - {new Date(project.endDate).toLocaleDateString('vi-VN')}
                    </Text>
                    <Text>
                      <UserOutlined /> Chuyên ngành: {project.relatedMajors.join(', ')}
                    </Text>
                    <Text>
                      <AimOutlined /> Trạng thái dự án: {project.projectStatus}
                    </Text>
                  </Space>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ position: 'sticky', top: '88px' }}>
                {isLoggedIn ? (
                  project.hasApplied ? (
                    <Button type="primary" danger size="large" onClick={handleCancelApply} style={{ width: '100%', marginBottom: '20px' }}>
                      Hủy ứng tuyển
                    </Button>
                  ) : (
                    <Button type="primary" size="large" onClick={handleApply} style={{ width: '100%', marginBottom: '20px' }}>
                      Ứng tuyển ngay
                    </Button>
                  )
                ) : (
                  <Button type="primary" size="large" onClick={handleApply} style={{ width: '100%', marginBottom: '20px' }}>
                    Đăng nhập để ứng tuyển
                  </Button>
                )}
                {company && (
                  <>
                    <Card title="Thông tin công ty" style={{ marginBottom: '20px' }}>
                      <Space direction="vertical">
                        <Text><GlobalOutlined /> Website: <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a></Text>
                        <Text><EnvironmentOutlined /> Địa chỉ: {company.address}</Text>
                      </Space>
                    </Card>
                    <Card title="Mô tả công ty">
                      <Paragraph>{company.description}</Paragraph>
                    </Card>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </StyledContent>
    </StyledLayout>
  );
};

export default ProjectDetail;