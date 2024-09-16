import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { FaImage, FaVideo } from 'react-icons/fa';

const CreatePostModal = ({ show, onHide, onSubmit }) => {
    const [newPost, setNewPost] = useState({ content: '', image: null, video: null });

    const handleNewPostChange = (e) => {
        setNewPost({ ...newPost, [e.target.name]: e.target.value });
    };

    const handleNewPostSubmit = (e) => {
        e.preventDefault();
        onSubmit(newPost);
        setNewPost({ content: '', image: null, video: null });
        onHide();
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'image') {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewPost({ ...newPost, image: reader.result });
                };
                reader.readAsDataURL(file);
            } else if (type === 'video') {
                setNewPost({ ...newPost, video: URL.createObjectURL(file) });
            }
        }
    };

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Tạo bài viết mới</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleNewPostSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="content"
                            value={newPost.content}
                            onChange={handleNewPostChange}
                            placeholder="Bạn đang nghĩ gì?"
                        />
                    </Form.Group>
                    {newPost.image && (
                        <div className="mb-3">
                            <img src={newPost.image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                        </div>
                    )}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span>Thêm vào bài viết của bạn</span>
                        <div>
                            <label htmlFor="image-upload" className="me-2" style={{ cursor: 'pointer' }}>
                                <FaImage size={20} />
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(e, 'image')}
                            />
                            <label htmlFor="video-upload" style={{ cursor: 'pointer' }}>
                                <FaVideo size={20} />
                            </label>
                            <input
                                id="video-upload"
                                type="file"
                                accept="video/*"
                                style={{ display: 'none' }}
                                onChange={(e) => handleFileUpload(e, 'video')}
                            />
                        </div>
                    </div>
                    <Button variant="primary" type="submit">
                        Đăng bài
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CreatePostModal;