import React, { useState } from 'react';
import { Table, Button, Modal, Input, Row, Col, Switch, Dropdown, Menu, Card, message } from 'antd';
import { SearchOutlined, EyeOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import { InputGroup } from 'react-bootstrap';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import moment from 'moment';
import useForm from '../../common/useForm';
import useCrudController from '../../common/useCrudController';

const School = () => {
  const { axiosInstance } = useAuthorization();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

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
      await axiosInstance.put(`/admin/schools/${record._id}`, { isActive: !record.isActive });
      message.success(`Trạng thái trường học đã được cập nhật thành ${!record.isActive ? 'Hoạt động' : 'Không hoạt động'}`);
      fetchData();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái trường học');
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
      title: 'Tên trường',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
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
      title: 'Ngày tạo',
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
            onClick={() => { setSelectedSchool(record); setIsModalVisible(true); }} 
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
          <Button type="primary" size="small" onClick={() => { setSelectedSchool(null); setIsModalVisible(true); }}>
            Tạo trường học
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
              placeholder="Tìm kiếm"
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
          dataSource={schools}
          rowKey="_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={selectedSchool ? 'Chỉnh sửa trường học' : 'Tạo trường học'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedSchool ?
          <EditSchoolForm initialValues={selectedSchool} onSubmit={(values) => handleUpdate(selectedSchool._id, values)} /> :
          <CreateSchoolForm onSubmit={handleCreate} />
        }
      </Modal>

      <Modal
        title="Chi tiết trường học"
        visible={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailsVisible(false)}>
            Đóng
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
                <p><strong>Địa chỉ:</strong> {selectedDetails.address}</p>
                <p><strong>Website:</strong> <a href={selectedDetails.website} target="_blank" rel="noopener noreferrer">{selectedDetails.website}</a></p>
                <p><strong>Ngày thành lập:</strong> {moment(selectedDetails.establishedDate).format('DD/MM/YYYY')}</p>
                <p><strong>Email admin:</strong> {selectedDetails.accounts[0].email}</p>
                <p><strong>Ngày tạo:</strong> {moment(selectedDetails.createdAt).format('DD/MM/YYYY HH:mm:ss')}</p>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

const CreateSchoolForm = ({ onSubmit }) => {
  const formFields = [
    { name: 'name', label: 'Tên trường', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập tên trường' }] },
    { name: 'address', label: 'Địa chỉ', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập địa chỉ' }] },
    { name: 'website', label: 'Website', type: 'link' },
    { name: 'establishedDate', label: 'Ngày thành lập', type: 'date' },
    { name: ['accounts', 0, 'name'], label: 'Tên admin', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập tên admin' }] },
    { name: ['accounts', 0, 'email'], label: 'Email admin', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập email admin' }, { type: 'email', message: 'Vui lòng nhập email hợp lệ' }] },
    { name: ['accounts', 0, 'password'], label: 'Mật khẩu admin', type: 'password', rules: [{ required: true, message: 'Vui lòng nhập mật khẩu admin' }] },
    { name: 'logo', label: 'Logo', type: 'upload', accept: 'image/*', colSpan: 24 },
  ];

  const { form, renderForm } = useForm({ fields: formFields, onSubmit });
  return renderForm();
};

const EditSchoolForm = ({ initialValues, onSubmit }) => {
  const formFields = [
    { name: 'name', label: 'Tên trường', type: 'text' },
    { name: 'address', label: 'Địa chỉ', type: 'text' },
    { name: 'website', label: 'Website', type: 'link' },
    { name: 'establishedDate', label: 'Ngày thành lập', type: 'date' },
    { name: ['accounts', 0, 'name'], label: 'Tên admin', type: 'text' },
    { name: ['accounts', 0, 'email'], label: 'Email admin', type: 'text', rules: [{ type: 'email', message: 'Vui lòng nhập email hợp lệ' }] },
    { name: 'isActive', label: 'Hoạt động', type: 'checkbox' },
    { name: 'logo', label: 'Logo', type: 'upload', accept: 'image/*', colSpan: 24 },
  ];

  const { form, renderForm } = useForm({ fields: formFields, onSubmit, initialValues });
  return renderForm();
};

export default School;