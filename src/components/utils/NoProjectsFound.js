import React from 'react';
import { Typography, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Empty } from 'antd';
import { ProjectOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Container = styled.div`
  background-color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const IllustrationWrapper = styled.div`
  margin-bottom: 24px;
`;

const StyledTitle = styled(Title)`
  color: #1890ff;
  margin-bottom: 16px !important;
`;

const StyledParagraph = styled(Paragraph)`
  font-size: 16px;
  text-align: center;
  max-width: 400px;
  margin-bottom: 24px !important;
`;


const NoProjectsFound = ({ onRefresh }) => (
  <Container>
        <IllustrationWrapper>
      <Empty
        image={<ProjectOutlined style={{ fontSize: 60, color: '#1890ff' }} />}
        imageStyle={{
          height: 60,
        }}
        description={false}
      />
    </IllustrationWrapper>
    <StyledTitle level={3}>Chưa có dự án nào đang tuyển dụng</StyledTitle>
    <StyledParagraph>
      Hiện tại chưa có dự án nào phù hợp với tiêu chí tìm kiếm của bạn. 
      Hãy thử điều chỉnh bộ lọc hoặc quay lại sau để xem các cơ hội mới nhất.
    </StyledParagraph>
  </Container>
);

export default NoProjectsFound;