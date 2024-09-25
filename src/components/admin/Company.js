import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Input, Row, Col, Switch, Dropdown, Menu, Card, message } from 'antd';
import { SearchOutlined, EyeOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import { InputGroup } from 'react-bootstrap';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import moment from 'moment';
import useForm from '../../common/useForm';

const Company = () => {
  const { axiosInstance } = useAuthorization();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/companies', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          sort: sortOrder === 'descend' ? `-${sortField}` : sortField,
          search: searchText,
        },
      });
      setCompanies(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.totalItems,
      }));
    } catch (error) {
      message.error('Không thể tải dữ liệu công ty');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sortField, sortOrder, searchText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      ...newPagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
    setSortField(sorter.field);
    setSortOrder(sorter.order);
  };

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
      title: 'SL dự án',
      dataIndex: 'projectCount',
      key: 'projectCount',
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
      sorter: true,
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <>
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

  const menu = (
    <Menu>
      <Menu.Item key="1" onClick={() => handleExport('csv')}>
        Xuất CSV
      </Menu.Item>
      <Menu.Item key="2" onClick={() => handleExport('excel')}>
        Xuất Excel
      </Menu.Item>
    </Menu>
  );

  const handleExport = (type) => {
    // Xử lý xuất dữ liệu
    message.info(`Đang xuất dữ liệu dạng ${type}. Tính năng này chưa được triển khai.`);
  };

  return (
    <div className='container'>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        <div className="col-auto">
          <Button type="primary" size="small" onClick={() => { setSelectedDetails(null); setDetailsVisible(true); }}>
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
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

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
