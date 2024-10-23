import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Tab, Nav, Pagination, Modal, Form } from 'react-bootstrap';
import { Avatar, Input, message } from 'antd';
import { FaImage, FaVideo } from 'react-icons/fa';
import { faker } from '@faker-js/faker/locale/vi';
import useForm from '../../common/useForm'; // Assuming the path is correct
import CreatePostModal from '../../common/CreatePostModal';

const { TextArea } = Input;

const CompanyProfile = () => {
    const [backgroundImage, setBackgroundImage] = useState(faker.image.business());
    const [logo, setLogo] = useState(faker.image.abstract());
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const postsPerPage = 5;
    const [previewImage, setPreviewImage] = useState(null);

    // Generate 20 random posts
    const [allPosts, setAllPosts] = useState(Array.from({ length: 20 }, (_, index) => ({
        id: index + 1,
        content: faker.lorem.paragraph(),
        image: Math.random() > 0.5 ? faker.image.url() : null,
        video: Math.random() > 0.8 ? 'https://www.example.com/sample-video.mp4' : null,
        date: faker.date.past(),
        likes: faker.datatype.number({ min: 0, max: 100 }),
        comments: [],
    })));

    // Calculate total pages
    const totalPages = Math.ceil(allPosts.length / postsPerPage);

    // Get current posts
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = allPosts.slice(indexOfFirstPost, indexOfLastPost);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Add comment
    const addComment = (postId, comment) => {
        setAllPosts(prevPosts => prevPosts.map(post => {
            if (post.id === postId) {
                return { ...post, comments: [...post.comments, comment] };
            }
            return post;
        }));
    };

    // Add new post
    const addNewPost = (newPost) => {
        setAllPosts(prevPosts => [
            { id: prevPosts.length + 1, ...newPost, date: new Date(), likes: 0, comments: [] },
            ...prevPosts
        ]);
        setShowModal(false);
    };

    // New post form
    const [newPost, setNewPost] = useState({ content: '', image: '', video: '' });

    const handleNewPostChange = (e) => {
        setNewPost({ ...newPost, [e.target.name]: e.target.value });
    };

    const handleNewPostSubmit = (e) => {
        e.preventDefault();
        addNewPost(newPost);
        setNewPost({ content: '', image: '', video: '' });
    };

    // Form configuration using useForm hook
    const fields = [
        { name: 'name', label: 'Tên công ty', type: 'text', colSpan: 12, rules: [{ required: true, message: 'Vui lòng nhập tên công ty!' }] },
        { name: 'email', label: 'Email', type: 'text', colSpan: 12, rules: [{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }] },
        { name: 'phone', label: 'Số điện thoại', type: 'text', colSpan: 12, rules: [{ required: true, message: 'Vui lòng nhập số điện thoại!' }] },
        { name: 'address', label: 'Địa chỉ', type: 'text', colSpan: 12, rules: [{ required: true, message: 'Vui lòng nhập địa chỉ!' }] },
        { name: 'description', label: 'Mô tả', type: 'wysiwyg', colSpan: 24, rules: [{ required: true, message: 'Vui lòng nhập mô tả công ty!' }] },
    ];

    const initialValues = {
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.address.streetAddress(),
        description: faker.company.catchPhrase(),
    };

    const handleFormSubmit = (values) => {
        console.log(values);
        message.success('Thông tin công ty đã được cập nhật');
    };

    const companyForm = useForm({
        fields,
        onSubmit: handleFormSubmit,
        initialValues,
    });

    // Form configuration for new post
    const postFields = [
        { name: 'title', label: 'Tiêu đề', type: 'text', colSpan: 24, rules: [{ required: true, message: 'Vui lòng nhập tiêu đề!' }] },
        { name: 'content', label: 'Nội dung', type: 'wysiwyg', colSpan: 24, rules: [{ required: true, message: 'Vui lòng nhập nội dung!' }] },
    ];

    const postInitialValues = {
        title: '',
        content: '',
    };

    const handlePostSubmit = (values) => {
        console.log(values);
        message.success('Bài viết mới đã được tạo');
    };

    const postForm = useForm({
        fields: postFields,
        onSubmit: handlePostSubmit,
        initialValues: postInitialValues,
    });

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                try {
                    const objectUrl = URL.createObjectURL(file);
                    setPreviewImage(objectUrl);
                } catch (error) {
                    console.error('Lỗi khi tạo URL cho ảnh:', error);
                    message.error('Không thể tải lên ảnh. Vui lòng thử lại.');
                }
            } else {
                message.error('Vui lòng chọn một tệp hình ảnh hợp lệ.');
            }
        }
    };

    // Đảm bảo xóa URL đối tượng khi component bị hủy
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    return (
        <Container>
            <Card className="mb-4">
                <div style={{ position: 'relative' }}>
                    <Card.Img
                        variant="top"
                        src={backgroundImage}
                        style={{ height: '200px', objectFit: 'cover' }}
                    />
                </div>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col xs={4} md={3} lg={2}>
                            <Avatar src={logo} size={100} shape="square" />
                        </Col>
                        <Col xs={8} md={9} lg={10}>
                            <h2>{initialValues.name}</h2>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Tab.Container id="company-tabs" defaultActiveKey="posts">
                <Nav variant="tabs" className="mb-3">
                    <Nav.Item>
                        <Nav.Link eventKey="posts">Bài viết</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="update">Cập nhật thông tin</Nav.Link>
                    </Nav.Item>
                </Nav>
                <Tab.Content>
                    <Tab.Pane eventKey="posts">
                        <Row className="justify-content-center mb-3">
                            <Col md={6}>
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    Tạo bài viết mới
                                </Button>
                            </Col>
                        </Row>
                        <Row className="justify-content-center">
                            <Col md={6}>
                                {currentPosts.map((post) => (
                                    <Card key={post.id} className="mb-4">
                                        <Card.Body>
                                            <Card.Text>{post.content}</Card.Text>
                                            {post.image && (
                                                <Card.Img variant="top" src={post.image} />
                                            )}
                                            {post.video && (
                                                <video controls width="100%">
                                                    <source src={post.video} type="video/mp4" />
                                                    Your browser does not support the video tag.
                                                </video>
                                            )}
                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                <small className="text-muted">
                                                    {post.date.toLocaleDateString('vi-VN')}
                                                </small>
                                                <span>{post.likes} likes</span>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-center mt-4 mb-4">
                            <Pagination>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <Pagination.Item
                                        key={i + 1}
                                        active={i + 1 === currentPage}
                                        onClick={() => paginate(i + 1)}
                                    >
                                        {i + 1}
                                    </Pagination.Item>
                                ))}
                            </Pagination>
                        </div>
                    </Tab.Pane>
                    <Tab.Pane eventKey="update">
                        <Row>
                            <Col md={6}>
                                <Card className="mb-4">
                                    <Card.Body>
                                        <Card.Title>Thông tin công ty</Card.Title>
                                        {companyForm}
                                        <Form.Group controlId="formFile" className="mb-3">
                                            <Form.Label>Tải lên logo công ty</Form.Label>
                                            <Form.Control 
                                                type="file" 
                                                onChange={handleImageUpload} 
                                                accept="image/*"
                                            />
                                        </Form.Group>
                                        {previewImage && (
                                            <img 
                                                src={previewImage} 
                                                alt="Logo preview" 
                                                style={{ maxWidth: '100%', marginTop: '10px' }} 
                                            />
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card className="mb-4">
                                    <Card.Body>
                                        <Card.Title>Vị trí</Card.Title>
                                        <div style={{ height: '400px', width: '100%' }}>
                                            <iframe
                                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15673.755459337825!2d106.69147999987815!3d10.854186887344692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317529c17978287d%3A0xec48f5a17b7d5741!2sNguyen%20Tat%20Thanh%20University%20-%20Campus%20District%2012!5e0!3m2!1sen!2s!4v1722962997848!5m2!1sen!2s"
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0 }}
                                                allowFullScreen=""
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                            ></iframe>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
            <CreatePostModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSubmit={addNewPost}
            />
        </Container>
    );
};

export default CompanyProfile;
