import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Spin, message, Avatar, Button } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import axiosInstance from '../../utils/axiosInstance';
import dayjs from 'dayjs';

const CurrentProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/student/current-project/${id}`);
      setProject(response.data);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  if (loading) return <Spin size="large" />;
  if (!project) return null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Button 
        type="link" 
        icon={<LeftOutlined />} 
        onClick={() => navigate('/student/current-projects')}
        style={{ marginBottom: 16, padding: 0 }}
      >
        Quay lại danh sách
      </Button>

      <Card title={project.title}>
        <Descriptions bordered>
          <Descriptions.Item label="Công ty" span={2}>
            <Avatar src={project.companyLogo} />
            {project.companyName}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color="processing">{project.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian" span={3}>
            {dayjs(project.startDate).format('DD/MM/YYYY')} - 
            {dayjs(project.endDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Mentor" span={3}>
            {project.mentor?.name} ({project.mentor?.email})
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả" span={3}>
            {project.description}
          </Descriptions.Item>
          <Descriptions.Item label="Chuyên ngành" span={3}>
            {project.relatedMajors?.map(major => (
              <Tag key={major}>{major}</Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Kỹ năng yêu cầu" span={3}>
            {project.requiredSkills?.map(skill => (
              <Tag color="blue" key={skill}>{skill}</Tag>
            ))}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default CurrentProjectDetail; 