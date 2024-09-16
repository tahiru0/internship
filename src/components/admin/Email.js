import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, ListGroup, Form } from 'react-bootstrap';
import { Tabs, Button, Input, message, Card, Select, Modal } from 'antd';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useAuthorization } from '../../routes/RequireAdminAuth';

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
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [isLoading, setIsLoading] = useState(false);

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
    }, [sortField, sortOrder, showDeleted, searchTerm, activeTab]);

    useEffect(() => {
        if (page > 1) {
            fetchMoreEmails();
        }
    }, [page]);

    const fetchEmails = async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`/admin/emails?page=1&search=${searchTerm}&sort=${sortField}&order=${sortOrder}&showDeleted=${showDeleted}`);
            console.log('API response:', response.data);
            if (Array.isArray(response.data)) {
                setEmails(response.data);
                setHasMore(response.data.length === 10); // Giả sử mỗi trang có 10 email
            } else if (response.data && Array.isArray(response.data.emails)) {
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
            const response = await axiosInstance.get(`/admin/emails?page=${page}&search=${searchTerm}&sort=${sortField}&order=${sortOrder}&showDeleted=${showDeleted}`);
            if (Array.isArray(response.data)) {
                setEmails(prevEmails => [...prevEmails, ...response.data]);
                setHasMore(response.data.length === 10);
            } else if (response.data && Array.isArray(response.data.emails)) {
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

    const handleSend = async () => {
        const newEmail = {
            to: recipient,
            subject,
            htmlContent: editorContent,
            sentAt: new Date().toISOString(),
        };

        try {
            await axiosInstance.post('/admin/send-email', newEmail);
            message.success('Email đã được gửi thành công!');
            handleCompose();
            fetchEmails();
        } catch (error) {
            console.error('Lỗi khi gửi email:', error);
            const errorMessage = error.response?.data?.message || 'Không thể gửi email';
            message.error(errorMessage);
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

    console.log('Current emails state:', emails);

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
                className={email.read ? '' : 'fw-bold'}
            >
                <div className="d-flex justify-content-between align-items-center">
                    <div>Đến: {email.to}</div>
                    <small>{new Date(email.sentAt).toLocaleString()}</small>
                </div>
                <small>{email.subject}</small>
            </ListGroup.Item>
        ));
    };

    return (
        <Container fluid>
            <Row>
                <Col md={4} style={{ height: isMobileView ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
                    <Button onClick={handleCompose} type="primary" className="mb-3">Soạn thư</Button>
                    <div className="mb-3">
                        <Input
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                        <Card>
                            <h4>{selectedEmail.subject}</h4>
                            <p>Đến: {selectedEmail.to}</p>
                            <p>Ngày: {new Date(selectedEmail.sentAt).toLocaleString()}</p>
                            <div className='my-3' dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }} />
                            {showDeleted ? (
                                <Button onClick={handleRestore}>Khôi phục</Button>
                            ) : (
                                <Button onClick={() => setIsDeleteModalVisible(true)} danger>Xóa</Button>
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
                            <Button onClick={handleSend} className="mt-4">Gửi</Button>
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
        </Container>
    );
};

export default Email;
