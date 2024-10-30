import React, { useState, useEffect, useRef } from 'react';
import { ConfigProvider, Spin, Badge, Modal, Upload, Button, Empty, message as antMessage, Tabs, List, Input, Tooltip } from 'antd';
import { gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { useStudent } from '../../context/StudentContext';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import dayjs from 'dayjs';
import { ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import {
  DashboardContainer,
  CalendarContainer,
  EventContent,
  CompanyLogo,
  EventTitle,
  TooltipContent,
  TooltipHeader,
  TaskDetailContainer,
  TaskSection,
  MentorInfo,
  TaskListItem
} from './styled/DashboardStyled';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅 Chào buổi sáng';
  if (hour < 18) return '☀️ Chào buổi chiều';
  return '🌙 Chào buổi tối';
};

const { TabPane } = Tabs;

// Thêm constant cho số lượng task hiển thị mặc định
const MAX_TASKS_DISPLAY = 3;

const Dashboard = () => {

  const { loading, userData } = useStudent();
  const [tasks, setTasks] = useState([]);
  const [apiMessage, setApiMessage] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayTasksModalVisible, setDayTasksModalVisible] = useState(false);
  const ganttContainerRef = useRef(null);

  const fetchTasks = async () => {
    console.log("Đang fetch tasks...");
    try {
      const response = await axiosInstance.get('/task/student-tasks', withAuth());
      console.log("Response từ API:", response.data);
      
      if (response.data.message) {
        setApiMessage(response.data.message);
      }
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      antMessage.error('Không thể tải danh sách task');
      setTasks([]);
    }
  };

  useEffect(() => {
    console.log("useEffect fetch tasks được gọi");
    fetchTasks();
  }, []);

  const formatTasksForGantt = (tasks) => {
    return tasks.map(task => ({
      id: task._id,
      text: task.name,
      start_date: new Date(task.createdAt),
      end_date: new Date(task.deadline),
      status: task.status,
      project: task.project?.title,
      description: task.description,
      mentor: task.project?.mentor,
      companyLogo: task.project?.companyLogo
    }));
  };

  // Khởi tạo Gantt
  useEffect(() => {
    if (!ganttContainerRef.current) return;
    
    gantt.init(ganttContainerRef.current);
    
    // Thêm template để tô màu task và các styles cơ bản
    gantt.templates.task_class = function(start, end, task) {
      switch (task.status) {
        case 'Assigned': return 'task-assigned';
        case 'In Progress': return 'task-in-progress';
        case 'Submitted': return 'task-submitted';
        case 'Completed': return 'task-completed';
        case 'Rejected': return 'task-rejected';
        case 'Overdue': return 'task-overdue';
        case 'Pending': return 'task-pending';
        default: return '';
      }
    };

    // Combine all styles into one styleSheet
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      /* Task status styles */
      .task-assigned .gantt_task_progress_drag { display: none !important; }
      .task-assigned .gantt_task_content,
      .task-assigned .gantt_task_progress { background: #1890ff; }
      
      .task-in-progress .gantt_task_progress_drag { display: none !important; }
      .task-in-progress .gantt_task_content,
      .task-in-progress .gantt_task_progress { background: #fa8c16; }
      
      .task-submitted .gantt_task_progress_drag { display: none !important; }
      .task-submitted .gantt_task_content,
      .task-submitted .gantt_task_progress { background: #722ed1; }
      
      .task-completed .gantt_task_progress_drag { display: none !important; }
      .task-completed .gantt_task_content,
      .task-completed .gantt_task_progress { background: #52c41a; }
      
      .task-rejected .gantt_task_progress_drag { display: none !important; }
      .task-rejected .gantt_task_content,
      .task-rejected .gantt_task_progress { background: #f5222d; }
      
      .task-overdue .gantt_task_progress_drag { display: none !important; }
      .task-overdue .gantt_task_content,
      .task-overdue .gantt_task_progress { background: #ff4d4f; }
      
      .task-pending .gantt_task_progress_drag { display: none !important; }
      .task-pending .gantt_task_content,
      .task-pending .gantt_task_progress { background: #faad14; }

      /* Task appearance */
      .gantt_task_line {
        border-radius: 20px;
        height: 28px !important;
        line-height: 28px !important;
        margin-top: 5px;
      }

      .gantt_task_content {
        color: white !important;
        font-weight: bold;
      }

      /* Grid styles */
      .gantt_grid_data .gantt_cell {
        font-size: 13px;
        padding: 5px 10px;
      }

      /* Resize handle styles */
      .gantt_grid_column_resize_wrap {
        cursor: col-resize;
        opacity: 0.3;
        transition: opacity 0.2s;
      }
      .gantt_grid_column_resize_wrap:hover {
        opacity: 1;
      }
      
      .gantt_grid_head_cell {
        font-weight: bold;
        color: #1a1a1a;
        background-color: #f5f5f5;
        border-right: 1px solid #e8e8e8;
      }

      .gantt_grid_column_resize_line {
        background-color: #1890ff;
        width: 2px;
      }
    `;
    document.head.appendChild(styleSheet);

    // Config for columns and grid
    gantt.config.grid_resize = true;
    gantt.config.grid_width = 800;
    gantt.config.min_grid_column_width = 100;
    gantt.config.grid_elastic_columns = true;
    
    gantt.config.columns = [
      {
        name: "text", 
        label: "Task", 
        tree: true, 
        width: 300,
        resize: true,
        min_width: 150
      },
      {
        name: "start_date", 
        label: "Bắt đầu", 
        align: "center", 
        width: 200,
        resize: true,
        min_width: 120,
        template: function(task) {
          return dayjs(task.start_date).format('DD/MM/YYYY HH:mm');
        }
      },
      {
        name: "end_date", 
        label: "Deadline", 
        align: "center", 
        width: 200,
        resize: true,
        min_width: 120,
        template: function(task) {
          return dayjs(task.end_date).format('DD/MM/YYYY HH:mm');
        }
      },
      {
        name: "status", 
        label: "Trạng thái", 
        align: "center", 
        width: 200,
        resize: true,
        min_width: 100,
        template: function(task) {
          const statusColors = {
            'Assigned': '#1890ff',
            'In Progress': '#fa8c16',
            'Submitted': '#722ed1',
            'Completed': '#52c41a',
            'Rejected': '#f5222d',
            'Overdue': '#ff4d4f',
            'Pending': '#faad14'
          };
          return `<span style="color: ${statusColors[task.status] || '#000'}; font-weight: bold;">
            ${getTaskStatus(task.status)}
          </span>`;
        }
      }
    ];

    gantt.config.date_format = "%Y-%m-%d %H:%i";
    gantt.config.scale_unit = "day";
    gantt.config.date_scale = "%d/%m";
    gantt.config.subscales = [
      {unit: "hour", step: 6, date: "%H:%i"}
    ];
    
    gantt.config.drag_move = false;
    gantt.config.drag_progress = false;
    gantt.config.drag_resize = false;
    gantt.config.drag_links = false;
    
    

    gantt.attachEvent("onTaskClick", (id) => {
      const task = tasks.find(t => t._id === id);
      if (task) {
        setSelectedTask(task);
        setModalVisible(true);
      }
    });

    return () => {
      gantt.clearAll();
    };
  }, [ganttContainerRef.current]);

  // Cập nhật dữ liệu cho Gantt khi tasks thay đổi
  useEffect(() => {
    if (tasks.length > 0) {
      console.log("Cập nhật dữ liệu Gantt với tasks:", tasks);
      const ganttTasks = formatTasksForGantt(tasks);
      gantt.clearAll();
      gantt.parse({
        data: ganttTasks
      });
    }
  }, [tasks]);

  // Cập nhật getTaskStatus để chỉ trả về text
  const getTaskStatus = (status) => {
    return status;
  };

  // Cập nhật getEventColor để xử lý màu sắc
  const getEventColor = (status) => {
    const colors = {
      'Assigned': '#1890ff',
      'In Progress': '#fa8c16',
      'Submitted': '#722ed1',
      'Completed': '#52c41a',
      'Rejected': '#f5222d',
      'Overdue': '#ff4d4f',
      'Pending': '#faad14'
    };
    return colors[status] || '#d9d9d9';
  };

  const events = tasks.map(task => {
    const startDate = new Date(task.deadline);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() - 1);

    return {
      id: task._id,
      title: task.name,
      start: endDate,
      end: startDate,
      allDay: false,
      display: 'block',
      backgroundColor: 'transparent', // Nền trong suốt
      textColor: getEventColor(task.status), // Dùng màu status cho chữ
      borderColor: 'transparent', // Bỏ viền
      extendedProps: {
        status: task.status,
        project: task.project?.title,
        description: task.description,
        mentor: task.project?.mentor,
        companyLogo: task.project?.companyLogo,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    };
  });

  const handleEventClick = (info) => {
    const taskId = info.event.id;
    const task = tasks.find(t => t._id === taskId);
    if (task) {
      setSelectedTask(task);
      setModalVisible(true);
    }
  };

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const { extendedProps } = event;
    
    return (
      <Tooltip 
        title={
          <TooltipContent>
            <TooltipHeader>
              <CompanyLogo 
                src={extendedProps.companyLogo} 
                alt="company" 
                size="medium"
              />
              <div style={{ flex: 1 }}>
                <div className="company-name">{extendedProps.project}</div>
                <span style={{ color: getEventColor(extendedProps.status) }}>
                  {extendedProps.status}
                </span>
              </div>
            </TooltipHeader>
            <div className="tooltip-content">
              <div className="tooltip-item">
                <strong>Task:</strong>
                <span style={{ flex: 1 }}>{event.title}</span>
              </div>
              <div className="tooltip-item">
                <strong>Deadline:</strong>
                <span>{dayjs(event.start).format('HH:mm DD/MM/YYYY')}</span>
              </div>
              {extendedProps.mentor && (
                <div className="tooltip-item">
                  <strong>Mentor:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img 
                      src={extendedProps.mentor.avatar} 
                      alt="mentor" 
                      style={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: '50%' 
                      }} 
                    />
                    <span>{extendedProps.mentor.name}</span>
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        }
        placement="top"
        overlayStyle={{ maxWidth: 400 }}
      >
        <EventContent>
          <CompanyLogo 
            src={extendedProps.companyLogo} 
            alt="company"
          />
          <EventTitle>{event.title}</EventTitle>
        </EventContent>
      </Tooltip>
    );
  };

  const dayCellContent = (arg) => {
    const dayTasks = events.filter(event => 
      dayjs(event.start).format('YYYY-MM-DD') === arg.date.format('YYYY-MM-DD')
    );

    if (dayTasks.length === 0) return null;

    const visibleTasks = dayTasks.slice(0, MAX_TASKS_DISPLAY);
    const remainingCount = dayTasks.length - MAX_TASKS_DISPLAY;

    return (
      <div className="day-cell-content">
        {visibleTasks.map((task, index) => (
          <div key={task.id} className="day-task">
            <img 
              src={task.extendedProps.companyLogo} 
              alt="company" 
              className="company-logo-small"
            />
            <span>{task.title}</span>
          </div>
        ))}
        {remainingCount > 0 && (
          <Button 
            size="small" 
            type="link" 
            onClick={(e) => {
              e.stopPropagation();
              // Hiển thị modal với tất cả tasks trong ngày
              setSelectedDate(arg.date);
              setDayTasksModalVisible(true);
            }}
          >
            +{remainingCount} task khác
          </Button>
        )}
      </div>
    );
  };

  // Gộp thành một modal duy nhất
  const TaskDetailModal = ({ visible, task, onClose, onSubmit }) => {
    const [files, setFiles] = useState([]);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      try {
        setSubmitting(true);
        const formData = new FormData();
        files.forEach(file => {
          formData.append('files', file);
        });
        formData.append('comment', comment);

        const response = await axiosInstance.post(`/task/${task._id}/submit`, formData, {
          ...withAuth(),
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        antMessage.success('Nộp task thành công');
        onSubmit(response.data.task);
        onClose();
      } catch (error) {
        antMessage.error(error.response?.data?.message || 'Có lỗi xảy ra');
      } finally {
        setSubmitting(false);
      }
    };

    if (!task) return null;
    
    return (
      <Modal
        title={
          <div className="modal-title" style={{display: 'flex', alignItems: 'center'}}>
            <img 
              src={task.project?.companyLogo} 
              alt="company" 
              style={{  height: '45px', objectFit: 'contain', marginRight: '10px' }}
            />
            <div>
              <h3>{task.project?.title}</h3>
              <div className="task-status">
                <Badge 
                  {...getStatusBadgeProps(task.status)}
                  text={<span style={{ color: getStatusBadgeProps(task.status).color }}>{task.status}</span>}
                />
              </div>
            </div>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width={700}
        footer={[
          <Button key="close" onClick={onClose}>
            Đóng
          </Button>,
          task.status !== 'Completed' && (
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleSubmit}
              loading={submitting}
            >
              Nộp task
            </Button>
          )
        ]}
      >
        <TaskDetailContainer>
          <TaskSection>
            <h4>Thông tin task</h4>
            <div className="task-info">
              <div className="info-item">
                <div className="label">Tên task:</div>
                <div className="value">{task.name}</div>
              </div>
              <div className="info-item">
                <div className="label">Deadline:</div>
                <div className="value">{dayjs(task.deadline).format('HH:mm DD/MM/YYYY')}</div>
              </div>
              <div className="info-item">
                <div className="label">Mô tả:</div>
                <div className="value description">{task.description}</div>
              </div>
            </div>
          </TaskSection>

          <TaskSection>
            <h4>Mentor phụ trách</h4>
            <MentorInfo>
              <img 
                src={task.project?.mentor?.avatar} 
                alt="mentor" 
                className="mentor-avatar"
              />
              <div className="mentor-details">
                <div className="mentor-name">{task.project?.mentor?.name}</div>
              </div>
            </MentorInfo>
          </TaskSection>

          {task.materialFiles?.length > 0 && (
            <TaskSection>
              <h4>Tài liệu đính kèm</h4>
              <List
                dataSource={task.materialFiles}
                renderItem={(file, index) => (
                  <List.Item>
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      {file.name}
                    </a>
                  </List.Item>
                )}
              />
            </TaskSection>
          )}

          <TaskSection>
            <h4>Thời gian</h4>
            <div className="time-info">
              <div className="info-item">
                <ClockCircleOutlined /> Tạo lúc: {dayjs(task.createdAt).format('HH:mm DD/MM/YYYY')}
              </div>
              <div className="info-item">
                <SyncOutlined /> Cập nhật: {dayjs(task.updatedAt).format('HH:mm DD/MM/YYYY')}
              </div>
            </div>
          </TaskSection>

          {/* Thêm phần upload file và comment */}
          {task.status !== 'Completed' && (
            <TaskSection>
              <h4>Nộp task</h4>
              <Upload
                multiple
                beforeUpload={(file) => {
                  setFiles(prev => [...prev, file]);
                  return false;
                }}
                onRemove={(file) => {
                  setFiles(prev => prev.filter(f => f !== file));
                }}
              >
                <Button>Chọn file</Button>
              </Upload>
              <Input.TextArea
                placeholder="Nhập comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="mt-3"
                rows={4}
              />
            </TaskSection>
          )}
        </TaskDetailContainer>
      </Modal>
    );
  };

  // Thêm modal hiển thị tất cả tasks trong ngày
  const DayTasksModal = ({ visible, date, onClose }) => {
    if (!date) return null;

    const dayTasks = tasks.filter(task => 
      dayjs(task.deadline).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
    );

    return (
      <Modal
        title={`Tasks ngày ${dayjs(date).format('DD/MM/YYYY')}`}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        <List
          dataSource={dayTasks}
          renderItem={task => (
            <List.Item
              onClick={() => {
                setSelectedTask(task);
                setModalVisible(true);
                onClose();
              }}
              className="task-list-item"
            >
              <List.Item.Meta
                avatar={
                  <img 
                    src={task.project?.companyLogo} 
                    alt="company" 
                    className="company-logo-medium" 
                  />
                }
                title={task.name}
                description={
                  <div>
                    <div>{task.project?.title}</div>
                    <div>Deadline: {dayjs(task.deadline).format('HH:mm')}</div>
                  </div>
                }
              />
              <Badge 
                {...getStatusBadgeProps(task.status)}
                text={<span style={{ color: getStatusBadgeProps(task.status).color }}>{task.status}</span>}
              />
            </List.Item>
          )}
        />
      </Modal>
    );
  };

  // Thêm hàm getStatusBadgeProps để xử lý màu sắc và status
  const getStatusBadgeProps = (status) => {
    const statusConfig = {
      'Assigned': {
        status: 'processing',
        color: '#1890ff'
      },
      'In Progress': {
        status: 'processing',
        color: '#fa8c16'
      },
      'Submitted': {
        status: 'warning',
        color: '#722ed1'
      },
      'Completed': {
        status: 'success',
        color: '#52c41a'
      },
      'Rejected': {
        status: 'error',
        color: '#f5222d'
      },
      'Overdue': {
        status: 'error',
        color: '#ff4d4f'
      },
      'Pending': {
        status: 'warning',
        color: '#faad14'
      }
    };

    return statusConfig[status] || { status: 'default', color: '#d9d9d9' };
  };

  return (
    <ConfigProvider>
      <DashboardContainer className="container">
        <h3 className="mb-4">{`${getGreeting()}, ${userData?.name || 'Sinh viên'}!`}</h3>
        
        {loading ? (
          <Spin size="large" />
        ) : (
          <CalendarContainer>
            {Array.isArray(tasks) && tasks.length > 0 ? (
              <div 
                ref={ganttContainerRef}
                style={{width: '100%', height: '500px'}}
              />
            ) : (
              <Empty 
                description={
                  <div className="text-center">
                    <p>{apiMessage || 'Bạn chưa được giao task nào'}</p>
                    {apiMessage && (
                      <Button 
                        type="primary" 
                        onClick={() => window.location.href = '/jobs'}
                        className="mt-3"
                      >
                        Tìm thực tập
                      </Button>
                    )}
                  </div>
                }
                className="mt-4"
              />
            )}
          </CalendarContainer>
        )}

        {/* Thêm DayTasksModal */}
        <DayTasksModal
          visible={dayTasksModalVisible}
          date={selectedDate}
          onClose={() => setDayTasksModalVisible(false)}
        />
        
        <TaskDetailModal 
          visible={modalVisible}
          task={selectedTask}
          onClose={() => setModalVisible(false)}
          onSubmit={(updatedTask) => {
            setTasks(prev => prev.map(t => 
              t._id === updatedTask._id ? updatedTask : t
            ));
          }}
        />
      </DashboardContainer>
    </ConfigProvider>
  );
};

export default Dashboard;
