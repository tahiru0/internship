import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Button, Layout, Typography, message, Input, Checkbox, Select, Avatar } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import axiosInstance, { withAuth, setTokenNames } from '../../utils/axiosInstance';
import Cookies from 'js-cookie';
import { Container, Row, Col, Card } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useSchool } from '../../context/SchoolContext';
// import { jwtDecode } from 'jwt-decode';
import SchoolSelectDropDown  from '../SchoolSelectDropDown';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

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
        // console.log('Đang xử lý đăng nhập với giá trị:', values);
        try {
            const response = await axiosInstance.post('/auth/school/login', {
                schoolId: values.schoolId,
                email: values.email,
                password: values.password,
            });
    
            const accessToken = response.data.data.token;
            const refreshToken = response.data.data.refreshToken;
            const user = response.data.data.user;
    
            setTokenNames('accessToken', 'schoolRefreshToken');
    
            Cookies.set('accessToken', accessToken, { expires: 1 / 24 });
            Cookies.set('refreshToken', refreshToken, { expires: 7 });
            Cookies.set('User', JSON.stringify(user), { expires: 7 });
    
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
            // Gọi checkAuthStatus sau khi đăng nhập thành công
            // await checkAuthStatus();
            if(user.isActive){
                message.success('Đăng nhập thành công!');
                navigate('/school/dashboard');
            }else{
                message.error('Tài khoản của bạn đã bị vô hiệu hóa! Liên hệ admin để biết thêm chi tiết.');
            }
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
                                        initialValues={{ schoolId: values.schoolId }}
                                    >
                                        <Form.Item
                                            name="schoolId"
                                            rules={[{ required: true, message: 'Vui lòng chọn trường học!' }]}
                                        >
                                            <SchoolSelectDropDown
                                                onSelect={(values) => {
                                                    handleSchoolSelect(values);
                                                    setFieldValue('schoolId', values);
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
