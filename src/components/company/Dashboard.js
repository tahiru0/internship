import React, { useState, useEffect } from 'react';
import { ConfigProvider, Spin } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import { useCompany } from '../../context/CompanyContext';
import AdminDashboard from './admin/AdminDashboard';
import MentorDashboard from './mentor/MentorDashboard';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅 Chào buổi sáng';
  if (hour < 18) return '☀️ Chào buổi chiều';
  return '🌙 Chào buổi tối';
};

function Dashboard() {
  const { loading, userRole, companyData } = useCompany();
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const timer = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); // Cập nhật mỗi phút

    return () => clearInterval(timer);
  }, []);

  return (
    <ConfigProvider locale={viVN}>
      <div className="dashboard container">
        <h3 className="mb-4">{`${greeting}, ${companyData?.account?.name || 'Người dùng'}!`}</h3>
        {loading ? (
          <Spin size="large" />
        ) : (
          userRole === 'admin' ? <AdminDashboard /> : <MentorDashboard />
        )}
      </div>
    </ConfigProvider>
  );
}

export default Dashboard;
