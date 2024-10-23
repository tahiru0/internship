import React, { useState } from 'react';
import { Form, Upload, Button, Typography, Space, Tag, Tooltip, Modal, message } from 'antd';
import { UploadOutlined, ClockCircleOutlined, ProjectOutlined, FileWordOutlined, FilePdfOutlined, FileExcelOutlined, FileImageOutlined, FileOutlined, ExclamationCircleOutlined, SendOutlined, AuditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

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

const FileUploadTask = ({ task, fileList, setFileList, visible, onCancel, handleTaskSubmit }) => {
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

  const isDisabled = task.status === 'Overdue' || task.status === 'Completed';

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await handleTaskSubmit(task.id, fileList);
      message.success('Nộp bài thành công!');
      onCancel();
    } catch (error) {
      console.error('Lỗi khi nộp bài:', error);
      message.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAllowedExtensionsTag = (fileRequirements) => {
    if (fileRequirements && fileRequirements.allowedExtensions) {
      return (
        <Tag icon={<FileOutlined />} color="purple">
          Định dạng cho phép: {fileRequirements.allowedExtensions.join(', ')}
        </Tag>
      );
    }
    return null;
  };

  const getMaxSizeTag = (fileRequirements) => {
    if (fileRequirements && fileRequirements.maxSize) {
      return (
        <Tag icon={<FileOutlined />} color="geekblue">
          Kích thước tối đa: {fileRequirements.maxSize}MB
        </Tag>
      );
    }
    return null;
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

  const renderStudentFile = () => {
    if (task.studentFile) {
      return (
        <div style={{ marginTop: '12px' }}>
          <Text strong>File đã nộp: </Text>
          <a href={task.studentFile} target="_blank" rel="noopener noreferrer">
            <FileIcon>{getFileIcon(getFileName(task.studentFile))}</FileIcon>
            {getFileName(task.studentFile)}
          </a>
        </div>
      );
    }
    return null;
  };

  return (
    <Modal
      title="Nhiệm vụ tải lên file"
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        task.status === 'Assigned' && (
          <Button key="submit" type="primary" onClick={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
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
          {getAllowedExtensionsTag(task.fileRequirements)}
          {getMaxSizeTag(task.fileRequirements)}
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
        <Form.Item label="Tải lên file">
          <Upload
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            beforeUpload={(file) => {
              const isAllowedExtension = task.fileRequirements?.allowedExtensions?.some(ext => 
                file.name.toLowerCase().endsWith(ext.toLowerCase())
              );
              const isSizeAllowed = file.size / 1024 / 1024 < (task.fileRequirements?.maxSize || Infinity);
              if (!isAllowedExtension) {
                message.error(`${file.name} không phải là định dạng file được cho phép!`);
              }
              if (!isSizeAllowed) {
                message.error(`${file.name} vượt quá kích thước tối đa cho phép!`);
              }
              return isAllowedExtension && isSizeAllowed;
            }}
            disabled={isSubmitting}
          >
            <Button icon={<UploadOutlined />} disabled={isSubmitting}>Chọn file</Button>
          </Upload>
        </Form.Item>
      ) : renderStudentFile()}
      {task.status === 'Evaluated' && (
        <div>
          <Title level={5}>Đánh giá:</Title>
          <Text>Điểm: {task.rating}/10</Text>
          <Text>Nhận xét: {task.comment}</Text>
        </div>
      )}
    </Modal>
  );
};

export default FileUploadTask;
