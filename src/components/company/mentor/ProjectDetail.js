import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, List, Avatar, Spin, Button, Tabs, Typography, Modal, Space, Progress, Tooltip, Switch, Popconfirm, message, InputNumber, DatePicker } from 'antd';
import { UserOutlined, LeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'js-cookie';

const { TabPane } = Tabs;
const { Paragraph } = Typography;

const ProjectDetail = ({ project: initialProject, loading, onBack, isMobile, showBackButton, fetchProject }) => {
  const [project, setProject] = useState(initialProject);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isApplicantModalVisible, setIsApplicantModalVisible] = useState(false);
  const [recruitingModalVisible, setRecruitingModalVisible] = useState(false);
  const [applicationEnd, setApplicationEnd] = useState(null);
  const [maxApplicants, setMaxApplicants] = useState(0);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

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

  const handleApplicantAction = (applicant, action) => {
    // Xử lý logic chấp nhận hoặc từ chối ứng viên
    console.log(`${action} ứng viên:`, applicant);
    setIsApplicantModalVisible(false);
  };

  const handleToggleRecruiting = async () => {
    if (!project.isRecruiting) {
      // Mở modal để chọn ngày kết thúc tuyển dụng và số ứng viên tối đa
      setMaxApplicants(project.maxApplicants || 0);
      setRecruitingModalVisible(true);
      return;
    }

    setIsToggling(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.patch(`http://localhost:5000/api/company/projects/${project.id}/stop-recruiting`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response && response.data) {
        setProject(prevProject => ({
          ...prevProject,
          isRecruiting: response.data.isRecruiting
        }));
        message.success(response.data.message);
      }
    } catch (error) {
      console.error('Lỗi khi tắt trạng thái tuyển dụng:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể tắt trạng thái tuyển dụng');
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleStartRecruiting = async () => {
    if (!applicationEnd) {
      message.error('Vui lòng chọn ngày kết thúc tuyển dụng');
      return;
    }

    setIsToggling(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axios.patch(`http://localhost:5000/api/company/projects/${project.id}/start-recruiting`, {
        maxApplicants,
        applicationEnd: applicationEnd.format('YYYY-MM-DD')
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response && response.data) {
        setProject(prevProject => ({
          ...prevProject,
          isRecruiting: response.data.isRecruiting,
          maxApplicants: maxApplicants,
          applicationEnd: applicationEnd.format('YYYY-MM-DD')
        }));
        message.success(response.data.message);
      }
      setRecruitingModalVisible(false);
    } catch (error) {
      console.error('Lỗi khi bật trạng thái tuyển dụng:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể bật trạng thái tuyển dụng');
      }
    } finally {
      setIsToggling(false);
    }
  };

  const renderProjectInfo = () => (
    <Descriptions column={1} bordered>
      <Descriptions.Item label="Tên dự án">{project.title}</Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <Tag color={project.status === 'Open' ? 'green' : 'red'}>
          {project.status}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Đang tuyển">
        {project.isRecruiting ? (
          <Popconfirm
            title="Đơn ứng tuyển sẽ bị xóa. Bạn có chắc chắn muốn tắt trạng thái tuyển dụng?"
            onConfirm={handleToggleRecruiting}
            okText="Có"
            cancelText="Không"
            disabled={isToggling}
          >
            <Switch
              checked={project.isRecruiting}
              loading={isToggling}
            />
          </Popconfirm>
        ) : (
          <Switch
            checked={project.isRecruiting}
            loading={isToggling}
            onChange={handleToggleRecruiting}
          />
        )}
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
      <Descriptions.Item label="Thành viên dự án">
        <Avatar.Group
          maxCount={5}
          size="large"
          maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}
        >
          {project.members?.map((member) => (
            <Tooltip key={member.id} title={member.name}>
              <Avatar src={member.avatar} icon={<UserOutlined />} />
            </Tooltip>
          ))}
        </Avatar.Group>
      </Descriptions.Item>
      <Descriptions.Item label="Sinh viên chờ duyệt">
        <Button onClick={() => setIsApplicantModalVisible(true)}>
          Xem danh sách ({project.applicants?.length || 0})
        </Button>
      </Descriptions.Item>
      <Descriptions.Item label="Mô tả">
        {project.description && project.description.length > 300 ? (
          <>
            <Paragraph
              ellipsis={
                isDescriptionExpanded ? false : { rows: 3, expandable: true, symbol: 'Xem thêm' }
              }
            >
              {project.description}
            </Paragraph>
            <Button type="link" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              {isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
            </Button>
          </>
        ) : (
          <Paragraph>{project.description}</Paragraph>
        )}
      </Descriptions.Item>
    </Descriptions>
  );

  const renderMemberManagement = () => (
    <Card title="Quản lý thành viên">
      <List
        itemLayout="horizontal"
        dataSource={project.members || []}
        renderItem={(member) => (
          <List.Item
            actions={[
              <Button key="assign" onClick={() => console.log('Giao task cho', member.name)}>
                Giao task
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={member.avatar} icon={<UserOutlined />} />}
              title={member.name}
              description={member.role || 'Thành viên'}
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const renderTaskProgress = () => (
    <Card title="Tiến độ công việc">
      <List
        itemLayout="horizontal"
        dataSource={project.tasks || []}
        renderItem={(task) => (
          <List.Item
            actions={[
              <Button
                key="complete"
                type={task.completed ? 'primary' : 'default'}
                onClick={() => console.log('Đánh dấu hoàn thành:', task.title)}
              >
                {task.completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
              </Button>
            ]}
          >
            <List.Item.Meta
              title={task.title}
              description={task.description}
            />
            <Progress percent={task.progress} status={task.completed ? 'success' : 'active'} />
          </List.Item>
        )}
      />
    </Card>
  );

  return (
    <div>
      {showBackButton && (
        <Button
          icon={<LeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: 16 }}
        >
          Quay lại danh sách
        </Button>
      )}
      <Card title={project.title}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Thông tin dự án" key="1">
            {renderProjectInfo()}
          </TabPane>
          <TabPane tab="Quản lý thành viên" key="2">
            {renderMemberManagement()}
          </TabPane>
          <TabPane tab="Tiến độ công việc" key="3">
            {renderTaskProgress()}
          </TabPane>
        </Tabs>
      </Card>
      <Modal
        title="Danh sách sinh viên chờ duyệt"
        visible={isApplicantModalVisible}
        onCancel={() => setIsApplicantModalVisible(false)}
        footer={null}
      >
        <List
          itemLayout="horizontal"
          dataSource={project.applicants || []}
          renderItem={(applicant) => (
            <List.Item
              actions={[
                <Button
                  key="accept"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApplicantAction(applicant, 'accept')}
                >
                  Chấp nhận
                </Button>,
                <Button
                  key="reject"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleApplicantAction(applicant, 'reject')}
                >
                  Từ chối
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={applicant.avatar} icon={<UserOutlined />} />}
                title={applicant.name}
                description={applicant.email}
              />
            </List.Item>
          )}
        />
      </Modal>
      <Modal
        title="Bắt đầu tuyển dụng"
        visible={recruitingModalVisible}
        onOk={handleStartRecruiting}
        onCancel={() => setRecruitingModalVisible(false)}
        confirmLoading={isToggling}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker
            style={{ width: '100%' }}
            placeholder="Chọn ngày kết thúc tuyển dụng"
            onChange={(date) => setApplicationEnd(date)}
          />
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            placeholder="Số lượng ứng viên tối đa"
            value={maxApplicants}
            onChange={(value) => setMaxApplicants(value)}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default ProjectDetail;