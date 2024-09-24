import React, { useState, useEffect } from 'react';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import { Row, Col, Card, Spinner, Form, Table, ProgressBar } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import moment from 'moment';
import { FaBuilding, FaSchool, FaUserGraduate, FaProjectDiagram } from 'react-icons/fa';

const Dashboard = () => {
  const { axiosInstance } = useAuthorization();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeUnit, setTimeUnit] = useState('day');
  const [startDate, setStartDate] = useState(moment().subtract(7, 'days').toDate());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, timeUnit]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/dashboard', {
        params: {
          startDate: moment(startDate).format('YYYY-MM-DD'),
          endDate: moment(endDate).format('YYYY-MM-DD'),
          timeUnit: timeUnit
        }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUnitChange = (e) => {
    const value = e.target.value;
    setTimeUnit(value);
    let newStartDate;
    switch (value) {
      case 'day':
        newStartDate = moment().subtract(7, 'days').toDate();
        break;
      case 'week':
        newStartDate = moment().subtract(4, 'weeks').toDate();
        break;
      case 'month':
        newStartDate = moment().subtract(6, 'months').toDate();
        break;
      default:
        newStartDate = moment().subtract(7, 'days').toDate();
    }
    setStartDate(newStartDate);
    setEndDate(new Date());
  };

  const dashboardStyles = {
    container: {
      background: '#f8f9fa',
      padding: '20px',
    },
    title: {
      color: '#343a40',
      textAlign: 'center',
      marginBottom: '1rem',
    },
    customDatepickerWrapper: {
      width: '100%',
    },
    customDatepicker: {
      width: '100% !important',
    },
  };

  // Thêm styles này vào thẻ <style> trong component
  const additionalStyles = `
    .react-datepicker-wrapper {
      width: 100%;
    }
    .react-datepicker__input-container {
      width: 100%;
    }
  `;

  if (loading || !dashboardData) {
    return <Spinner animation="border" variant="primary" />;
  }

  const { totalCompanies, totalProjects, totalSchools, totalStudents, timeIntervals, topCompaniesByProjects } = dashboardData;

  const projectData = timeIntervals.map(interval => ({
    date: moment(interval.start).format(timeUnit === 'day' ? 'DD/MM' : 'DD/MM/YYYY'),
    'Tổng dự án': interval.projectStats.totalProjects,
    'Dự án đang tuyển': interval.projectStats.recruitingProjects
  }));

  const lastInterval = timeIntervals[timeIntervals.length - 1];
  const taskData = [
    { name: 'Đang chờ', value: lastInterval.taskStats.pendingTasks },
    { name: 'Đang thực hiện', value: lastInterval.taskStats.inProgressTasks },
    { name: 'Hoàn thành', value: lastInterval.taskStats.completedTasks },
    { name: 'Quá hạn', value: lastInterval.taskStats.overdueTasks }
  ].filter(item => item.value > 0);

  const TASK_COLORS = ['#FFA500', '#1E90FF', '#32CD32', '#DC143C'];

  const loginData = timeIntervals.map(interval => ({
    date: moment(interval.start).format(timeUnit === 'day' ? 'DD/MM' : 'DD/MM/YYYY'),
    'Số lượt đăng nhập': interval.loginStats.totalLogins
  }));

  const recruitmentData = topCompaniesByProjects.map(company => ({
    name: company.companyName,
    'Tỷ lệ tuyển dụng': company.recruitmentRate * 100,
    'Dự án đang tuyển': company.recruitingProjectCount,
    'Tổng số dự án': company.projectCount
  }));

  const StatCard = ({ icon, title, value, color }) => (
    <Card className="mb-3 stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0 text-muted">{title}</h6>
            <h2 className="mb-0" style={{ color }}>{value}</h2>
          </div>
          <div className="stat-icon" style={{ color }}>
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="dashboard-container" style={{ background: '#f8f9fa', padding: '20px' }}>
      <style>{additionalStyles}</style>
      <h2 style={{ color: '#343a40', textAlign: 'center', marginBottom: '1rem' }}>Bảng điều khiển quản trị</h2>
      <Form className="mb-4">
        <Row>
          <Col xs={12} sm={4}>
            <Form.Group>
              <Form.Label>Đơn vị thời gian</Form.Label>
              <Form.Select value={timeUnit} onChange={handleTimeUnitChange}>
                <option value="day">Ngày</option>
                <option value="week">Tuần</option>
                <option value="month">Tháng</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={12} sm={4}>
            <Form.Group>
              <Form.Label>Ngày bắt đầu</Form.Label>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                maxDate={endDate}
                dateFormat="dd/MM/yyyy"
                className="form-control"
              />
            </Form.Group>
          </Col>
          <Col xs={12} sm={4}>
            <Form.Group>
              <Form.Label>Ngày kết thúc</Form.Label>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                className="form-control"
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>

      <Row>
        <Col xs={12} sm={6} md={3}>
          <StatCard icon={<FaBuilding size={30} />} title="Tổng số công ty" value={totalCompanies} color="#007bff" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard icon={<FaSchool size={30} />} title="Tổng số trường học" value={totalSchools} color="#28a745" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard icon={<FaUserGraduate size={30} />} title="Tổng số sinh viên" value={totalStudents} color="#ffc107" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard icon={<FaProjectDiagram size={30} />} title="Tổng số dự án" value={totalProjects} color="#dc3545" />
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12} lg={6}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="card-title">Thống kê dự án</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Tổng dự án" stroke="#8884d8" />
                  <Line type="monotone" dataKey="Dự án đang tuyển" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="card-title">Phân bố trạng thái công việc</h5>
              {taskData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {taskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={TASK_COLORS[index % TASK_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <h6 className="text-muted">Chưa có dữ liệu</h6>
                </div>
              )}
              <div className="text-center mt-3">
                <p>Tổng số công việc: {lastInterval.taskStats.totalTasks}</p>
                <p>Đánh giá trung bình: {lastInterval.taskStats.avgRating ? `${lastInterval.taskStats.avgRating.toFixed(2)}/5` : 'Chưa có đánh giá'}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="card-title">Thống kê đăng nhập</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loginData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Số lượt đăng nhập" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12}>
          <Card className="mb-3">
            <Card.Body>
              <h5 className="card-title">Top công ty theo tỷ lệ tuyển dụng</h5>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Tên công ty</th>
                    <th>Số dự án</th>
                    <th>Dự án đang tuyển</th>
                    <th>Tỷ lệ tuyển dụng</th>
                  </tr>
                </thead>
                <tbody>
                  {topCompaniesByProjects.map((company, index) => (
                    <tr key={company._id}>
                      <td>
                        {company.companyLogo && (
                          <img 
                            src={company.companyLogo} 
                            alt={company.companyName} 
                            style={{ width: '30px', height: '30px', marginRight: '10px', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        )}
                        {company.companyName}
                      </td>
                      <td>{company.projectCount}</td>
                      <td>{company.recruitingProjectCount}</td>
                      <td style={{ width: '30%' }}>
                        <div className="d-flex align-items-center">
                          <ProgressBar 
                            now={company.recruitmentRate * 100} 
                            style={{ flexGrow: 1, height: '20px' }}
                            variant={getProgressBarVariant(company.recruitmentRate)}
                          />
                          <span className="ml-2" style={{ minWidth: '60px', textAlign: 'right' }}>
                            {(company.recruitmentRate * 100).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Hàm helper để xác định màu sắc cho ProgressBar
const getProgressBarVariant = (rate) => {
  if (rate < 0.3) return 'danger';
  if (rate < 0.7) return 'warning';
  return 'success';
};

export default Dashboard;