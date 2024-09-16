import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from '../components/instructor/Dashboard';
import ProjectManagement from '../components/instructor/ProjectManagement';
import StudentManagement from '../components/instructor/StudentManagement';
import Main from '../layout/Main';
// import Settings from '../components/instructor/Settings';
// import Report from '../components/instructor/Report';
import { FaProjectDiagram, FaTachometerAlt, FaUserGraduate } from 'react-icons/fa';
import NotFound from '../common/Notfound';

const navItems = [
  { key: "1", to: "/instructor/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
  { key: "2", to: "/instructor/project", label: "Project Management", icon: <FaProjectDiagram /> },
  { key: "3", to: "/instructor/student", label: "Student Management", icon: <FaUserGraduate /> },
//   { key: "4", to: "/instructor/report", label: "Report", icon: <FaFileAlt /> },
//   { key: "5", to: "/instructor/settings", label: "Settings", icon: <FaCog /> },
];

function Instructor() {
  return (
    <Routes>
      <Route path="/*" element={
        <Main navItems={navItems}>
          <Routes>
            <Route path="/" element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project" element={<ProjectManagement />} />
            <Route path="/student" element={<StudentManagement />} />
            {/* <Route path="/report" element={<Report />} />
            <Route path="/settings" element={<Settings />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Main>
      } />
    </Routes>
  );
}

export default Instructor;