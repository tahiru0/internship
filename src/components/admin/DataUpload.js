import React, { useState, useEffect } from 'react';
import { Upload, message, Button, Table, Modal, Form, Select, Space, Tabs, Typography, Card, Row, Col, Avatar } from 'antd';
import { InboxOutlined, InfoCircleOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import moment from 'moment';
import axiosInstance from '../../utils/axiosInstance';

const { Dragger } = Upload;
const { Option } = Select;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

const SchoolSelect = ({ onSelect, initialValue }) => {
  const [schools, setSchools] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);

  useEffect(() => {
    if (initialValue) {
      handleSearch(initialValue);
    }
  }, [initialValue]);

  const handleSearch = async (value) => {
    setSearchValue(value);
    if (value.length >= 2) {
      try {
        const response = await axiosInstance.get(`/auth/schools?query=${value}`);
        setSchools(response.data);
        if (response.data.length === 1 && response.data[0].id === value) {
          setSelectedSchool(response.data[0]);
        }
      } catch (error) {
        console.error('Lỗi khi tìm kiếm trường học:', error);
        message.error(error.message);
      }
    } else {
      setSchools([]);
    }
  };

  const handleChange = (value, option) => {
    setSelectedSchool(option.school);
    onSelect(value);
  };

  return (
    <Select
      showSearch
      placeholder="Chọn trường học"
      filterOption={false}
      onSearch={handleSearch}
      onChange={handleChange}
      notFoundContent={null}
      style={{ width: '100%' }}
      value={selectedSchool ? selectedSchool.id : undefined}
      size="large"
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
    >
      {schools.map((school) => (
        <Option key={school.id} value={school.id} school={school}>
          <Avatar src={school.logo} size="small" style={{ marginRight: 8 }} />
          {school.name}
        </Option>
      ))}
    </Select>
  );
};
const DataUpload = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [form] = Form.useForm();
  const [excelColumns, setExcelColumns] = useState([]);
  const [currentType, setCurrentType] = useState('students');
  const [isInstructionsVisible, setIsInstructionsVisible] = useState(false);
  const [mappingValues, setMappingValues] = useState({});
  const [uploadResult, setUploadResult] = useState(null);

  const handleUpload = async (values) => {
    console.log('Bắt đầu tải lên với giá trị:', values);
    if (!file) {
      message.error('Vui lòng chọn file Excel trước khi tải lên');
      return;
    }

    const mappingFields = getMappingFields(currentType);
    const requiredFields = Object.keys(mappingFields).filter(key => 
      ['name', 'email', 'studentId', 'major', 'address', 'accounts.0.email', 'title', 'description', 'company', 'objectives'].includes(key)
    );

    const missingFields = requiredFields.filter(field => !values.mapping[field]);
    if (missingFields.length > 0) {
      message.error(`Các cột bắt buộc sau chưa được ánh xạ: ${missingFields.map(field => mappingFields[field].vi).join(', ')}`);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(values.mapping));
    if (currentType === 'students') {
      formData.append('schoolId', values.schoolId);
    }

    try {
      console.log('Đang gửi yêu cầu API...');
      const response = await axiosInstance.post(`/admin/upload/${currentType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Phản hồi API:', response.data);
      setUploadResult(response.data);
      message.success(response.data.message || 'Tải lên thành công');
    } catch (error) {
      console.error('Lỗi khi tải lên dữ liệu:', error);
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (info) => {
    const { file } = info;
    if (file.status === 'removed') {
      setFile(null);
      setPreviewData([]);
      setExcelColumns([]);
      return;
    }
    
    if (file instanceof File) {
      setFile(file);
      readExcelFile(file);
    } else if (file.originFileObj instanceof File) {
      setFile(file.originFileObj);
      readExcelFile(file.originFileObj);
    } else {
      console.error('Invalid file object:', file);
      message.error('Không thể đọc file. Vui lòng thử lại.');
    }
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary', cellDates: true, dateNF: 'dd/mm/yyyy' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Lấy tất cả các cột, kể cả khi không có dữ liệu
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const columns = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({r:0, c:C})];
        columns.push(cell ? cell.v : undefined);
      }
      
      // Chuyển đổi dữ liệu Excel thành JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        dateNF: 'dd/mm/yyyy',
        header: 1,
        defval: ''
      });

      // Xử lý lại các trường ngày tháng và số điện thoại
      const processedData = jsonData.slice(1).map(row => {
        const newRow = {};
        columns.forEach((col, index) => {
          if (col) {
            const value = row[index];
            if (typeof value === 'string') {
              // Xử lý ngày tháng
              const parsedDate = moment(value, ['DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'], true);
              if (parsedDate.isValid()) {
                newRow[col] = parsedDate.toDate();
              } else if (col.toLowerCase().includes('phone') || col.toLowerCase().includes('sdt') || col.toLowerCase().includes('điện thoại')) {
                // Xử lý số điện thoại
                newRow[col] = value.replace(/^'/, ''); // Loại bỏ dấu ' ở đầu nếu có
                if (!newRow[col].startsWith('0') && !newRow[col].startsWith('+84')) {
                  newRow[col] = '0' + newRow[col];
                }
              } else {
                newRow[col] = value;
              }
            } else if (value instanceof Date) {
              // Nếu đã là Date, giữ nguyên
              newRow[col] = value;
            } else {
              newRow[col] = value;
            }
          }
        });
        return newRow;
      });

      setPreviewData(processedData.slice(0, 5)); // Chỉ hiển thị 5 dòng đầu tiên
      setExcelColumns(columns.filter(Boolean));

      // Tự động điền ánh xạ cột
      const mappingFields = getMappingFields(currentType);
      const newMapping = {};
      
      // Tạo một bản sao của mảng columns để có thể xóa các cột đã được ánh xạ
      let remainingColumns = [...columns];

      Object.entries(mappingFields).forEach(([key, value]) => {
        const matchingColumnIndex = remainingColumns.findIndex(col => {
          if (!col) return false;
          const normalizedCol = col.toLowerCase().replace(/[_\s]+/g, '');
          const normalizedVi = value.vi.toLowerCase().replace(/[_\s]+/g, '');
          const normalizedEn = value.en.toLowerCase().replace(/[_\s]+/g, '');
          const normalizedKey = key.toLowerCase().replace(/[_\s]+/g, '');
          
          return normalizedCol === normalizedVi || 
                 normalizedCol === normalizedEn || 
                 normalizedCol === normalizedKey ||
                 normalizedCol.includes(normalizedVi) ||
                 normalizedCol.includes(normalizedEn) ||
                 normalizedCol.includes(normalizedKey);
        });

        if (matchingColumnIndex !== -1) {
          newMapping[key] = remainingColumns[matchingColumnIndex];
          // Xóa cột đã được ánh xạ để tránh ánh xạ trùng lặp
          remainingColumns.splice(matchingColumnIndex, 1);
        }
      });

      form.setFieldsValue({ mapping: newMapping });
    };
    reader.readAsBinaryString(file);
  };

  const getMappingFields = (type) => {
    switch (type) {
      case 'students':
        return {
          name: { vi: 'Tên sinh viên', en: 'Student Name' },
          email: { vi: 'Email', en: 'Email' },
          studentId: { vi: 'Mã số sinh viên', en: 'Student ID' },
          major: { vi: 'Ngành học', en: 'Major' },
          dateOfBirth: { vi: 'Ngày sinh', en: 'Date of Birth' },
          gender: { vi: 'Giới tính', en: 'Gender' },
          phoneNumber: { vi: 'Số điện thoại', en: 'Phone Number' }
        };
      case 'schools':
        return {
          name: { vi: 'Tên trường', en: 'School Name' },
          address: { vi: 'Địa chỉ', en: 'Address' },
          website: { vi: 'Website', en: 'Website' },
          foundedYear: { vi: 'Năm thành lập', en: 'Founded Year' },
          'accounts.0.email': { vi: 'Email đăng nhập', en: 'Login Email' }
        };
      case 'companies':
        return {
          name: { vi: 'Tên công ty', en: 'Company Name' },
          address: { vi: 'Địa chỉ', en: 'Address' },
          email: { vi: 'Email', en: 'Email' },
          website: { vi: 'Website', en: 'Website' },
          industry: { vi: 'Ngành công nghiệp', en: 'Industry' },
          foundedYear: { vi: 'Năm thành lập', en: 'Founded Year' },
          employeeCount: { vi: 'Số lượng nhân viên', en: 'Employee Count' },
          'accounts.0.email': { vi: 'Email đăng nhập', en: 'Login Email' }
        };
      case 'projects':
        return {
          title: { vi: 'Tiêu đề', en: 'Title' },
          description: { vi: 'Mô tả', en: 'Description' },
          company: { vi: 'Công ty', en: 'Company' },
          status: { vi: 'Trạng thái', en: 'Status' },
          objectives: { vi: 'Mục tiêu', en: 'Objectives' },
          startDate: { vi: 'Ngày bắt đầu', en: 'Start Date' },
          endDate: { vi: 'Ngày kết thúc', en: 'End Date' }
        };
      default:
        return {};
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx, .xls',
    beforeUpload: () => false,
    onChange: handleFileChange,
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
      if (e.dataTransfer.files.length > 0) {
        handleFileChange({ file: e.dataTransfer.files[0] });
      }
    },
  };

  const handleMappingChange = (field, value) => {
    setMappingValues(prev => {
      const newMapping = { ...prev, [field]: value };
      form.setFieldsValue({ mapping: newMapping });
      return newMapping;
    });
  };

  const renderUploadSection = (type) => {
    const mappingFields = getMappingFields(type);
    const requiredFields = Object.keys(mappingFields).filter(key => 
      ['name', 'email', 'studentId', 'major', 'address', 'accounts.0.email', 'title', 'description', 'company', 'objectives'].includes(key)
    );

    return (
      <Form form={form} onFinish={handleUpload} layout="vertical">
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
              name="file"
              rules={[{ required: true, message: 'Vui lòng chọn file Excel' }]}
            >
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Nhấp hoặc kéo file vào khu vực này để tải lên</p>
                <p className="ant-upload-hint">
                  Hỗ trợ tải lên một file Excel (.xlsx, .xls)
                </p>
              </Dragger>
            </Form.Item>
            {type === 'students' && (
              <Form.Item
                name="schoolId"
                label="Trường đại học"
                rules={[{ required: true, message: 'Vui lòng chọn trường đại học' }]}
              >
                <SchoolSelect
                  onSelect={(value) => form.setFieldsValue({ schoolId: value })}
                  initialValue={form.getFieldValue('schoolId')}
                />
              </Form.Item>
            )}
            {file && (
              <>
                <Title level={4}>Ánh xạ cột</Title>
                <Form.Item
                  name="mapping"
                  rules={[{ required: true, message: 'Vui lòng ánh xạ các cột' }]}
                >
                  <Table 
                    dataSource={Object.entries(mappingFields).map(([key, value]) => ({
                      key,
                      field: value.vi,
                      fieldEn: value.en,
                      required: requiredFields.includes(key),
                    }))}
                    columns={[
                      {
                        title: 'Trường dữ liệu',
                        dataIndex: 'field',
                        key: 'field',
                        render: (text, record) => (
                          <span>
                            {text} ({record.fieldEn})
                            {record.required && <span style={{ color: 'red' }}> *</span>}
                          </span>
                        ),
                      },
                      {
                        title: 'Cột trong Excel',
                        dataIndex: 'key',
                        key: 'mapping',
                        render: (text, record) => (
                          <Form.Item
                            name={['mapping', record.key]}
                            noStyle
                            rules={[
                              {
                                required: record.required,
                                message: `Vui lòng chọn cột cho ${record.field}`,
                              },
                            ]}
                          >
                            <Select
                              style={{ width: '100%' }}
                              placeholder="Chọn cột"
                              onChange={(value) => handleMappingChange(record.key, value)}
                            >
                              {excelColumns.filter(col => 
                                !Object.values(mappingValues).includes(col) || 
                                mappingValues[record.key] === col
                              ).map(col => (
                                <Option key={col} value={col}>{col}</Option>
                              ))}
                            </Select>
                          </Form.Item>
                        ),
                      },
                    ]}
                    pagination={false}
                  />
                </Form.Item>
                <Row gutter={16}>
                  <Col>
                    <Button onClick={() => setIsPreviewVisible(true)} icon={<FileExcelOutlined />}>
                      Xem trước dữ liệu
                    </Button>
                  </Col>
                  <Col>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Tải lên
                    </Button>
                  </Col>
                </Row>
              </>
            )}
          </Space>
        </Card>
      </Form>
    );
  };

  const renderInstructionsModal = () => (
    <Modal
      title="Hướng dẫn tải lên dữ liệu"
      visible={isInstructionsVisible}
      onCancel={() => setIsInstructionsVisible(false)}
      footer={null}
    >
      <Typography>
        <Title level={4}>Các bước tải lên:</Title>
        <Paragraph>
          <ol>
            <li>Chọn file Excel chứa dữ liệu cn tải lên.</li>
            <li>Ánh xạ các cột trong file Excel với các cột trong hệ thống.</li>
            <li>Nhấn "Xem trước dữ liệu" để kiểm tra.</li>
            <li>Nhấn "Tải lên" để hoàn tất quá trình.</li>
          </ol>
        </Paragraph>
        <Title level={4}>Các cột bắt buộc:</Title>
        <Paragraph>
          <ul>
            {Object.entries(getMappingFields(currentType))
              .filter(([key]) => ['name', 'email', 'studentId', 'major', 'address', 'accounts.0.email', 'title', 'description', 'company', 'objectives'].includes(key))
              .map(([key, value], index) => (
                <li key={index}>{value.vi} ({value.en})</li>
              ))}
          </ul>
        </Paragraph>
      </Typography>
    </Modal>
  );

  const formatDate = (value, key) => {
    if (value instanceof Date) {
      return moment(value).format('DD/MM/YYYY');
    }
    if (typeof value === 'string') {
      const parsedDate = moment(value, ['DD/MM/YYYY', 'D/M/YYYY', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'], true);
      if (parsedDate.isValid()) {
        return parsedDate.format('DD/MM/YYYY');
      }
      // Xử lý số điện thoại
      if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('sdt') || key.toLowerCase().includes('điện thoại')) {
        return value.replace(/^'/, ''); // Loại bỏ dấu ' ở đầu nếu có
      }
    }
    return value;
  };

  const downloadSuccessExcel = () => {
    if (!uploadResult || !uploadResult.students || uploadResult.students.length === 0) {
      message.warning('Không có dữ liệu thành công để tải xuống');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const successData = uploadResult.students.map(student => ({
      'Họ và tên': student.name,
      'Email': student.email,
      'Mã sinh viên': student.studentId,
      'Mật khẩu': student.password,
      'Trường': student.schoolName
    }));
    const ws = XLSX.utils.json_to_sheet(successData);
    XLSX.utils.book_append_sheet(workbook, ws, "Dữ liệu thành công");
    XLSX.writeFile(workbook, `Dữ liệu thành công ${new Date().toISOString()}.xlsx`);
  };

  const downloadErrorExcel = () => {
    if (!uploadResult || !uploadResult.errors || uploadResult.errors.length === 0) {
      message.warning('Không có dữ liệu lỗi để tải xuống');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const errorData = uploadResult.errors.map(error => ({
      ...error.row,
      'Lỗi': Object.entries(error.errors).map(([key, value]) => `${key}: ${value}`).join(', ')
    }));
    const ws = XLSX.utils.json_to_sheet(errorData);
    XLSX.utils.book_append_sheet(workbook, ws, "Dữ liệu lỗi");
    XLSX.writeFile(workbook, `Dữ liệu lỗi ${new Date().toISOString()}.xlsx`);
  };

  const renderResultModal = () => {
    if (!uploadResult) return null;

    return (
      <Modal
        title="Kết quả tải lên"
        visible={!!uploadResult}
        onCancel={() => setUploadResult(null)}
        footer={[
          <Button 
            key="downloadSuccess" 
            type="primary" 
            onClick={downloadSuccessExcel} 
            icon={<DownloadOutlined />}
            disabled={!uploadResult.students || uploadResult.students.length === 0}
          >
            Tải xuống dữ liệu thành công
          </Button>,
          <Button 
            key="downloadError" 
            type="danger" 
            onClick={downloadErrorExcel} 
            icon={<DownloadOutlined />}
            disabled={!uploadResult.errors || uploadResult.errors.length === 0}
          >
            Tải xuống dữ liệu lỗi
          </Button>,
          <Button key="close" onClick={() => setUploadResult(null)}>
            Đóng
          </Button>
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph>
            <Text strong>{uploadResult.message}</Text>
          </Paragraph>
          <Paragraph>
            Nhấn nút tương ứng để tải về file Excel chứa dữ liệu thành công hoặc dữ liệu lỗi.
          </Paragraph>
        </Space>
      </Modal>
    );
  };

  const renderPreviewModal = () => {
    if (!previewData || previewData.length === 0) return null;

    return (
      <Modal
        title="Xem trước dữ liệu"
        visible={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <Table 
          dataSource={previewData} 
          columns={previewData.length > 0 ? Object.keys(previewData[0]).map(key => ({ 
            title: key, 
            dataIndex: key, 
            key,
            render: (text) => formatDate(text, key)
          })) : []} 
          pagination={false} 
          scroll={{ x: true }} 
        />
      </Modal>
    );
  };

  return (
    <div>
      <Space align="center" style={{ marginBottom: 16 }}>
        <Title level={2}>Tải lên dữ liệu</Title>
        <Button
          icon={<InfoCircleOutlined />}
          onClick={() => setIsInstructionsVisible(true)}
          type="text"
        />
      </Space>
      <Tabs 
        defaultActiveKey="1" 
        onChange={(key) => {
          setCurrentType(key === '1' ? 'students' : key === '2' ? 'schools' : key === '3' ? 'companies' : 'projects');
          form.resetFields();
          setFile(null);
          setPreviewData([]);
          setExcelColumns([]);
        }}
      >
        <TabPane tab="Sinh viên" key="1">
          {renderUploadSection('students')}
        </TabPane>
        <TabPane tab="Trường học" key="2">
          {renderUploadSection('schools')}
        </TabPane>
        <TabPane tab="Công ty" key="3">
          {renderUploadSection('companies')}
        </TabPane>
        <TabPane tab="Dự án" key="4">
          {renderUploadSection('projects')}
        </TabPane>
      </Tabs>

      {renderInstructionsModal()}
      {renderPreviewModal()}
      {renderResultModal()}
    </div>
  );
};

export default DataUpload;
