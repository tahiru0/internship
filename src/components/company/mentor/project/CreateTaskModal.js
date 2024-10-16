import React from 'react';
import { Modal, Form, Input, DatePicker, Select, Upload, Row, Col, Card, Button, InputNumber, Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useModal } from '../../../../context/ModalContext';
const { TextArea } = Input;
const { Option } = Select;

const CreateTaskModal = ({ visible, onCancel, onSubmit, form, project }) => {
  const { getNextZIndex } = useModal();
  const zIndex = React.useMemo(() => getNextZIndex(), [visible]);
  const parseQuestionsText = (text) => {
    const questions = [];
    const lines = text.split('\n');
    let currentQuestion = null;

    for (let line of lines) {
      line = line.trim();
      if (line === '') {
        if (currentQuestion) {
          questions.push(currentQuestion);
          currentQuestion = null;
        }
      } else if (!currentQuestion) {
        currentQuestion = { question: line, options: [], correctAnswer: null };
      } else if (line.match(/^[A-Z]\./)) {
        currentQuestion.options.push(line.substring(2).trim());
      } else if (line.startsWith('Đáp án:')) {
        const answer = line.substring(7).trim();
        currentQuestion.correctAnswer = answer.charCodeAt(0) - 'A'.charCodeAt(0);
      }
    }

    if (currentQuestion) {
      questions.push(currentQuestion);
    }

    return questions;
  };
  return (
    <Modal
      style={{ zIndex: zIndex }}
      title="Thêm Task mới"
      visible={visible}
      onOk={onSubmit}
      onCancel={onCancel}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Tên task"
              rules={[{ required: true, message: 'Vui lòng nhập tên task' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Mô tả"
            >
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name="deadline"
              label="Hạn chót"
              rules={[{ required: true, message: 'Vui lòng chọn hạn chót' }]}
            >
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="assignedTo"
              label="Người được giao"
              rules={[{ required: true, message: 'Vui lòng chọn người được giao' }]}
            >
              <Select>
                {project?.members.map(member => (
                  <Option key={member.id} value={member.id}>{member.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="taskType"
              label="Loại task"
              rules={[{ required: true, message: 'Vui lòng chọn loại task' }]}
            >
              <Select>
                <Option value="general">Chung</Option>
                <Option value="multipleChoice">Trắc nghiệm</Option>
                <Option value="essay">Tự luận</Option>
                <Option value="fileUpload">Nộp file</Option>
              </Select>
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.taskType !== currentValues.taskType}
            >
              {({ getFieldValue }) => {
                const taskType = getFieldValue('taskType');
                switch (taskType) {
                  case 'multipleChoice':
                    return (
                      <>
                        <Form.Item
                          name="questionsText"
                          label="Câu hỏi trắc nghiệm"
                          rules={[{ required: true, message: 'Vui lòng nhập các câu hỏi' }]}
                        >
                          <Input.TextArea
                            rows={10}
                            placeholder={`Nhập câu hỏi và các lựa chọn theo định dạng sau:
Câu hỏi 1
A. Lựa chọn 1
B. Lựa chọn 2
C. Lựa chọn 3
D. Lựa chọn 4
Đáp án: A

Câu hỏi 2
A. Lựa chọn 1
B. Lựa chọn 2
C. Lựa chọn 3
D. Lựa chọn 4
Đáp án: C`}
                          />
                        </Form.Item>
                        <Alert
                          message="Hướng dẫn"
                          description="Mỗi câu hỏi bắt đầu trên một dòng mới. Các lựa chọn được liệt kê sau câu hỏi, mỗi lựa chọn trên một dòng và bắt đầu bằng A., B., C., ... Đáp án đúng được chỉ định sau 'Đáp án:'. Để bắt đầu câu hỏi mới, để một dòng trống."
                          type="info"
                          showIcon
                        />
                      </>
                    );
                  case 'fileUpload':
                    return (
                      <>
                        <Form.Item
                          name={['fileRequirements', 'maxSize']}
                          label="Kích thước tối đa (MB)"
                          rules={[{ required: true, message: 'Vui lòng nhập kích thước tối đa' }]}
                        >
                          <InputNumber min={1} max={1024} />
                        </Form.Item>
                        <Form.Item
                          name={['fileRequirements', 'allowedExtensions']}
                          label="Định dạng cho phép"
                          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một định dạng' }]}
                        >
                          <Select mode="multiple">
                            <Option value=".pdf">.pdf</Option>
                            <Option value=".doc">.doc</Option>
                            <Option value=".docx">.docx</Option>
                            <Option value=".zip">.zip</Option>
                          </Select>
                        </Form.Item>
                      </>
                    );
                  default:
                    return null;
                }
              }}
            </Form.Item>
            <Form.Item
              name="file"
              label="Tài liệu đính kèm"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                if (Array.isArray(e)) {
                  return e;
                }
                return e && e.fileList;
              }}
            >
              <Upload.Dragger maxCount={1} beforeUpload={() => false}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Nhấp hoặc kéo file vào khu vực này để tải lên</p>
              </Upload.Dragger>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;
