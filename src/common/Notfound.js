import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../style/notfound.css'; // Import file CSS cho hiệu ứng

const NotFound = ({ homeLink }) => {
  return (
    <Container className="not-found-container">
      <Row className="justify-content-center">
        <Col md={9} className="text-center">
        <h1 className="display-1 animated-text animated-text-404">404</h1>
          <h2 className="mb-4 animated-text">Trang không tìm thấy</h2>
          <p className="lead mb-4 animated-text">
            Rất tiếc, trang bạn đang tìm kiếm không tồn tại. Hãy thử quay lại trang chủ.
          </p>
          <Link to={homeLink}>
            <Button variant="primary" size="lg" className="animated-button">
              Quay về trang chủ
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;
