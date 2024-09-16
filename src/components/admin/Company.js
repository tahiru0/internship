import React, { useState } from 'react';
import { Table, Button, Modal, Input, Row, Col, Switch, Dropdown, Menu, Card, message } from 'antd';
import { SearchOutlined, EyeOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import { InputGroup } from 'react-bootstrap';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import moment from 'moment';
import useForm from '../../common/useForm';
import useCrudController from '../../common/useCrudController';

const Company = () => {
  const { axiosInstance } = useAuthorization();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const {
    data: companies,
    loading,
    isModalVisible,
    selectedItem: selectedCompany,
    showActive,
    searchText,
    pagination,
    setIsModalVisible,
    setSelectedItem: setSelectedCompany,
    setShowActive,
    setSearchText,
    handleCreate,
    handleUpdate,
    handleTableChange,
    fetchData,
  } = useCrudController(axiosInstance, '/admin/companies', {
    dataField: 'data',
    totalField: 'total',
    defaultSortField: 'createdAt',
    defaultPageSize: 10,
  });

  const menu = (
    <Menu>
      <Menu.Item key="1">
        <Switch
          checked={showActive}
          onChange={setShowActive}
          checkedChildren="Active"
          unCheckedChildren="All"
        />
      </Menu.Item>
    </Menu>
  );

  const toggleActiveStatus = async (record) => {
    try {
      // Optimistically update the UI
      await axiosInstance.put(`/admin/companies/${record._id}`, { isActive: !record.isActive });
      message.success(`Trạng thái tài khoản đã được cập nhật thành ${!record.isActive ? 'Hoạt động' : 'Không hoạt động'}`);
      // Refresh the data to reflect the changes
      fetchData();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái tài khoản');
    }
  };

  const columns = [
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      render: (text) => text ? <img src={text} alt="Logo" style={{ width: 50, height: 50 }} /> : 'N/A',
      width: 100,
    },
    {
      title: 'Tên công ty',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
    },
    {
      title: 'Active',
      key: 'isActive',
      render: (text, record) => (
        <Switch 
          checked={record.isActive} 
          onChange={() => toggleActiveStatus(record)} 
          checkedChildren="Active" 
          unCheckedChildren="Inactive" 
        />
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => moment(text).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <>
          <Button 
            onClick={() => { setSelectedCompany(record); setIsModalVisible(true); }} 
            icon={<EditOutlined />} 
          />
          <Button 
            onClick={() => { setSelectedDetails(record); setDetailsVisible(true); }} 
            icon={<EyeOutlined />} 
            style={{ marginLeft: 8 }}
          />
        </>
      ),
      width: 120,
      fixed: 'right',
    },
  ];

  return (
    <div className='container'>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        <div className="col-auto">
          <Button type="primary" size="small" onClick={() => { setSelectedCompany(null); setIsModalVisible(true); }}>
            Tạo công ty
          </Button>
        </div>
        <div className="col-auto ms-auto">
          <InputGroup>
            <Dropdown overlay={menu} trigger={['click']}>
              <Button>
                Tùy chọn <DownOutlined />
              </Button>
            </Dropdown>
            <Input
              placeholder="Search"
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200, maxWidth:'50vh' }}
              size="small"
            />
          </InputGroup>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={companies}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={selectedCompany ? 'Edit Company' : 'Create Company'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedCompany ?
          <EditCompanyForm initialValues={selectedCompany} onSubmit={(values) => handleUpdate(selectedCompany._id, values)} /> :
          <CreateCompanyForm onSubmit={handleCreate} />
        }
      </Modal>

      <Modal
        title="Company Details"
        visible={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedDetails && (
          <div>
            <Row gutter={16}>
              <Col span={8}>
                <img src={selectedDetails.logo} alt="Logo" style={{ width: '100%', borderRadius: '8px' }} />
              </Col>
              <Col span={16}>
                <h2>{selectedDetails.name}</h2>
                <p><strong>Email:</strong> {selectedDetails.email}</p>
                <p><strong>Description:</strong></p>
                <div dangerouslySetInnerHTML={{ __html: selectedDetails.description }} />
                <p><strong>Website:</strong> <a href={selectedDetails.website} target="_blank" rel="noopener noreferrer">{selectedDetails.website}</a></p>
                <p><strong>Phone:</strong> {selectedDetails.accounts[0].phone}</p>
                <p><strong>Created At:</strong> {moment(selectedDetails.createdAt).format('DD/MM/YYYY HH:mm:ss')}</p>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

const CreateCompanyForm = ({ onSubmit }) => {
  const formFields = [
    { name: ['user', 'username'], label: 'Username', type: 'text', rules: [{ required: true, message: 'Please input the username' }] },
    { name: ['user', 'password'], label: 'Password', type: 'password', rules: [{ required: true, message: 'Please input the password' }] },
    { name: 'email', label: 'Email', type: 'text', rules: [{ required: true, message: 'Please input the email' }, { type: 'email', message: 'Please enter a valid email' }] },
    { name: 'name', label: 'Name', type: 'text', rules: [{ required: true, message: 'Please input the name' }] },
    { name: 'description', label: 'Description', type: 'wysiwyg', colSpan: 24 },
    { name: 'website', label: 'Website', type: 'link' },
    { name: ['user', 'phone'], label: 'Phone', type: 'text', rules: [{ required: true, message: 'Please input the phone number' }] },
    { name: 'logo', label: 'Logo', type: 'upload', accept: 'image/*', colSpan: 24 },
  ];

  const { form, renderForm } = useForm({ fields: formFields, onSubmit });
  return renderForm();
};

const EditCompanyForm = ({ initialValues, onSubmit }) => {
  const formFields = [
    { name: 'email', label: 'Email', type: 'text', rules: [{ type: 'email', message: 'Please enter a valid email' }] },
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'description', label: 'Description', type: 'wysiwyg', colSpan: 24 },
    { name: 'website', label: 'Website', type: 'link' },
    { name: ['user', 'phone'], label: 'Phone', type: 'text' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
    { name: 'logo', label: 'Logo', type: 'upload', accept: 'image/*', colSpan: 24 },
  ];

  const { form, renderForm } = useForm({ fields: formFields, onSubmit, initialValues });
  return renderForm();
};

export default Company;
