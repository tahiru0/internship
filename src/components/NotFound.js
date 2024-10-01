import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Header from './Header'; // Giả sử bạn đã tách Header thành một component riêng

const NotFound = () => {
  return (
    <>
      <Header />
      <Container style={{ paddingTop: '100px' }}>
        <Row className="align-items-center" style={{ height: '80vh' }}>
          <Col md={6}>
            <h2 className="display-4" style={{ color: '#5f6469', marginBottom: '30px', fontWeight: '500' }}>
              404 - Không tìm thấy trang
            </h2>
            <p style={{ color: '#5f6469', marginBottom: '30px' }}>
              Xin lỗi, trang bạn đang tìm kiếm không tồn tại.
            </p>
            <Link to="/" className="btn-outline-b">Quay lại trang chủ</Link>
          </Col>
          <Col md={6}>
            <img src='/assets/404.avif' alt="404 Not Found" className="img-fluid" />
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default NotFound;
