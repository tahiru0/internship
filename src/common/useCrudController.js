import { useState, useEffect, useCallback } from 'react';
import { Modal } from 'antd';

const useCrudController = (axiosInstance, endpoint, config = {}) => {
  const {
    dataField = '',
    totalField = '',
    defaultSortField = '',
    defaultPageSize = 10,
  } = config;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: defaultPageSize,
    total: 0,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
  });
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortOrder, setSortOrder] = useState('');
  const [selectedFields, setSelectedFields] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filterString = Object.entries(filters)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');

      const response = await axiosInstance.get(endpoint, {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          sort: sortOrder === 'descend' ? `-${sortField}` : sortField,
          filter: filterString,
          search: searchText,
          select: selectedFields.join(','),
        },
      });
      setData(response.data[dataField]);
      setPagination(prev => ({
        ...prev,
        total: response.data[totalField],
      }));
    } catch (error) {
      Modal.error({ content: error.response?.data?.message || 'Không thể tải dữ liệu' });
    } finally {
      setLoading(false);
    }
  }, [filters, searchText, pagination.current, pagination.pageSize, sortField, sortOrder, selectedFields, dataField, totalField]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (formData) => {
    try {
      const response = await axiosInstance.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Modal.success({ content: response.data.message || 'Tạo mục thành công' });
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      Modal.error({ content: error.response?.data?.error || error.response?.data?.message || 'Không thể tạo mục' });
    }
  };

  const handleUpdate = async (id, values) => {
    try {
      const response = await axiosInstance.patch(`${endpoint}/${id}`, values);
      Modal.success({ content: response.data.message || 'Cập nhật mục thành công' });
      fetchData();
      setIsModalVisible(false);
    } catch (error) {
      Modal.error({ content: error.response?.data?.message || 'Không thể cập nhật mục' });
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination({
      ...pagination,
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
    setSortField(sorter.field);
    setSortOrder(sorter.order);
  };

  return {
    data,
    loading,
    isModalVisible,
    selectedItem,
    filters,
    searchText,
    pagination,
    selectedFields,
    setIsModalVisible,
    setSelectedItem,
    setFilters,
    setSearchText,
    setSelectedFields,
    handleCreate,
    handleUpdate,
    handleTableChange,
    fetchData,
  };
};

export default useCrudController;