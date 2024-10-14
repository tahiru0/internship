import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useModal } from '../../../../context/ModalContext';

const ConfirmCloseRecruitingModal = ({ visible, onCancel, onConfirm }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Xác nhận đóng ứng tuyển"
      visible={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <p>
        <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
        Bạn có chắc chắn muốn đóng ứng tuyển cho dự án này?
      </p>
      <p>Lưu ý: Tất cả danh sách ứng tuyển hiện tại sẽ bị xóa.</p>
    </Modal>
  );
};

export default ConfirmCloseRecruitingModal;

