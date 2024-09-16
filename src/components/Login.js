import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate } from 'react-icons/fa'; // Import only the student icon
import { Select, Input, message, Checkbox } from 'antd'; // Import Ant Design components
import { faker } from '@faker-js/faker'; // Import faker

const { Option } = Select;

const Login = () => {
    const [school, setSchool] = useState('');
    const navigate = useNavigate();

    // Generate fake schools
    const schools = Array.from({ length: 10 }).map(() => ({
        id: faker.datatype.uuid(),
        name: faker.company.name(),
        logo: faker.image.business(50, 50, true), // Generate a random logo
    }));

    // Validation schema
    const validationSchema = Yup.object().shape({
        identifier: Yup.string().required('Tên tài khoản là bắt buộc'),
        password: Yup.string().required('Mật khẩu là bắt buộc'),
        school: Yup.string().required('Trường là bắt buộc'),
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
                                src="logo.png"
                                height="50"
                                className="align-top"
                                alt="Logo"
                            />
                            <h2 style={{ color: '#060270', marginLeft: '10px' }}>Internship</h2>
                        </div>
                        <div className='col-md-6'>
                            <div style={{ textAlign: 'right' }}>
                                <span>Bạn chưa có tài khoản? <a href="#signup" style={{ color: '#20DC49' }}>Đăng ký</a></span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex flex-column justify-content-center py-4" style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <h2 className="text-center mb-4 display-md-4" style={{ fontWeight: 600 }}>
                                CHÀO MỪNG BẠN ĐÃ TRỞ LẠI
                            </h2>
                            <h5 className="text-center mb-4">Đăng nhập vào tài khoản</h5>

                            <Formik
                                initialValues={{ identifier: '', password: '', school: '' }}
                                validationSchema={validationSchema}
                                onSubmit={(values, { setSubmitting }) => {
                                    setTimeout(() => {
                                        console.log(values);
                                        message.success('Đăng nhập thành công!');
                                        setSubmitting(false);
                                    }, 500);
                                }}
                            >
                                {({
                                    handleSubmit,
                                    handleChange,
                                    values,
                                    errors,
                                    touched,
                                    isSubmitting,
                                }) => (
                                    <form noValidate onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <Select
                                                placeholder="Chọn trường"
                                                onChange={(value) => {
                                                    values.school = value;
                                                    setSchool(value);
                                                }}
                                                style={{ width: '100%', height: '50px', fontSize: '16px' }} // Increased height and font size
                                                allowClear
                                            >
                                                {schools.map(school => (
                                                    <Option key={school.id} value={school.name}>
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            <img src={school.logo} alt={school.name} style={{ width: 30, height: 30, marginRight: 10 }} />
                                                            <span>{school.name}</span>
                                                        </div>
                                                    </Option>
                                                ))}
                                            </Select>
                                            {errors.school && touched.school && <div style={{ color: 'red' }}>{errors.school}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <Input
                                                type="text"
                                                name="identifier"
                                                placeholder="Mã số sinh viên"
                                                value={values.identifier}
                                                onChange={handleChange}
                                                style={{ width: '100%', height: '50px', fontSize: '16px' }} // Increased height and font size
                                            />
                                            {errors.identifier && touched.identifier && <div style={{ color: 'red' }}>{errors.identifier}</div>}
                                        </div>

                                        <div className="mb-3">
                                            <Input.Password
                                                name="password"
                                                placeholder="Mật khẩu"
                                                value={values.password}
                                                onChange={handleChange}
                                                style={{ width: '100%', height: '50px', fontSize: '16px' }} // Increased height and font size
                                            />
                                            {errors.password && touched.password && <div style={{ color: 'red' }}>{errors.password}</div>}
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <Checkbox>Ghi nhớ tôi</Checkbox>
                                            <a href="#forgot-password" style={{ color: '#D93F21', fontSize: '14px' }}>Quên mật khẩu?</a>
                                        </div>

                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            className="w-100"
                                            loading={isSubmitting}
                                            style={{
                                                backgroundColor: '#4569DF',
                                                borderColor: '#4569DF',
                                                padding: '0.5rem',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            Đăng nhập
                                        </Button>
                                    </form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </Col>
                <Col md={5} className="p-0">
                    <Card className="h-100 d-none d-md-block" style={{ position: 'relative' }}>
                        <div
                            style={{
                                backgroundImage: 'url(/assets/college-banner.png)',
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
