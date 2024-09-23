import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, message, Space, Avatar, Row, Col, Upload, Progress, Steps, Statistic, Tabs, Badge } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useSchool } from '../../context/SchoolContext';
import moment from 'moment';
import debounce from 'lodash/debounce';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useDropzone } from 'react-dropzone';
import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

const { Option } = Select;

// Wrapper component để xử lý ResizeObserver
const ResizeObserverWrapper = ({ children }) => {
    const ref = useRef(null);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => {
                if (ref.current) {
                    ref.current.style.display = 'none';
                    // Thay vì sử dụng offsetHeight trực tiếp, chúng ta gán nó cho một biến
                    const _ = ref.current.offsetHeight; // eslint-disable-line no-unused-vars
                    ref.current.style.display = '';
                }
            });
        });

        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                resizeObserver.unobserve(ref.current);
            }
        };
    }, []);

    return <div ref={ref}>{children}</div>;
};

function StudentManagement() {
    const { api } = useSchool();
    const [students, setStudents] = useState([]);
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form] = Form.useForm();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [filters, setFilters] = useState({
        search: '',
        major: '',
        sort: 'name',
        order: 'asc',
    });
    const [previewData, setPreviewData] = useState([]);
    const [previewColumns, setPreviewColumns] = useState([]);
    const [uploadResult, setUploadResult] = useState(null);
    const [errorData, setErrorData] = useState([]);
    const [gridKey, setGridKey] = useState(0);
    const [errorColumns, setErrorColumns] = useState([]);
    const [uploadStep, setUploadStep] = useState('upload'); // 'upload', 'preview', 'result'
    const [uploadFile, setUploadFile] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingCount, setPendingCount] = useState(0);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const { current, pageSize } = pagination;
            const { search, major, sort, order } = filters;
            const isApproved = activeTab === 'approved';
            const response = await api.get('/school/students', {
                params: {
                    search,
                    isApproved,
                    major,
                    sort,
                    order,
                    page: current,
                    limit: pageSize,
                },
            });
            setStudents(response.data.students);
            setPagination(prev => ({
                ...prev,
                total: response.data.totalStudents,
            }));
            
            // Cập nhật số lượng sinh viên chờ xác nhận
            if (!isApproved) {
                setPendingCount(response.data.totalStudents);
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Lỗi khi lấy danh sách sinh viên');
            }
        } finally {
            setLoading(false);
        }
    }, [api, pagination.current, pagination.pageSize, filters, activeTab]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        fetchMajors();
    }, []);

    const fetchMajors = async (search = '') => {
        try {
            const response = await api.get('/school/majors', {
                params: { search },
            });
            setMajors(response.data);
        } catch (error) {
            message.error('Lỗi khi lấy danh sách ngành học');
        }
    };

    const debouncedFetchMajors = debounce(fetchMajors, 300);

    const handleTableChange = (newPagination, _, sorter) => {
        setPagination(newPagination);
        setFilters(prev => ({
            ...prev,
            sort: sorter.field || 'name',
            order: sorter.order === 'descend' ? 'desc' : 'asc',
        }));
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        form.setFieldsValue({
            ...student,
            dateOfBirth: student.dateOfBirth ? moment(student.dateOfBirth) : null,
            major: student.major ? student.major._id : null,
        });
        setModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            await api.put(`/school/students/${editingStudent._id}`, values);
            message.success('Cập nhật thông tin sinh viên thành công');
            setModalVisible(false);
            fetchStudents();
        } catch (error) {
            message.error('Lỗi khi cập nhật thông tin sinh viên');
        }
    };

    const handleApprove = async (studentId) => {
        try {
            const response = await api.post(`/school/approve-student/${studentId}`);
            if (response.data && response.data.message) {
                message.success(response.data.message);
            } else {
                message.success('Xác nhận sinh viên thành công');
            }
            fetchStudents();
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Lỗi khi xác nhận sinh viên');
            }
        }
    };

    const handleFilterChange = (value, filterName) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value,
        }));
        setPagination(prev => ({
            ...prev,
            current: 1,
        }));
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = jsonData[0];
            const rows = jsonData.slice(1).map((row, index) => {
                const obj = {
                    stt: index + 1,  // Thêm STT vào đây
                };
                headers.forEach((header, i) => {
                    obj[header] = row[i];
                });
                obj.id = index;
                return obj;
            });

            setPreviewData(rows);
            setPreviewColumns([
                { key: 'stt', name: 'STT' },
                ...headers.map(header => ({ key: header, name: header }))
            ]);
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    const handlePreview = () => {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(previewData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const file = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Lưu file vào state để sử dụng sau này khi tải lên
        setUploadFile(file);
        
        setUploadStep('preview');
    };

    const handleUpload = async () => {
        setUploading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', uploadFile, 'students.xlsx');

        try {
            const response = await api.post('/school/students/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(Math.min(percentCompleted, 98));
                }
            });

            const responseData = response.data;

            setUploadResult(responseData);
            setUploadStep('result');

            if (responseData.issueCount > 0) {
                message.warning(`Tải lên thành công. Có ${responseData.issueCount} bản ghi có vấn đề. Vui lòng kiểm tra danh sách chi tiết.`);
                
                // Tạo một mảng mới chứa tất cả các hàng, bao gồm cả những hàng không có vấn đề
                const allRows = previewData.map((row, index) => {
                    const issue = responseData.issues.find(issue => issue.row === index + 2);
                    return {
                        ...row,
                        issue: issue ? issue.issue : '',
                        id: index
                    };
                });

                // Lọc ra chỉ những hàng có vấn đề
                const issuesWithMessages = allRows.filter(row => row.issue !== '');

                setErrorData(issuesWithMessages);
                setErrorColumns([
                    { key: 'stt', name: 'STT', editable: false },
                    ...previewColumns.filter(col => col.key !== 'stt').map(col => ({ ...col, editable: true })),
                    { key: 'issue', name: 'Vấn đề', editable: false }
                ]);
            } else {
                message.success(responseData.message || 'Tải lên và tạo sinh viên thành công');
            }

            // Hiển thị thống kê
            console.log(`Tổng số bản ghi xử lý: ${responseData.totalProcessed}`);
            console.log(`Số bản ghi thành công: ${responseData.successCount}`);
            console.log(`Số bản ghi có vấn đề: ${responseData.issueCount}`);

        } catch (error) {
            console.error('Lỗi khi tải lên:', error);
            let errorMessage = 'Có lỗi xảy ra khi tải lên file. Vui lòng thử lại.';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }
            message.error(errorMessage);
        } finally {
            setUploadProgress(100);
            setUploading(false);
        }
    };

    const handleErrorDataChange = (rows) => {
        console.log('handleErrorDataChange được gọi với dữ liệu:', rows);
        setErrorData(rows);
        // Tự động tải xuống khi có thay đổi
        handleDownloadErrors(rows);
    };

    const handleDownloadErrors = (data = errorData) => {
        if (!Array.isArray(data) || data.length === 0) {
            console.log('Không có dữ liệu lỗi để tải xuống');
            message.error('Không có dữ liệu lỗi để tải xuống');
            return;
        }

        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, 'student_upload_errors.xlsx');
            console.log('File Excel đã được tạo và đang được tải xuống');
            message.success('Đã tải xuống file lỗi thành công');
        } catch (error) {
            console.error('Lỗi khi tạo file Excel:', error);
            message.error('Có lỗi xảy ra khi tạo file Excel');
        }
    };

    useEffect(() => {
        if (previewData.length > 0) {
            // Sử dụng requestAnimationFrame để trì hoãn việc render của DataGrid
            requestAnimationFrame(() => {
                setGridKey(prevKey => prevKey + 1);
            });
        }
    }, [previewData]);

    // Thêm useEffect để fetch số lượng sinh viên chờ xác nhận khi component mount
    useEffect(() => {
        const fetchPendingCount = async () => {
            try {
                const response = await api.get('/school/students', {
                    params: {
                        isApproved: false,
                        limit: 1,
                    },
                });
                setPendingCount(response.data.totalStudents);
            } catch (error) {
                console.error('Lỗi khi lấy số lượng sinh viên chờ xác nhận:', error);
            }
        };

        fetchPendingCount();
    }, [api]);

    const columns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 70,
            render: (text, record, index) => {
                const pageSize = pagination.pageSize;
                const currentPage = pagination.current;
                return (currentPage - 1) * pageSize + index + 1;
            },
        },
        {
            title: 'Avatar',
            dataIndex: 'avatar',
            key: 'avatar',
            render: (avatar, record) => (
                <Avatar src={avatar} alt={`Avatar của ${record.name}`} />
            ),
            editable: true,
            editor: TextEditor,
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            editable: true,
            editor: TextEditor,
        },
        {
            title: 'Mã sinh viên',
            dataIndex: 'studentId',
            key: 'studentId',
            editable: true,
            editor: TextEditor,
        },
        {
            title: 'Ngành học',
            dataIndex: ['major', 'name'],
            key: 'major',
            editable: true,
            editor: TextEditor,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isApproved',
            key: 'isApproved',
            render: (isApproved) => (
                <span style={{ color: isApproved ? 'green' : 'red' }}>
                    {isApproved ? 'Đã xác nhận' : 'Chưa xác nhận'}
                </span>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button onClick={() => handleEdit(record)}>Chỉnh sửa</Button>
                    {!record.isApproved && (
                        <Button type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record._id)}>
                            Xác nhận
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                
            <Tabs.TabPane tab="Đã xác nhận" key="approved" />
                <Tabs.TabPane 
                    tab={
                        <Badge count={pendingCount} offset={[10, 0]}>
                            Chờ xác nhận
                        </Badge>
                    } 
                    key="pending" 
                />
            </Tabs>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc mã sinh viên"
                        value={filters.search}
                        onChange={(e) => handleFilterChange(e.target.value, 'search')}
                    />
                </Col>
                <Col span={8}>
                    <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="Chọn ngành học"
                        value={filters.major}
                        onChange={(value) => handleFilterChange(value, 'major')}
                        onSearch={debouncedFetchMajors}
                        filterOption={false}
                        notFoundContent={null}
                        allowClear
                    >
                        {majors.map((major) => (
                            <Option key={major._id} value={major._id}>
                                {major.name}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col span={8}>
                    <Button type="primary" onClick={() => setUploadModalVisible(true)}>
                        Tải lên file Excel
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={students}
                loading={loading}
                rowKey="_id"
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title="Chỉnh sửa thông tin sinh viên"
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} onFinish={handleUpdate}>
                    <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="studentId" label="Mã sinh viên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="dateOfBirth" label="Ngày sinh">
                        <DatePicker />
                    </Form.Item>
                    <Form.Item name="major" label="Ngành học">
                        <Select
                            showSearch
                            placeholder="Chọn ngành học"
                            onSearch={debouncedFetchMajors}
                            filterOption={false}
                            notFoundContent={null}
                        >
                            {majors.map((major) => (
                                <Option key={major._id} value={major._id}>
                                    {major.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Cập nhật
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
        title="Quản lý tải lên sinh viên"
        visible={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setUploadResult(null);
          setErrorData([]);
          setUploadStep('upload');
        }}
        footer={null}
        width={800}
      >
        <Steps current={uploadStep === 'upload' ? 0 : uploadStep === 'preview' ? 1 : 2} style={{ marginBottom: 20 }}>
          <Steps.Step title="Tải lên" />
          <Steps.Step title="Xem trước" />
          <Steps.Step title="Kết quả" />
        </Steps>

        {uploadStep === 'upload' && (
          <>
            <div {...getRootProps()} style={{ 
              border: '2px dashed #1890ff', 
              padding: '20px', 
              textAlign: 'center', 
              marginBottom: '20px',
              backgroundColor: '#f0f2f5',
              borderRadius: '4px'
            }}>
              <input {...getInputProps()} />
              <p>Kéo và thả file vào đây, hoặc nhấp để chọn file</p>
            </div>
            {previewData.length > 0 && (
              <Button type="primary" onClick={handlePreview}>
                Xem trước dữ liệu
              </Button>
            )}
          </>
        )}

        {uploadStep === 'preview' && (
          <>
            <h3>Xem trước dữ liệu</h3>
            <ResizeObserverWrapper>
              <div style={{ height: '400px', width: '100%', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                <DataGrid
                  columns={previewColumns}
                  rows={previewData}
                  style={{
                    height: '100%',
                    width: '100%',
                    border: 'none',
                  }}
                />
              </div>
            </ResizeObserverWrapper>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setUploadStep('upload')}>Quay lại</Button>
              <Button type="primary" onClick={handleUpload} disabled={uploading}>
                Tải lên
              </Button>
            </div>
          </>
        )}

        {uploadStep === 'result' && (
          <>
            <h3>Kết quả tải lên</h3>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Tổng số bản ghi" value={uploadResult.totalProcessed} />
              </Col>
              <Col span={8}>
                <Statistic title="Số bản ghi thành công" value={uploadResult.successCount} valueStyle={{ color: '#3f8600' }} />
              </Col>
              <Col span={8}>
                <Statistic title="Số bản ghi có vấn đề" value={uploadResult.issueCount} valueStyle={{ color: '#cf1322' }} />
              </Col>
            </Row>

            {errorData.length > 0 && (
              <>
                <h4 style={{ marginTop: 20 }}>Danh sách vấn đề</h4>
                <ResizeObserverWrapper>
                  <div style={{ height: '300px', width: '100%', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                    <DataGrid
                      columns={errorColumns}
                      rows={errorData}
                      onRowsChange={handleErrorDataChange}
                      style={{
                        height: '100%',
                        width: '100%',
                        border: 'none',
                      }}
                    />
                  </div>
                </ResizeObserverWrapper>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                  <Button onClick={() => handleDownloadErrors(errorData)}>
                    Tải xuống danh sách vấn đề
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {uploading && <Progress percent={uploadProgress} style={{ marginTop: 20 }} />}
      </Modal>
        </div>
    );
}

const TextEditor = ({ row, column, onRowChange }) => {
    const [value, setValue] = useState(row[column.key]);
  
    const onChange = (e) => {
      setValue(e.target.value);
      onRowChange({ ...row, [column.key]: e.target.value });
    };
  
    return <Input value={value} onChange={onChange} />;
  };

export default StudentManagement;