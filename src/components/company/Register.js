import React, { useState } from 'react';
import { Container, Row, Col, Button, Form as BootstrapForm } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import confetti from 'canvas-confetti';
import { FaCheckCircle, FaHome, FaEnvelope } from 'react-icons/fa';
import axiosInstance, { withAuth } from '../../utils/axiosInstance';

const Register = () => {
    const navigate = useNavigate();
    const [previewImage, setPreviewImage] = useState(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
        const formData = new FormData();
        for (const key in values) {
            formData.append(key, values[key]);
        }

        try {
            const response = await axiosInstance.post('/api/company/register', formData, withAuth());

            if (response.data.message.includes('Đăng ký thành công')) {
                Cookies.set('selectedCompany', response.data.companyId, { expires: 7 });
                setRegistrationSuccess(true);
                setUserEmail(values.email);
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            message.error('Đã xảy ra lỗi!');
            console.error(error);
        }

        setSubmitting(false);
    };

    const handleImageChange = (event, setFieldValue) => {
        const file = event.currentTarget.files[0];
        if (file) {
            setFieldValue("logo", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const getEmailProvider = (email) => {
        const domain = email.split('@')[1];
        if (domain.includes('gmail')) return 'https://mail.google.com';
        if (domain.includes('yahoo')) return 'https://mail.yahoo.com';
        if (domain.includes('outlook') || domain.includes('hotmail')) return 'https://outlook.live.com';
        return 'https://mail.google.com'; // Mặc định là Gmail
    };

    if (registrationSuccess) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: 'linear-gradient(135deg, #E6F3FF 0%, #B5D8FF 100%)' }}>
                <Row className="justify-content-center w-100">
                    <Col md={8} lg={6} className="bg-white p-5 rounded shadow text-center">
                        <FaCheckCircle className="text-success mb-4" style={{ fontSize: '100px' }} />
                        <h2 className="mb-4" style={{ color: '#060270', fontWeight: 'bold' }}>Chúc mừng! Đăng ký thành công!</h2>
                        <p className="mb-4" style={{ fontSize: '18px', color: '#555' }}>Chúng tôi đã gửi email xác nhận đến địa chỉ email của bạn. Vui lòng kiểm tra và xác nhận tài khoản để bắt đầu sử dụng dịch vụ.</p>
                        <div className="d-flex justify-content-center gap-3">
                            <Button variant="primary" size="lg" onClick={() => navigate('/')} className="px-4 py-2">
                                <FaHome className="me-2" /> Quay về trang chủ
                            </Button>
                            <Button 
                                variant="outline-primary" 
                                size="lg" 
                                onClick={() => window.open(getEmailProvider(userEmail), '_blank')} 
                                className="px-4 py-2"
                            >
                                <FaEnvelope className="me-2" /> Kiểm tra email
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container fluid className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: 'linear-gradient(135deg, #E6F3FF 0%, #B5D8FF 100%)' }}>
            <Row className="justify-content-center w-100">
                <Col md={8} lg={6} className="bg-white p-4 p-md-5 rounded shadow">
                    <div className="d-flex justify-content-start mb-4" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <img src="/logo.png" height="50" alt="Logo" />
                        <h2 className="ms-2" style={{ color: '#060270' }}>Internship</h2>
                    </div>
                    <h2 className="text-center mb-4" style={{ fontWeight: 600, color: '#060270' }}>ĐĂNG KÝ TÀI KHOẢN CHO CÔNG TY</h2>

                    <Formik
                        initialValues={{
                            companyName: '',
                            address: '',
                            accountName: '',
                            email: '',
                            password: '',
                            confirmPassword: '',
                            logo: null,
                            agreeTerms: false,
                            confirmInfo: false,
                        }}
                        validationSchema={Yup.object({
                            companyName: Yup.string().required('Tên công ty là bắt buộc'),
                            address: Yup.string().required('Địa chỉ là bắt buộc'),
                            accountName: Yup.string().required('Tên tài khoản là bắt buộc'),
                            email: Yup.string()
                                .required('Email là bắt buộc')
                                .email('Email không hợp lệ'),
                            password: Yup.string().required('Mật khẩu là bắt buộc'),
                            confirmPassword: Yup.string()
                                .oneOf([Yup.ref('password'), null], 'Mật khẩu không khớp')
                                .required('Xác nhận mật khẩu là bắt buộc'),
                            logo: Yup.mixed().required('Logo là bắt buộc'),
                            agreeTerms: Yup.boolean().oneOf([true], 'Bạn phải đồng ý với Điều khoản dịch vụ'),
                            confirmInfo: Yup.boolean().oneOf([true], 'Bạn phải cam đoan rằng thông tin là chính xác'),
                        })}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting, setFieldValue }) => (
                            <Form>
                                <Row className="gy-3">
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="companyName" type="text" placeholder="Tên công ty" as={BootstrapForm.Control} />
                                            <label htmlFor="companyName">Tên công ty</label>
                                            <ErrorMessage name="companyName" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="address" type="text" placeholder="Địa chỉ công ty" as={BootstrapForm.Control} />
                                            <label htmlFor="address">Địa chỉ công ty</label>
                                            <ErrorMessage name="address" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="accountName" type="text" placeholder="Tên của bạn" as={BootstrapForm.Control} />
                                            <label htmlFor="accountName">Tên người đại diện</label>
                                            <ErrorMessage name="accountName" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="email" type="email" placeholder="Email" as={BootstrapForm.Control} />
                                            <label htmlFor="email">Email đăng nhập</label>
                                            <ErrorMessage name="email" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="password" type="password" placeholder="Mật khẩu" as={BootstrapForm.Control} />
                                            <label htmlFor="password">Mật khẩu</label>
                                            <ErrorMessage name="password" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" as={BootstrapForm.Control} />
                                            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                                            <ErrorMessage name="confirmPassword" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={12}>
                                        <div className="mb-3">
                                            <label htmlFor="logo" className="form-label">Logo công ty</label>
                                            <div className="d-flex align-items-center">
                                                <input
                                                    id="logo"
                                                    name="logo"
                                                    type="file"
                                                    onChange={(event) => handleImageChange(event, setFieldValue)}
                                                    className="form-control"
                                                    accept="image/*"
                                                />
                                                {previewImage && (
                                                    <img src={previewImage} alt="Preview" className="ms-3" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                )}
                                            </div>
                                            <ErrorMessage name="logo" component="div" className="text-danger mt-1" />
                                        </div>
                                    </Col>
                                    <Col md={12}>
                                        <BootstrapForm.Check className="mb-2">
                                            <Field type="checkbox" name="agreeTerms" id="agreeTerms" as={BootstrapForm.Check.Input} />
                                            <BootstrapForm.Check.Label htmlFor="agreeTerms">
                                                Tôi đồng ý với <a href="/terms">Điều khoản dịch vụ</a>
                                            </BootstrapForm.Check.Label>
                                            <ErrorMessage name="agreeTerms" component="div" className="text-danger" />
                                        </BootstrapForm.Check>
                                    </Col>
                                    <Col md={12}>
                                        <BootstrapForm.Check className="mb-2">
                                            <Field type="checkbox" name="confirmInfo" id="confirmInfo" as={BootstrapForm.Check.Input} />
                                            <BootstrapForm.Check.Label htmlFor="confirmInfo">
                                                Tôi cam đoan rằng tất cả thông tin đã cung cấp là chính xác
                                            </BootstrapForm.Check.Label>
                                            <ErrorMessage name="confirmInfo" component="div" className="text-danger" />
                                        </BootstrapForm.Check>
                                    </Col>
                                </Row>
                                <div className="d-grid gap-2 mt-4">
                                    <Button type="submit" disabled={isSubmitting} variant="primary" size="lg">
                                        Đăng ký
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                    
                    <div className="text-center mt-3">
                        <p>
                            Đã có tài khoản?{' '}
                            <Link to="/company/login" className="text-primary">
                                Đăng nhập
                            </Link>
                        </p>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Register;