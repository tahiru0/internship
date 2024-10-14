import React from 'react';
import { Modal, Form, Rate, Input } from 'antd';
import { useModal } from '../../../../context/ModalContext';
const { TextArea } = Input;

const RatingModal = (  { visible, onCancel, onSubmit, rating, setRating, comment, setComment }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Đánh giá Task"
      visible={visible}
      onOk={onSubmit}
      onCancel={onCancel}
    >
      <Form layout="vertical">
        <Form.Item label="Đánh giá">
          <Rate
            allowHalf
            onChange={(value) => setRating(value)}
            value={rating / 2}
          />
          <span className="ant-rate-text">{rating}/10</span>
        </Form.Item>
        <Form.Item label="Bình luận">
          <TextArea rows={4} onChange={(e) => setComment(e.target.value)} value={comment} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RatingModal;

