import React, { useState, useMemo } from 'react';
import { Table, Card, Row, Col, Button, Switch, Avatar, Input, Select, Tooltip, Tag, Popconfirm, Modal, Form, notification } from 'antd';
import { AppstoreOutlined, TableOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { faker } from '@faker-js/faker';
import axios from 'axios'; // Make sure to install axios
import { useCompany } from '../../context/CompanyContext'; // Import the useCompany hook

const { Option } = Select;

// Mock data generation using faker
const generateEmployees = (count = 20) => {
  return Array.from({ length: count }, () => ({
    key: faker.datatype.uuid(),
    name: faker.name.fullName(),
    email: faker.internet.email(),
    role: faker.helpers.arrayElement(['Sub-admin', 'Mentor']),
    status: faker.helpers.arrayElement(['Active', 'Inactive']),
    avatar: faker.image.avatar(),
  }));
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState(generateEmployees());
  const [view, setView] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortOrder, setSortOrder] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const { token } = useCompany(); // Get the token from the context
  const [form] = Form.useForm();

  // Delete an employee
  const deleteEmployee = (key) => {
    setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.key !== key));
  };

  // Filter and search logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || employee.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? employee.status === statusFilter : true;
      const matchesRole = roleFilter ? employee.role === roleFilter : true;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [employees, searchTerm, statusFilter, roleFilter]);

  // Sorting logic
  const sortedEmployees = useMemo(() => {
    if (!sortOrder) return filteredEmployees;
    return [...filteredEmployees].sort((a, b) => {
      if (sortOrder === 'ascend') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });
  }, [filteredEmployees, sortOrder]);

  // Define table columns
  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar) => <Avatar src={avatar} />,
      width: 60,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder,
      onHeaderCell: () => ({
        onClick: () => setSortOrder(sortOrder === 'ascend' ? 'descend' : 'ascend'),
      }),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleColors = {
          'Sub-admin': 'red',
          'Mentor': 'blue',
        };
        return <Tag color={roleColors[role]}>{role}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          'Active': 'green',
          'Inactive': 'gray',
        };
        return <Tag color={statusColors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this employee?"
            onConfirm={() => deleteEmployee(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button icon={<DeleteOutlined />} style={{ marginLeft: 8 }} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
      width: 100,
    },
  ];

  // Handle double-click to open modal
  const handleRowDoubleClick = (record) => {
    setSelectedEmployee(record);
    setIsModalVisible(true);
  };

  // Handle edit action
  const handleEdit = (record) => {
    // Implement edit functionality here
    console.log('Edit employee:', record);
  };

  // Render employee cards for grid view
  const renderGrid = () => (
    <Row gutter={16}>
      {sortedEmployees.map((employee) => (
        <Col xs={24} sm={12} md={8} lg={6} key={employee.key}>
          <Card
            title={employee.name}
            bordered={false}
            style={{ marginBottom: 16 }}
            onDoubleClick={() => handleRowDoubleClick(employee)}
          >
            <Avatar src={employee.avatar} size={64} style={{ marginBottom: 16 }} />
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Role:</strong> <Tag color={employee.role === 'Sub-admin' ? 'red' : 'blue'}>{employee.role}</Tag></p>
            <p><strong>Status:</strong> <Tag color={employee.status === 'Active' ? 'green' : 'gray'}>{employee.status}</Tag></p>
            <div>
              <Tooltip title="Edit">
                <Button icon={<EditOutlined />} onClick={() => handleEdit(employee)} />
              </Tooltip>
              <Popconfirm
                title="Are you sure to delete this employee?"
                onConfirm={() => deleteEmployee(employee.key)}
                okText="Yes"
                cancelText="No"
              >
                <Tooltip title="Delete">
                  <Button icon={<DeleteOutlined />} style={{ marginLeft: 8 }} />
                </Tooltip>
              </Popconfirm>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // Modal for employee details
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedEmployee(null);
  };

  // Handle create employee modal
  const handleCreateModalOpen = () => {
    setIsCreateModalVisible(true);
    form.resetFields(); // Reset form fields
  };

  const handleCreateModalClose = () => {
    setIsCreateModalVisible(false);
  };

  const handleCreateEmployee = (values) => {
    // Simulate creating an employee
    const newEmployee = {
      key: values.email, // Use email as the unique key
      name: values.name,
      email: values.email,
      role: values.role,
      status: 'Inactive', // Set default status to Inactive
      avatar: faker.image.avatar(), // Generate a random avatar
    };
  
    // Update the employees state
    setEmployees((prev) => [...prev, newEmployee]);
  
    // Show success notification
    notification.success({
      message: 'Tạo tài khoản thành công',
      description: 'Tài khoản đã được tạo. Vui lòng kiểm tra email để xác nhận tài khoản.',
    });
  
    // Close the modal
    handleCreateModalClose();
  };
  

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search employees"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 200 }}
            allowClear
          >
            <Option value="Active">Active</Option>
            <Option value="Inactive">Inactive</Option>
          </Select>
          <Select
            placeholder="Filter by role"
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 200 }}
            allowClear
          >
            <Option value="Sub-admin">Sub-admin</Option>
            <Option value="Mentor">Mentor</Option>
          </Select>
        </div>
        <div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateModalOpen}>
            Create Employee
          </Button>
          <Switch
            checkedChildren={<AppstoreOutlined />}
            unCheckedChildren={<TableOutlined />}
            onChange={(checked) => setView(checked ? 'grid' : 'table')}
            checked={view === 'grid'}
            style={{ marginLeft: 16 }}
          />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        {view === 'table' ? (
          <Table
            columns={columns}
            dataSource={sortedEmployees}
            pagination={{ pageSize: 5 }}
            onRow={(record) => ({
              onDoubleClick: () => handleRowDoubleClick(record),
            })}
          />
        ) : (
          renderGrid()
        )}
      </div>

      {/* Modal for employee details */}
      <Modal
        title="Employee Details"
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        {selectedEmployee && (
          <div>
            <Avatar src={selectedEmployee.avatar} size={64} />
            <p><strong>Name:</strong> {selectedEmployee.name}</p>
            <p><strong>Email:</strong> {selectedEmployee.email}</p>
            <p><strong>Role:</strong> {selectedEmployee.role}</p>
            <p><strong>Status:</strong> {selectedEmployee.status}</p>
          </div>
        )}
      </Modal>

      {/* Modal for creating a new employee */}
      <Modal
        title="Create Employee"
        visible={isCreateModalVisible}
        onCancel={handleCreateModalClose}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateEmployee}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please input the email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input the password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select placeholder="Select a role">
              <Option value="sub-admin">Sub-admin</Option>
              <Option value="mentor">Mentor</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;
