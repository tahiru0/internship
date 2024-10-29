import React, { useState, useEffect } from 'react';
import { List, Modal, Button, Input, message, Space, Switch, TimePicker, Select, Form, Pagination, Spin, Typography } from 'antd';
import { FileZipOutlined, EyeOutlined, UndoOutlined, SettingOutlined, PlusOutlined, MinusOutlined, EditOutlined, LoadingOutlined, FileOutlined } from '@ant-design/icons';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import moment from 'moment';
import 'moment/locale/vi';  // Import tiếng Việt cho moment

const { Option } = Select;
const { Text } = Typography;

moment.locale('vi');  // Sử dụng tiếng Việt

const Backup = () => {
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [autoBackupConfig, setAutoBackupConfig] = useState({
    config: {
      isAutoBackup: false,
      schedule: {
        frequency: 'daily',
        dayOfWeek: 0,
        time: '00:00',
      },
      password: '',
      retentionPeriod: 7,
    }
  });
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [newBackupModalVisible, setNewBackupModalVisible] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupPassword, setNewBackupPassword] = useState('');
  const { axiosInstance } = useAuthorization();

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [isAnalyzingBackup, setIsAnalyzingBackup] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [analyzingMessage, setAnalyzingMessage] = useState('');
  const [restoringMessage, setRestoringMessage] = useState('');
  const [backupProgress, setBackupProgress] = useState('');

  useEffect(() => {
    fetchBackups(currentPage, pageSize);
    fetchAutoBackupConfig();
  }, [currentPage, pageSize]);

  const fetchBackups = async (page, limit) => {
    try {
      const response = await axiosInstance.get('/admin/backups', {
        params: { page, limit }
      });
      setBackups(response.data.backups);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải danh sách sao lưu');
    }
  };

  const fetchAutoBackupConfig = async () => {
    try {
      const response = await axiosInstance.get('/admin/backup-config');
      setAutoBackupConfig(response.data.config ? response.data : { config: autoBackupConfig.config });
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tải cấu hình sao lưu tự động');
    }
  };

  const handleBackupClick = (backup) => {
    setSelectedBackup(backup);
    setModalVisible(true);
  };

  const handlePasswordSubmit = async () => {
    setIsAnalyzingBackup(true);
    setAnalyzingMessage('Đang phân tích sao lưu...');
    try {
      let messageIndex = 0;
      const messages = [
        'Đang kiểm tra cấu trúc dữ liệu...',
        'Đang so sánh với dữ liệu hiện tại...',
        'Đang tổng hợp kết quả...',
      ];
      const messageInterval = setInterval(() => {
        setAnalyzingMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 3000);

      const response = await axiosInstance.post('/admin/analyze-backup', {
        backupFileName: selectedBackup.fileName,
        password,
      });
      clearInterval(messageInterval);
      setSelectedBackup({ ...selectedBackup, analysis: response.data });
    } catch (error) {
      message.error(error.response?.data?.message || 'Mật khẩu không đúng hoặc có lỗi xảy ra');
    } finally {
      setIsAnalyzingBackup(false);
      setAnalyzingMessage('');
    }
  };

  const handleRestore = async () => {
    setIsRestoringBackup(true);
    setRestoringMessage('Đang bắt đầu quá trình khôi phục...');
    try {
      let messageIndex = 0;
      const messages = [
        'Đang chuẩn bị dữ liệu...',
        'Đang khôi phục cơ sở dữ liệu...',
        'Đang kiểm tra tính toàn vẹn...',
        'Gần hoàn thành...',
      ];
      const messageInterval = setInterval(() => {
        setRestoringMessage(messages[messageIndex]);
        messageIndex = (messageIndex + 1) % messages.length;
      }, 3000);

      const response = await axiosInstance.post('/admin/restore-backup', {
        backupFileName: selectedBackup.fileName,
        password,
      });
      clearInterval(messageInterval);
      message.success(response.data?.message || 'Khôi phục sao lưu thành công');
      setModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể khôi phục sao lưu');
    } finally {
      setIsRestoringBackup(false);
      setRestoringMessage('');
    }
  };

  const isBackupChanged = (analysis) => {
    if (!analysis) return false;
    return Object.values(analysis).some(collection => 
      collection.added > 0 || collection.removed > 0 || collection.modified > 0
    );
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    let progressIndex = 0;
    const progressMessages = [
      'Đang khởi tạo quá trình sao lưu...',
      'Đang thu thập dữ liệu...',
      'Đang nén và mã hóa dữ liệu...',
      'Đang kiểm tra tính toàn vẹn...',
      'Đang lưu trữ bản sao lưu...',
      'Đang hoàn tất quá trình...',
      'Quá trình có thể kéo dài tùy thuộc vào khối lượng dữ liệu...',
      'Vui lòng không đóng cửa sổ này...',
    ];
    const progressInterval = setInterval(() => {
      setBackupProgress(progressMessages[progressIndex]);
      progressIndex = (progressIndex + 1) % progressMessages.length;
    }, 3000);

    try {
      const response = await axiosInstance.post('/admin/backup', {
        backupName: newBackupName,
        password: newBackupPassword,
      });
      clearInterval(progressInterval);
      message.success(response.data?.message || 'Tạo sao lưu thành công');
      fetchBackups(currentPage, pageSize);
      setNewBackupModalVisible(false);
      setNewBackupName('');
      setNewBackupPassword('');
    } catch (error) {
      clearInterval(progressInterval);
      message.error(error.response?.data?.message || 'Không thể tạo sao lưu');
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress('');
    }
  };

  const handleAutoBackupConfigChange = async (values) => {
    setIsSavingConfig(true);
    try {
      let configToSend = {
        isAutoBackup: values.isAutoBackup,
        schedule: values.isAutoBackup ? {
          frequency: values.schedule?.frequency || 'daily',
          dayOfWeek: values.schedule?.dayOfWeek || 0,
          time: values.schedule?.time ? values.schedule.time.format('HH:mm') : '00:00',
        } : null,
        password: values.isAutoBackup ? values.password : null,
        retentionPeriod: values.isAutoBackup ? values.retentionPeriod : null,
      };
      const response = await axiosInstance.post('/admin/backup-config', configToSend);
      message.success(response.data?.message || 'Cập nhật cấu hình sao lưu tự động thành công');
      setAutoBackupConfig(response.data);
      setConfigModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật cấu hình sao lưu tự động');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
    fetchBackups(page, pageSize);
  };

  const renderChangeItem = (label, value, icon, color) => (
    <div style={{ marginBottom: 8 }}>
      <Space>
        {icon}
        <Text strong>{label}:</Text>
        <Text style={{ color }}>{value}</Text>
      </Space>
    </div>
  );

  const formatDate = (dateString) => {
    const date = moment(dateString);
    const now = moment();
    if (date.isAfter(now)) {
      // Nếu ngày trong tương lai, hiển thị ngày tháng năm
      return date.format('DD/MM/YYYY HH:mm:ss');
    }
    return date.fromNow();
  };

  const getFileIcon = (fileName) => {
    if (fileName.endsWith('.zip')) {
      return <FileZipOutlined style={{ fontSize: 45, color: '#ffa940' }} />;
    } else if (fileName.endsWith('.bson')) {
      return <FileOutlined style={{ fontSize: 45, color: '#52c41a' }} />;
    } else {
      return <FileOutlined style={{ fontSize: 45 }} />;
    }
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button onClick={() => setNewBackupModalVisible(true)} type="primary">
            Tạo sao lưu mới
          </Button>
          <Button onClick={() => setConfigModalVisible(true)} icon={<SettingOutlined />}>
            Cấu hình sao lưu tự động
          </Button>
        </Space>

        <List
          dataSource={backups}
          renderItem={(backup) => (
            <List.Item
              actions={[
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handleBackupClick(backup)}
                >
                  Xem chi tiết
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={getFileIcon(backup.fileName)}
                title={backup.fileName}
                description={`Ngày tạo: ${formatDate(backup.createdAt)} - Kích thước: ${backup.size}`}
              />
            </List.Item>
          )}
        />
        <Pagination
          current={currentPage}
          total={totalItems}
          pageSize={pageSize}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) => `${range[0]}-${range[1]} của ${total} mục`}
        />
      </Space>

      <Modal
        title="Chi tiết sao lưu"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBackup && !selectedBackup.analysis ? (
          <div>
            <Input.Password
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={handlePasswordSubmit} loading={isAnalyzingBackup}>
              Xác nhận
            </Button>
            {isAnalyzingBackup && (
              <div style={{ marginTop: 16 }}>
                <Spin /> {analyzingMessage}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p><Text strong>Tên:</Text> {selectedBackup?.fileName}</p>
            <p><Text strong>Ngày tạo:</Text> {formatDate(selectedBackup?.createdAt)}</p>
            {selectedBackup?.analysis && (
              <div>
                <h4>Phân tích:</h4>
                {isBackupChanged(selectedBackup.analysis) ? (
                  Object.entries(selectedBackup.analysis).map(([collection, changes]) => (
                    <div key={collection} style={{ marginBottom: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 4, backgroundColor: '#f0f2f5' }}>
                      <Text strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>{collection}</Text>
                      {renderChangeItem('Thêm mới', changes.added, <PlusOutlined />, '#52c41a')}
                      {renderChangeItem('Đã xóa', changes.removed, <MinusOutlined />, '#f5222d')}
                      {renderChangeItem('Đã sửa đổi', changes.modified, <EditOutlined />, '#1890ff')}
                    </div>
                  ))
                ) : (
                  <p>Không có gì thay đổi</p>
                )}
              </div>
            )}
            {isBackupChanged(selectedBackup?.analysis) && (
              <div style={{ marginTop: 16 }}>
                <Button icon={<UndoOutlined />} onClick={handleRestore} loading={isRestoringBackup}>
                  Khôi phục
                </Button>
                {isRestoringBackup && (
                  <div style={{ marginTop: 16 }}>
                    <Spin /> {restoringMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Cấu hình sao lưu tự động"
        visible={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
      >
        <Form
          initialValues={{
            isAutoBackup: autoBackupConfig.config?.isAutoBackup || false,
            schedule: {
              frequency: autoBackupConfig.config?.schedule?.frequency || 'daily',
              dayOfWeek: autoBackupConfig.config?.schedule?.dayOfWeek || 0,
              time: autoBackupConfig.config?.schedule?.time ? moment(autoBackupConfig.config.schedule.time, 'HH:mm') : moment('00:00', 'HH:mm'),
            },
            password: autoBackupConfig.config?.password || '',
            retentionPeriod: autoBackupConfig.config?.retentionPeriod || 7,
          }}
          onFinish={handleAutoBackupConfigChange}
        >
          <Form.Item name="isAutoBackup" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.isAutoBackup !== currentValues.isAutoBackup
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('isAutoBackup') ? (
                <>
                  <Form.Item name={['schedule', 'frequency']}>
                    <Select>
                      <Option value="daily">Hàng ngày</Option>
                      <Option value="weekly">Hàng tuần</Option>
                      <Option value="monthly">Hàng tháng</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.schedule?.frequency !== currentValues.schedule?.frequency
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue(['schedule', 'frequency']) === 'weekly' ? (
                        <Form.Item name={['schedule', 'dayOfWeek']}>
                          <Select>
                            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                              <Option key={day} value={day}>
                                {moment().day(day).format('dddd')}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>
                  <Form.Item name={['schedule', 'time']}>
                    <TimePicker format="HH:mm" />
                  </Form.Item>
                  <Form.Item name="password" label="Mật khẩu">
                    <Input.Password />
                  </Form.Item>
                  <Form.Item name="retentionPeriod" label="Thời gian lưu trữ (ngày)">
                    <Input type="number" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSavingConfig}>
              Lưu cấu hình
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo sao lưu mới"
        visible={newBackupModalVisible}
        onCancel={() => {
          setNewBackupModalVisible(false);
          setBackupProgress('');
        }}
        onOk={handleCreateBackup}
        confirmLoading={isCreatingBackup}
      >
        <Input
          placeholder="Tên sao lưu"
          value={newBackupName}
          onChange={(e) => setNewBackupName(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Input.Password
          placeholder="Mật khẩu sao lưu"
          value={newBackupPassword}
          onChange={(e) => setNewBackupPassword(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        {isCreatingBackup && (
          <div style={{ marginTop: 16 }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            <Text style={{ marginLeft: 8 }}>{backupProgress}</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Backup;
