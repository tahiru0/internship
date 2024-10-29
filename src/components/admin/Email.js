import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Form, Button, ListGroup, Card, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Input, Select, Tabs, message } from 'antd';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import { FaCog, FaPaperPlane, FaRedo, FaExclamationCircle } from 'react-icons/fa';

const { Option } = Select;
const { TabPane } = Tabs;

const Email = () => {
    const { axiosInstance } = useAuthorization();
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const [subject, setSubject] = useState('');
    const [recipient, setRecipient] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [sortField, setSortField] = useState('sentAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showDeleted, setShowDeleted] = useState(false);
    const [status, setStatus] = useState('');
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [resendingEmailId, setResendingEmailId] = useState(null);
    const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
    const [emailConfig, setEmailConfig] = useState({});

    const observer = useRef();
    const lastEmailElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    useEffect(() => {
        fetchEmails();
        fetchTemplates();
        fetchEmailConfig();
    }, [sortField, sortOrder, showDeleted, searchTerm, activeTab, status]);

    useEffect(() => {
        if (page > 1) {
            fetchMoreEmails();
        }
    }, [page]);

    const fetchEmails = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/admin/emails', {
                params: {
                    page: 1,
                    search: searchTerm,
                    sort: sortField,
                    order: sortOrder,
                    showDeleted: showDeleted.toString(),
                    status
                }
            });
            if (response.data && Array.isArray(response.data.emails)) {
                setEmails(response.data.emails);
                setHasMore(response.data.emails.length === 10);
            } else {
                console.error('Unexpected API response structure:', response.data);
                setEmails([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách email:', error);
            message.error('Không thể lấy danh sách email');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMoreEmails = async () => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/admin/emails', {
                params: {
                    page,
                    search: searchTerm,
                    sort: sortField,
                    order: sortOrder,
                    showDeleted: showDeleted.toString(),
                    status
                }
            });
            if (response.data && Array.isArray(response.data.emails)) {
                setEmails(prevEmails => [...prevEmails, ...response.data.emails]);
                setHasMore(response.data.emails.length === 10);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thêm email:', error);
            message.error('Không thể lấy thêm email');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await axiosInstance.get('/admin/email-templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách mẫu email:', error);
            message.error('Không thể lấy danh sách mẫu email');
        }
    };

    const fetchEmailConfig = async () => {
        try {
            const response = await axiosInstance.get('/admin/email-config');
            setEmailConfig(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy cấu hình email:', error);
            message.error('Không thể lấy cấu hình email');
        }
    };

    const handleSend = async () => {
        const newEmail = {
            to: recipient,
            subject,
            htmlContent: editorContent,
            type: 'sent'
        };

        setIsSending(true);
        try {
            await axiosInstance.post('/admin/send-email', newEmail);
            message.success('Email đã được gửi thành công!');
            handleCompose();
            fetchEmails();
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            const errorMessage = error.response?.data?.message || 'Không thể gửi email';
            message.error(errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    const handleResend = async (email) => {
        setResendingEmailId(email._id);
        try {
            await axiosInstance.post('/admin/resend-email', { emailId: email._id });
            message.success('Email đã được gửi lại thành công!');
            fetchEmails();
        } catch (error) {
            console.error('Lỗi khi gửi lại email:', error);
            message.error('Không thể gửi lại email');
        } finally {
            setResendingEmailId(null);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosInstance.delete(`/admin/emails/${selectedEmail._id}`);
            message.success('Email đã được xóa thành công!');
            setIsDeleteModalVisible(false);
            setSelectedEmail(null);
            fetchEmails();
        } catch (error) {
            console.error('Lỗi khi xóa email:', error);
            message.error('Không thể xóa email');
        }
    };

    const handleRestore = async () => {
        try {
            await axiosInstance.post(`/admin/emails/restore/${selectedEmail._id}`);
            message.success('Email đã được khôi phục thành công!');
            fetchEmails();
        } catch (error) {
            console.error('Lỗi khi khôi phục email:', error);
            message.error('Không thể khôi phục email');
        }
    };

    const handleSort = (field) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleTabChange = (key) => {
        setActiveTab(key);
        setShowDeleted(key === '2');
        setPage(1);
        setEmails([]);
        setHasMore(true);
    };

    const handleConfigSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const values = Object.fromEntries(formData.entries());
        try {
            const response = await axiosInstance.post('/admin/email-config', values);
            setEmailConfig(response.data.config);
            message.success('Cấu hình email đã đưc cập nhật thành công');
            setIsConfigModalVisible(false);
        } catch (error) {
            console.error('Lỗi khi cập nhật cấu hình email:', error);
            message.error('Không thể cập nhật cấu hình email');
        }
    };

    const handleSendTestEmail = async () => {
        try {
            await axiosInstance.post('/admin/send-test-email', {
                to: emailConfig.emailUser,
                subject: 'Test Email',
                htmlContent: '<p>Đây là email test.</p>'
            });
            message.success('Email test đã được gửi thành công');
        } catch (error) {
            console.error('Lỗi khi gửi email test:', error);
            message.error('Không thể gửi email test');
        }
    };

    const handleCompose = () => {
        setSelectedEmail(null);
        setEditorContent('');
        setSubject('');
        setRecipient('');
        setSelectedTemplate(null);
    };

    const handleTemplateChange = (templateId) => {
        const template = templates.find(t => t._id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setSubject(template.subject);
            setEditorContent(template.htmlContent);
        }
    };

    const renderEmailList = (emailList) => {
        if (emailList.length === 0) {
            return <p>{showDeleted ? "Không có email đã xóa nào." : "Không có email nào."}</p>;
        }

        return emailList.map((email, index) => (
            <ListGroup.Item
                ref={index === emailList.length - 1 ? lastEmailElementRef : null}
                key={email._id}
                action
                onClick={() => setSelectedEmail(email)}
                active={selectedEmail && selectedEmail._id === email._id}
                className={`d-flex justify-content-between align-items-center ${email.read ? '' : 'fw-bold'}`}
                style={{
                    backgroundColor: email.status === 'failed' 
                        ? (selectedEmail && selectedEmail._id === email._id ? '#dc3545' : '#FFCCCB') 
                        : '',
                    borderLeft: email.status === 'failed' ? '5px solid red' : '',
                    color: email.status === 'failed' && selectedEmail && selectedEmail._id === email._id ? 'white' : undefined
                }}
            >
                <div>
                    <div>Đến: {email.to}</div>
                    <small>{email.subject}</small>
                </div>
                <div className="d-flex align-items-center">
                    {email.status === 'failed' && (
                        <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip id={`tooltip-${email._id}`}>Gửi lại</Tooltip>}
                        >
                            <Button 
                                variant="link"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleResend(email);
                                }}
                                size="sm"
                                style={{ marginRight: '10px', padding: 0 }}
                                disabled={resendingEmailId === email._id}
                            >
                                <FaRedo color={resendingEmailId === email._id ? 'gray' : 'blue'} />
                            </Button>
                        </OverlayTrigger>
                    )}
                    <small>{new Date(email.sentAt).toLocaleString()}</small>
                </div>
            </ListGroup.Item>
        ));
    };

    return (
        <Container fluid>
            <Row>
                <Col md={4} style={{ height: isMobileView ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                    <Form.Group className="d-flex mb-3">
                        <Button 
                            onClick={handleCompose} 
                            variant="primary" 
                            className="me-2" 
                            style={{ width: '70%' }}
                        >
                            <FaPaperPlane className="me-2" /> Soạn thư
                        </Button>
                        <Button 
                            onClick={() => setIsConfigModalVisible(true)} 
                            variant="outline-primary"  // Thay đổi variant thành outline-primary
                            style={{ width: '30%' }}
                        >
                            <FaCog /> Cài đặt
                        </Button>
                    </Form.Group>
                    <div className="mb-3">
                        <Input
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <Select
                            style={{ width: '100%' }}
                            placeholder="Lọc theo trạng thái"
                            value={status}
                            onChange={(value) => setStatus(value)}
                        >
                            <Option value="">Tất cả</Option>
                            <Option value="sent">Đã gửi</Option>
                            <Option value="failed">Gửi thất bại</Option>
                        </Select>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <Tabs defaultActiveKey="1" onChange={handleTabChange}>
                            <TabPane tab="Email đã gửi" key="1">
                                <ListGroup>
                                    {renderEmailList(emails)}
                                </ListGroup>
                            </TabPane>
                            <TabPane tab="Email đã xóa" key="2">
                                <ListGroup>
                                    {renderEmailList(emails)}
                                </ListGroup>
                            </TabPane>
                        </Tabs>
                        {isLoading && <p>Đang tải...</p>}
                    </div>
                </Col>
                <Col md={8} style={{ overflowY: 'auto', height: isMobileView ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)', }}>
                    {selectedEmail ? (
                        <Card style={{ padding: '20px' }}>
                            <h4>{selectedEmail.subject}</h4>
                            <p>Đến: {selectedEmail.to}</p>
                            <p>Ngày: {new Date(selectedEmail.sentAt).toLocaleString()}</p>
                            <p>Trạng thái: {selectedEmail.status === 'sent' ? 'Đã gửi' : 'Gửi thất bại'}</p>
                            {selectedEmail.status === 'failed' && (
                                <div>
                                    <p style={{ color: 'red' }}><FaExclamationCircle /> Lỗi: {selectedEmail.error}</p>
                                    <Button 
                                        onClick={() => handleResend(selectedEmail)} 
                                        variant="primary"
                                        disabled={resendingEmailId === selectedEmail._id}
                                    >
                                        {resendingEmailId === selectedEmail._id ? 'Đang gửi lại...' : 'Gửi lại'}
                                    </Button>
                                </div>
                            )}
                            <div className='my-3' dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} />
                            {showDeleted ? (
                                <Button onClick={handleRestore} variant="primary">Khôi phục</Button>
                            ) : (
                                <Button onClick={() => setIsDeleteModalVisible(true)} variant="danger">Xóa</Button>
                            )}
                        </Card>
                    ) : (
                        <div>
                            <Form.Control
                                placeholder="Đến"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="mb-3"
                            />
                            <Form.Control
                                placeholder="Chủ đề"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="mb-3"
                            />
                            <Select
                                placeholder="Chọn mẫu email"
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                                className="mb-3"
                                style={{ width: '100%' }}
                            >
                                {templates.map(template => (
                                    <Option key={template._id} value={template._id}>
                                        {template.name}
                                    </Option>
                                ))}
                            </Select>
                            <CKEditor
                                editor={ClassicEditor}
                                data={editorContent}
                                onChange={(event, editor) => {
                                    const data = editor.getData();
                                    setEditorContent(data);
                                }}
                                className="mb-3"
                            />
                            <Button 
                                onClick={handleSend} 
                                className="mt-4" 
                                loading={isSending}
                                disabled={isSending}
                            >
                                Gửi
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>
            <Modal
                title="Xác nhận xóa"
                visible={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
            >
                <p>Bạn có chắc chắn muốn xóa email này không?</p>
            </Modal>
            <Modal
                title="Cài đặt Email"
                visible={isConfigModalVisible}
                onCancel={() => setIsConfigModalVisible(false)}
                footer={null}
            >
                <Form onSubmit={handleConfigSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Dịch vụ Email</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="emailService" 
                            defaultValue={emailConfig.emailService} 
                            required 
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Tài khoản Email</Form.Label>
                        <Form.Control 
                            type="email" 
                            name="emailUser" 
                            defaultValue={emailConfig.emailUser} 
                            required 
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu Email</Form.Label>
                        <Form.Control 
                            type="password" 
                            name="emailPass" 
                            defaultValue={emailConfig.emailPass} 
                            required 
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Host Email</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="emailHost" 
                            defaultValue={emailConfig.emailHost} 
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Port Email</Form.Label>
                        <Form.Control 
                            type="number" 
                            name="emailPort" 
                            defaultValue={emailConfig.emailPort} 
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Tên người gửi</Form.Label>
                        <Form.Control 
                            type="text" 
                            name="senderName" 
                            defaultValue={emailConfig.senderName} 
                            required 
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="me-2">
                        Lưu cài đặt
                    </Button>
                    <Button variant="secondary" onClick={handleSendTestEmail}>
                        Gửi email test
                    </Button>
                </Form>
            </Modal>
        </Container>
    );
};

export default Email;
