import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin, Tabs, Space, Typography, Divider, Alert, Modal, Row, Col } from 'antd';
import { SaveOutlined, LinkOutlined, InfoCircleOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import { useSchool } from '../../context/SchoolContext';

const { TabPane } = Tabs;
const { Title, Paragraph, Text } = Typography;

const ApiConfig = () => {
    const { api } = useSchool();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [apiConfig, setApiConfig] = useState(null);
    const [testStudentId, setTestStudentId] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [passwordPreviewVisible, setPasswordPreviewVisible] = useState(false);
    const [passwordPreview, setPasswordPreview] = useState('');

    useEffect(() => {
        fetchApiConfig();
    }, []);

    const fetchApiConfig = async () => {
        setLoading(true);
        try {
            const response = await api.get('/school/student-api-config');
            const config = response.data;
            setApiConfig(config);
            form.setFieldsValue({
                uri: config.studentApiConfig.uri,
                fieldMappings: config.studentApiConfig.fieldMappings || {},
                passwordRule: config.studentApiConfig.passwordRule
            });
        } catch (error) {
            handleApiError(error, 'Lỗi khi tải cấu hình API');
        } finally {
            setLoading(false);
        }
    };

    const checkApiConnection = async () => {
        setLoading(true);
        try {
            const uri = form.getFieldValue('uri');
            const response = await api.post('/school/check-student-api-connection', {
                uri,
                id: testStudentId
            });
            setTestResult(response.data.data);
            message.success(response.data.message);
        } catch (error) {
            setTestResult(null);
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Lỗi khi kiểm tra kết nối API');
            }
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const configToSave = {
                studentApiConfig: {
                    uri: values.uri,
                    fieldMappings: values.fieldMappings,
                    passwordRule: values.passwordRule
                }
            };
            const response = await api.put('/school/student-api-config', configToSave);
            message.success(response.data.message || 'Cập nhật cấu hình API thành công');
            setApiConfig(configToSave);
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Lỗi khi cập nhật cấu hình API');
            }
        } finally {
            setLoading(false);
        }
    };

    const reviewPasswordRule = async () => {
        try {
            const values = await form.validateFields(['passwordRule']);
            const response = await api.post('/school/review-password-rule', {
                passwordRule: values.passwordRule,
                dateOfBirth: '1995-01-01' // Ví dụ ngày sinh
            });
            setPasswordPreview(response.data.password);
            setPasswordPreviewVisible(true);
        } catch (error) {
            handleApiError(error, 'Lỗi khi kiểm tra quy tắc mật khẩu');
        }
    };

    const handleApiError = (error, defaultMessage) => {
        if (error.response && error.response.data && error.response.data.message) {
            message.error(error.response.data.message);
        } else {
            message.error(defaultMessage);
        }
    };

    if (loading && !apiConfig) {
        return <Spin size="large" />;
    }

    return (
        <Card>
            <Tabs defaultActiveKey="1">
                <TabPane tab={<span><InfoCircleOutlined />Cấu hình API</span>} key="1">
                    <Title level={3}>Cấu hình API Sinh viên</Title>
                    <Paragraph>
                        Cấu hình kết nối API với hệ thống quản lý sinh viên của trường bạn.
                    </Paragraph>
                    <Alert
                        message="Lưu ý: API phải hỗ trợ truy vấn thông tin sinh viên bằng mã số sinh viên."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={apiConfig?.studentApiConfig}
                    >
                        <Form.Item
                            name="uri"
                            label="URI API"
                        >
                            <Input prefix={<LinkOutlined />} placeholder="https://api.yourschool.edu/v1/students" />
                        </Form.Item>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Nhập mã số sinh viên để kiểm tra"
                                    value={testStudentId}
                                    onChange={(e) => setTestStudentId(e.target.value)}
                                    style={{ width: 250 }}
                                />
                                <Button icon={<LinkOutlined />} onClick={checkApiConnection} loading={loading}>
                                    Kiểm tra kết nối
                                </Button>
                            </Space>
                            {testResult && (
                                <Alert
                                    message="Kết quả kiểm tra"
                                    description={<pre>{JSON.stringify(testResult, null, 2)}</pre>}
                                    type="success"
                                    showIcon
                                />
                            )}
                        </Space>
                        <Divider orientation="left">Ánh xạ trường</Divider>
                        <Form.Item noStyle>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name={['fieldMappings', 'studentId']}
                                        label="ID Sinh viên"
                                    >
                                        <Input placeholder="Ví dụ: student_id" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name={['fieldMappings', 'name']}
                                        label="Tên"
                                    >
                                        <Input placeholder="Ví dụ: name" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name={['fieldMappings', 'major']}
                                        label="Chuyên ngành"
                                    >
                                        <Input placeholder="Ví dụ: major" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name={['fieldMappings', 'email']}
                                        label="Email"
                                    >
                                        <Input placeholder="Ví dụ: email" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name={['fieldMappings', 'dateOfBirth']}
                                        label="Ngày sinh"
                                    >
                                        <Input placeholder="Ví dụ: date_of_birth" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form.Item>
                        <Divider orientation="left">Quy tắc mật khẩu</Divider>
                        <Form.Item
                            name={['passwordRule', 'template']}
                            label="Mẫu mật khẩu"
                        >
                            <Input.TextArea placeholder="Ví dụ: SV${ngaysinh}" />
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
                                    Lưu cấu hình
                                </Button>
                                <Button icon={<EyeOutlined />} onClick={reviewPasswordRule}>
                                    Xem mẫu mật khẩu
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </TabPane>
                <TabPane tab={<span><InfoCircleOutlined />Hướng dẫn</span>} key="2">
                    <Title level={3}>Hướng dẫn sử dụng</Title>
                    <Paragraph>
                        <Text strong>1. URI API:</Text> Nhập địa chỉ API của hệ thống quản lý sinh viên của trường.
                    </Paragraph>
                    <Paragraph>
                        <Text strong>2. Ánh xạ trường:</Text> Điền tên trường tương ứng trong API của bạn cho mỗi loại thông tin.
                    </Paragraph>
                    <Paragraph>
                        <Text strong>3. Quy tắc mật khẩu:</Text> Nhập mẫu để tạo mật khẩu cho sinh viên. Sử dụng ${'{ngaysinh}'} để chèn ngày sinh của sinh viên.
                    </Paragraph>
                    <Paragraph>
                        <Text strong>4. Kiểm tra kết nối:</Text> Nhấn nút "Kiểm tra kết nối" để xác nhận cấu hình API hoạt động chính xác.
                    </Paragraph>
                </TabPane>
            </Tabs>
            <Modal
                title="Xem trước mật khẩu"
                visible={passwordPreviewVisible}
                onOk={() => setPasswordPreviewVisible(false)}
                onCancel={() => setPasswordPreviewVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setPasswordPreviewVisible(false)}>
                        Đóng
                    </Button>
                ]}
            >
                <p>Mật khẩu mẫu được tạo theo quy tắc của bạn:</p>
                <Text strong>{passwordPreview}</Text>
            </Modal>
        </Card>
    );
};

export default ApiConfig;
