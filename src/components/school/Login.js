import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Button, Layout, Typography, message, Input, Checkbox, Select, Avatar } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import Cookies from 'js-cookie';
import { Container, Row, Col, Card } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useSchool } from '../../context/SchoolContext';
import { jwtDecode } from 'jwt-decode';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const SchoolSelect = ({ onSelect, initialValue }) => {
    const [schools, setSchools] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedSchool, setSelectedSchool] = useState(null);

    useEffect(() => {
        if (initialValue) {
            handleSearch(initialValue);
        }
    }, [initialValue]);

    const handleSearch = async (value) => {
        setSearchValue(value);
        if (value.length >= 2) {
            try {
                const response = await axiosInstance.get(`/auth/schools?query=${value}`);
                setSchools(response.data);
                if (response.data.length === 1 && response.data[0].id === value) {
                    setSelectedSchool(response.data[0]);
                }
            } catch (error) {
                console.error('Lỗi khi tìm kiếm trường học:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    message.error(error.response.data.message);
                } else {
                    message.error('Không thể tìm kiếm trường học');
                }
            }
        } else {
            setSchools([]);
        }
    };

    const handleChange = (value, option) => {
        setSelectedSchool(option.school);
        onSelect(value);
    };

    return (
        <Select
            showSearch
            placeholder="Chọn trường học"
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            notFoundContent={null}
            style={{ width: '100%' }}
            value={selectedSchool ? selectedSchool.id : undefined}
            size="large"
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
        >
            {schools.map((school) => (
                <Option key={school.id} value={school.id} school={school}>
                    <Avatar src={school.logo} size="default" style={{ marginRight: 8 }} />
                    {school.name}
                </Option>
            ))}
        </Select>
    );
};

const Login = () => {
    const [form] = Form.useForm();
    const [schoolId, setSchoolId] = useState(Cookies.get('selectedSchool') || '');
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuthStatus } = useSchool();
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const schoolIdFromUrl = searchParams.get('schoolId');
        const errorMessage = searchParams.get('error');
        const messageFromUrl = searchParams.get('message');

        if (errorMessage) {
            message.error(decodeURIComponent(errorMessage));
        }

        if (messageFromUrl) {
            message.success(decodeURIComponent(messageFromUrl));
        }

        if (schoolIdFromUrl) {
            setSchoolId(schoolIdFromUrl);
            form.setFieldsValue({ schoolId: schoolIdFromUrl });
            Cookies.set('selectedSchool', schoolIdFromUrl, { expires: 7 });
        } else if (schoolId) {
            form.setFieldsValue({ schoolId });
        }
    }, [location.search, form, schoolId]);

    const handleLogin = async (values) => {
        console.log('Đang xử lý đăng nhập với giá trị:', values);
        try {
            const { email, password } = values;
            const response = await axiosInstance.post('/auth/login/school', {
                schoolId: values.schoolId,
                email,
                password,
            });

            const { accessToken, refreshToken } = response.data;

            Cookies.set('accessToken', accessToken, { expires: 1 / 24 });
            if (rememberMe) {
                Cookies.set('schoolRefreshToken', refreshToken, { expires: 30 });
              }
            
            await checkAuthStatus();
            message.success('Đăng nhập thành công!');
            navigate('/school/dashboard');
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            if (error.response && error.response.data && error.response.data.message) {
                message.error(error.response.data.message);
            } else {
                message.error('Đăng nhập thất bại. Vui lòng thử lại.');
            }
        }
    };

    const handleSchoolSelect = (value) => {
        setSchoolId(value);
        form.setFieldsValue({ schoolId: value });
        Cookies.set('selectedSchool', value, { expires: 7 });
        form.validateFields(['schoolId']);
    };

    const validationSchema = Yup.object().shape({
        schoolId: Yup.string().required('Vui lòng chọn trường học!'),
        email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email!'),
        password: Yup.string().required('Vui lòng nhập mật khẩu!'),
    });

    const handleLogoClick = () => {
        navigate('/');
    };

    return (
        <Container fluid className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: '#F0F2F5' }}>
            <Row className="justify-content-center w-100 min-vh-100">
                <Col md={7} className='py-4'>
                    <div className='row'>
                        <div className='col-md-6 d-flex justify-content-start' onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                            <img
                                src="/logo.png"
                                height="50"
                                className="align-top"
                                alt="Logo"
                            />
                            <h2 style={{ color: '#060270', marginLeft: '10px' }}>Internship</h2>
                        </div>
                        <div className='col-md-6'>
                            <div style={{ textAlign: 'right' }}>
                                <span>Bạn chưa có tài khoản? <Link to="/school/register" style={{ color: '#20DC49' }}>Đăng ký</Link></span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex flex-column justify-content-center py-4" style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 className="text-center mb-4 display-md-4" style={{ fontWeight: 600 }}>
                                CHÀO MỪNG BẠN ĐÃ TRỞ LẠI
                            </h2>
                            <h5 className="text-center mb-4">Đăng nhập vào tài khoản trường học</h5>

                            <Formik
                                initialValues={{ schoolId: schoolId, email: '', password: '' }}
                                validationSchema={validationSchema}
                                onSubmit={handleLogin}
                            >
                                {({
                                    handleSubmit,
                                    handleChange,
                                    setFieldValue,
                                    values,
                                    errors,
                                    touched,
                                    isSubmitting,
                                }) => (
                                    <Form
                                        form={form}
                                        onFinish={handleSubmit}
                                        autoComplete="off"
                                        layout="vertical"
                                        initialValues={{ schoolId: '' }}
                                    >
                                        <Form.Item
                                            name="schoolId"
                                            rules={[{ required: true, message: 'Vui lòng chọn trường học!' }]}
                                        >
                                            <SchoolSelect
                                                onSelect={(value) => {
                                                    handleSchoolSelect(value);
                                                    setFieldValue('schoolId', value);
                                                }}
                                                initialValue={schoolId}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="email"
                                            validateStatus={errors.email && touched.email ? 'error' : ''}
                                            help={errors.email && touched.email ? errors.email : ''}
                                        >
                                            <Input
                                                prefix={<MailOutlined className="site-form-item-icon" />}
                                                placeholder="Email"
                                                size="large"
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setFieldValue('email', e.target.value);
                                                }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="password"
                                            validateStatus={errors.password && touched.password ? 'error' : ''}
                                            help={errors.password && touched.password ? errors.password : ''}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined className="site-form-item-icon" />}
                                                placeholder="Mật khẩu"
                                                size="large"
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setFieldValue('password', e.target.value);
                                                }}
                                            />
                                        </Form.Item>

                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <Checkbox onChange={(e) => setRememberMe(e.target.checked)}>Ghi nhớ tôi</Checkbox>
                                            <Link to="/school/forgot-password" style={{ color: '#D93F21', fontSize: '14px' }}>Quên mật khẩu?</Link>
                                        </div>

                                        <Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                style={{
                                                    width: '100%',
                                                    marginTop: 10,
                                                    backgroundColor: '#4569DF',
                                                    borderColor: '#4569DF',
                                                    padding: '0.5rem',
                                                    fontSize: '1rem',
                                                    height: '50px',
                                                }}
                                                loading={isSubmitting}
                                            >
                                                Đăng nhập
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </Col>
                <Col md={5} className="p-0">
                    <Card className="h-100 d-none d-md-block" style={{ position: 'relative' }}>
                        <div
                            style={{
                                backgroundImage: 'url(/assets/login-banner.jpg)',
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                height: '100%',
                                width: '100%',
                            }}
                        />
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
