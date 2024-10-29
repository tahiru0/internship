import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Space, Avatar, Button, Spin, Empty, message } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const { Title, Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const CompanyLogo = styled.div`
  width: 64px;
  height: 64px;
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

const Applications = () => {
  const [appliedProjects, setAppliedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppliedProjects();
  }, []);

  const fetchAppliedProjects = async () => {
    try {
      const response = await axiosInstance.get('/student/applied-projects', withAuth());
      setAppliedProjects(response.data);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApply = async (projectId) => {
    try {
      const response = await axiosInstance.delete(`/student/projects/${projectId}/apply`, withAuth());
      message.success(response.data.message);
      setAppliedProjects(prevProjects => prevProjects.filter(project => project._id !== projectId));
    } catch (error) {
      message.error(error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (appliedProjects.length === 0) {
    return (
      <Empty
        description="Bạn chưa ứng tuyển dự án nào"
        style={{ marginTop: '50px' }}
      >
        <Button type="primary" onClick={() => navigate('/jobs')}>
          Tìm kiếm dự án
        </Button>
      </Empty>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>Đơn ứng tuyển của bạn</Title>
      {appliedProjects.map(project => (
        <StyledCard key={project._id}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6} md={4}>
              <CompanyLogo>
                <CompanyLogoImage src={project.company.logo} alt={project.company.name} />
              </CompanyLogo>
            </Col>
            <Col xs={24} sm={18} md={20}>
              <Title level={3}>{project.title}</Title>
              <Text type="secondary">{project.company.name}</Text>
              <div style={{ marginTop: '8px' }}>
                <Space wrap>
                  <Tag color={project.isRecruiting ? 'green' : 'red'}>
                    {project.isRecruiting ? 'Đang tuyển' : 'Đã đóng'}
                  </Tag>
                  <Tag icon={<CalendarOutlined />}>
                    Hạn nộp: {new Date(project.applicationEnd).toLocaleDateString()}
                  </Tag>
                </Space>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Button type="primary" danger onClick={() => handleCancelApply(project._id)}>
                  Hủy ứng tuyển
                </Button>
              </div>
            </Col>
          </Row>
        </StyledCard>
      ))}
    </div>
  );
};

export default Applications;
