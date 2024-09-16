import React from 'react';
import { Tabs, Form, Input, Button, Switch, Upload } from 'antd';
import { Row, Col, Container } from 'react-bootstrap';
import { UploadOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const Settings = () => {
  const onFinish = (values) => {
    console.log('Success:', values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Container className="settings-container">
      <Row>
        <Col md={8} className="m-auto">
          <Tabs tabPosition="left" defaultActiveKey="1">
            <TabPane tab="Giao diện" key="1">
              <Form
                name="giao_dien"
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
              >
                <Form.Item
                  label="Màu chủ đạo"
                  name="primary_color"
                  rules={[{ required: true, message: 'Vui lòng chọn màu chủ đạo!' }]}
                >
                  <Input type="color" style={{ width: 40 }} />
                </Form.Item>

                <Form.Item
                  label="Phông chữ"
                  name="font_family"
                  rules={[{ required: true, message: 'Vui lòng nhập phông chữ!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Cỡ chữ"
                  name="font_size"
                  rules={[{ required: true, message: 'Vui lòng nhập cỡ chữ!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
            <TabPane tab="Tài khoản" key="2">
              <Form
                name="tai_khoan"
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
              >
                <Form.Item
                  label="Tên người dùng"
                  name="username"
                  rules={[{ required: true, message: 'Vui lòng nhập tên người dùng!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
                >
                  <Input type="email" />
                </Form.Item>

                <Form.Item
                  label="Mật khẩu mới"
                  name="password"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item
                  label="Logo"
                  name="logo"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
                >
                  <Upload name="logo" listType="picture" maxCount={1} beforeUpload={() => false}>
                    <Button icon={<UploadOutlined />}>Tải lên logo</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  label="Ảnh nền"
                  name="background"
                  valuePropName="fileList"
                  getValueFromEvent={(e) => Array.isArray(e) ? e : e && e.fileList}
                >
                  <Upload name="background" listType="picture" maxCount={1} beforeUpload={() => false}>
                    <Button icon={<UploadOutlined />}>Tải lên ảnh nền</Button>
                  </Upload>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
            <TabPane tab="Cài đặt khác" key="3">
              <Form
                name="cai_dat_khac"
                layout="vertical"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
              >
                <Form.Item
                  label="Nhận thông báo"
                  name="notifications"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  label="Ngôn ngữ"
                  name="language"
                  rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ!' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Lưu thay đổi
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
