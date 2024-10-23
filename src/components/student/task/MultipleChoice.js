import React, { useRef } from 'react';
import { Form, Radio, Space, Typography, Card, Button, Row, Col, Tag, Tooltip, Modal, Avatar, Rate } from 'antd';
import styled from 'styled-components';
import { CloseCircleOutlined, ClockCircleOutlined, ProjectOutlined, DownloadOutlined, FileWordOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, FileOutlined, ExclamationCircleOutlined, SendOutlined, AuditOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { Title, Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const QuestionTitle = styled(Title)`
  margin-bottom: 16px !important;
`;

const OptionText = styled(Text)`
  font-size: 16px;
`;

const DeleteButton = styled(Button)`
  margin-left: 8px;
`;

const QuestionContainer = styled.div`
  position: relative;
  padding-bottom: 40px;
`;

const DeleteButtonContainer = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
`;

const QuestionMapContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
  position: sticky;
  top: 20px;
`;

const QuestionMapItem = styled.div`
  background-color: ${props => {
        if (props.status === 'Assigned') {
            return props.isAnswered ? '#1890ff' : '#f0f0f0';
        } else {
            return props.isCorrect ? '#f6ffed' : '#fff1f0';
        }
    }};
  color: ${props => props.status === 'Assigned' && props.isAnswered ? 'white' : 'black'};
  padding: 8px;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid ${props => {
        if (props.status === 'Assigned') {
            return props.isAnswered ? '#1890ff' : '#d9d9d9';
        } else {
            return props.isCorrect ? '#b7eb8f' : '#ffa39e';
        }
    }};
`;

const LeftColumn = styled(Col)`
  position: sticky;
  top: 20px;
  height: fit-content;
  display: flex;
  flex-direction: column;
`;

const NonSelectableContainer = styled.div`
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const preventRightClick = (e) => {
  e.preventDefault();
};

const TaskInfoContainer = styled.div`
  margin-bottom: 24px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
`;

const FileIcon = styled.span`
  margin-right: 4px;
`;

const OptionRadio = styled(Radio)`
  .ant-radio-wrapper {
    padding: 8px;
    border-radius: 4px;
    width: 100%;
    margin-bottom: 8px;
  }
`;

const OptionContainer = styled.div`
  padding: 3px;
  border-radius: 4px;
  width: 100%;
  margin-bottom: 4px;
  ${props => props.isCorrectAnswer && props.isCorrect && `
    background-color: #e6ffe6;
    border: 1px solid #4caf50;
  `}
  ${props => props.isCorrectAnswer && !props.isCorrect && `
    background-color: #ffe6e6;
    border: 1px solid #ff4d4d;
  `}
`;

const EvaluationCard = styled(Card)`
  margin-top: 16px;
  background-color: #f0f5ff;
  border: 1px solid #d6e4ff;
`;

const MultipleChoice = ({ task, selectedOptions, setSelectedOptions, handleTaskSubmit, visible, onCancel }) => {
    const questionRefs = useRef([]);

    const handleOptionChange = (questionIndex, optionIndex) => {
        if (task.status === 'Assigned') {
            const newSelectedOptions = [...selectedOptions];
            newSelectedOptions[questionIndex] = optionIndex;
            setSelectedOptions(newSelectedOptions);
        }
    };

    const handleDeleteAnswer = (questionIndex) => {
        const newSelectedOptions = [...selectedOptions];
        newSelectedOptions[questionIndex] = null;
        setSelectedOptions(newSelectedOptions);
    };

    const getOptionLabel = (index) => {
        return String.fromCharCode(65 + index);
    };

    const scrollToQuestion = (index) => {
        questionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
    };

    const renderQuestionMap = () => {
        const items = [];
        for (let i = 0; i < task.questions.length; i++) {
            const isAnswered = task.status === 'Assigned'
                ? selectedOptions[i] !== null && selectedOptions[i] !== undefined
                : task.studentAnswer[i] !== null && task.studentAnswer[i] !== undefined;
            const isCorrect = task.status !== 'Assigned' && task.studentAnswer[i] === task.questions[i].correctAnswer;

            items.push(
                <QuestionMapItem
                    key={i}
                    isAnswered={isAnswered}
                    isCorrect={isCorrect}
                    status={task.status}
                    onClick={() => scrollToQuestion(i)}
                >
                    {i + 1}
                </QuestionMapItem>
            );
        }
        return <QuestionMapContainer>{items}</QuestionMapContainer>;
    };

    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        switch (extension) {
            case 'doc':
            case 'docx':
                return <FileWordOutlined />;
            case 'pdf':
                return <FilePdfOutlined />;
            case 'xls':
            case 'xlsx':
                return <FileExcelOutlined />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <FileImageOutlined />;
            default:
                return <FileOutlined />;
        }
    };

    const getFileName = (url) => {
        return url.split('/').pop();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Assigned': return 'blue';
            case 'Submitted': return 'cyan';
            case 'Evaluated': return 'green';
            case 'Overdue': return 'red';
            case 'Completed': return 'green';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Assigned': return <ExclamationCircleOutlined />;
            case 'Submitted': return <SendOutlined />;
            case 'Evaluated': return <AuditOutlined />;
            case 'Overdue': return <ClockCircleOutlined />;
            case 'Completed': return <CheckCircleOutlined />;
            default: return null;
        }
    };

    const getTimeRemaining = (deadline) => {
        const now = moment();
        const deadlineDate = moment(deadline);
        const duration = moment.duration(deadlineDate.diff(now));

        if (duration.asMonths() >= 1) {
            return `${Math.floor(duration.asMonths())} tháng`;
        } else if (duration.asDays() >= 1) {
            return `${Math.floor(duration.asDays())} ngày`;
        } else if (duration.asHours() >= 1) {
            return `${Math.floor(duration.asHours())} giờ`;
        } else if (duration.asMinutes() >= 1) {
            return `${Math.floor(duration.asMinutes())} phút`;
        } else {
            return 'Hết hạn';
        }
    };

    const getDeadlineTooltip = (deadline) => {
        return moment(deadline).format('DD/MM/YYYY HH:mm');
    };
    const getVietnameseStatus = (status) => {
        switch (status) {
            case 'Assigned': return 'Đã giao';
            case 'Submitted': return 'Đã nộp';
            case 'Evaluated': return 'Đã đánh giá';
            case 'Overdue': return 'Quá hạn';
            case 'Completed': return 'Đã hoàn thành';
            default: return status;
        }
    };

    const getDeadlineColor = (deadline) => {
        const now = moment();
        const deadlineDate = moment(deadline);
        const duration = moment.duration(deadlineDate.diff(now));

        if (duration.asHours() <= 0) {
            return 'red';
        } else if (duration.asHours() <= 24) {
            return 'orange';
        } else if (duration.asDays() <= 3) {
            return 'yellow';
        } else {
            return 'green';
        }
    };

    const isCorrectAnswer = (questionIndex, optionIndex) => {
        return task.questions[questionIndex].correctAnswer === optionIndex;
    };

    const isStudentAnswerCorrect = (questionIndex) => {
        return task.status !== 'Assigned' && task.studentAnswer[questionIndex] === task.questions[questionIndex].correctAnswer;
    };

    const renderEvaluation = () => {
        if (task.status !== 'Evaluated') return null;

        return (
            <EvaluationCard>
                <Space direction="vertical">
                    <Text strong>Đánh giá:</Text>
                    <Text>Điểm: {task.rating}/10</Text>
                    <Text>Nhận xét: {task.comment}</Text>
                </Space>
            </EvaluationCard>
        );
    };

    return (
        <Modal
            title="Nhiệm vụ trắc nghiệm"
            visible={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Đóng
                </Button>,
                task.status === 'Assigned' && (
                    <Button key="submit" type="primary" onClick={handleTaskSubmit}>
                        Nộp bài
                    </Button>
                ),
            ]}
            width={1000}
        >
            <NonSelectableContainer onContextMenu={preventRightClick}>
                <TaskInfoContainer>
                    <Title level={3}>{task.name}</Title>
                    <TagsContainer>
                        <Tag icon={<ProjectOutlined />} color="blue">{task.project.title}</Tag>
                        <Tooltip title={getDeadlineTooltip(task.deadline)}>
                            <Tag icon={<ClockCircleOutlined />} color={getDeadlineColor(task.deadline)}>
                                Hạn chót: {getTimeRemaining(task.deadline)}
                            </Tag>
                        </Tooltip>
                        <Tag icon={getStatusIcon(task.status)} color={getStatusColor(task.status)}>
                            {getVietnameseStatus(task.status)}
                        </Tag>
                    </TagsContainer>
                    {task.description && <Text>{task.description}</Text>}
                    {task.materialFile && (
                        <div style={{ marginTop: '12px' }}>
                            <a href={task.materialFile} target="_blank">
                                <FileIcon>{getFileIcon(getFileName(task.materialFile))}</FileIcon>
                                Tài liệu: {getFileName(task.materialFile)}
                            </a>
                        </div>
                    )}
                </TaskInfoContainer>
                <Row gutter={24}>
                    <LeftColumn span={6}>
                        {renderQuestionMap()}
                        {renderEvaluation()}
                    </LeftColumn>
                    <Col span={18}>
                        <Form>
                            {task.questions.map((question, questionIndex) => (
                                <StyledCard key={questionIndex} ref={el => questionRefs.current[questionIndex] = el} id={`question-${questionIndex}`}>
                                    <QuestionContainer>
                                        <QuestionTitle level={4}>{question.question}</QuestionTitle>
                                        <Radio.Group
                                            onChange={(e) => handleOptionChange(questionIndex, e.target.value)}
                                            value={task.status !== 'Assigned' ? task.studentAnswer[questionIndex] : selectedOptions[questionIndex]}
                                            disabled={task.status !== 'Assigned'}
                                        >
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {question.options.map((option, optionIndex) => (
                                                    <OptionContainer
                                                        key={optionIndex}
                                                        isCorrectAnswer={task.status !== 'Assigned' && isCorrectAnswer(questionIndex, optionIndex)}
                                                        isCorrect={isStudentAnswerCorrect(questionIndex)}
                                                    >
                                                        <Radio value={optionIndex}>
                                                            <OptionText>{`${getOptionLabel(optionIndex)}. ${option}`}</OptionText>
                                                        </Radio>
                                                    </OptionContainer>
                                                ))}
                                            </Space>
                                        </Radio.Group>
                                        {selectedOptions[questionIndex] !== null && selectedOptions[questionIndex] !== undefined && (
                                            <DeleteButtonContainer>
                                                <DeleteButton
                                                    type="text"
                                                    danger
                                                    icon={<CloseCircleOutlined />}
                                                    onClick={() => handleDeleteAnswer(questionIndex)}
                                                    disabled={task.status === 'Overdue' || task.status === 'Completed'}
                                                >
                                                    Xóa câu trả lời
                                                </DeleteButton>
                                            </DeleteButtonContainer>
                                        )}
                                    </QuestionContainer>
                                </StyledCard>
                            ))}
                        </Form>
                    </Col>
                </Row>
            </NonSelectableContainer>
        </Modal>
    );
};

export default MultipleChoice;
