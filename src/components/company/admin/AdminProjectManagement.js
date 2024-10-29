import { Table, Button, Modal, message, Avatar, Typography, Card, Tag, Popconfirm, Switch, Pagination, Tooltip, Progress, Dropdown, Menu, Row, Col, Empty, Input, Select, DatePicker, InputNumber, Descriptions, Spin } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined, AppstoreOutlined, TableOutlined, PushpinOutlined, PushpinFilled, SearchOutlined, MoreOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../../utils/axiosInstance';
import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import useForm from '../../../common/useForm';

const { Title } = Typography;
const { Option } = Select;

const AdminProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isGridView, setIsGridView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [recruitingModalVisible, setRecruitingModalVisible] = useState(false);
  const [recruitingProject, setRecruitingProject] = useState(null);
  const [applicationEnd, setApplicationEnd] = useState(null);
  const [maxApplicants, setMaxApplicants] = useState(0);
  const [changeMentorModalVisible, setChangeMentorModalVisible] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [newMentorId, setNewMentorId] = useState(null);
  const [mentorDetailModalVisible, setMentorDetailModalVisible] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [oldMentorId, setOldMentorId] = useState(null);
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const containerRef = useRef(null);
  const [skills, setSkills] = useState([]);
  const [majors, setMajors] = useState([]);
  

  const formFields = [
    { name: 'title', label: 'Tên dự án', type: 'text', rules: [{ required: true, message: 'Vui lòng nhập tên dự án' }], colSpan: 24 },
    { name: 'mentorId', label: 'Người hướng dẫn', type: 'select', options: mentors.map(mentor => ({ value: mentor._id, label: mentor.name })), rules: [{ required: true, message: 'Vui lòng chọn Người hướng dẫn' }], colSpan: 12 },
    { name: 'isRecruiting', label: 'Đang tuyển dụng', type: 'checkbox', colSpan: 12 },
    { name: 'maxApplicants', label: 'Số lượng ứng viên tối đa', type: 'number', rules: [{ required: true, message: 'Vui lòng nhập số lượng ứng viên tối đa' }], colSpan: 8, dependsOn: 'isRecruiting' },
    { name: 'applicationPeriod', label: 'Thời gian ứng tuyển', type: 'dateRange', rules: [{ required: true, message: 'Vui lòng chọn thời gian ứng tuyển' }], colSpan: 24, dependsOn: 'isRecruiting' },
    { name: 'description', label: 'Mô tả', type: 'textarea', rules: [{ required: true, message: 'Vui lòng nhập mô tả' }], colSpan: 24 },
    { name: 'objectives', label: 'Mục tiêu', type: 'textarea', rules: [{ required: true, message: 'Vui lòng nhập mục tiêu' }], colSpan: 24 },
    { name: 'requiredSkills', label: 'Kỹ năng yêu cầu', type: 'tags', options: skills.map(skill => ({ value: skill._id, label: skill.name })), colSpan: 12 },
    { name: 'relatedMajors', label: 'Ngành liên quan', type: 'tags', options: majors.map(major => ({ value: major._id, label: major.name })), colSpan: 12 },
  ];

  const handleAddEdit = useCallback(async (values) => {
    setLoading(true);
    try {
      const accessToken = Cookies.get('accessToken');
      if (editingProject) {
        const response = await axiosInstance.put(`/company/projects/${editingProject._id}`, values, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        message.success(response.data.message || 'Cập nhật dự án thành công');
      } else {
        const response = await axiosInstance.post('/company/projects', values, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        message.success(response.data.message || 'Thêm dự án mới thành công');
      }
      setModalVisible(false);
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Lỗi khi thêm/sửa dự án:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể thêm/sửa dự án');
      }
    } finally {
      setLoading(false);
    }
  }, [editingProject, pagination.current, pagination.pageSize]);

  const { form, renderForm } = useForm({
    fields: formFields,
    onSubmit: handleAddEdit,
    initialValues: editingProject,
  });

  const fetchProjects = async (page = 1, pageSize = 10, filters = {}, sorter = {}) => {
    setLoading(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
      });

      // Thêm các bộ lọc
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.join(','));
        }
      });

      // Thêm sắp xếp
      if (sorter.field && sorter.order) {
        params.append('sortBy', sorter.field);
        params.append('order', sorter.order === 'ascend' ? 'asc' : 'desc');
      }

      const response = await axiosInstance.get(`/company/projects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Kiểm tra xem response.data có phải là một mảng không
      if (Array.isArray(response.data)) {
        setProjects(response.data);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.data.length, // Hoặc sử dụng giá trị total từ headers nếu có
        });
      } else if (response.data && Array.isArray(response.data.projects)) {
        // Nếu response.data là một object chứa mảng projects
        setProjects(response.data.projects);
        setPagination({
          current: response.data.page || page,
          pageSize: response.data.limit || pageSize,
          total: response.data.total || response.data.projects.length,
        });
      } else {
        console.error('Dữ liệu nhận được không hợp lệ:', response.data);
        message.error(response.data.message || 'Có lỗi xảy ra khi lấy danh sách dự án');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách dự án:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể lấy danh sách dự án');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axiosInstance.get('/company/mentors', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.data && Array.isArray(response.data)) {
        setMentors(response.data);
      } else {
        console.error('Dữ liệu mentor không hợp lệ:', response.data);
        message.error('Có lỗi xảy ra khi lấy danh sách mentor');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách mentor:', error);
      message.error('Không thể lấy danh sách mentor');
    }
  };

  const fetchMentorDetail = async (mentorId) => {
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axiosInstance.get(`/company/mentors/${mentorId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSelectedMentor(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết mentor:', error);
      message.error('Không thể lấy thông tin chi tiết mentor');
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await axiosInstance.get('/guest/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách kỹ năng:', error);
      message.error('Không thể lấy danh sách kỹ năng');
    }
  };

  const fetchMajors = async () => {
    try {
      const response = await axiosInstance.get('/guest/majors');
      setMajors(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách ngành học:', error);
      message.error('Không thể lấy danh sách ngành học');
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchMentors();
    fetchSkills();
    fetchMajors();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
    fetchProjects(pagination.current, pagination.pageSize, filters, sorter);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axiosInstance.delete(`/company/projects/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success(response.data.message || 'Xóa dự án thành công');
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Lỗi khi xóa dự án:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể xóa dự án');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePinProject = async (id) => {
    // Implement the toggle pin project functionality here
  };

  const handleToggleRecruiting = async (record) => {
    if (record.isRecruiting) {
      // Tắt trạng thái tuyển dụng
      try {
        const accessToken = Cookies.get('accessToken');
        await axiosInstance.patch(`/company/projects/${record._id}/stop-recruiting`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        message.success('Đã tắt trạng thái tuyển dụng');
        fetchProjects(pagination.current, pagination.pageSize);
      } catch (error) {
        console.error('Lỗi khi tắt trạng thái tuyển dụng:', error);
        if (error.response && error.response.data && error.response.data.message) {
          message.error(error.response.data.message);
        } else {
          message.error('Không thể tắt trạng thái tuyển dụng');
        }
      }
    } else {
      // Mở modal để chọn ngày kết thúc tuyển dụng và số ứng viên tối đa
      setRecruitingProject(record);
      setMaxApplicants(record.maxApplicants || 0); // Tự động điền maxApplicants nếu có
      setRecruitingModalVisible(true);
    }
  };

  const handleStartRecruiting = async () => {
    if (!applicationEnd) {
      message.error('Vui lòng chọn ngày kết thúc tuyển dụng');
      return;
    }

    try {
      const accessToken = Cookies.get('accessToken');
      await axiosInstance.patch(`/company/projects/${recruitingProject._id}/start-recruiting`, {
        maxApplicants,
        applicationEnd: applicationEnd.format('YYYY-MM-DD')
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      message.success('Đã bật trạng thái tuyển dụng');
      setRecruitingModalVisible(false);
      setRecruitingProject(null); // Reset recruitingProject sau khi hoàn thành
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Lỗi khi bật trạng thái tuyển dụng:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể bật trạng thái tuyển dụng');
      }
    }
  };

  const handleChangeMentor = async () => {
    if (!selectedProjectId || !newMentorId || !oldMentorId) {
      message.error('Vui lòng chọn dự án, Người hướng dẫn cũ và Người hướng dẫn mới');
      return;
    }

    setLoading(true);
    try {
      const accessToken = Cookies.get('accessToken');
      const response = await axiosInstance.patch(
        `/company/projects/${selectedProjectId}/change-mentor`, 
        { newMentorId, oldMentorId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      message.success(response.data.message || 'Thay đổi Người hướng dẫn thành công');
      setChangeMentorModalVisible(false);
      fetchProjects(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('Lỗi khi thay đổi Người hướng dẫn:', error);
      if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Không thể thay đổi Người hướng dẫn');
      }
    } finally {
      setLoading(false);
    }
  };

  const openMentorDetailModal = (projectId, mentorId) => {
    setSelectedProjectId(projectId);
    setOldMentorId(mentorId);
    fetchMentorDetail(mentorId);
    setMentorDetailModalVisible(true);
  };

  const columns = [
    {
      title: '',
      key: 'pin',
      render: (_, record) => (
        <Tooltip title={record.pinned ? 'Bỏ ghim dự án' : 'Ghim dự án'}>
          {record.pinned ? (
            <PushpinFilled onClick={() => togglePinProject(record._id)} />
          ) : (
            <PushpinOutlined onClick={() => togglePinProject(record._id)} />
          )}
        </Tooltip>
      ),
      width: 60,
    },
    {
      title: 'Tên Dự Án',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'title' && sortedInfo.order,
      filteredValue: filteredInfo.title || null,
      onFilter: (value, record) => record.title.includes(value),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm tên dự án"
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Tìm
          </Button>
          <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
            Đặt lại
          </Button>
        </div>
      ),
      filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    },
    {
      title: 'Người hướng dẫn',
      dataIndex: 'mentor',
      key: 'mentor',
      filters: mentors.map(mentor => ({ text: mentor.name, value: mentor._id })),
      filteredValue: filteredInfo.mentor || null,
      onFilter: (value, record) => record.mentor && record.mentor._id === value,
      render: (mentor, record) => (
        mentor && (
          <Button onClick={() => openMentorDetailModal(record._id, mentor._id)}>
            <Avatar src={mentor.avatar} size="small" style={{ marginRight: 8 }} />
            {mentor.name}
          </Button>
        )
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Đang tiến hành', value: 'Open' },
        { text: 'Hoàn thành', value: 'Closed' },
      ],
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={status === 'Open' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Đang Tuyển',
      dataIndex: 'isRecruiting',
      key: 'isRecruiting',
      filters: [
        { text: 'Có', value: true },
        { text: 'Không', value: false },
      ],
      filteredValue: filteredInfo.isRecruiting || null,
      onFilter: (value, record) => record.isRecruiting === value,
      render: (isRecruiting, record) => (
        <Popconfirm
          title="Đơn ứng tuyển sẽ bị xóa. Bạn có chắc chắn muốn tắt trạng thái tuyển dụng?"
          onConfirm={() => handleToggleRecruiting(record)}
          okText="Có"
          cancelText="Không"
          disabled={!isRecruiting}
        >
          <Switch
            checked={isRecruiting}
            onChange={() => {
              if (!isRecruiting) {
                handleToggleRecruiting(record);
              }
            }}
          />
        </Popconfirm>
      ),
    },
    {
      title: 'Đơn Ứng Tuyển',
      dataIndex: 'applicantCount',
      key: 'applicantCount',
      render: (applicantCount, record) => record.isRecruiting ? `${applicantCount}/${record.maxApplicants}` : '-',
    },
    {
      title: 'Số Lượng Thành Viên',
      dataIndex: 'approvedMemberCount',
      key: 'approvedMemberCount',
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="delete">
                <Popconfirm
                  title="Bạn có chắc chắn muốn xóa dự án này không?"
                  onConfirm={() => handleDelete(record._id)}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button icon={<DeleteOutlined />} danger>
                    Xóa
                  </Button>
                </Popconfirm>
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
      width: 60,
    },
  ];

  const renderGrid = () => (
    <Row gutter={[16, 16]}>
      {projects.map((project) => (
        <Col xs={24} sm={12} md={8} lg={6} key={project._id}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tooltip title={project.title}>
                  <span style={{ maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.title}
                  </span>
                </Tooltip>
                {project.pinned ? (
                  <Tooltip title="Bỏ ghim dự án">
                    <PushpinFilled onClick={() => togglePinProject(project._id)} />
                  </Tooltip>
                ) : (
                  <Tooltip title="Ghim dự án">
                    <PushpinOutlined onClick={() => togglePinProject(project._id)} />
                  </Tooltip>
                )}
              </div>
            }
            extra={
              <Dropdown
                overlay={
                  <Menu>
                    <Menu.Item key="delete" onClick={() => handleDelete(project._id)}>
                      <DeleteOutlined /> Xóa
                    </Menu.Item>
                  </Menu>
                }
                trigger={['click']}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            }
            style={{
              height: '100%',
              backgroundColor: project.pinned ? '#f0f9ff' : '#fff',
              borderColor: project.pinned ? '#91d5ff' : '#d9d9d9',
            }}
          >
            <p>
              <strong>Người hướng dẫn:</strong>{' '}
              {project.mentor && project.mentor.length > 0 && (
                <Button onClick={() => openMentorDetailModal(project._id, project.mentor[0]._id)}>
                  <Avatar src={project.mentor[0].avatar} size="small" style={{ marginRight: 8 }} />
                  {project.mentor[0].name}
                </Button>
              )}
            </p>
            <p><strong>Trạng Thái:</strong> <Tag color={project.status === 'Open' ? 'green' : 'red'}>{project.status}</Tag></p>
            <p>
              <strong>Đang Tuyển:</strong>
              <Popconfirm
                title={project.isRecruiting ? "Đơn ứng tuyển sẽ bị xóa. Bạn có chắc chắn muốn tắt trạng thái tuyển dụng?" : "Bạn có muốn bật trạng thái tuyển dụng?"}
                onConfirm={() => handleToggleRecruiting(project)}
                okText="Có"
                cancelText="Không"
                disabled={!project.isRecruiting}
              >
                <Switch
                  checked={project.isRecruiting}
                  onChange={() => {
                    if (!project.isRecruiting) {
                      handleToggleRecruiting(project);
                    }
                  }}
                />
              </Popconfirm>
            </p>
            {project.isRecruiting && (
              <p><strong>Đơn Ứng Tuyển:</strong> {project.applicantCount}/{project.maxApplicants}</p>
            )}
            <p><strong>Số Lượng Thành Viên:</strong> {project.approvedMemberCount}</p>
          </Card>
        </Col>
      ))}
    </Row>
  );

  const rowClassName = (record) => {
    return record.pinned ? 'pinned-row' : '';
  };

  // Modal for member details
  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedMember(null);
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        // Xử lý thay đổi kích thước ở đây
        // console.log('Kích thước mới:', entry.contentRect);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Tìm kiếm dự án"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200 }}
        />
        <div>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />} 
            onClick={() => {
              setEditingProject(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Thêm dự án mới
          </Button>
          <Switch
            checkedChildren={<AppstoreOutlined />}
            unCheckedChildren={<TableOutlined />}
            onChange={(checked) => setIsGridView(checked)}
            checked={isGridView}
          />
        </div>
      </div>
      
      {isGridView ? (
        <>
          {projects.length > 0 ? (
            renderGrid()
          ) : (
            <Empty description="Không có dự án nào" />
          )}
          {projects.length > 0 && (
            <Pagination
              style={{ marginTop: 16, textAlign: 'center' }}
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page, pageSize) => fetchProjects(page, pageSize)}
            />
          )}
        </>
      ) : (
        <Card>
          <Table
            columns={columns}
            dataSource={projects}
            loading={loading}
            rowKey="id"
            pagination={pagination}
            onChange={handleTableChange}
            rowClassName={rowClassName}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Không có dự án nào' }}
          />
        </Card>
      )}
      
      {/* Modal for member details */}
      <Modal
        title="Chi tiết thành viên"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        {selectedMember && (
          <Row gutter={16}>
            <Col span={8}>
              <Avatar src={selectedMember.avatar} size={100} />
            </Col>
            <Col span={16}>
              <p><strong>Tên:</strong> {selectedMember.name}</p>
              <p><strong>Email:</strong> {selectedMember.email}</p>
              <p><strong>Địa Chỉ:</strong> {selectedMember.address}</p>
              <p><strong>Số Điện Thoại:</strong> {selectedMember.phone}</p>
            </Col>
          </Row>
        )}
      </Modal>
      {/* Modal for adding/editing project */}
      <Modal
        title={editingProject ? "Sửa dự án" : "Thêm dự án mới"}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProject(null);
          form.resetFields();
        }}
        footer={null}
        width={800} // Tăng kích thước modal để form có nhiều không gian hơn
      >
        {renderForm()}
      </Modal>
      <Modal
        title="Chọn ngày kết thúc tuyển dụng và số lượng ứng viên tối đa"
        visible={recruitingModalVisible}
        onOk={handleStartRecruiting}
        onCancel={() => {
          setRecruitingModalVisible(false);
          setApplicationEnd(null);
          setMaxApplicants(0);
          setRecruitingProject(null); // Reset recruitingProject khi đóng modal
        }}
      >
        <DatePicker
          value={applicationEnd}
          onChange={(date) => setApplicationEnd(date)}
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Chọn ngày kết thúc tuyển dụng"
        />
        <InputNumber
          min={1}
          value={maxApplicants}
          onChange={(value) => setMaxApplicants(value)}
          placeholder="Số lượng ứng viên tối đa"
          style={{ width: '100%' }}
        />
      </Modal>
      {/* Modal for changing mentor */}
      <Modal
        title="Thay đổi Người hướng dẫn"
        visible={changeMentorModalVisible}
        onOk={handleChangeMentor}
        onCancel={() => {
          setChangeMentorModalVisible(false);
          setSelectedProjectId(null);
          setNewMentorId(null);
          setOldMentorId(null);
        }}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Chọn Người hướng dẫn mới"
          onChange={(value) => setNewMentorId(value)}
        >
          {mentors.map(mentor => (
            <Option key={mentor._id} value={mentor._id}>
              <Avatar src={mentor.avatar} size="small" style={{ marginRight: 8 }} />
              {mentor.name}
            </Option>
          ))}
        </Select>
      </Modal>
      {/* Modal for mentor details */}
      <Modal
        title="Chi tiết Người hướng dẫn"
        visible={mentorDetailModalVisible}
        onCancel={() => {
          setMentorDetailModalVisible(false);
          setSelectedProjectId(null);
          setSelectedMentor(null);
          setOldMentorId(null);
        }}
        footer={null}
        width={400}
        centered
      >
        {selectedMentor ? (
          <div style={{ textAlign: 'center' }}>
            <Avatar src={selectedMentor.avatar} size={100} style={{ marginBottom: 24 }} />
            <h3 style={{ marginBottom: 16 }}>{selectedMentor.name}</h3>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Email">{selectedMentor.email}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedMentor.phone}</Descriptions.Item>
              <Descriptions.Item label="Chuyên môn">{selectedMentor.expertise}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 24 }}>
              <Button key="close" onClick={() => setMentorDetailModalVisible(false)} style={{ marginRight: 8 }}>
                Đóng
              </Button>
              <Button
                key="change"
                type="primary"
                onClick={() => {
                  setMentorDetailModalVisible(false);
                  setChangeMentorModalVisible(true);
                }}
              >
                Thay đổi Người hướng dẫn
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>Đang tải thông tin Người hướng dẫn...</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Thêm CSS cho component
const styles = `
  .pinned-row {
    background-color: #e6f7ff;
  }
  .pinned-row:hover td {
    background-color: #bae7ff !important;
  }
  .ant-card {
    margin-bottom: 24px;
  }
  .ant-card-body {
    padding: 24px;
  }
  .grid-view {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .grid-view .ant-card {
    width: 100%;
  }
  @media (min-width: 576px) {
    .grid-view .ant-card {
      width: calc(50% - 16px);
    }
  }
  @media (min-width: 768px) {
    .grid-view .ant-card {
      width: calc(33.333% - 16px);
    }
  }
  @media (min-width: 992px) {
    .grid-view .ant-card {
      width: calc(25% - 16px);
    }
  }
`;

const AdminProjectManagementWithStyles = () => (
  <>
    <style>{styles}</style>
    <AdminProjectManagement />
  </>
);

export default AdminProjectManagementWithStyles;