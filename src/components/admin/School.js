import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Input, Row, Col, Switch, Dropdown, Menu, Card, message } from 'antd';
import { SearchOutlined, EyeOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import { InputGroup } from 'react-bootstrap';
import { useAuthorization } from '../../routes/RequireAdminAuth';
import moment from 'moment';
import useForm from '../../common/useForm';

const School = () => {
  const { axiosInstance } = useAuthorization();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActive, setShowActive] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('');
  const [loadingSchools, setLoadingSchools] = useState({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/schools', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          sort: sortOrder === 'descend' ? `-${sortField}` : sortField,
          search: searchText,
          isActive: showActive ? true : undefined,
        },
      });
      setSchools(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.totalItems,
      }));
    } catch (error) {
      message.error('Không thể tải dữ liệu trường học');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sortField, sortOrder, searchText, showActive]);

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
    setLoadingSchools(prev => ({ ...prev, [record._id]: true }));
    try {
      const response = await axiosInstance.put(`/admin/schools/${record._id}`, { isActive: !record.isActive });
      
      if (response.data && response.data.updatedFields) {
        setSchools(prevSchools => prevSchools.map(school => 
          school._id === record._id ? { ...school, ...response.data.updatedFields } : school
        ));
        
        message.success(response.data.message || 'Cập nhật trạng thái trường học thành công');
      } else {
        throw new Error('Phản hồi không hợp lệ từ server');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái trường học');
      // Khôi phục trạng thái ban đầu nếu có lỗi
      setSchools(prevSchools => prevSchools.map(school => 
        school._id === record._id ? { ...school, isActive: record.isActive } : school
      ));
    } finally {
      setLoadingSchools(prev => ({ ...prev, [record._id]: false }));
    }
  };

  const handleCreate = async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/schools', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Tạo trường học thành công');
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo trường học');
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      const response = await axiosInstance.patch(`/admin/schools/${id}`, values);
      message.success('Cập nhật trường học thành công');
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trường học');
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
      title: 'SL sinh viên',
      dataIndex: 'studentCount',
      key: 'studentCount',
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
          loading={loadingSchools[record._id]}
          disabled={loadingSchools[record._id]}
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
  const allowedFields = ['name', 'address', 'website', 'description', 'logo'];

  // Xử lý ngày thành lập và lọc các trường được phép chỉnh sửa
  const processedInitialValues = Object.keys(initialValues)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => {
      if (key === 'establishedDate') {
        obj[key] = initialValues[key] ? moment(initialValues[key]) : null;
      } else {
        obj[key] = initialValues[key];
      }
      return obj;
    }, {});

  const formFields = [
    { name: 'name', label: 'Tên trường', type: 'text' },
    { name: 'address', label: 'Địa chỉ', type: 'text' },
    { name: 'website', label: 'Website', type: 'link' },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { name: 'logo', label: 'Logo', type: 'upload', accept: 'image/*', colSpan: 24 },
  ];

  const handleSubmit = (values) => {
    // Ch gửi các trường được phép chỉnh sửa
    const filteredValues = Object.keys(values)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = values[key];
        return obj;
      }, {});

    onSubmit(filteredValues);
  };

  const { form, renderForm } = useForm({ 
    fields: formFields, 
    onSubmit: handleSubmit, 
    initialValues: processedInitialValues 
  });
  
  return renderForm();
};

export default School;
