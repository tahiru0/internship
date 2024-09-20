import React from 'react';
import { useCompany } from '../../context/CompanyContext';
import AdminProjectManagement from './admin/AdminProjectManagement';
import MentorProjectManagement from './mentor/MentorProjectManagement';

const ProjectManagement = () => {
  const { userRole, isMobileView } = useCompany(); // Assuming isMobileView is provided by useCompany

  return (
    <div
      className="project-management-wrapper"
      style={{ width: '100%', height: isMobileView ? 'calc(100vh - 150px)' : 'calc(100vh - 100px)' }}
    >
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