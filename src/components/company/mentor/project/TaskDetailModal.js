import React, { useState } from 'react';
import { Modal, Row, Col, Typography, Tag, Progress, Avatar, Card, List, Upload, Radio, Divider, Spin, Button, Pagination, Empty } from 'antd';
import { ClockCircleOutlined, UserOutlined, FileOutlined, CheckCircleOutlined, ProjectOutlined, QuestionCircleOutlined, FileTextOutlined, UploadOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import styled from 'styled-components';

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
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 24px;
  color: white;
`;

const ContentSection = styled.div`
  padding: 24px;
`;

const StatusTag = styled(Tag)`
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
`;

const InfoCard = styled(Card)`
  height: 100%;
  .ant-card-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;

const MainContent = styled.div`
  display: flex;
  height: calc(100vh - 160px);
  overflow: hidden;
`;

const ScrollableColumn = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  height: 100%;
`;
const CustomCloseButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
  z-index: 1000;

  &:hover {
    background-color: #f0f0f0;
  }

  .anticon {
    color: #000;
    font-size: 16px;
  }
`;

const TaskDetailModal = ({ visible, onCancel, task, loading, getStatusColor, statusMapping, getRatingColor, zIndex, onRate }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5; // Số câu hỏi trên mỗi trang

    if (!task) return null;

    const canRate = task.status === 'Submitted';

    const renderTaskContent = () => {
        switch (task.taskType) {
            case 'multipleChoice':
                const questions = task.questions || [];
                const totalQuestions = questions.length;
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const currentQuestions = questions.slice(startIndex, endIndex);

                return (
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><QuestionCircleOutlined style={{ marginRight: '8px' }} />Câu hỏi trắc nghiệm</span>
                                {renderSubmissionStatus()}
                            </div>
                        }
                    >
                        <List
                            dataSource={currentQuestions}
                            renderItem={(item, index) => {
                                const questionText = item.question.replace(/^\d+\.\s*/, '');
                                const questionNumber = startIndex + index + 1;
                                return (
                                    <List.Item style={{ backgroundColor: index % 2 === 0 ? '#f0f2f5' : 'white', padding: '16px', borderRadius: '8px', marginBottom: '8px' }}>
                                        <div>
                                            <Text strong>{`${questionNumber}. ${questionText}`}</Text><br />
                                            <Radio.Group value={task.studentAnswer ? task.studentAnswer[startIndex + index] : undefined}>
                                                {item.options.map((option, optionIndex) => (
                                                    <Radio
                                                        key={optionIndex}
                                                        value={optionIndex}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            marginTop: '4px',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        <span style={{ color: item.correctAnswer === optionIndex ? '#008000' : 'inherit' }}>
                                                            {String.fromCharCode(65 + optionIndex)}. {option}
                                                        </span>
                                                        {task.studentAnswer && task.studentAnswer[startIndex + index] === optionIndex && (
                                                            <Tag color="blue" style={{ marginLeft: 8 }}>Câu trả lời của sinh viên</Tag>
                                                        )}
                                                    </Radio>
                                                ))}
                                            </Radio.Group>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                        <Pagination
                            current={currentPage}
                            total={totalQuestions}
                            pageSize={pageSize}
                            onChange={(page) => setCurrentPage(page)}
                            style={{ marginTop: '16px', textAlign: 'center' }}
                        />
                    </Card>
                );
            case 'essay':
                return (
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><FileTextOutlined style={{ marginRight: '8px' }} />Bài luận</span>
                                {renderSubmissionStatus()}
                            </div>
                        }
                    >
                        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', backgroundColor: '#f0f2f5' }}>
                            <Text>{task.studentAnswer || 'Chưa có bài làm'}</Text>
                        </div>
                    </Card>
                );
            case 'fileUpload':
                return (
                    <Card
                        title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><UploadOutlined style={{ marginRight: '8px' }} />File đã tải lên</span>
                                {renderSubmissionStatus()}
                            </div>
                        }
                    >
                        {task.studentFile ? (
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f0f2f5', padding: '16px', borderRadius: '8px' }}>
                                <FileOutlined style={{ fontSize: '32px', marginRight: '16px', color: '#1890ff' }} />
                                <a href={task.studentFile} target="_blank" rel="noopener noreferrer">
                                    {task.studentFile.split('/').pop()}
                                </a>
                            </div>
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Chưa có file được tải lên"
                            />
                        )}
                    </Card>
                );
            default:
                return null;
        }
    };

    const renderSubmissionStatus = () => {
        if (task.status === 'Assigned') {
            return <Text type="warning">Chưa nộp bài</Text>;
        } else if (task.status === 'Submitted') {
            return <Text type="success">Đã nộp bài</Text>;
        } else if (task.status === 'Graded') {
            return <Text type="primary">Đã chấm điểm</Text>;
        }
        return null;
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
                                <Title level={2} style={{ color: 'white', margin: 0 }}>{task.name || 'Không có tên'}</Title>
                                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                                    <ProjectOutlined /> {task.project?.title || 'Không có dự án'}
                                </Text>
                            </Col>
                            <Col xs={24} sm={6} style={{ textAlign: 'right' }}>
                                <StatusTag color={getStatusColor(task.status)}>{task.status || 'Không có trạng thái'}</StatusTag>
                            </Col>
                        </Row>
                    </HeaderSection>
                    <MainContent>
                        <ScrollableColumn>
                            <Row gutter={[24, 24]}>
                                <Col xs={24} md={8}>
                                    <InfoCard>
                                        <Avatar size={64} icon={<UserOutlined />} src={task.assignedTo?.avatar} />
                                        <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>{task.assignedTo?.name || 'Chưa được giao'}</Title>
                                        <Text type="secondary">Người được giao</Text>
                                    </InfoCard>
                                </Col>
                                <Col xs={24} md={8}>
                                    <InfoCard>
                                        <ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                        <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                                            {task.deadline ? moment(task.deadline).format('DD/MM/YYYY HH:mm') : 'Không có hạn'}
                                        </Title>
                                        <Text type="secondary">Hạn nộp</Text>
                                    </InfoCard>
                                </Col>
                                <Col xs={24} md={8}>
                                    {task.rating !== null && task.rating !== undefined ? (
                                        <InfoCard>
                                            <Progress type="circle" percent={task.rating * 10} width={80} />
                                            <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>Đánh giá</Title>
                                            <Text type="secondary">{task.comment || 'Không có nhận xét'}</Text>
                                        </InfoCard>
                                    ) : (
                                        <InfoCard>
                                            <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                            <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>Chưa đánh giá</Title>
                                            <Text type="secondary">Đang chờ đánh giá</Text>
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
                            <Text>{task.description || 'Không có mô tả'}</Text>
                            {task.materialFile && (
                                <>
                                    <Divider orientation="left">Tài liệu đính kèm</Divider>
                                    <a href={task.materialFile} target="_blank" rel="noopener noreferrer">
                                        <FileOutlined /> {task.materialFile.split('/').pop()}
                                    </a>
                                </>
                            )}
                        </ScrollableColumn>
                        <ScrollableColumn>
                            <Divider orientation="left">Nội dung bài làm</Divider>
                            {renderTaskContent()}
                        </ScrollableColumn>
                    </MainContent>
                </>
            )}
        </StyledModal>
    );
};

export default TaskDetailModal;
