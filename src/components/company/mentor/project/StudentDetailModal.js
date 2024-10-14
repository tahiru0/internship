import React from 'react';
import { Modal, Row, Col, Avatar, Typography, Card, Tag, Empty } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CalendarOutlined, ManOutlined, BankOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useColor } from 'color-thief-react';
import { useModal } from '../../../../context/ModalContext';
import styled from 'styled-components';  // Đảm bảo bạn đã cài đặt styled-components

const { Title, Text } = Typography;

// Thêm các hàm mới
const getBrightness = (hexColor) => {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000;
};

const getContrastColor = (hexColor) => {
  return getBrightness(hexColor) > 128 ? '#000000' : '#FFFFFF';
};

// Tạo một component nút đóng tùy chỉnh
const CustomCloseButton = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }

  .anticon {
    color: #000;
    font-size: 16px;
  }
`;

// Tạo một Modal tùy chỉnh để ghi đè kiểu mặc định
const CustomModal = styled(Modal)`
  .ant-modal-close {
    display: none;
  }
`;

const StudentDetailModal = ({ visible, onCancel, student }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);

  const { data: dominantColor } = useColor(student?.avatar || '', 'hex', { crossOrigin: 'anonymous' });

  if (!student) return null;

  const backgroundStyle = {
    background: dominantColor
      ? `linear-gradient(135deg, ${dominantColor} 0%, ${adjustColor(dominantColor, -30)} 100%)`
      : 'linear-gradient(135deg, #1E1E1E 0%, #3D3D3D 100%)',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
  };

  const textColor = dominantColor ? getContrastColor(dominantColor) : '#FFFFFF';

  return (
    <CustomModal
      style={{ zIndex: zIndex }}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      bodyStyle={{ padding: 0 }}
    >
      <CustomCloseButton onClick={onCancel}>
        <CloseOutlined />
      </CustomCloseButton>
      <div style={backgroundStyle}>
        <Row gutter={[24, 24]} align="middle">
          <Col span={8}>
            <Avatar size={200} src={student.avatar} icon={<UserOutlined />} style={{ border: `4px solid ${textColor}`, background: 'white' }} />
          </Col>
          <Col span={16}>
            <Title level={2} style={{ color: textColor, margin: 0 }}>{student.name || 'Không có tên'}</Title>
            <Title level={4} style={{ color: textColor, fontWeight: 'normal', margin: '10px 0' }}>{student.major || 'Chưa có ngành học'}</Title>
            <Text style={{ color: textColor, fontSize: '16px' }}>
              <MailOutlined style={{ marginRight: '8px', color: textColor }} />
              <a href={`mailto:${student.email}`} style={{ color: textColor }}>{student.email || 'Chưa có email'}</a>
            </Text>
            <br />
            <Text style={{ color: textColor, fontSize: '16px' }}><PhoneOutlined style={{ marginRight: '8px', color: textColor }} /> {student.phoneNumber || 'Chưa có số điện thoại'}</Text>
            <br />
            <Text style={{ color: textColor, fontSize: '16px' }}><IdcardOutlined style={{ marginRight: '8px', color: textColor }} /> {student.studentId || 'Chưa có mã sinh viên'}</Text>
          </Col>
        </Row>
      </div>
      <div style={{ padding: '40px' }}>
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Card title="Thông tin cá nhân" bordered={false}>
              <p><CalendarOutlined /> Ngày sinh: {student.dateOfBirth ? moment(student.dateOfBirth).format('DD/MM/YYYY') : 'Chưa có thông tin'}</p>
              <p><ManOutlined /> Giới tính: {student.gender || 'Chưa có thông tin'}</p>
              <p><BankOutlined /> Trường: {student.school?.name || 'Chưa có thông tin'}</p>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Kỹ năng" bordered={false}>
              {student.skills && student.skills.length > 0 ? (
                student.skills.map((skill, index) => (
                  <Tag key={index} color="blue" style={{ margin: '5px' }}>{skill}</Tag>
                ))
              ) : (
                <Empty description="Chưa có kỹ năng nào được thêm" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </CustomModal>
  );
};

// Hàm hỗ trợ để điều chỉnh màu sắc
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

export default StudentDetailModal;
