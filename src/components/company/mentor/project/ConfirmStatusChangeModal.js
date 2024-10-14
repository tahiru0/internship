import React from 'react';
import { Modal, Checkbox } from 'antd';
import { useModal } from '../../../../context/ModalContext';    

const ConfirmStatusChangeModal = ({ visible, onCancel, onOk, taskToUpdate, statusMapping, rememberChoice, onRememberChoiceChange }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Xác nhận cập nhật trạng thái"
      visible={visible}
      onOk={onOk}
      onCancel={onCancel}
    >
      {taskToUpdate && (
        <p>Bạn có chắc chắn muốn cập nhật trạng thái của task "{taskToUpdate.taskName}" từ "{statusMapping[taskToUpdate.currentStatus] || taskToUpdate.currentStatus}" sang "{statusMapping[taskToUpdate.newStatus] || taskToUpdate.newStatus}"?</p>
      )}
      <Checkbox checked={rememberChoice} onChange={onRememberChoiceChange}>
        Ghi nhớ lựa chọn của tôi
      </Checkbox>
    </Modal>
  );
};

export default ConfirmStatusChangeModal;
