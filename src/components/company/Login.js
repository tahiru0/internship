import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Button, Layout, Typography, message, Input, Checkbox, Select, Avatar } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';
import Cookies from 'js-cookie';
import { Container, Row, Col, Card } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useCompany } from '../../context/CompanyContext';
import { jwtDecode } from 'jwt-decode';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const CompanySelect = ({ onSelect, initialValue }) => {
    const [companies, setCompanies] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);

    useEffect(() => {
        if (initialValue) {
            handleSearch(initialValue);
        }
    }, [initialValue]);

    const handleSearch = async (value) => {
        setSearchValue(value);
        if (value.length >= 2) {
            try {
                const response = await axiosInstance.get(`/auth/companies?query=${value}`);
                setCompanies(response.data);
                if (response.data.length === 1 && response.data[0].id === value) {
                    setSelectedCompany(response.data[0]);
                }
            } catch (error) {
                console.error('Lỗi khi tìm kiếm công ty:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    message.error(error.response.data.message);
                } else {
                    message.error('Không thể tìm kiếm công ty');
                }
            }
        } else {
            setCompanies([]);
        }
    };

    const handleChange = (value, option) => {
        setSelectedCompany(option.company);
        onSelect(value);
    };

    return (
        <Select
            showSearch
            placeholder="Chọn công ty"
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            notFoundContent={null}
            style={{ width: '100%' }}
            value={selectedCompany ? selectedCompany.id : undefined}
            size="large"
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
        >
            {companies.map((company) => (
                <Option key={company.id} value={company.id} company={company}>
                    <Avatar src={company.logo} size="default" style={{ marginRight: 8 }} />
                    {company.name}
                </Option>
            ))}
        </Select>
    );
};

const Login = () => {
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [form] = Form.useForm();
    const [companyId, setCompanyId] = useState(Cookies.get('selectedCompany') || '');
    const navigate = useNavigate();
    const location = useLocation();
    const { checkAuthStatus } = useCompany();
    const [isLoading, setIsLoading] = useState(false);
    const [initialEmail, setInitialEmail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const companyIdFromUrl = searchParams.get('companyId');
        const errorMessage = searchParams.get('error');
        const messageFromUrl = searchParams.get('message');
        const emailFromUrl = searchParams.get('email');

        if (errorMessage) {
            message.error(decodeURIComponent(errorMessage));
        }

        if (messageFromUrl) {
            message.success(decodeURIComponent(messageFromUrl));
        }

        if (companyIdFromUrl) {
            setCompanyId(companyIdFromUrl);
            form.setFieldsValue({ companyId: companyIdFromUrl });
            Cookies.set('selectedCompany', companyIdFromUrl, { expires: 7 });
        } else if (companyId) {
            form.setFieldsValue({ companyId });
        }

        if (emailFromUrl) {
            setInitialEmail(decodeURIComponent(emailFromUrl));
            form.setFieldsValue({ email: decodeURIComponent(emailFromUrl) });
        }
    }, [location.search, form, companyId]);

    const handleLogin = async (values) => {
        console.log('Đang xử lý đăng nhập với giá trị:', values);
        setIsLoading(true);
        try {
            const { email, password } = values;
            const response = await axiosInstance.post('/auth/login/company', {
                companyId: values.companyId,
                email,
                password,
            });

            const { accessToken, refreshToken } = response.data;

            Cookies.set('accessToken', accessToken, { expires: 1 / 24 });
            if (rememberMe) {
                Cookies.set('refreshToken', refreshToken, { expires: 30 });
              }

            await checkAuthStatus();
            setIsAuthChecked(false);
            message.success('Đăng nhập thành công!');
            navigate('/company/dashboard');
        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            message.error(error.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompanySelect = (value) => {
        setCompanyId(value);
        form.setFieldsValue({ companyId: value });
        Cookies.set('selectedCompany', value, { expires: 7 });
        form.validateFields(['companyId']);
    };

    const validationSchema = Yup.object().shape({
        companyId: Yup.string().required('Vui lòng chọn công ty!'),
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
                                <span>Bạn chưa có tài khoản? <Link to="/company/register" style={{ color: '#20DC49' }}>Đăng ký</Link></span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex flex-column justify-content-center py-4" style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 className="text-center mb-4 display-md-4" style={{ fontWeight: 600 }}>
                                CHÀO MỪNG BẠN ĐÃ TRỞ LẠI
                            </h2>
                            <h5 className="text-center mb-4">Đăng nhập vào tài khoản doanh nghiệp</h5>

                            <Formik
                                initialValues={{ companyId: companyId, email: initialEmail, password: '' }}
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
                                        initialValues={{ companyId: '', email: initialEmail }}
                                    >
                                        <Form.Item
                                            name="companyId"
                                            rules={[{ required: true, message: 'Vui lòng chọn công ty!' }]}
                                        >
                                            <CompanySelect
                                                onSelect={(value) => {
                                                    handleCompanySelect(value);
                                                    setFieldValue('companyId', value);
                                                }}
                                                initialValue={companyId}
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
                                                value={values.email}
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
                                            <Link to="/company/forgot-password" style={{ color: '#D93F21', fontSize: '14px' }}>Quên mật khẩu?</Link>
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
                                                loading={isLoading}
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
