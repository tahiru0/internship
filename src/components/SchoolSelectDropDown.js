import React, { useState, useEffect } from 'react';
import { Select, Avatar, message } from 'antd';
import axiosInstance from '../utils/axiosInstance';

const { Option } = Select;

const SchoolSelectDropdown = ({ onSelect, initialValue }) => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [searchValue, setSearchValue] = useState('Đại học');
    const [searchTimeout, setSearchTimeout] = useState(null);

    useEffect(() => {
        // Lấy tất cả trường học khi component được mount
        fetchInitialSchool(initialValue);
    }, [initialValue]);

    const fetchInitialSchool = async (schoolId) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/public/search/schools?query=${schoolId}`);
            if (response.data.data && response.data.data > 0) {
                setSchools(response.data.data); // Cập nhật danh sách trường học từ items
                const initialSchool = response.data.data.find(school => school.id === schoolId);
                setSelectedSchool(initialSchool);
                onSelect(initialSchool.id);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin trường:', error);
            message.error(error.message || 'Không thể lấy thông tin trường');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchValue(value);
        if (searchTimeout) {
            clearTimeout(searchTimeout); // Xóa timeout trước đó nếu có
        }

        if (value.length >= 1) {
            setLoading(true);
            // Tạo timeout để trì hoãn việc gọi API
            const timeout = setTimeout(async () => {
                try {
                    const response = await axiosInstance.get(`/public/search/schools?query=${searchValue}`);
                    if (response.data.data && Array.isArray(response.data.data)) {
                        setSchools(response.data.data); // Cập nhật danh sách trường học từ items
                    } else {
                        console.error('Dữ liệu trả về không đúng định dạng:', response.data.data);
                        setSchools([]); // Đặt lại danh sách trường học nếu không phải là mảng
                    }
                } catch (error) {
                    console.error('Lỗi khi tìm kiếm trường học:', error);
                    message.error(error.message || 'Không thể tìm kiếm trường học');
                } finally {
                    setLoading(false);
                }
            }, 500); // Thời gian trì hoãn 3 giây

            setSearchTimeout(timeout); // Lưu timeout vào state
        } else {
            setSchools([]); // Đặt lại danh sách trường khi không có giá trị tìm kiếm
        }
    };

    const handleChange = (value) => {
        const selected = schools.find(school => school.id === value);
        setSelectedSchool(selected);
        onSelect(value);
    };

    return (
        <Select
            showSearch
            placeholder="Chọn trường học"
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            notFoundContent={loading ? <span>Đang tìm kiếm...</span> : null}
            style={{ width: '100%' }}
            size="large"
        >
            {(Array.isArray(schools) ? schools : []).map((school) => (
                <Option key={school.id} value={school.id}>
                    <Avatar src={school.logo} size="default" style={{ marginRight: 8 }} />
                    {school.name}
                </Option>
            ))}
        </Select>
    );
};

export default SchoolSelectDropdown;