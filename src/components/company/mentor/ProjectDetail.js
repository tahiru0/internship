import React, { memo, useState, useEffect } from 'react';
import { Card, Button, Descriptions, Tag, Switch, Divider, Table, Spin, Avatar, Tooltip, Modal, DatePicker, InputNumber, message, Menu, Dropdown } from 'antd';
import { PlusOutlined, UserOutlined, MoreOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'js-cookie';

const ProjectDetail = memo(({ project, loading, onBack, isMobile, handleAddTask, fetchProjects, taskColumns }) => {
  const [applicationEnd, setApplicationEnd] = useState(null);
  const [maxApplicants, setMaxApplicants] = useState(0);
  const [isRecruiting, setIsRecruiting] = useState(project?.isRecruiting || false);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        const response = await axios.get('http://localhost:5000/api/mentor/search/tasks', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { project: project.id } // Sử dụng project ID từ params
        });
        setTasks(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách task:', error);
        message.error('Không thể lấy danh sách task');
      }
    };

    if (project && project.id) {
      fetchTasks();
    }
  }, [project]);

  const renderMembers = (members) => {
    const maxDisplay = 3;
    return (
      <Avatar.Group
        maxCount={maxDisplay}
        maxStyle={{
          color: '#f56a00',
          backgroundColor: '#fde3cf',
        }}
      >
        {members.map((member) => (
          <Tooltip title={member.name} key={member._id}>
            <Avatar src={member.avatar} icon={<UserOutlined />} />
          </Tooltip>
        ))}
      </Avatar.Group>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'orange';
      case 'In Progress':
        return 'blue';
      case 'Completed':
        return 'green';
      default:
        return 'default';
    }
  };

  const taskMenu = (
    <Menu>
      <Menu.Item key="1">Chỉnh sửa</Menu.Item>
      <Menu.Item key="2">Xóa</Menu.Item>
    </Menu>
  );

  const updatedTaskColumns = [
    {
      title: 'Tên task',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Người được giao',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => renderMembers([assignedTo]),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: () => (
        <Dropdown overlay={taskMenu} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const handleToggleRecruiting = async () => {
    if (!project || !project.id) {
      message.error('Không thể thực hiện thao tác này. Thông tin dự án không hợp lệ.');
      return;
    }

    try {
      const accessToken = Cookies.get('accessToken');
      if (!accessToken) {
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (isRecruiting) {
        // Tắt trạng thái tuyển dụng
        const response = await axios.patch(`http://localhost:5000/api/company/projects/${project.id}/stop-recruiting`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        message.success(response.data.message);
        setIsRecruiting(false);
      } else {
        // Mở modal để chọn ngày kết thúc tuyển dụng và số ứng viên tối đa
        Modal.confirm({
          title: 'Bật trạng thái tuyển dụng',
          content: (
            <div>
              <DatePicker
                style={{ width: '100%', marginBottom: 16 }}
                placeholder="Chọn ngày kết thúc tuyển dụng"
                onChange={(date) => setApplicationEnd(date)}
              />
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                placeholder="Số lượng ứng viên tối đa"
                onChange={(value) => setMaxApplicants(value)}
              />
            </div>
          ),
          onOk: async () => {
            if (!applicationEnd) {
              message.error('Vui lòng chọn ngày kết thúc tuyển dụng');
              return;
            }
            const response = await axios.patch(`http://localhost:5000/api/company/projects/${project.id}/start-recruiting`, {
              applicationEnd: applicationEnd.format('YYYY-MM-DD'),
              maxApplicants
            }, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            message.success(response.data.message);
            setIsRecruiting(true);
            setApplicationEnd(null);
            setMaxApplicants(0);
          },
        });
      }
      if (typeof fetchProjects === 'function') {
        fetchProjects();
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái tuyển dụng:', error);
      message.error('Không thể thay đổi trạng thái tuyển dụng: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (!project) {
    return <div>Vui lòng chọn một dự án để xem chi tiết.</div>;
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{project.title}</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>
            Thêm Task
          </Button>
        </div>
      }
      extra={isMobile && <Button onClick={onBack}>Quay lại</Button>}
    >
      <Descriptions column={1}>
        <Descriptions.Item label="Trạng thái">
          <Tag color={project.status === 'Open' ? 'green' : 'red'}>{project.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">{project.description}</Descriptions.Item>
        <Descriptions.Item label="Chuyên ngành liên quan">
          {project.relatedMajors.map(major => (
            <Tag key={major.id}>{major.name}</Tag>
          ))}
        </Descriptions.Item>
        <Descriptions.Item label="Thành viên">
          {project.members.length > 0 ? renderMembers(project.members) : 'Chưa có thành viên'}
        </Descriptions.Item>
        <Descriptions.Item label="Đang tuyển dụng">
          <Switch
            checked={isRecruiting}
            onChange={handleToggleRecruiting}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Ngày bắt đầu">
          {moment(project.startDate).format('DD/MM/YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày kết thúc">
          {moment(project.endDate).format('DD/MM/YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Cập nhật mới nhất">
          {moment(project.updatedAt).fromNow()}
        </Descriptions.Item>
      </Descriptions>
      <Divider orientation="left">Danh sách Task</Divider>
      <div style={{ height: '400px', overflow: 'auto' }}>
        <Table
          columns={updatedTaskColumns}
          dataSource={tasks}
          rowKey="_id"
          pagination={false}
          scroll={{ x: true, y: 350 }}
        />
      </div>
    </Card>
  );
});

export default ProjectDetail;