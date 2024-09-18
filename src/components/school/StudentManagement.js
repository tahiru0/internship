import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Space, message, Form, DatePicker, Select, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import axios from 'axios';
import Cookies from 'js-cookie';
import debounce from 'lodash/debounce';
import moment from 'moment';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [editingKey, setEditingKey] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [isPasswordRuleModalVisible, setIsPasswordRuleModalVisible] = useState(false);
    const [tempStudentData, setTempStudentData] = useState(null);
    const [form] = Form.useForm();

    const fetchStudents = useCallback(async (search = '') => {
        setLoading(true);
        try {
            const accessToken = Cookies.get('schoolAccessToken');
            const response = await axios.get('http://localhost:5000/api/school/students', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { search }
            });
            setStudents(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sinh viên:', error);
            message.error('Không thể lấy danh sách sinh viên');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const debouncedSearch = useCallback(
        debounce((value) => {
            fetchStudents(value);
        }, 300),
        [fetchStudents]
    );

    const handleSearch = (value) => {
        setSearchText(value);
        debouncedSearch(value);
    };

    const isEditing = (record) => record._id === editingKey;

    const edit = () => {
        const selectedStudent = students.find(student => student._id === selectedRowKeys[0]);
        if (selectedStudent) {
            form.setFieldsValue({ ...selectedStudent, dateOfBirth: moment(selectedStudent.dateOfBirth) });
            setEditingKey(selectedStudent._id);
        }
    };

    const cancel = () => {
        setEditingKey('');
        if (isCreating) {
            setStudents(students.filter(student => student._id !== 'new'));
            setIsCreating(false);
        }
    };

    const save = async () => {
        try {
            const row = await form.validateFields();
            const newData = [...students];
            const index = newData.findIndex((item) => editingKey === item._id);
            if (index > -1) {
                const item = newData[index];
                const accessToken = Cookies.get('schoolAccessToken');
                if (editingKey === 'new') {
                    try {
                        const response = await axios.post('http://localhost:5000/api/school/students', {
                            ...row,
                            dateOfBirth: row.dateOfBirth.format('YYYY-MM-DD'),
                        }, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        });
                        newData[index] = response.data;
                        setStudents(newData);
                        setEditingKey('');
                        setIsCreating(false);
                        message.success('Thêm sinh viên thành công');
                    } catch (error) {
                        if (error.response && error.response.data && error.response.data.message) {
                            const errorMessage = error.response.data.message;
                            if (errorMessage.startsWith('email:')) {
                                form.setFields([
                                    {
                                        name: ['email', 'name', 'studentId', 'dateOfBirth', 'major'],
                                        errors: [errorMessage.split(':')[1]],
                                    },
                                ]);
                            } else {
                                message.error(errorMessage);
                            }
                        } else {
                            console.error('Lỗi khi cập nhật sinh viên:', error);
                            message.error('Không thể cập nhật sinh viên');
                        }
                        if (error.response && error.response.data && error.response.data.code === 'NO_PASSWORD_RULE') {
                            setTempStudentData({ ...row, dateOfBirth: row.dateOfBirth.format('YYYY-MM-DD') });
                            Modal.confirm({
                                title: 'Chọn cách xử lý',
                                content: 'Bạn muốn cung cấp mật khẩu cho sinh viên này hay cập nhật quy tắc mật khẩu?',
                                okText: 'Cung cấp mật khẩu',
                                cancelText: 'Cập nhật quy tắc',
                                onOk() {
                                    setIsPasswordModalVisible(true);
                                },
                                onCancel() {
                                    setIsPasswordRuleModalVisible(true);
                                },
                            });
                        } else {
                            throw error;
                        }
                    }
                } else {
                    await axios.put(`http://localhost:5000/api/school/students/${item._id}`, {
                        ...item,
                        ...row,
                        dateOfBirth: row.dateOfBirth.format('YYYY-MM-DD'),
                    }, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    });
                    newData[index] = { ...item, ...row };
                    setStudents(newData);
                    setEditingKey('');
                    message.success('Cập nhật sinh viên thành công');
                }
            }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const handleDelete = async () => {
        try {
            const accessToken = Cookies.get('schoolAccessToken');
            await Promise.all(selectedRowKeys.map(key =>
                axios.delete(`http://localhost:5000/api/school/students/${key}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
            ));
            message.success(`Đã xóa ${selectedRowKeys.length} sinh viên`);
            fetchStudents(searchText);
            setSelectedRowKeys([]);
        } catch (error) {
            console.error('Lỗi khi xóa sinh viên:', error);
            message.error('Không thể xóa sinh viên');
        }
    };

    const handleAdd = () => {
        const newStudent = {
            _id: 'new',
            name: '',
            email: '',
            studentId: '',
            dateOfBirth: null,
            major: '',
        };
        setStudents([newStudent, ...students]);
        setEditingKey('new');
        setIsCreating(true);
        form.resetFields();
    };

    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: 'name',
            key: 'name',
            editable: true,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            editable: true,
        },
        {
            title: 'Mã số sinh viên',
            dataIndex: 'studentId',
            key: 'studentId',
            editable: true,
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dateOfBirth',
            key: 'dateOfBirth',
            editable: true,
            render: (_, record) => (
                isEditing(record) ? (
                    <Form.Item
                        name="dateOfBirth"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
                    >
                        <DatePicker format="DD/MM/YYYY" />
                    </Form.Item>
                ) : (
                    formatDate(record.dateOfBirth)
                )
            ),
        },
        {
            title: 'Ngành học',
            dataIndex: 'major',
            key: 'major',
            editable: true,
            render: (_, record) => (
                isEditing(record) ? (
                    <Form.Item
                        name="major"
                        rules={[{ required: true, message: 'Vui lòng chọn ngành học' }]}
                    >
                        <Select style={{ width: '100%' }} placeholder="Chọn ngành học">
                            <Select.Option value="cntt">Công nghệ thông tin</Select.Option>
                            <Select.Option value="ktpm">Kỹ thuật phần mềm</Select.Option>
                            <Select.Option value="ktmt">Kỹ thuật máy tính</Select.Option>
                        </Select>
                    </Form.Item>
                ) : (
                    record.major
                )
            ),
        },
    ];

    const mergedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.dataIndex === 'dateOfBirth' ? 'date' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

    const EditableCell = ({
        editing,
        dataIndex,
        title,
        inputType,
        record,
        index,
        children,
        ...restProps
    }) => {
        const inputNode = inputType === 'date' ? <DatePicker /> : <Input />;
        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item
                        name={dataIndex}
                        style={{ margin: 0 }}
                        rules={[
                            {
                                required: true,
                                message: `Vui lòng nhập ${title}!`,
                            },
                        ]}
                    >
                        {inputNode}
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };

    const handlePasswordModalOk = async () => {
        try {
            const values = await form.validateFields();
            const accessToken = Cookies.get('schoolAccessToken');
            const response = await axios.post('http://localhost:5000/api/school/students', {
                ...tempStudentData,
                password: values.password,
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setStudents([response.data, ...students.filter(s => s._id !== 'new')]);
            setIsPasswordModalVisible(false);
            setEditingKey('');
            setIsCreating(false);
            message.success('Thêm sinh viên thành công');
        } catch (error) {
            console.error('Lỗi khi thêm sinh viên:', error);
            message.error('Không thể thêm sinh viên');
        }
    };

    const handlePasswordRuleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const accessToken = Cookies.get('schoolAccessToken');
            await axios.put('http://localhost:5000/api/school/update-password-rule', {
                passwordRule: {
                    template: values.passwordRuleTemplate,
                }
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setIsPasswordRuleModalVisible(false);
            message.success('Cập nhật quy tắc mật khẩu thành công');

            // Tạo sinh viên mới ngay sau khi cập nhật quy tắc mật khẩu
            const response = await axios.post('http://localhost:5000/api/school/students', tempStudentData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setStudents([response.data, ...students.filter(s => s._id !== 'new')]);
            setEditingKey('');
            setIsCreating(false);
            message.success('Thêm sinh viên thành công');
        } catch (error) {
            console.error('Lỗi khi cập nhật quy tắc mật khẩu hoặc thêm sinh viên:', error);
            message.error('Không thể cập nhật quy tắc mật khẩu hoặc thêm sinh viên');
        }
    };

    const handleModalCancel = () => {
        setIsPasswordModalVisible(false);
        setIsPasswordRuleModalVisible(false);
    };

    const reviewPasswordRule = async () => {
        try {
            const accessToken = Cookies.get('schoolAccessToken');
            const response = await axios.post('http://localhost:5000/api/school/review-password-rule', {
                passwordRule: {
                    template: form.getFieldValue('passwordRuleTemplate')
                },
                dateOfBirth: tempStudentData.dateOfBirth
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            Modal.info({
                title: 'Kết quả xem xét quy tắc mật khẩu',
                content: (
                    <div>
                        <p>Mật khẩu mẫu: {response.data.password}</p>
                    </div>
                ),
                onOk() { }
            });
        } catch (error) {
            console.error('Lỗi khi xem xét quy tắc mật khẩu:', error);
            message.error('Không thể xem xét quy tắc mật khẩu');
        }
    };

    return (
        <div>
            <h1>Quản lý sinh viên</h1>
            <Space style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Tìm kiếm sinh viên"
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 200 }}
                    prefix={<SearchOutlined />}
                />
                <Button type="primary" onClick={handleAdd} disabled={editingKey !== ''}>
                    Thêm sinh viên
                </Button>
                <Button onClick={handleDelete} disabled={selectedRowKeys.length === 0}>
                    Xóa sinh viên đã chọn
                </Button>
                <Button onClick={edit} disabled={selectedRowKeys.length !== 1 || editingKey !== ''}>
                    Sửa
                </Button>
                <Button onClick={save} disabled={editingKey === ''}>
                    Lưu
                </Button>
                <Button onClick={cancel} disabled={editingKey === ''}>
                    Hủy
                </Button>
            </Space>
            <Form form={form} component={false}>
                <Table
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    dataSource={students}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    rowKey="_id"
                    loading={loading}
                    scroll={{ x: true }}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                />
            </Form>
            <Modal
                title="Cung cấp mật khẩu cho sinh viên"
                visible={isPasswordModalVisible}
                onOk={handlePasswordModalOk}
                onCancel={handleModalCancel}
            >
                <Form form={form}>
                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Cập nhật quy tắc mật khẩu"
                visible={isPasswordRuleModalVisible}
                onOk={handlePasswordRuleModalOk}
                onCancel={handleModalCancel}
            >
                <Form form={form}>
                    <Form.Item
                        name="passwordRuleTemplate"
                        label="Mẫu mật khẩu"
                        rules={[{ required: true, message: 'Vui lòng nhập mẫu mật khẩu' }]}
                    >
                        <Input placeholder="School${ngaysinh}2023" />
                    </Form.Item>
                    <div style={{ marginBottom: '16px' }}>
                        <h4>Hướng dẫn tạo mẫu mật khẩu:</h4>
                        <ul>
                            <li>Sử dụng {'$'}{'{ngaysinh}'} để chèn ngày sinh của sinh viên (định dạng DDMMYYYY)</li>
                            <li>Sử dụng {'$'}{'{nam}'} để chèn năm hiện tại</li>
                            <li>Sử dụng {'$'}{'{mssv}'} để chèn mã số sinh viên</li>
                            <li>Ví dụ: School{'$'}{'{ngaysinh}'}{'$'}{'{nam}'} sẽ tạo mật khẩu như School010120052023</li>
                        </ul>
                    </div>
                    <Button onClick={reviewPasswordRule}>Xem xét quy tắc</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default StudentManagement;