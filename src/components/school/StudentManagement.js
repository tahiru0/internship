import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Space, message, Form, DatePicker, Select, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
// import axios from 'axios';
// import Cookies from 'js-cookie';
import debounce from 'lodash/debounce';
import moment from 'moment';
import { faker } from '@faker-js/faker';

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

    const generateFakeStudents = (count) => {
        return Array.from({ length: count }, () => ({
            _id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            studentId: faker.string.numeric(8),
            dateOfBirth: faker.date.between({ from: '1990-01-01', to: '2005-12-31' }).toISOString(),
            major: faker.helpers.arrayElement(['cntt', 'ktpm', 'ktmt']),
        }));
    };

    const fetchStudents = useCallback(async (search = '') => {
        setLoading(true);
        // Giả lập việc tìm kiếm và trì hoãn
        await new Promise(resolve => setTimeout(resolve, 500));
        const fakeStudents = generateFakeStudents(20);
        const filteredStudents = fakeStudents.filter(student => 
            student.name.toLowerCase().includes(search.toLowerCase()) ||
            student.email.toLowerCase().includes(search.toLowerCase()) ||
            student.studentId.includes(search)
        );
        setStudents(filteredStudents);
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
                if (editingKey === 'new') {
                    const newStudent = {
                        _id: faker.string.uuid(),
                        ...row,
                        dateOfBirth: row.dateOfBirth.format('YYYY-MM-DD'),
                    };
                    newData[index] = newStudent;
                    setStudents(newData);
                    setEditingKey('');
                    setIsCreating(false);
                    message.success('Thêm sinh viên thành công');
                } else {
                    newData[index] = { ...item, ...row, dateOfBirth: row.dateOfBirth.format('YYYY-MM-DD') };
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
        const newData = students.filter(item => !selectedRowKeys.includes(item._id));
        setStudents(newData);
        message.success(`Đã xóa ${selectedRowKeys.length} sinh viên`);
        setSelectedRowKeys([]);
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

    // Comment lại các Modal liên quan đến mật khẩu và quy tắc mật khẩu

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
        </div>
    );
};

export default StudentManagement;