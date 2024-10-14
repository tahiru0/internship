import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, Spin } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import { useStudent } from '../../context/StudentContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅 Chào buổi sáng';
  if (hour < 18) return '☀️ Chào buổi chiều';
  return '🌙 Chào buổi tối';
};

const Dashboard = () => {
  const { loading, userData } = useStudent(); // Sử dụng userData thay vì studentData
  const [greeting, setGreeting] = useState(getGreeting());

  const updateGreeting = useCallback(() => {
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, [updateGreeting]);

  return (
    <ConfigProvider locale={viVN}>
      <div className="dashboard container">
        <h3 className="mb-4">{`${greeting}, ${userData?.name || 'Sinh viên'}!`}</h3>
        {loading ? (
          <Spin size="large" />
        ) : (
          <div>
            {/* Nội dung Dashboard sẽ được thêm vào đây */}
            {/* Thêm các component và thông tin khác của Dashboard sinh viên */}
          </div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default Dashboard;
