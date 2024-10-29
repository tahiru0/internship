import React, { useState } from 'react';
import { Modal, Row, Col, Typography, Card, Tag, Empty, Spin, Button, Divider, Progress, Avatar, Space } from 'antd';
import { UserOutlined, ClockCircleOutlined, FileOutlined, UploadOutlined, CheckCircleOutlined, ProjectOutlined, CloseOutlined, ShareAltOutlined, CopyOutlined } from '@ant-design/icons';
import moment from 'moment';
import styled from 'styled-components';
import { message } from 'antd';

const { Title, Text } = Typography;

const StyledModal = styled(Modal)`
&.ant-modal {
    top: 15px;
  }
  .ant-modal-content {
    border-radius: 10px;
    overflow: hidden;
  }
  .ant-modal-close {
    display: none;
  }
`;

const HeaderSection = styled.div`
  background-color: #1890ff;
  padding: 24px;
  border-radius: 8px 8px 0 0;
`;

const MainContent = styled.div`
  padding: 24px;
  height: calc(100% - 100px);
  overflow-y: auto;
`;

const InfoCard = styled(Card)`
  text-align: center;
  height: 100%;
`;

const StatusTag = styled(Tag)`
  padding: 4px 12px;
  font-size: 14px;
  border-radius: 16px;
`;

const CustomCloseButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`;

const TaskDetailModal = ({ 
  visible, 
  onCancel, 
  task, 
  loading, 
  getStatusColor, 
  statusMapping, 
  getRatingColor, 
  zIndex, 
  onRate,
  onShare
}) => {
  // Di chuyển useState lên trước mọi điều kiện
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Sau đó mới kiểm tra task
  if (!task) return null;

  const canRate = task.status === 'Submitted';

  const renderSubmissionStatus = () => {
    const statusColors = {
      'Assigned': 'warning',
      'Submitted': 'success',
      'Graded': 'processing'
    };
    
    const statusText = {
      'Assigned': 'Chưa nộp bài',
      'Submitted': 'Đã nộp bài',
      'Graded': 'Đã chấm điểm'
    };

    return <Tag color={statusColors[task.status]}>{statusText[task.status]}</Tag>;
  };

  const renderTaskContent = () => {
    return (
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><UploadOutlined style={{ marginRight: '8px' }} />Bài nộp</span>
            {renderSubmissionStatus()}
          </div>
        }
      >
        {task.studentFile ? (
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', padding: '16px', borderRadius: '8px' }}>
            <FileOutlined style={{ fontSize: '32px', marginRight: '16px', color: '#1890ff' }} />
            <Space direction="vertical">
              <a href={task.studentFile} target="_blank" rel="noopener noreferrer">
                {task.studentFile.split('/').pop()}
              </a>
              {task.submittedAt && (
                <Text type="secondary">
                  Nộp lúc: {moment(task.submittedAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              )}
            </Space>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có file được nộp"
          />
        )}
      </Card>
    );
  };

  const handleCopyLink = () => {
    const taskUrl = `${window.location.origin}/tasks/${task._id}`;
    navigator.clipboard.writeText(taskUrl).then(() => {
      message.success('Đã sao chép liên kết');
    }).catch(() => {
      message.error('Không thể sao chép liên kết');
    });
  };

  const handleShare = () => {
    if (onShare) {
      onShare(task);
    }
    setShareModalVisible(true);
  };

  const renderShareSettings = () => {
    if (!task.shareSettings) return null;

    return (
      <Card 
        size="small" 
        title={
          <Space>
            <ShareAltOutlined />
            Cài đặt chia sẻ
          </Space>
        }
        style={{ marginTop: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">Trạng thái chia sẻ:</Text>
            <Tag color={task.shareSettings.isPublic ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
              {task.shareSettings.isPublic ? 'Công khai' : 'Riêng tư'}
            </Tag>
          </div>
          
          {task.shareSettings.accessType && (
            <div>
              <Text type="secondary">Quyền truy cập:</Text>
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {task.shareSettings.accessType === 'view' ? 'Chỉ xem' : 'Chỉnh sửa'}
              </Tag>
            </div>
          )}

          <Space>
            <Button 
              icon={<CopyOutlined />} 
              onClick={handleCopyLink}
            >
              Sao chép liên kết
            </Button>
            {task.canEditStatus && (
              <Button 
                icon={<ShareAltOutlined />}
                onClick={handleShare}
              >
                Chia sẻ
              </Button>
            )}
          </Space>
        </Space>
      </Card>
    );
  };

  return (
    <StyledModal
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width="90%"
      bodyStyle={{ padding: 0, height: '90vh', overflow: 'hidden' }}
      zIndex={zIndex}
    >
      <CustomCloseButton onClick={onCancel}>
        <CloseOutlined />
      </CustomCloseButton>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <HeaderSection>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={18}>
                <Title level={2} style={{ color: 'white', margin: 0 }}>{task.name}</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  <ProjectOutlined /> {task.project?.title}
                </Text>
              </Col>
              <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
                <Space>
                  {task.permissions?.canManageSharing && (
                    <Button 
                      icon={<ShareAltOutlined />}
                      onClick={() => setShareModalVisible(true)}
                    >
                      Chia sẻ
                    </Button>
                  )}
                  <StatusTag color={getStatusColor(task.status)}>
                    {statusMapping[task.status] || task.status}
                  </StatusTag>
                </Space>
              </Col>
            </Row>
          </HeaderSection>

          <MainContent>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <InfoCard>
                  <Avatar size={64} icon={<UserOutlined />} src={task.assignedTo?.avatar} />
                  <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>{task.assignedTo?.name}</Title>
                  <Text type="secondary">Người được giao</Text>
                </InfoCard>
              </Col>

              <Col xs={24} md={8}>
                <InfoCard>
                  <ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                    {moment(task.deadline).format('DD/MM/YYYY HH:mm')}
                  </Title>
                  <Text type="secondary">Hạn nộp</Text>
                </InfoCard>
              </Col>

              <Col xs={24} md={8}>
                {task.rating !== null ? (
                  <InfoCard>
                    <Progress type="circle" percent={task.rating * 10} width={80} />
                    <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>Đánh giá</Title>
                    <Text type="secondary">{task.comment || 'Không có nhận xét'}</Text>
                  </InfoCard>
                ) : (
                  <InfoCard>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>Chưa đánh giá</Title>
                    {canRate && (
                      <Button type="primary" onClick={() => onRate(task)} style={{ marginTop: 16 }}>
                        Đánh giá
                      </Button>
                    )}
                  </InfoCard>
                )}
              </Col>
            </Row>

            <Divider orientation="left">Mô tả nhiệm vụ</Divider>
            <Text>{task.description}</Text>

            {task.materialFiles?.length > 0 && (
              <>
                <Divider orientation="left">Tài liệu đính kèm</Divider>
                <Space direction="vertical">
                  {task.materialFiles.map((file, index) => (
                    <a key={index} href={file.url} target="_blank" rel="noopener noreferrer">
                      <FileOutlined /> {file.url.split('/').pop()}
                    </a>
                  ))}
                </Space>
              </>
            )}

            <Divider orientation="left">Bài nộp</Divider>
            {renderTaskContent()}

            {/* Thêm phần cài đặt chia sẻ */}
            {renderShareSettings()}
          </MainContent>
        </>
      )}
    </StyledModal>
  );
};

export default TaskDetailModal;
