import React from 'react';
import { Modal, Input } from 'antd';
import { useModal } from '../../../../context/ModalContext';    

const RemoveStudentModal = ({ visible, onCancel, onConfirm, studentName, reason, onReasonChange }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Xóa sinh viên khỏi dự án"
      visible={visible}
      onOk={onConfirm}
      onCancel={onCancel}
    >
      <p>Bạn có chắc chắn muốn xóa sinh viên {studentName} khỏi dự án?</p>
      <Input.TextArea
        placeholder="Nhập lý do xóa sinh viên"
        value={reason}
        onChange={onReasonChange}
        rows={4}
      />
    </Modal>
  );
};

export default RemoveStudentModal;

