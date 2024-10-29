import styled from 'styled-components';

export const DashboardContainer = styled.div`
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  padding: 24px;
`; 

export const CalendarContainer = styled.div`
  flex: 1;
  min-height: 0;
  height: calc(100vh - 280px); // Chiều cao cố định trừ đi header và padding
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden; // Ẩn overflow của container

  .fc {
    flex: 1;
    height: 100% !important;
    overflow: auto; // Cho phép cuộn trong calendar
  }

  .fc-view-harness {
    height: 100% !important;
  }

  .fc-scroller {
    height: 100% !important;
    overflow-y: auto !important; // Cho phép cuộn dọc
  }

  // Tùy chỉnh thanh cuộn
  .fc-scroller::-webkit-scrollbar {
    width: 8px;
  }

  .fc-scroller::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .fc-scroller::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  .fc-scroller::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .fc-timegrid-event {
    min-height: 50px !important;
    margin: 1px 0 !important;
    padding: 4px !important;
  }

  .fc-toolbar-title {
    font-size: 1.2em !important;
  }

  .fc-event {
    cursor: pointer;
    background: transparent !important;
    border: none !important;
  }

  .fc-event-title {
    color: inherit !important;
    font-weight: 500;
    font-size: 0.9em;
  }

  .fc-event-time {
    color: inherit !important;
    font-size: 0.8em;
  }

  .fc-daygrid-event {
    margin: 1px 2px !important;
    padding: 2px 4px !important;
    height: 20px !important;
    min-height: 20px !important;
    max-height: 20px !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    background: transparent !important;
    border: none !important;
  }

  .fc-daygrid-day-events {
    min-height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .fc-daygrid-event-harness {
    margin: 2px 0 !important;
    width: 100% !important;
  }

  // Đảm bảo event không bị kéo dài
  .fc-h-event {
    border: none !important;
    background: none !important;
    display: block !important;
  }

  // Style cho "+more" link
  .fc-daygrid-more-link {
    margin: 0 !important;
    padding: 2px 4px !important;
    color: #1677ff !important;
    font-size: 0.9em !important;
    z-index: 1 !important;
  }

  // Tăng z-index cho tooltip để hiển thị trên "+more"
  .ant-tooltip {
    z-index: 9999 !important;
  }

  // Đảm bảo màu chữ không bị ghi đè
  .fc-event-title-container,
  .fc-event-main-frame {
    color: inherit !important;
  }

  // Giảm chiều cao của ô ngày
  .fc-daygrid-day-frame {
    min-height: 70px !important; // Giảm chiều cao tối thiểu
    height: auto !important;
  }
`;

export const EventContent = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px;
  overflow: hidden;
  max-height: 20px !important;
`;

export const CompanyLogo = styled.img`
  width: ${props => props.size === 'medium' ? '32px' : '20px'};
  height: ${props => props.size === 'medium' ? '32px' : '20px'};
  border-radius: 4px;
  object-fit: contain;
  min-width: ${props => props.size === 'medium' ? '32px' : '20px'};
  max-width: ${props => props.size === 'medium' ? '32px' : '20px'};
`;

export const EventTitle = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

export const TooltipContent = styled.div`
  padding: 12px;
  max-width: 300px;
  z-index: 9999 !important;
`;

export const TooltipHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
`;

export const TaskDetailContainer = styled.div`
  padding: 16px 0;

  .modal-title {
    display: flex;
    align-items: center;
    gap: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
    }

    .company-logo-medium {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      object-fit: contain;
      min-width: 40px;
      max-width: 40px;
    }

    .task-status {
      margin-top: 4px;
    }
  }

  .task-info {
    .info-item {
      display: flex;
      margin-bottom: 12px;
      
      .label {
        width: 100px;
        color: #666;
        flex-shrink: 0;
      }

      .value {
        flex: 1;
        
        &.description {
          white-space: pre-wrap;
        }
      }
    }
  }

  .time-info {
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #666;
    }
  }

  .mentor-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }

  .mentor-details {
    .mentor-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
  }

  .ant-upload-list {
    margin-top: 12px;
  }

  .mt-3 {
    margin-top: 12px;
  }
`;

export const TaskSection = styled.div`
  margin-bottom: 24px;

  h4 {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  }
`;

export const MentorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
`;

export const TaskListItem = styled.div`
  cursor: pointer;
  padding: 12px !important;
  border-radius: 6px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f5f5f5;
  }
`;

export const TaskListContainer = styled.div`
  .task-list-item {
    cursor: pointer;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #f5f5f5;
    }

    .company-logo-medium {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      object-fit: contain;
      min-width: 40px;
      max-width: 40px;
    }
  }
`;

export const DayTasksModalContent = styled.div`
  .task-list-item {
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    
    &:hover {
      background-color: #f5f5f5;
    }

    .ant-list-item-meta-avatar {
      img {
        width: 32px;
        height: 32px;
        border-radius: 4px;
      }
    }
  }
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`;

export const UploadSection = styled.div`
  margin-top: 16px;
  
  .ant-upload-list {
    margin-top: 8px;
  }

  .ant-input-textarea {
    margin-top: 16px;
  }
`;
