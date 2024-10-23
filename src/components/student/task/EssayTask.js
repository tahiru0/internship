import React from 'react';
import { Form, Input, Typography, Space, Tag, Tooltip, Modal, Button } from 'antd';
import { ClockCircleOutlined, ProjectOutlined, FileWordOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, FileOutlined, ExclamationCircleOutlined, SendOutlined, AuditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const { TextArea } = Input;
const { Title, Text } = Typography;

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

const EssayTask = ({ task, taskAnswer, setTaskAnswer, visible, onCancel, handleTaskSubmit }) => {
    const getVietnameseStatus = (status) => {
        switch (status) {
            case 'Assigned': return 'Đã giao';
            case 'Submitted': return 'Đã nộp';
            case 'Evaluated': return 'Đã đánh giá';
            case 'Overdue': return 'Quá hạn';
            case 'Completed': return 'Hoàn thành';
            default: return status;
        }
    };

    const isDisabled = task.status === 'Overdue' || task.status === 'Completed';

    const onSubmit = () => {
        if (!taskAnswer.trim()) {
            Modal.confirm({
                title: 'Xác nhận nộp bài',
                content: 'Bạn chưa nhập câu trả lời. Bạn có chắc chắn muốn nộp bài không?',
                onOk: handleTaskSubmit,
            });
        } else {
            handleTaskSubmit();
        }
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

    return (
        <Modal
            title="Nhiệm vụ viết luận"
            visible={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Đóng
                </Button>,
                task.status === 'Assigned' && (
                    <Button key="submit" type="primary" onClick={onSubmit}>
                        Nộp bài
                    </Button>
                ),
            ]}
            width={800}
        >
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
                        <a href={task.materialFile} target="_blank" rel="noopener noreferrer">
                            <FileIcon>{getFileIcon(getFileName(task.materialFile))}</FileIcon>
                            Tài liệu: {getFileName(task.materialFile)}
                        </a>
                    </div>
                )}
            </TaskInfoContainer>
            {task.status === 'Assigned' ? (
                <Form.Item label="Câu trả lời của bạn">
                    <TextArea
                        rows={6}
                        value={taskAnswer}
                        onChange={(e) => setTaskAnswer(e.target.value)}
                        placeholder="Nhập câu trả lời của bạn"
                        disabled={isDisabled}
                    />
                </Form.Item>
            ) : (
                <Form.Item label="Câu trả lời của bạn">
                    <Text>{task.studentAnswer || 'Chưa có câu trả lời'}</Text>
                </Form.Item>
            )}
        </Modal>
    );
};

export default EssayTask;
