import React, { useState, useEffect, useRef } from 'react';
import { Input, Avatar, Badge, List, Tabs, Card } from 'antd';
import { SendOutlined, UserOutlined, MessageOutlined, DownOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaRegCommentDots } from 'react-icons/fa';
import { faker } from '@faker-js/faker/locale/vi';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Search } = Input;
const { TabPane } = Tabs;

// Helper function to generate fake messages
const generateFakeMessages = (count) => {
    return Array.from({ length: count }, () => ({
        id: faker.datatype.uuid(),
        text: faker.lorem.sentence(),
        sender: faker.datatype.boolean() ? 'user' : 'contact',
        timestamp: faker.date.recent(),
        read: faker.datatype.boolean(),
    })).sort((a, b) => a.timestamp - b.timestamp);
};

// Helper function to generate fake contacts
const generateFakeContacts = (count) => {
    return Array.from({ length: count }, () => ({
        id: faker.datatype.uuid(),
        name: faker.person.fullName(),
        avatar: faker.image.avatar(),
        unread: faker.number.int({ min: 0, max: 10 }),
    }));
};

const Contact = () => {
    const [selectedContact, setSelectedContact] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [inputMessage, setInputMessage] = useState('');
    const [contacts, setContacts] = useState(generateFakeContacts(20));
    const [messages, setMessages] = useState({});
    const chatEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [isNearBottom, setIsNearBottom] = useState(true);

    // Generate fake messages for each contact
    useEffect(() => {
        const fakeMessages = {};
        contacts.forEach(contact => {
            fakeMessages[contact.id] = generateFakeMessages(faker.number.int({ min: 5, max: 30 }));
        });
        setMessages(fakeMessages);
    }, [contacts]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedContact, messages]);

    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        setIsNearBottom(distanceFromBottom < 100);
    };

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setContacts(contacts.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c)));
        if (window.innerWidth <= 768) {
            setIsMobileView(true);
        }
        // Mark all messages as read when selecting a contact
        setMessages(prevMessages => ({
            ...prevMessages,
            [contact.id]: prevMessages[contact.id].map(msg => ({ ...msg, read: true }))
        }));
    };

    const handleSendMessage = () => {
        if (inputMessage.trim() !== '' && selectedContact) {
            const newMessage = {
                id: faker.datatype.uuid(),
                text: inputMessage,
                sender: 'user',
                timestamp: new Date(),
                read: true,
            };
            setMessages(prevMessages => ({
                ...prevMessages,
                [selectedContact.id]: [...(prevMessages[selectedContact.id] || []), newMessage],
            }));
            setInputMessage('');
            scrollToBottom();
        }
    };

    const renderContactList = () => (
        <List
            itemLayout="horizontal"
            dataSource={contacts}
            renderItem={(item) => (
                <List.Item
                    onClick={() => handleSelectContact(item)}
                    style={{
                        background: selectedContact?.id === item.id ? '#f0f0f0' : 'transparent',
                        cursor: 'pointer',
                    }}
                >
                    <List.Item.Meta
                        avatar={<Avatar src={item.avatar} />}
                        title={item.name}
                        description={`${item.unread} tin nhắn chưa đọc`}
                    />
                    <Badge count={item.unread} />
                </List.Item>
            )}
        />
    );

    const renderChatMessages = () => {
        const contactMessages = selectedContact ? messages[selectedContact.id] || [] : [];
        let firstUnreadIndex = contactMessages.findIndex(msg => !msg.read);
        firstUnreadIndex = firstUnreadIndex === -1 ? contactMessages.length : firstUnreadIndex;

        return (
            <div
                className="chat-messages"
                style={{
                    height: 'auto',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingRight: '15px',
                }}
                onScroll={handleScroll}
                ref={chatContainerRef}
            >
                {contactMessages.map((message, index) => (
                    <React.Fragment key={message.id}>
                        {index === firstUnreadIndex && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                margin: '10px 0',
                                color: '#888',
                            }}>
                                <div style={{ flex: 1, height: '1px', background: '#888' }}></div>
                                <span style={{ padding: '0 10px' }}>Tin nhắn chưa đọc</span>
                                <div style={{ flex: 1, height: '1px', background: '#888' }}></div>
                            </div>
                        )}
                        <div
                            className={`message ${message.sender}`}
                            style={{
                                textAlign: message.sender === 'user' ? 'right' : 'left',
                                margin: '5px 0',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                background: message.sender === 'user' ? '#d7edf7' : '#f0f0f0',
                                display: 'inline-block',
                                maxWidth: '70%',
                                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                wordBreak: 'break-word',
                            }}
                        >
                            {message.text}
                            <div style={{ fontSize: '0.8em', color: '#888', marginTop: '4px' }}>
                                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true, locale: vi })}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
                <div ref={chatEndRef} />
            </div>
        );
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleBackToContacts = () => {
        setSelectedContact(null);
        setIsMobileView(window.innerWidth <= 768);
    };

    return (
        <Container fluid style={{
            height: isMobileView ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Row style={{ flex: 1, minHeight: 0 }}>
                {(!selectedContact || !isMobileView) && (
                    <Col md={4} style={{ height: '100%', overflowY: 'auto' }}>
                        <Tabs defaultActiveKey="1" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <TabPane
                                tab={
                                    <span>
                                        <UserOutlined />
                                        Contacts
                                    </span>
                                }
                                key="1"
                                style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
                            >
                                <div style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'white' }}>
                                    <Search placeholder="Search contacts" style={{ marginBottom: '10px' }} />
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: isMobileView ? 'calc(100vh - 300px)' : 'calc(100vh - 250px)', }}>
                                    {renderContactList()}
                                </div>
                            </TabPane>
                        </Tabs>
                    </Col>
                )}
                {selectedContact && (isMobileView || !isMobileView) && (
                    <Col md={8} xs={12} style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <Card
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {isMobileView && (
                                        <Button variant="link" onClick={handleBackToContacts} style={{ marginRight: '10px' }}>
                                            <ArrowLeftOutlined />
                                        </Button>
                                    )}
                                    <Avatar src={selectedContact.avatar} style={{ marginRight: '10px' }} />
                                    {selectedContact.name}
                                </div>
                            }
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                        >
                            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }} ref={chatContainerRef} onScroll={handleScroll}>
                                {renderChatMessages()}
                                <div ref={chatEndRef} />
                            </div>
                            <div style={{ display: 'flex', marginTop: 'auto' }}>
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onPressEnter={handleSendMessage}
                                    placeholder="Type a message"
                                    style={{ flex: 1, marginRight: '10px' }}
                                />
                                <Button variant="primary" onClick={handleSendMessage}>
                                    <SendOutlined />
                                </Button>
                            </div>
                            {!isNearBottom && (
                                <Button
                                    variant="secondary"
                                    onClick={scrollToBottom}
                                    style={{
                                        position: 'absolute',
                                        bottom: '90px',
                                        right: '50%',
                                        transform: 'translateX(50%)',
                                        borderRadius: '50%',
                                        width: '30px',
                                        height: '30px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <DownOutlined />
                                </Button>
                            )}
                        </Card>
                    </Col>
                )}
                {!selectedContact && !isMobileView && (
                    <Col md={8} style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                        <FaRegCommentDots style={{ fontSize: '48px', marginBottom: '20px' }} />
                        <p>Hãy chọn 1 đoạn chat để bắt đầu</p>
                    </Col>
                )}
            </Row>
        </Container>
    );
};

export default Contact;
