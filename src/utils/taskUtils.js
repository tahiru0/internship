import dayjs from 'dayjs';

// Constants
export const MAX_TASKS_DISPLAY = 3;

// Task status colors
export const STATUS_COLORS = {
  'Assigned': '#1890ff',
  'In Progress': '#fa8c16',
  'Submitted': '#722ed1',
  'Completed': '#52c41a',
  'Rejected': '#f5222d',
  'Overdue': '#ff4d4f',
  'Pending': '#faad14'
};

// Utility functions
export const getTaskStatus = (status) => {
  return status;
};

export const getEventColor = (status) => {
  return STATUS_COLORS[status] || '#d9d9d9';
};

export const formatEvents = (tasks) => {
  return tasks.map(task => ({
    id: task._id,
    title: task.name,
    start: task.deadline,
    end: dayjs(task.deadline).add(1, 'hour').toDate(),
    backgroundColor: getEventColor(task.status),
    extendedProps: {
      status: task.status,
      project: task.project?.title,
      description: task.description,
      mentor: task.project?.mentor,
      companyLogo: task.project?.companyLogo
    }
  }));
};
