import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Row, Col, Dropdown, Offcanvas } from 'react-bootstrap';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaHome, FaInfoCircle, FaBriefcase, FaPlus, FaSignInAlt } from 'react-icons/fa';

const HomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [show, setShow] = useState(false);
    const [activeItem, setActiveItem] = useState('/');

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        setActiveItem(location.pathname);
    }, [location]);

    const handleNavClick = (path) => {
        setActiveItem(path);
        handleClose();
        navigate(path);
    };

    const NavItem = ({ to, icon, children }) => (
        <Nav.Link
            as="div"
            onClick={() => handleNavClick(to)}
            className={`offcanvas-link ${activeItem === to ? 'active' : ''}`}
        >
            {icon}
            {children}
        </Nav.Link>
    );

    return (
        <div>
            <Navbar bg="white" expand="lg" className="fixed-top">
                <Container>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Navbar.Brand as={Link} to="/" style={{ display: 'flex', alignItems: 'center' }}>
                            <img
                                src="logo.png"
                                height="50"
                                className="d-inline align-top"
                                alt="Logo"
                            />
                            <h2 style={{ color: '#060270', marginLeft: '10px' }} className='d-inline'>Internship</h2>
                        </Navbar.Brand>
                    </div>
                    <Navbar.Toggle aria-controls="offcanvasNavbar" onClick={handleShow} className="d-lg-none" />
                    <Navbar.Collapse id="basic-navbar-nav" className="d-none d-lg-flex">
                        <Nav className="mx-auto">
                            <Nav.Link as={Link} to="/" className='nav-link1' active={location.pathname === '/'}>Trang chủ</Nav.Link>
                            <Nav.Link as={Link} to="/about" className='nav-link1' active={location.pathname === '/about'}>Về chúng tôi</Nav.Link>
                            <Nav.Link as={Link} to="/jobs" className='nav-link1' active={location.pathname === '/jobs'}>Việc làm</Nav.Link>
                        </Nav>

                        <Nav>
                            <Link to="/company" className="btn-custom mx-2">Tạo việc làm</Link>
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

                    <Offcanvas show={show} onHide={handleClose} placement="end" className="custom-offcanvas">
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title className="offcanvas-title">Menu</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav className="flex-column">
                                <NavItem to="/" icon={<FaHome className="offcanvas-icon" />}>
                                    Trang chủ
                                </NavItem>
                                <NavItem to="/about" icon={<FaInfoCircle className="offcanvas-icon" />}>
                                    Về chúng tôi
                                </NavItem>
                                <NavItem to="/jobs" icon={<FaBriefcase className="offcanvas-icon" />}>
                                    Việc làm
                                </NavItem>
                                <NavItem to="/signup" icon={<FaPlus className="offcanvas-icon" />}>
                                    Tạo việc làm
                                </NavItem>
                                <Dropdown>
                                    <Dropdown.Toggle variant="link" id="dropdown-basic-mobile" className="offcanvas-dropdown">
                                        <FaSignInAlt className="offcanvas-icon" /> Đăng nhập
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="offcanvas-dropdown-menu">
                                        <Dropdown.Item as={Link} to="/login" onClick={handleClose}>Sinh viên</Dropdown.Item>
                                        <Dropdown.Item as={Link} to="/company/login" onClick={handleClose}>Doanh nghiệp</Dropdown.Item>
                                        <Dropdown.Item as={Link} to="/school/login" onClick={handleClose}>Trường đại học</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Nav>
                        </Offcanvas.Body>
                    </Offcanvas>
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
