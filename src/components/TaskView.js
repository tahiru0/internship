import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Typography, Tag, Space, Button, Upload, message, Modal, Form, Select } from 'antd';
import { FileOutlined, UploadOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useCompany } from '../context/CompanyContext';
import TaskDetailModal from './company/mentor/project/TaskDetailModal';

const { Title, Text } = Typography;
const { Option } = Select;

const TaskView = () => {
  const { taskId } = useParams();
  const { axiosInstance } = useCompany();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareForm] = Form.useForm();

  const fetchTask = async () => {
    try {
      const response = await axiosInstance.get(`/tasks/${taskId}`);
      setTask(response.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải thông tin task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const handleShare = async (values) => {
    try {
      await axiosInstance.post(`/tasks/${taskId}/share`, values);
      message.success('Đã chia sẻ task thành công');
      setShareModalVisible(false);
      shareForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể chia sẻ task');
    }
  };

  const handleShareSettingsChange = async (values) => {
    try {
      await axiosInstance.put(`/tasks/${taskId}/share-settings`, values);
      message.success('Đã cập nhật cài đặt chia sẻ');
      fetchTask();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật cài đặt chia sẻ');
    }
  };

  if (!task) return null;

  return (
    <>
      <TaskDetailModal 
        visible={true}
        task={task}
        loading={loading}
        onCancel={() => window.history.back()}
        getStatusColor={(status) => {
          const colors = {
            'Assigned': 'blue',
            'Submitted': 'orange',
            'Completed': 'green'
          };
          return colors[status] || 'default';
        }}
        statusMapping={{
          'Assigned': 'Đã giao',
          'Submitted': 'Đã nộp',
          'Completed': 'Hoàn thành'
        }}
      />

      {task.permissions?.canManageSharing && (
        <Modal
          title="Chia sẻ Task"
          visible={shareModalVisible}
          onCancel={() => setShareModalVisible(false)}
          footer={null}
        >
          <Form form={shareForm} onFinish={handleShare}>
            <Form.Item
              name="isPublic"
              label="Chia sẻ công khai"
            >
              <Select onChange={(value) => handleShareSettingsChange({ isPublic: value })}>
                <Option value={true}>Cho phép mọi người xem</Option>
                <Option value={false}>Chỉ người được chia sẻ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="accessType"
              label="Quyền truy cập"
            >
              <Select>
                <Option value="view">Chỉ xem</Option>
                <Option value="edit">Cho phép chỉnh sửa</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Chia sẻ
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default TaskView;
