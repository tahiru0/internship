import React from 'react';
import { Result, Typography } from 'antd';

const { Paragraph, Text } = Typography;

const MaintenancePage = ({ message }) => (
  <Result
    status="warning"
    title="Hệ thống đang bảo trì"
    subTitle={
      <Paragraph>
        <Text strong>
          {message || 'Chúng tôi đang nâng cấp hệ thống. Vui lòng quay lại sau.'}
        </Text>
      </Paragraph>
    }
  />
);

export default MaintenancePage;
