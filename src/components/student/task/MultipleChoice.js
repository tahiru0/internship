import React, { useRef } from 'react';
import { Form, Radio, Space, Typography, Card, Button, Row, Col } from 'antd';
import styled from 'styled-components';
import { CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const QuestionTitle = styled(Title)`
  margin-bottom: 16px !important;
`;

const OptionText = styled(Text)`
  font-size: 16px;
`;

const DeleteButton = styled(Button)`
  margin-left: 8px;
`;

const QuestionContainer = styled.div`
  position: relative;
  padding-bottom: 40px;
`;

const DeleteButtonContainer = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
`;

const QuestionMapContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 20px;
  position: sticky;
  top: 20px;
`;

const QuestionMapItem = styled.div`
  background-color: ${props => props.isAnswered ? '#1890ff' : '#f0f0f0'};
  color: ${props => props.isAnswered ? 'white' : 'black'};
  padding: 8px;
  text-align: center;
  cursor: pointer;
  border-radius: 4px;
`;

const LeftColumn = styled(Col)`
  position: sticky;
  top: 20px;
  height: fit-content;
`;

const MultipleChoice = ({ questions, selectedOptions, setSelectedOptions, taskName, taskDescription }) => {
  const questionRefs = useRef([]);

  const handleOptionChange = (questionIndex, optionIndex) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[questionIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
  };

  const handleDeleteAnswer = (questionIndex) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[questionIndex] = null;
    setSelectedOptions(newSelectedOptions);
  };

  const getOptionLabel = (index) => {
    return String.fromCharCode(65 + index);
  };

  const scrollToQuestion = (index) => {
    questionRefs.current[index].scrollIntoView({ behavior: 'smooth' });
  };

  const renderQuestionMap = () => {
    const items = [];
    for (let i = 0; i < questions.length; i++) {
      items.push(
        <QuestionMapItem
          key={i}
          isAnswered={selectedOptions[i] !== null && selectedOptions[i] !== undefined}
          onClick={() => scrollToQuestion(i)}
        >
          {i + 1}
        </QuestionMapItem>
      );
    }
    return <QuestionMapContainer>{items}</QuestionMapContainer>;
  };

  return (
    <Row gutter={24}>
      <LeftColumn span={6}>
        <Text style={{ marginBottom: '20px', display: 'block' }}>{taskDescription}</Text>
        {renderQuestionMap()}
      </LeftColumn>
      <Col span={18}>
        <Form>
          {questions.map((question, questionIndex) => (
            <StyledCard key={questionIndex} ref={el => questionRefs.current[questionIndex] = el} id={`question-${questionIndex}`}>
              <QuestionContainer>
                <QuestionTitle level={4}>{`Câu ${questionIndex + 1}: ${question.question.replace(/^\d+\.\s*/, '')}`}</QuestionTitle>
                <Radio.Group
                  onChange={(e) => handleOptionChange(questionIndex, e.target.value)}
                  value={selectedOptions[questionIndex]}
                >
                  <Space direction="vertical">
                    {question.options.map((option, optionIndex) => (
                      <Radio key={optionIndex} value={optionIndex}>
                        <OptionText>{`${getOptionLabel(optionIndex)}. ${option}`}</OptionText>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
                {selectedOptions[questionIndex] !== null && selectedOptions[questionIndex] !== undefined && (
                  <DeleteButtonContainer>
                    <DeleteButton
                      type="text"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleDeleteAnswer(questionIndex)}
                    >
                      Xóa câu trả lời
                    </DeleteButton>
                  </DeleteButtonContainer>
                )}
              </QuestionContainer>
            </StyledCard>
          ))}
        </Form>
      </Col>
    </Row>
  );
};

export default MultipleChoice;
