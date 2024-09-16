import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

function MentorDashboard() {
  return (
    <div className="row g-4">
      <div className="col-12 col-sm-6 col-lg-3">
        <Card className="custom-card">
          <Row align="middle">
            <Col span={24}>
              <Statistic title="Bảng điều khiển Mentor" value="Chào mừng, Mentor!" />
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
}

export default MentorDashboard;
