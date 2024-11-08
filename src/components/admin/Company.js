import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Input, Row, Col, Switch, Dropdown, Menu, Card, message } from 'antd';
import { SearchOutlined, DownOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { InputGroup } from 'react-bootstrap';
import moment from 'moment';
import axiosInstance from '../../utils/axiosInstance';
import CreateCompanyForm from './form/CreateCompanyForm';
import UpdateCompanyForm from './form/UpdateCompanyForm';

const Company = () => {
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState({});

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
      message.error(error.message || 'Không thể tải dữ liệu công ty');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sortField, sortOrder, searchText]);

  const fetchProjectCounts = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/admin/companies/project-count');
      const projectCounts = response.data.data;

      // Cập nhật số lượng dự án cho từng công ty
      setCompanies(prevCompanies => 
        prevCompanies.map(company => {
          const projectCount = projectCounts.find(pc => pc.id === company.id);
          return {
            ...company,
            projectCount: projectCount ? projectCount.projectCount : 0,
          };
        })
      );
    } catch (error) {
      message.error(error.message || 'Không thể tải số lượng dự án');
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchProjectCounts(); // Gọi API để lấy số lượng dự án
  }, [fetchData, fetchProjectCounts]);

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
    setLoadingCompanies(prev => ({ ...prev, [record.id]: true }));
    try {
      const response = await axiosInstance.put(`/admin/companies/${record.id}`, { 
        isActive: !record.isActive 
      });

      if (response.status === 200) {
        setCompanies(prevCompanies => prevCompanies.map(company => 
          company.id === record.id ? { ...company, isActive: !record.isActive } : company
        ));
        
        message.success(response.data.message || 'Cập nhật trạng thái tài khoản thành công');
      } else {
        throw new Error('Phản hồi không hợp lệ từ server');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản');
      setCompanies(prevCompanies => prevCompanies.map(company => 
        company.id === record.id ? { ...company, isActive: record.isActive } : company
      ));
    } finally {
      setLoadingCompanies(prev => ({ ...prev, [record.id]: false }));
    }
  };

  const handleCreate = async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/companies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Tạo công ty thành công');
      setCompanies(prevCompanies => [
        ...prevCompanies,
        { ...response.data.data, id: response.data.data.id }
      ]);
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo công ty');
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      await axiosInstance.put(`/admin/companies/${id}`, values);
      message.success('Cập nhật công ty thành công');

      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === id ? { ...company, ...values } : company
        )
      );

      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể cập nhật công ty');
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
    },
    {
      title: 'SL dự án',
      dataIndex: 'projectCount', // Cột mới cho số lượng dự án
      key: 'projectCount',
    },
    {
      title: 'Active',
      key: 'isActive',
      render: (text, record) => (
        <Switch 
          checked={record.isActive} 
          onChange={() => toggleActiveStatus(record)} 
          checkedChildren="Active" 
          unCheckedChildren="Disable" 
          loading={loadingCompanies[record.id]}
          disabled={loadingCompanies[record.id]}
        />
      ),
    },
    // {
    //   title: 'Ngày tạo',
    //   dataIndex: 'createdAt',
    //   key: 'createdAt',
    //   render: (text) => moment(text).format('DD/MM/YYYY'),
    // },
    {
      title: 'Hành động',
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
        title={selectedCompany ? 'Chỉnh sửa công ty' : 'Tạo công ty'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedCompany ? (
          <UpdateCompanyForm 
            initialValues={selectedCompany} 
            onSubmit={(values) => handleUpdate(selectedCompany.id, values)} 
          />
        ) : (
          <CreateCompanyForm onSubmit={handleCreate} />
        )}
      </Modal>

      <Modal
        title="Chi tiết công ty"
        visible={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[<Button key="back" onClick={() => setDetailsVisible(false)}>Đóng</Button>]}
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
                <p><strong>SL dự án:</strong> {selectedDetails.projectCount}</p>
                <p><strong>Địa chỉ:</strong> {selectedDetails.address}</p>
                <p><strong>Website:</strong> <a href={selectedDetails.website} target="_blank" rel="noopener noreferrer">{selectedDetails.website}</a></p>
                <p><strong>Ngày tạo:</strong> {moment(selectedDetails.createdAt).format('DD/MM/YYYY HH:mm:ss')}</p>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Company;