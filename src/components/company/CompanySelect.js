import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Select, Spin } from 'antd';

const { Option } = Select;

const CompanySelect = ({ value, onChange, onSelect, ...rest }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get('/api/auth/companies');
                setCompanies(response.data);
            } catch (error) {
                setError('Error fetching companies');
                console.error('Error fetching companies:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const handleChange = (selectedValue) => {
        if (onChange) {
            onChange(selectedValue);
        }
        if (onSelect) {
            onSelect(selectedValue);
        }
    };

    return (
        <Select
            {...rest}
            placeholder="Chọn công ty"
            onChange={handleChange}
            loading={loading}
            size="large"
            allowClear
            showSearch
            style={{ width: '100%', height: '50px', fontSize: '16px' }}
            value={value}
            filterOption={(input, option) => 
                (typeof option.children === 'string' ? option.children : option.children.join(' '))
                    .toLowerCase()
                    .includes(input.toLowerCase())
            }
        >
            {loading ? (
                <Option value="" disabled>
                    <Spin size="small" />
                </Option>
            ) : (
                companies.map(company => (
                    <Option key={company._id} value={company._id}>
                        {company.logo && (
                            <img
                                src={company.logo}
                                alt={company.name}
                                style={{ width: '20px', marginRight: '5px' }}
                            />
                        )}
                        {company.name}
                    </Option>
                ))
            )}
            {error && <Option value="" disabled>{error}</Option>}
        </Select>
    );
};

export default CompanySelect;