import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Input, Row, Col, Switch, Dropdown, Menu, Card, message } from 'antd';
import { SearchOutlined, EyeOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import { InputGroup } from 'react-bootstrap';
import moment from 'moment';
import UpdateSchoolForm from './form/UpdateSchoolForm';
import CreateSchoolForm from './form/CreateSchoolForm';
import axiosInstance from '../../utils/axiosInstance';

const School = () => {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState({});
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/admin/schools', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          sort: sortOrder === 'descend' ? `-${sortField}` : sortField,
          search: searchText,
        },
      });
      setSchools(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.totalItems,
      }));
    } catch (error) {
      message.error(error.message || 'Không thể tải dữ liệu trường học');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, sortField, sortOrder, searchText]);

  const fetchStudentCounts = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/admin/schools/students-count');
      const studentCounts = response.data.data;

      // Cập nhật số lượng sinh viên cho từng trường
      setSchools(prevSchools => 
        prevSchools.map(school => {
          const studentCount = studentCounts.find(sc => sc.id === school.id);
          return {
            ...school,
            studentCount: studentCount ? studentCount.studentCount : 0,
          };
        })
      );
    } catch (error) {
      message.error(error.message || 'Không thể tải số lượng sinh viên');
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchStudentCounts(); // Gọi API để lấy số lượng sinh viên
  }, [fetchData, fetchStudentCounts]);

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
  setLoadingSchools(prev => ({ ...prev, [record.id]: true }));
  try {
    const response = await axiosInstance.put(`/admin/schools/${record.id}`, { 
      isActive: !record.isActive });
    
    // Kiểm tra xem phản hồi có thành công không
    if (response.status === 200) {
      setSchools(prevSchools => prevSchools.map(school => 
        school.id === record.id ? { ...school, isActive: !record.isActive } : school
      ));
      
      message.success(response.data.message || 'Cập nhật trạng thái trường học thành công');
    } else {
      throw new Error('Phản hồi không hợp lệ từ server');
    }
  } catch (error) {
    message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái trường học');
    // Khôi phục trạng thái ban đầu nếu có lỗi
    setSchools(prevSchools => prevSchools.map(school => 
      school.id === record.id ? { ...school, isActive: record.isActive } : school
    ));
  } finally {
    setLoadingSchools(prev => ({ ...prev, [record.id]: false }));
  }
};

  const handleCreate = async (formData) => {
    try {
      const response = await axiosInstance.post('/admin/schools', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('Tạo trường học thành công');
      setSchools(prevSchools => [
        ...prevSchools,
        { ...response.data.school, id: response.data.school.id }
      ]);
      setIsModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể tạo trường học');
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      await axiosInstance.put(`/admin/schools/${id}`, values);
      message.success('Cập nhật trường học thành công');
      setSchools(prevSchools => 
        prevSchools.map(school => 
          school.id === id ? { ...school, ...values } : school
        )
      );
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'SL sinh viên',
      dataIndex: 'studentCount', // Cột mới cho số lượng sinh viên
      key: 'studentCount',
    },
    {
      title: 'Active',
      key: 'isActive',
      render: (record) => (
        <Switch 
          checked={record.isActive} 
          onChange={() => toggleActiveStatus(record)} 
          checkedChildren="Active" 
          unCheckedChildren="Disable"
        />
      ),
    },
    // {
    //   title: 'Ngày tạo',
    //   dataIndex: 'createdAt',
    //   key: 'createdAt',
    //   render: (text) => moment(text).format('DD/MM/YYYY HH:mm:ss'),
    // },
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
        {selectedSchool ? (
          <UpdateSchoolForm 
            initialValues={selectedSchool} 
            onSubmit={(values) => handleUpdate(selectedSchool.id, values)} 
          />
        ) : (
          <CreateSchoolForm onSubmit={handleCreate} />
        )}
      </Modal>

      <Modal
        title="Chi tiết trường học"
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
                <p><strong>Địa chỉ:</strong> {selectedDetails.address}</p>
                <p><strong>Website:</strong> <a href={selectedDetails.website} target="_blank" rel="noopener noreferrer">{selectedDetails.website}</a></p>
                <p><strong>Ngày thành lập:</strong> {moment(selectedDetails.establishedDate).format('DD/MM/YYYY')}</p>
                <p><strong>Ngày tạo:</strong> {moment(selectedDetails.createdAt).format('DD/MM/YYYY HH:mm:ss')}</p>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default School;
