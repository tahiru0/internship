import React from 'react';
import { Modal, Form, Input, InputNumber, Typography } from 'antd';
import { useModal } from '../../../../context/ModalContext';

const { TextArea } = Input;
const { Text } = Typography;

const RatingModal = ({ visible, onCancel, onSubmit, rating, setRating, comment, setComment, taskType }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);

  const handleSubmit = () => {
    onSubmit(rating, comment);
  };

  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Đánh giá Task"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
    >
      <Form layout="vertical">
        {taskType !== 'multipleChoice' && (
          <Form.Item label="Điểm số (0-10)">
            <InputNumber
              min={0}
              max={10}
              step={0.1}
              value={rating}
              onChange={(value) => setRating(value)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}
        <Form.Item label="Nhận xét">
          <TextArea 
            rows={4} 
            value={comment} 
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhập nhận xét của bạn về task này"
          />
        </Form.Item>
        {taskType === 'multipleChoice' && (
          <Text type="secondary">
            Lưu ý: Đối với bài trắc nghiệm, chỉ có thể nhập nhận xét mà không thể cho điểm.
          </Text>
        )}
      </Form>
    </Modal>
  );
};

export default RatingModal;
