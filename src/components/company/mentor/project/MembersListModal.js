import React from 'react';
import { Modal, List, Avatar, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useModal } from '../../../../context/ModalContext';
    
const MembersListModal = ({ visible, onCancel, members, onViewDetail, onRemove }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Danh sách thành viên dự án"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <List
        itemLayout="horizontal"
        dataSource={members}
        renderItem={member => (
          <List.Item
            actions={[
              <Button
                type="link"
                danger
                onClick={() => onRemove(member)}
              >
                Xóa
              </Button>
            ]}
          >
            <List.Item.Meta
              avatar={<Avatar src={member.avatar} icon={<UserOutlined />} />}
              title={<a onClick={() => onViewDetail(member.id)}>{member.name}</a>}
              description={member.email}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default MembersListModal;

