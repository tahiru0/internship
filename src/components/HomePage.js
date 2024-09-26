import React from 'react';
import { Navbar, Nav, Button, Container, Row, Col, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLoginClick = (role) => {
        // Navigate to the login page with the selected role
        navigate(`/login?role=${role}`);
    };

    return (
        <div>
            <Navbar bg="white" expand="lg" className="fixed-top">
                <Container>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Navbar.Brand href="#home" style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src="logo.png"
                                height="50"
                                className="d-inline align-top"
                                alt="Logo"
                            />
                            <h2 style={{ color: '#060270', marginLeft: '10px' }} className='d-inline'>Internship</h2>
                        </Navbar.Brand>
                    </div>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="mx-auto">
                            <Nav.Link as={Link} to="/" className='nav-link1' active={location.pathname === '/'}>Trang chủ</Nav.Link>
                            <Nav.Link as={Link} to="/about" className='nav-link1' active={location.pathname === '/about'}>Về chúng tôi</Nav.Link>
                            <Nav.Link as={Link} to="/jobs" className='nav-link1' active={location.pathname === '/jobs'}>Việc làm</Nav.Link>
                        </Nav>

                        <Nav>
                            <button className="btn-custom mx-2" href="#signup">Tạo việc làm</button>
                            <Dropdown className="mx-2">
                                <Dropdown.Toggle variant="link" className="btn-outline" id="dropdown-basic">
                                    Đăng nhập
                                </Dropdown.Toggle>

                                <Dropdown.Menu className="custom-dropdown-menu">
                                    <Dropdown.Item as={Link} to="/login" className="custom-dropdown-item">Sinh viên</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/company/login" className="custom-dropdown-item">Doanh nghiệp</Dropdown.Item>
                                    <Dropdown.Item as={Link} to="/school/login" className="custom-dropdown-item">Trường đại học</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <div style={{ paddingTop: '100px' }}>
                <Container>
                    <Row className="align-items-center" style={{ height: '90vh' }}>
                        <Col md={6}>
                            <h1 className="display-4 display-md-3" style={{ color: '#5f6469', marginBottom: '30px', fontWeight: '500' }}>
                                Khám phá cơ hội thực tập tuyệt vời cùng chúng tôi!
                            </h1>
                            <Link to="/jobs" className="btn-outline-b">Khám phá thực tập ngay</Link>
                            <p className="mt-3" style={{ color: '#5f6469' }}>
                                Doanh nghiệp cần tuyển dụng? <Link style={{ color: '#007bff' }} to="/company/register">Đăng ký ngay</Link>
                            </p>
                        </Col>
                        <Col md={6} sm={8}>
                            <img src='/assets/banner.png' alt="Banner" className="img-fluid" />
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
}

export default HomePage;
