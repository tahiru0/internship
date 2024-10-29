import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, message, Space, Avatar, Row, Col, Upload, Progress, Steps, Statistic, Tabs, Badge, Tooltip } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckOutlined, CloseOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
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
    const [activeTab, setActiveTab] = useState('approved');
    const [pendingCount, setPendingCount] = useState(0);
    const [cachedMajors, setCachedMajors] = useState({});
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordTemplate, setPasswordTemplate] = useState('');
    const [passwordPreview, setPasswordPreview] = useState('');
    const [majorLoading, setMajorLoading] = useState(false);
    const [majorPage, setMajorPage] = useState(1);
    const [hasMoreMajors, setHasMoreMajors] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, [activeTab, filters, pagination.current, pagination.pageSize]);

    const fetchStudents = useCallback(async () => {
        if (loading) return; // Prevent multiple requests while loading
        setLoading(true);
        try {
            const response = await api.get('/school/students', {
                params: {
                    search: filters.search,
                    isApproved: activeTab === 'approved',
                    major: filters.major,
                    sort: filters.sort,
                    order: filters.order,
                    page: pagination.current,
                    limit: pagination.pageSize,
                },
            });
            setStudents(response.data.students);
            setPagination(prev => ({
                ...prev,
                total: response.data.totalStudents,
            }));

            // Cập nhật số lượng sinh viên chờ xác nhận
            if (activeTab !== 'approved') {
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
    }, [api, filters.search, activeTab, filters.major, filters.sort, filters.order, pagination.current, pagination.pageSize]);

    useEffect(() => {
        const debouncedFetchStudents = debounce(() => {
            fetchStudents();
        }, 300);

        debouncedFetchStudents();

        return () => debouncedFetchStudents.cancel();
    }, [fetchStudents]);

    useEffect(() => {
        fetchMajors();
    }, []);

    const fetchMajors = async (page = 1, search = '') => {
        setMajorLoading(true);
        try {
            const response = await api.get('/school/majors', {
                params: { page, limit: 10, search }
            });
            const newMajors = response.data.majors;
            setMajors(prevMajors => (page === 1 ? newMajors : [...prevMajors, ...newMajors]));
            setHasMoreMajors(page < response.data.totalPages);
            setMajorPage(page);
        } catch (error) {
            message.error( error.response?.data?.message || error.message);
        } finally {
            setMajorLoading(false);
        }
    };

    const debouncedFetchMajors = debounce((search) => fetchMajors(1, search), 300);

    const handleTableChange = useCallback((newPagination, _, sorter) => {
        setPagination(newPagination);
        if (sorter.field && sorter.order) {
            setFilters(prev => ({
                ...prev,
                sort: sorter.field,
                order: sorter.order === 'descend' ? 'desc' : 'asc',
            }));
        }
    }, []);

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

    const debouncedHandleFilterChange = useCallback(
        debounce((value, filterName) => {
            setFilters(prev => ({
                ...prev,
                [filterName]: value,
            }));
            setPagination(prev => ({
                ...prev,
                current: 1,
            }));
        }, 300),
        []
    );

    const handleFilterChange = (value, filterName) => {
        debouncedHandleFilterChange(value, filterName);
    };

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];

        // Kiểm tra loại file
        if (!file.type.match('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') &&
            !file.type.match('application/vnd.ms-excel')) {
            message.error('Vui lòng chỉ upload file Excel (.xlsx hoặc .xls)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const headers = jsonData[0];
                const rows = jsonData.slice(1).map((row, index) => {
                    const obj = {
                        stt: index + 1,
                    };
                    headers.forEach((header, i) => {
                        // Cắt ngắn nội dung nếu vượt quá giới hạn
                        obj[header] = typeof row[i] === 'string' ? row[i].substring(0, 32700) : row[i];
                    });
                    obj.id = index;
                    return obj;
                });

                setPreviewData(rows);
                setPreviewColumns([
                    { key: 'stt', name: 'STT' },
                    ...headers.map(header => ({ key: header, name: header }))
                ]);
            } catch (error) {
                console.error('Lỗi khi đọc file:', error);
                message.error('Không thể đọc file. Vui lòng kiểm tra lại định dạng file.');
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    const handlePreview = () => {
        try {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(previewData.map(row => {
                const newRow = { ...row };
                delete newRow.id;
                delete newRow.stt;
                // Cắt ngắn nội dung của mỗi ô nếu cần
                Object.keys(newRow).forEach(key => {
                    if (typeof newRow[key] === 'string' && newRow[key].length > 32700) {
                        newRow[key] = newRow[key].substring(0, 32700);
                    }
                });
                return newRow;
            }));
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const file = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            setUploadFile(file);
            setUploadStep('preview');
        } catch (error) {
            console.error('Lỗi khi tạo file preview:', error);
            message.error('Có lỗi xảy ra khi tạo bản xem trước. Vui lòng thử lại.');
        }
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
        setErrorData(rows);
        // Tự động tải xuống khi có thay đổi
        handleDownloadErrors(rows);
    };

    const handleDownloadErrors = (response) => {
        if (!response || !Array.isArray(response.issues) || response.issues.length === 0) {
            console.log('Không có dữ liệu lỗi để tải xuống');
            message.error('Không có dữ liệu lỗi để tải xuống');
            return;
        }

        try {
            console.log('Dữ liệu lỗi:', JSON.stringify(response.issues, null, 2));

            // Định nghĩa các cột cố định
            const columns = ['STT', 'Dòng', 'Tên', 'Email', 'Mã sinh viên', 'Ngày sinh', 'Ngành học', 'Vấn đề'];

            // Chuẩn hóa dữ liệu
            const normalizedData = response.issues.map((item, index) => ({
                'STT': index + 1,
                'Dòng': item.row,
                'Tên': item.data?.name || '',
                'Email': item.data?.email || '',
                'Mã sinh viên': item.data?.studentId || '',
                'Ngày sinh': item.data?.dateOfBirth || '',
                'Ngành học': item.data?.major || '',
                'Vấn đề': item.issue
            }));

            console.log('Dữ liệu đã chuẩn hóa:', JSON.stringify(normalizedData, null, 2));

            // Tạo worksheet
            const worksheet = XLSX.utils.json_to_sheet(normalizedData);

            // Tạo workbook và thêm worksheet vào
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");

            // Thêm header
            XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: 'A1' });

            // Tạo buffer
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Tải file
            saveAs(blob, 'error_data.xlsx');

            message.success('Đã tải xuống dữ liệu lỗi thành công');
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
                message.error( error.response?.data?.message || error.message);
            }
        };

        fetchPendingCount();
    }, [api]);

    const columns = useMemo(() => [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 70,
            fixed: 'left',
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
            width: 80,
            render: (avatar, record) => (
                <Avatar src={avatar} alt={`Avatar của ${record.name}`} />
            ),
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            sorter: true,
        },
        {
            title: 'Mã sinh viên',
            dataIndex: 'studentId',
            key: 'studentId',
            width: 120,
        },
        {
            title: 'Ngành học',
            dataIndex: ['major', 'name'],
            key: 'major',
            width: 150,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isApproved',
            key: 'isApproved',
            width: 120,
            render: (isApproved) => (
                <span style={{ color: isApproved ? 'green' : 'red' }}>
                    {isApproved ? 'Đã xác nhận' : 'Chưa xác nhận'}
                </span>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    {!record.isApproved && (
                        <Tooltip title="Xác nhận">
                            <Button
                                type="text"
                                icon={<CheckOutlined />}
                                onClick={() => handleApprove(record._id)}
                                style={{ color: 'green' }}
                            />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ], [handleEdit, handleApprove, pagination]);

    // Định nghĩa lại cấu trúc cột cho DataGrid
    const issueColumns = [
        { key: 'stt', name: 'STT', width: 70 },
        { key: 'row', name: 'Dòng', width: 70 },
        { key: 'name', name: 'Tên', editor: TextEditor },
        { key: 'email', name: 'Email', editor: TextEditor },
        { key: 'studentId', name: 'Mã sinh viên', editor: TextEditor },
        { key: 'dateOfBirth', name: 'Ngày sinh', editor: TextEditor },
        { key: 'major', name: 'Ngành học', editor: TextEditor },
        { key: 'issue', name: 'Vấn đề', width: 300 }
    ];

    useEffect(() => {
        fetchPasswordTemplate();
    }, []);

    const fetchPasswordTemplate = async () => {
        try {
            const response = await api.get('/school/password-rule');
            const config = response.data;
            if (config && config.passwordRule) {
                setPasswordTemplate(config.passwordRule);
                // Gọi hàm handlePasswordTemplateChange để cập nhật preview
                handlePasswordTemplateChange(config.passwordRule);
            }
        } catch (error) {
            console.error('Lỗi khi lấy mẫu mật khẩu:', error);
            message.error('Không thể tải mẫu mật khẩu');
        }
    };

    const handlePasswordTemplateChange = async (value) => {
        setPasswordTemplate(value);
        try {
            const response = await api.post('/school/review-password-rule', {
                passwordRule: value,
                dateOfBirth: '1995-12-31' // Ví dụ ngày sinh
            });
            if (typeof response.data === 'object' && response.data.password) {
                setPasswordPreview(response.data.password);
            } else if (typeof response.data === 'string') {
                setPasswordPreview(response.data);
            } else {
                setPasswordPreview('Không thể tạo mật khẩu mẫu');
            }
        } catch (error) {
            console.error('Lỗi khi xem trước mật khẩu:', error);
            setPasswordPreview('Lỗi khi tạo mật khẩu mẫu');
        }
    };

    const savePasswordTemplate = async () => {
        try {
            await api.put('/school/update-password-rule', {
                passwordRule: passwordTemplate
            });
            message.success('Đã lưu mẫu mật khẩu thành công');
            setPasswordModalVisible(false);
        } catch (error) {
            console.error('Lỗi khi lưu mẫu mật khẩu:', error);
            message.error('Lỗi khi lưu mẫu mật khẩu');
        }
    };

    // Thêm hàm này để chuyển đổi ID ngành học thành tên ngành học
    const getMajorName = (majorId) => {
        const major = majors.find(m => m._id === majorId);
        return major ? major.name : '';
    };

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

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <Input
                        placeholder="Tìm kiếm theo tên hoặc mã sinh viên"
                        value={filters.search}
                        onChange={(e) => handleFilterChange(e.target.value, 'search')}
                    />
                </Col>
                <Col xs={24} sm={24} md={8} lg={8} xl={8}>
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
                <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <Space wrap>
                        <Button type="primary" onClick={() => setUploadModalVisible(true)}>
                            Tải lên file Excel
                        </Button>
                        <Button 
                            icon={<EyeOutlined />} 
                            onClick={() => setPasswordModalVisible(true)}
                        >
                            Cấu hình mẫu mật khẩu
                        </Button>
                    </Space>
                </Col>
            </Row>

            <div style={{ overflowX: 'auto' }}>
                <Table
                    columns={columns}
                    dataSource={students}
                    loading={loading}
                    rowKey="_id"
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </div>

            <Modal
                title="Chỉnh sửa thông tin sinh viên"
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form 
                    form={form} 
                    onFinish={handleUpdate}
                    initialValues={{
                        ...editingStudent,
                        dateOfBirth: editingStudent?.dateOfBirth ? moment(editingStudent.dateOfBirth) : null,
                        major: editingStudent?.major?._id
                    }}
                >
                    <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
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
                            optionFilterProp="children"
                            onSearch={debouncedFetchMajors}
                            filterOption={false}
                            loading={majorLoading}
                            onPopupScroll={(event) => {
                                const target = event.target;
                                if (target.scrollTop + target.offsetHeight === target.scrollHeight && !majorLoading && hasMoreMajors) {
                                    fetchMajors(majorPage + 1);
                                }
                            }}
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
                                <Statistic title="Tổng số bản ghi" value={uploadResult.totalRows} />
                            </Col>
                            <Col span={8}>
                                <Statistic title="Số bản ghi thành công" value={uploadResult.successCount} valueStyle={{ color: '#3f8600' }} />
                            </Col>
                            <Col span={8}>
                                <Statistic title="Số bản ghi có vấn đề" value={uploadResult.issues?.length || 0} valueStyle={{ color: '#cf1322' }} />
                            </Col>
                        </Row>

                        {uploadResult.issues && uploadResult.issues.length > 0 && (
                            <>
                                <h4 style={{ marginTop: 20 }}>Danh sách vấn đề</h4>
                                <ResizeObserverWrapper>
                                    <div style={{ height: '300px', width: '100%', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                                        <DataGrid
                                            columns={issueColumns}
                                            rows={uploadResult.issues.map((issue, index) => ({
                                                stt: index + 1,
                                                ...issue,
                                                ...issue.data,
                                                id: issue.row // Đảm bảo mỗi hàng có một id duy nhất
                                            }))}
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
                                    <Button onClick={() => handleDownloadErrors(uploadResult)}>
                                        Tải xuống danh sách vấn đề
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {uploading && <Progress percent={uploadProgress} style={{ marginTop: 20 }} />}
            </Modal>

            <Modal
                title="Cấu hình mẫu mật khẩu"
                visible={passwordModalVisible}
                onOk={savePasswordTemplate}
                onCancel={() => setPasswordModalVisible(false)}
            >
                <Input
                    value={passwordTemplate}
                    onChange={(e) => handlePasswordTemplateChange(e.target.value)}
                    placeholder="Nhập mẫu mật khẩu (ví dụ: ${ngaysinh})"
                />
                <div style={{ marginTop: 16 }}>
                    <strong>Xem trước mật khẩu:</strong> {passwordPreview}
                </div>
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
