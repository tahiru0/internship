import React, { useState, useEffect, useContext } from 'react';
import { Form, Input, Button, Select, Table, message, TimePicker, Space, Modal, Switch, Tabs, Alert, Card, Statistic, Row, Col } from 'antd';
import { SaveOutlined, UndoOutlined, DatabaseOutlined, FileSearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import moment from 'moment';
import 'moment/locale/vi'; // Import ngôn ngữ tiếng Việt
import { MaintenanceContext } from '../../context/MaintenanceContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const Settings = () => {
  const [backupConfig, setBackupConfig] = useState({});
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBackupModalVisible, setIsBackupModalVisible] = useState(false);
  const [backupName, setBackupName] = useState('');
  const { maintenanceMode, setMaintenanceMode } = useContext(MaintenanceContext);
  const { axiosInstance } = useAuthorization();
  const [form] = Form.useForm();
  const [isRestoreModalVisible, setIsRestoreModalVisible] = useState(false);
  const [restoreFileName, setRestoreFileName] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzeModalVisible, setIsAnalyzeModalVisible] = useState(false);
  const [analyzePassword, setAnalyzePassword] = useState('');
  const [analyzeFileName, setAnalyzeFileName] = useState('');
  const [isMaintenanceWarningVisible, setIsMaintenanceWarningVisible] = useState(false);
  const [undoTimer, setUndoTimer] = useState(null);
  const [notificationKey, setNotificationKey] = useState(null);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isAnalysisModalVisible, setIsAnalysisModalVisible] = useState(false);

  moment.locale('vi'); // Đặt ngôn ngữ cho moment là tiếng Việt

  useEffect(() => {
    fetchBackupConfig();
    fetchBackups();
    fetchMaintenanceMode();
  }, []);

  const fetchBackupConfig = async () => {
    try {
      const response = await axiosInstance.get('/admin/backup-config');
      setBackupConfig(response.data.config);
      form.setFieldsValue({
        ...response.data.config,
        dayOfWeek: response.data.config.schedule.dayOfWeek,
        backupTime: moment(response.data.config.schedule.time, 'HH:mm'),
        retentionPeriod: response.data.config.retentionPeriod,
        password: response.data.config.password,
      });
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải cấu hình sao lưu');
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await axiosInstance.get('/admin/backups');
      setBackups(response.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách bản sao lưu');
    }
  };

  const fetchMaintenanceMode = async () => {
    try {
      const response = await axiosInstance.get('/admin/maintenance');
      setMaintenanceMode(response.data || { isActive: false, message: '' });
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải trạng thái Bo trì hệ thống');
      setMaintenanceMode({ isActive: false, message: '' });
    }
  };

  const handleBackupConfigSubmit = async (values) => {
    setLoading(true);
    try {
      const configToSubmit = {
        schedule: {
          frequency: 'weekly',
          dayOfWeek: values.dayOfWeek,
          time: values.backupTime.format('HH:mm'),
        },
        password: values.password,
        retentionPeriod: values.retentionPeriod,
      };
      await axiosInstance.post('/admin/backup-config', configToSubmit);
      message.success('Cấu hình sao lưu đã được cập nhật');
      fetchBackupConfig();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật cấu hình sao lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupModalOk = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/admin/backup', { backupName: backupName.trim() });
      message.success('Sao lưu thành công');
      fetchBackups();
      setIsBackupModalVisible(false);
      setBackupName('');
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo bản sao lưu');
    } finally {
      setLoading(false);
    }
  };

  const showRestoreModal = (fileName) => {
    if (!maintenanceMode.isActive) {
      setIsMaintenanceWarningVisible(true);
    } else {
      setRestoreFileName(fileName);
      setIsRestoreModalVisible(true);
    }
  };

  const handleMaintenanceWarningOk = async () => {
    try {
      await axiosInstance.post('/admin/maintenance', {
        isActive: true,
        message: maintenanceMode.message || 'Hệ thống đang trong Bảo trì hệ thống.',
      });
      setMaintenanceMode({ ...maintenanceMode, isActive: true });
      message.success('Đã bật Bảo trì hệ thống');
      setIsMaintenanceWarningVisible(false);
      // Hiển thị modal khôi phục sau khi bật Bảo trì hệ thống
      setIsRestoreModalVisible(true);
    } catch (error) {
      message.error('Không thể bật Bảo trì hệ thống');
    }
  };

  const handleRestoreModalOk = async () => {
    if (!restorePassword) {
      message.error('Vui lòng nhập mật khẩu sao lưu');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post('/admin/analyze-backup', {
        backupFileName: restoreFileName,
        password: restorePassword
      });
      setAnalysisResult(response.data.analysis);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể phân tích bản sao lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/admin/restore-backup', {
        backupFileName: restoreFileName,
        password: restorePassword
      });
      
      if (response.data && response.data.success) {
        message.success(response.data.message || 'Khôi phục sao lưu thành công');
        
        if (response.data.canUndo && response.data.undoExpiresIn) {
          showUndoNotification(response.data.undoExpiresIn);
        }
      } else {
        throw new Error(response.data?.message || 'Khôi phục sao lưu không thành công');
      }
    } catch (error) {
      message.error(error.message || 'Không thể khôi phục bản sao lưu');
    } finally {
      setLoading(false);
      setIsAnalysisModalVisible(false);
      setRestorePassword('');
      setAnalysisResult(null);
    }
  };

  const handleUndoRestore = async () => {
    if (undoTimer) {
      clearInterval(undoTimer);
      setUndoTimer(null);
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/admin/undo-restore');
      console.log('Undo Response:', response); // Log để kiểm tra

      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Đã hoàn tác khôi phục sao lưu', {
          autoClose: 5000,
          closeButton: true,
          closeOnClick: false,
        });
      } else {
        throw new Error(response.data?.message || 'Không thể hoàn tác khôi phục sao lưu');
      }
    } catch (error) {
      console.error('Error in handleUndoRestore:', error);
      toast.error(error.message || 'Không thể hoàn tác khôi phục sao lưu', {
        autoClose: 5000,
        closeButton: true,
        closeOnClick: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const showUndoNotification = (expiresIn) => {
    let remainingTime = expiresIn;
    const toastId = toast.info(
      ({ closeToast }) => (
        <div>
          Bạn có thể hoàn tác trong {remainingTime} giây
          <br />
          <Button type="primary" size="small" onClick={() => {
            closeToast();
            handleUndoRestore();
          }}>
            Hoàn tác
          </Button>
        </div>
      ),
      {
        autoClose: expiresIn * 1000,
        closeOnClick: false,
        closeButton: true,
        position: 'bottom-right',
      }
    );

    const timer = setInterval(() => {
      remainingTime -= 1;
      if (remainingTime <= 0) {
        clearInterval(timer);
        toast.dismiss(toastId);
      } else {
        toast.update(toastId, {
          render: ({ closeToast }) => (
            <div>
              Bạn có thể hoàn tác trong {remainingTime} giây
              <br />
              <Button type="primary" size="small" onClick={() => {
                closeToast();
                handleUndoRestore();
              }}>
                Hoàn tác
              </Button>
            </div>
          ),
        });
      }
    }, 1000);

    setUndoTimer(timer);
  };

  const handleRestoreModalCancel = () => {
    setIsRestoreModalVisible(false);
    setRestorePassword('');
  };

  const handleMaintenanceModeChange = async (checked) => {
    try {
      const response = await axiosInstance.post('/admin/maintenance', {
        isActive: checked,
        message: maintenanceMode.message || '',
      });
      
      const newMaintenanceMode = response.data.config || { isActive: false, message: '' };
      setMaintenanceMode(newMaintenanceMode);
      
      message.success(`Bảo trì hệ thống đã được ${newMaintenanceMode.isActive ? 'bật' : 'tắt'}`);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái bảo trì:', error);
      message.error(error.response?.data?.message || 'Không thể cập nhật Bảo trì hệ thống');
    }
  };

  const handleMaintenanceMessageChange = async (value) => {
    try {
      const response = await axiosInstance.post('/admin/maintenance', {
        isActive: maintenanceMode.isActive,
        message: value,
      });
      setMaintenanceMode(response.data);
      message.success('Thông báo bảo trì đã được cập nhật');
    } catch (error) {
      console.error('Lỗi khi cập nhật thông báo bảo trì:', error);
      message.error(error.response?.data?.message || 'Không thể cập nhật thông báo bảo trì');
      // Khôi phục thông báo cũ nếu có lỗi
      setMaintenanceMode(prevState => ({ ...prevState, message: prevState.message }));
    }
  };

  const showAnalyzeModal = (fileName) => {
    setAnalyzeFileName(fileName);
    setIsAnalyzeModalVisible(true);
  };

  const handleAnalyzeModalOk = async () => {
    if (!analyzePassword) {
      message.error('Vui lòng nhập mật khẩu sao lưu');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post('/admin/analyze-backup', {
        backupFileName: analyzeFileName,
        password: analyzePassword
      });
      setAnalysisResult(response.data.analysis);
      message.success('Phân tích sao lưu thành công');
      setIsAnalyzeModalVisible(false);
      setAnalyzePassword('');
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể phân tích bản sao lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeModalCancel = () => {
    setIsAnalyzeModalVisible(false);
    setAnalyzePassword('');
  };

  const formatTimeAgo = (date) => {
    const now = moment();
    const createdAt = moment(date);
    const duration = moment.duration(now.diff(createdAt));

    if (duration.asYears() >= 1) {
      return `${Math.floor(duration.asYears())} năm trước`;
    } else if (duration.asMonths() >= 1) {
      return `${Math.floor(duration.asMonths())} tháng trước`;
    } else if (duration.asDays() >= 1) {
      return `${Math.floor(duration.asDays())} ngày trước`;
    } else if (duration.asHours() >= 1) {
      return `${Math.floor(duration.asHours())} giờ trước`;
    } else if (duration.asMinutes() >= 1) {
      return `${Math.floor(duration.asMinutes())} phút trước`;
    } else {
      return 'Vừa xong';
    }
  };

  const columns = [
    {
      title: 'Tên file',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span>{text}</span>,
    },
    {
      title: 'Kích thước',
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        if (typeof size === 'number') {
          // Nếu size là số, chuyển đổi sang MB
          return `${(size / 1024 / 1024).toFixed(2)} MB`;
        } else if (typeof size === 'string') {
          // Nếu size là chuỗi, hiển thị nguyên bản
          return size;
        }
        return 'N/A'; // Trường hợp khác
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span title={moment(date).format('DD/MM/YYYY HH:mm:ss')}>
          {formatTimeAgo(date)}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button onClick={() => showRestoreModal(record.name)} icon={<DatabaseOutlined />}>
          Khôi phục
        </Button>
      ),
    },
  ];

  const daysOfWeek = [
    { value: 0, label: 'Chủ nhật' },
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
  ];

  const retentionPeriods = [
    { value: 7, label: '1 tuần' },
    { value: 14, label: '2 tuần' },
    { value: 30, label: '1 tháng' },
    { value: 90, label: '3 tháng' },
    { value: 180, label: '6 tháng' },
    { value: 365, label: '1 năm' },
  ];

  const BackupConfigTab = () => (
    <Form
      form={form}
      onFinish={handleBackupConfigSubmit}
      layout="vertical"
    >
      <Form.Item label="Lịch sao lưu">
        <Space>
          <span>Sao lưu hàng tuần vào </span>
          <Form.Item name="dayOfWeek" noStyle>
            <Select style={{ width: 120 }}>
              {daysOfWeek.map(day => (
                <Option key={day.value} value={day.value}>{day.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <span> vào lúc </span>
          <Form.Item name="backupTime" noStyle>
            <TimePicker format="HH:mm" />
          </Form.Item>
          <span> và lưu trữ trong </span>
          <Form.Item name="retentionPeriod" noStyle>
            <Select style={{ width: 120 }}>
              {retentionPeriods.map(period => (
                <Option key={period.value} value={period.value}>{period.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Space>
      </Form.Item>
      <Form.Item
        name="password"
        label="Mật khẩu sao lưu"
        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu sao lưu' }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            Lưu cấu hình
          </Button>
          <Button onClick={() => setIsBackupModalVisible(true)} icon={<DatabaseOutlined />} loading={loading}>
            Sao lưu ngay
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const BackupListTab = () => (
    <>
      <Table
        columns={columns}
        dataSource={backups}
        rowKey="name"
        loading={loading}
      />
      <Button onClick={handleUndoRestore} icon={<UndoOutlined />} style={{ marginTop: 16 }}>
        Hoàn tác khôi phục
      </Button>
    </>
  );

  const MaintenanceTab = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Switch
        checked={maintenanceMode?.isActive || false}
        onChange={handleMaintenanceModeChange}
      /> Bật/tắt Bảo trì hệ thống
      <TextArea
        value={maintenanceMode?.message || ''}
        onChange={(e) => handleMaintenanceMessageChange(e.target.value)}
        placeholder="Nhập thông báo bảo trì"
        rows={4}
      />
    </Space>
  );

  const showPasswordModal = (fileName) => {
    if (!maintenanceMode.isActive) {
      setIsMaintenanceWarningVisible(true);
    } else {
      setRestoreFileName(fileName);
      setIsPasswordModalVisible(true);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!restorePassword) {
      message.error('Vui lòng nhập mật khẩu sao lưu');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post('/admin/analyze-backup', {
        backupFileName: restoreFileName,
        password: restorePassword
      });
      setAnalysisResult(response.data.analysis);
      setIsPasswordModalVisible(false);
      setIsAnalysisModalVisible(true);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể phân tích bản sao lưu');
    } finally {
      setLoading(false);
    }
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const changedCollections = Object.entries(analysisResult).filter(
      ([_, value]) => value.toBeAdded > 0 || value.toBeDeleted > 0
    );

    if (changedCollections.length === 0) {
      return <p>Không có thay đổi nào được phát hiện.</p>;
    }

    return (
      <Table
        dataSource={changedCollections.map(([key, value]) => ({
          key,
          collection: key,
          ...value
        }))}
        columns={[
          {
            title: 'Bộ sưu tập',
            dataIndex: 'collection',
            key: 'collection',
          },
          {
            title: 'Sẽ thêm',
            dataIndex: 'toBeAdded',
            key: 'toBeAdded',
            render: (value) => <span style={{ color: '#3f8600' }}>{value}</span>,
          },
          {
            title: 'Sẽ xóa',
            dataIndex: 'toBeDeleted',
            key: 'toBeDeleted',
            render: (value) => <span style={{ color: '#cf1322' }}>{value}</span>,
          },
        ]}
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <div>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Cấu hình sao lưu" key="1">
          <BackupConfigTab />
        </TabPane>
        <TabPane tab="Danh sách bản sao lưu" key="2">
          <BackupListTab />
        </TabPane>
        <TabPane tab="Bảo trì hệ thống" key="3">
          <MaintenanceTab />
        </TabPane>
      </Tabs>

      <Modal
        title="Tạo bản sao lưu mới"
        visible={isBackupModalVisible}
        onOk={handleBackupModalOk}
        onCancel={() => setIsBackupModalVisible(false)}
        confirmLoading={loading}
      >
        <Input
          placeholder="Nhập tên cho bản sao lưu"
          value={backupName}
          onChange={(e) => setBackupName(e.target.value)}
        />
      </Modal>

      <Modal
        title="Cảnh báo"
        visible={isMaintenanceWarningVisible}
        onOk={handleMaintenanceWarningOk}
        onCancel={() => setIsMaintenanceWarningVisible(false)}
        okText="Bật Bảo trì hệ thống"
        cancelText="Hủy"
      >
        <Alert
          message="Bảo trì hệ thống chưa được bật"
          description={
            <div>
              <p>Để đảm bảo an toàn dữ liệu, bạn cần bật Bảo trì hệ thống trước khi khôi phục sao lưu.</p>
              <p>Lưu ý:</p>
              <ul>
                <li>Khi bật Bảo trì hệ thống, người dùng sẽ không thể truy cập hệ thống.</li>
                <li>Hãy đảm bảo thông báo cho người dùng trước khi bật Bảo trì hệ thống.</li>
                <li>Sau khi khôi phục xong, đừng quên tắt Bảo trì hệ thống.</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
        />
      </Modal>

      <Modal
        title="Khôi phục bản sao lưu"
        visible={isRestoreModalVisible}
        onOk={analysisResult ? handleRestore : handleRestoreModalOk}
        onCancel={() => {
          setIsRestoreModalVisible(false);
          setRestorePassword('');
          setAnalysisResult(null);
        }}
        okText={analysisResult ? "Khôi phục" : "Phân tích"}
        cancelText="Hủy"
        confirmLoading={loading}
      >
        {!analysisResult ? (
          <>
            <p>Bạn đang khôi phục bản sao lưu: {restoreFileName}</p>
            <Input.Password
              placeholder="Nhập mật khẩu sao lưu"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
            />
          </>
        ) : (
          <>
            <p>Kết quả phân tích bản sao lưu:</p>
            {renderAnalysisResult()}
          </>
        )}
      </Modal>

      <Modal
        title="Phân tích bản sao lưu"
        visible={isAnalyzeModalVisible}
        onOk={handleAnalyzeModalOk}
        onCancel={handleAnalyzeModalCancel}
        confirmLoading={loading}
      >
        <p>Bạn đang phân tích bản sao lưu: {analyzeFileName}</p>
        <Input.Password
          placeholder="Nhập mật khẩu sao lưu"
          value={analyzePassword}
          onChange={(e) => setAnalyzePassword(e.target.value)}
        />
      </Modal>

      <Modal
        title="Kết quả phân tích sao lưu"
        visible={!!analysisResult}
        onOk={() => setAnalysisResult(null)}
        onCancel={() => setAnalysisResult(null)}
        width={1000}
      >
        {renderAnalysisResult()}
      </Modal>

      <Modal
        title="Nhập mật khẩu sao lưu"
        visible={isPasswordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          setRestorePassword('');
        }}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <p>Bạn đang khôi phục bản sao lưu: {restoreFileName}</p>
        <Input.Password
          placeholder="Nhập mật khẩu sao lưu"
          value={restorePassword}
          onChange={(e) => setRestorePassword(e.target.value)}
        />
      </Modal>

      <Modal
        title="Phân tích bản sao lưu"
        visible={isAnalysisModalVisible}
        onOk={handleRestore}
        onCancel={() => setIsAnalysisModalVisible(false)}
        okText="Khôi phục"
        cancelText="Hủy"
        confirmLoading={loading}
      >
        <p>Những thay đổi:</p>
        {renderAnalysisResult()}
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default Settings;
