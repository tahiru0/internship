import React from 'react';
import { Card, Descriptions, Tag, List, Avatar, Spin, Button } from 'antd';
import { UserOutlined, LeftOutlined } from '@ant-design/icons';
import moment from 'moment';

const ProjectDetail = ({ project, loading, onBack, isMobile, showBackButton }) => {
  if (loading) {
    return <Spin size="large" />;
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>Chọn một dự án để xem chi tiết</p>
      </div>
    );
  }

  return (
    <div>
      {showBackButton && ( // Chỉ hiển thị nút quay lại nếu showBackButton là true
        <Button
          icon={<LeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
      )}
      <Card title={project.title}>
        <Descriptions column={1}>
          <Descriptions.Item label="Mô tả">{project.description}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={project.status === 'Open' ? 'green' : 'red'}>
              {project.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Đang tuyển">
            {project.isRecruiting ? 'Có' : 'Không'}
          </Descriptions.Item>
          <Descriptions.Item label="Số lượng tối đa">{project.maxApplicants}</Descriptions.Item>
          <Descriptions.Item label="Thời gian ứng tuyển">
            {moment(project.applicationStart).format('DD/MM/YYYY')} - 
            {moment(project.applicationEnd).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian dự án">
            {moment(project.startDate).format('DD/MM/YYYY')} - 
            {moment(project.endDate).format('DD/MM/YYYY')}
          </Descriptions.Item>
        </Descriptions>
        <h3>Thành viên dự án</h3>
        <List
          itemLayout="horizontal"
          dataSource={project.members || []}
          renderItem={(member) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={member.avatar} icon={<UserOutlined />} />}
                title={member.name}
                description={member.role || 'Thành viên'}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default ProjectDetail;