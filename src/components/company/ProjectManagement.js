import React from 'react';
import { useCompany } from '../../context/CompanyContext';
import AdminProjectManagement from './admin/AdminProjectManagement';
import MentorProjectManagement from './mentor/MentorProjectManagement';

const ProjectManagement = () => {
  const { userRole } = useCompany();

  return (
    <div>
      {userRole === 'admin' ? (
        <AdminProjectManagement />
      ) : userRole === 'mentor' ? (
        <MentorProjectManagement />
      ) : (
        <p>Bạn không có quyền truy cập vào trang này.</p>
      )}
    </div>
  );
};

export default ProjectManagement;