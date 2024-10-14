import React from 'react';
import { Modal, Form, DatePicker, InputNumber, Alert } from 'antd';
import { useModal } from '../../../../context/ModalContext';

const RecruitingModal = ({ visible, onCancel, onSubmit, applicationEnd, setApplicationEnd, maxApplicants, setMaxApplicants, recruitingError }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Mở tuyển dụng"
      visible={visible}
      onOk={onSubmit}
      onCancel={onCancel}
    >
      <Form layout="vertical">
        <Form.Item label="Ngày kết thúc tuyển dụng">
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            value={applicationEnd}
            onChange={setApplicationEnd}
          />
        </Form.Item>
        <Form.Item label="Số lượng tuyển tối đa">
          <InputNumber
            min={1}
            value={maxApplicants}
            onChange={setMaxApplicants}
          />
        </Form.Item>
      </Form>
      {recruitingError && <Alert message={recruitingError} type="error" showIcon />}
    </Modal>
  );
};

export default RecruitingModal;

