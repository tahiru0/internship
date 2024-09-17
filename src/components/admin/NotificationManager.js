import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Badge,
  Descriptions,
  Typography,
  Tabs,
} from "antd";
import { Container, Row, Col } from "react-bootstrap";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MailOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { faker } from "@faker-js/faker"; 
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const generateFakeNotifications = (num = 10) => {
    return Array.from({ length: num }).map((_, index) => ({
      id: index + 1,
      message: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(["đang chờ", "chấp nhận", "từ chối"]),
      user: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
      },
      createdAt: faker.date.recent({ days: 30 }), // Tạo ngày trong vòng 30 ngày gần đây
    }));
  };

const { Title } = Typography;
const { TabPane } = Tabs;

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailContent, setEmailContent] = useState("");

  useEffect(() => {
    // Use mock data instead of fetching from API
    setNotifications(generateFakeNotifications(10)); // Generate 10 fake notifications
  }, []);

  const approveRequest = (record) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === record.id
        ? { ...notification, status: "chấp nhận" }
        : notification
    );
    setNotifications(updatedNotifications);
    message.success("Yêu cầu tài khoản được chấp nhận");
  };

  const rejectRequest = (record) => {
    const updatedNotifications = notifications.map((notification) =>
      notification.id === record.id
        ? { ...notification, status: "từ chối" }
        : notification
    );
    setNotifications(updatedNotifications);
    message.success("Yêu cầu tài khoản bị từ chối");
  };

  const sendEmail = () => {
    message.success("Email đã được gửi thành công");
    setEmailModalVisible(false);
  };

  const columns = [
    {
      title: "Notification",
      dataIndex: "message",
      key: "message",
    },
    {
        title: "Thời gian",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (createdAt) => formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: vi }),
        sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge
          status={
            status === "đang chờ"
              ? "warning"
              : status === "từ chối"
              ? "error"
              : "success"
          }
          text={status}
        />
      ),
      sorter: (a, b) => {
        // Prioritize "đang chờ" status
        const statusOrder = { "đang chờ": 1, "chấp nhận": 2, "từ chối": 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      },
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <span>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => approveRequest(record)}
            disabled={record.status !== "đang chờ"}
            style={{ marginRight: 8 }}
          >
            Chấp thuận
          </Button>
          <Button
            type="button"
            icon={<CloseCircleOutlined />}
            className="btn btn-danger"
            onClick={() => rejectRequest(record)}
            disabled={record.status !== "đang chờ"}
            style={{ marginRight: 8 }}
          >
            Từ chối
          </Button>

          <Button
            icon={<InfoCircleOutlined />}
            onClick={() => {
              setSelectedNotification(record);
              setIsModalVisible(true);
            }}
            style={{ marginRight: 8 }}
          >
            Chi tiết
          </Button>
          <Button
            icon={<MailOutlined />}
            onClick={() => {
              setSelectedNotification(record);
              setEmailModalVisible(true);
            }}
          >
            Gửi email
          </Button>
        </span>
      ),
    },
  ];

  // Calculate the number of pending notifications
  const pendingNotificationsCount = notifications.filter(
    (notification) => notification.status === "đang chờ"
  ).length;

  return (
    <Container fluid>
      <Row className="justify-content-md-center">
        <Col>
          <Title level={3} className="text-center mt-4">
            Quản lý thông báo
          </Title>
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <Badge count={pendingNotificationsCount} offset={[10, 0]}>
                    Yêu cầu kích hoạt tài khoản
                  </Badge>
                </span>
              }
              key="1"
            >
              <Table
                columns={columns}
                dataSource={notifications}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: "max-content" }}
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <Badge count={0} offset={[10, 0]}>
                    Tab khác
                  </Badge>
                </span>
              }
              key="2"
            >
              {/* Content for another tab */}
              <p>This is another tab.</p>
            </TabPane>
          </Tabs>
        </Col>
      </Row>

      {/* Details Modal */}
      <Modal
        title="Chi tiết thông báo"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedNotification && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Message">
              {selectedNotification.message}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge
                status={
                  selectedNotification.status === "đang chờ"
                    ? "warning"
                    : "success"
                }
                text={selectedNotification.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Thông tin người dùng">
              <p>Name: {selectedNotification.user.name}</p>
              <p>Email: {selectedNotification.user.email}</p>
              <p>Phone: {selectedNotification.user.phone}</p>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal
        title="Gửi email"
        visible={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        onOk={sendEmail}
      >
        <Form layout="vertical">
          <Form.Item label="Nội dung email">
            <Input.TextArea
              rows={4}
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
};

export default NotificationManager;
