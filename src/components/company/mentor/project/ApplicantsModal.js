import React from 'react';
import { Modal, List, Avatar, Button, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useModal } from '../../../../context/ModalContext';    

const ApplicantsModal = ({ visible, onCancel, applicants, loading, onAccept, onReject, onViewDetail }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Danh sách ứng viên"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <List
        loading={loading}
        itemLayout="horizontal"
        dataSource={applicants}
        renderItem={applicant => {
          if (!applicant) return null;
          return (
            <List.Item
              actions={[
                <Button type="primary" onClick={() => onAccept(applicant.id)}>Chấp nhận</Button>,
                <Button danger onClick={() => onReject(applicant.id)}>Từ chối</Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={applicant.avatar} icon={<UserOutlined />} />}
                title={<a onClick={() => onViewDetail(applicant.id)}>{applicant.name || 'Không có tên'}</a>}
                description={
                  <Space direction="vertical">
                    <span>{applicant.major || 'Chưa có ngành học'} - {applicant.school?.name || 'Chưa có trường'}</span>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Modal>
  );
};

export default ApplicantsModal;
