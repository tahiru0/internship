import React, { useCallback, useEffect, useState } from 'react';
import { Table, Button, Input, Modal, Form, Select, Dropdown, Menu, Space, message, DatePicker, Row, Col } from 'antd';
import { SearchOutlined, DownOutlined } from '@ant-design/icons';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import Cookies from 'js-cookie';
import useCrudController from '../../common/useCrudController';
import moment from 'moment';

const { Option } = Select;

const CreateSchoolForm = ({ onSubmit }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values) => {
    const formattedValues = {
      name: values.name,
      address: values.address,
      website: values.website,
      establishedDate: values.establishedDate.toISOString(),
      accounts: [
        {
          name: values.accountName,
          email: values.accountEmail,
          password: values.accountPassword,
          role: {
            name: "admin",
            department: "Quản trị"
          }
        }
      ]
    };
    onSubmit(formattedValues);
    form.resetFields();
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="name"
            label="Tên trường"
            rules={[{ required: true, message: 'Vui lòng nhập tên trường' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="website"
            label="Website"
            rules={[{ type: 'url', message: 'Vui lòng nhập đúng định dạng URL' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="establishedDate"
            label="Ngày thành lập"
            rules={[{ required: true, message: 'Vui lòng chọn ngày thành lập' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="accountName"
            label="Tên tài khoản admin"
            rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản admin' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="accountEmail"
            label="Email tài khoản admin"
            rules={[
              { required: true, message: 'Vui lòng nhập email admin' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item
            name="accountPassword"
            label="Mật khẩu tài khoản admin"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu admin' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Tạo mới
        </Button>
      </Form.Item>
    </Form>
  );
};

const EditSchoolForm = ({ initialValues, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        establishedDate: moment(initialValues.establishedDate),
        accountName: initialValues.accounts?.[0]?.name || '',
        accountEmail: initialValues.accounts?.[0]?.email || '',
      });
    }
  }, [form, initialValues]);

  const handleSubmit = (values) => {
    const formattedValues = {
      name: values.name,
      address: values.address,
      website: values.website,
      establishedDate: values.establishedDate.toISOString(),
      accounts: [
        {
          name: values.accountName,
          email: values.accountEmail,
          role: {
            name: "admin",
            department: "Quản trị"
          }
        }
      ]
    };
    onSubmit(formattedValues);
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="name"
            label="Tên trường"
            rules={[{ required: true, message: 'Vui lòng nhập tên trường' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="website"
            label="Website"
            rules={[{ type: 'url', message: 'Vui lòng nhập đúng định dạng URL' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="establishedDate"
            label="Ngày thành lập"
            rules={[{ required: true, message: 'Vui lòng chọn ngày thành lập' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="accountName"
            label="Tên tài khoản admin"
            rules={[{ required: true, message: 'Vui lòng nhập tên tài khoản admin' }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="accountEmail"
            label="Email tài khoản admin"
            rules={[
              { required: true, message: 'Vui lòng nhập email admin' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Cập nhật
        </Button>
      </Form.Item>
    </Form>
  );
};

const School = () => {
  const { axiosInstance } = useAuthorization();

  useEffect(() => {
    const token = Cookies.get('adminAccessToken');
    if (token) {
      axiosInstance.defaults.headers['Authorization'] = `Bearer ${token}`;
    }
  }, [axiosInstance]);

  const {
    data: schools,
    loading,
    isModalVisible,
    selectedItem: selectedSchool,
    showActive,
    searchText,
    pagination,
    setIsModalVisible,
    setSelectedItem: setSelectedSchool,
    setShowActive,
    setSearchText,
    handleCreate,
    handleUpdate,
    handleTableChange,
    fetchData,
  } = useCrudController(axiosInstance, '/admin/schools', {
    dataField: 'data',
    totalField: 'total',
    defaultSortField: 'createdAt',
    defaultPageSize: 10,
  });

  const columns = [
    { title: 'Tên trường', dataIndex: 'name', key: 'name', sorter: true },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    { title: 'Website', dataIndex: 'website', key: 'website' },
    { 
      title: 'Ngày thành lập', 
      dataIndex: 'establishedDate', 
      key: 'establishedDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Email admin',
      dataIndex: 'accounts',
      key: 'adminEmail',
      render: (accounts) => accounts?.[0]?.email || 'N/A'
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button onClick={() => setSelectedSchool(record)}>Sửa</Button>
      ),
    },
  ];

  const handleSearch = useCallback((value) => {
    setSearchText(value);
    fetchData({ page: 1, searchText: value });
  }, [fetchData, setSearchText]);

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => setShowActive(true)}>Hiển thị trường đang hoạt động</Menu.Item>
      <Menu.Item key="2" onClick={() => setShowActive(false)}>Hiển thị tất cả trường</Menu.Item>
    </Menu>
  );

  return (
    <div className='container'>
      <h1>Quản lý trường học</h1>
      <div className="row mb-3">
        <div className="col-auto">
          <Button onClick={() => setIsModalVisible(true)}>Thêm trường mới</Button>
        </div>
        <div className="col-auto ms-auto">
          <Space>
            <Dropdown overlay={menu} trigger={['click']}>
              <Button>
                Tùy chọn <DownOutlined />
              </Button>
            </Dropdown>
            <Input
              placeholder="Tìm kiếm"
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              value={searchText}
              style={{ width: 200, maxWidth:'50vh' }}
              size="small"
            />
          </Space>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={schools}
        rowKey="_id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />
      <Modal
        title={selectedSchool ? "Sửa thông tin trường" : "Thêm trường mới"}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedSchool(null);
        }}
        footer={null}
      >
        {selectedSchool ? (
          <EditSchoolForm
            initialValues={selectedSchool}
            onSubmit={(values) => handleUpdate(selectedSchool._id, values)}
          />
        ) : (
          <CreateSchoolForm onSubmit={handleCreate} />
        )}
      </Modal>
    </div>
  );
};

export default School;