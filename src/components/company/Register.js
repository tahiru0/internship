import React, { useState } from 'react';
import { Container, Row, Col, Button, Card, ProgressBar } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Input, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const Step1 = () => (
    <div>
        <h5 className="text-center mb-4">Nhập tên công ty</h5>
        <Field style={{ width: '100%', height: '50px', fontSize: '16px' }} name="companyName" placeholder="Tên công ty" as={Input} />
        <ErrorMessage name="companyName" component="div" style={{ color: 'red' }} />
        <div className="mt-3">
        Đã có tài khoản?<Link to="/company/login"> Đăng nhập</Link>
        </div>
    </div>
);

const Step2 = ({ values }) => (
    <div>
        <h5 className="text-center mb-4">Nhập địa chỉ cho công ty {values.companyName}</h5>
        <Field style={{ width: '100%', height: '50px', fontSize: '16px' }} name="address" placeholder="Địa chỉ công ty" as={Input} />
        <ErrorMessage name="address" component="div" style={{ color: 'red' }} />
    </div>
);

const Step3 = () => (
    <div>
        <h5 className="text-center mb-4">Tên của bạn là gì</h5>
        <Field style={{ width: '100%', height: '50px', fontSize: '16px' }} name="accountName" placeholder="Tên của bạn" as={Input} />
        <ErrorMessage name="accountName" component="div" style={{ color: 'red' }} />
    </div>
);

const Step4 = ({ setFieldValue }) => {
    const [emailExists, setEmailExists] = useState(false);
  
    const checkEmail = async (email) => {
      try {
        const response = await fetch('http://localhost:5000/api/company/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        setEmailExists(data.exists);
        setFieldValue('emailExists', data.exists);
      } catch (error) {
        console.error('Error checking email:', error);
      }
    };
  
    return (
      <div>
        <h5 className="text-center mb-4">Nhập thông tin đăng nhập</h5>
        <Field
          style={{ width: '100%', height: '50px', fontSize: '16px' }}
          name="email"
          placeholder="Email"
          as={Input}
        />
        <ErrorMessage name="email" component="div" style={{ color: 'red' }} />
        <Field
          style={{ width: '100%', height: '50px', fontSize: '16px' }}
          name="password"
          type="password"
          placeholder="Mật khẩu"
          as={Input.Password}
          className="mt-3"
        />
        <ErrorMessage name="password" component="div" style={{ color: 'red' }} />
        <Field
          style={{ width: '100%', height: '50px', fontSize: '16px' }}
          name="confirmPassword"
          type="password"
          placeholder="Xác nhận mật khẩu"
          as={Input.Password}
          className="mt-3"
        />
        <ErrorMessage name="confirmPassword" component="div" style={{ color: 'red' }} />
      </div>
    );
  };

const Step5 = ({ setFieldValue }) => (
    <div>
        <h5 className="text-center mb-4">Tải lên logo công ty</h5>
        <Upload
            name="logo"
            listType="picture"
            maxCount={1}
            beforeUpload={(file) => {
                setFieldValue('logo', file);
                return false;
            }}
        >
            <Button icon={<UploadOutlined />}>Chọn logo</Button>
        </Upload>
    </div>
);

const Step6 = ({ values, setFieldValue, handleSubmit }) => (
    <div>
        <h5 className="text-center mb-4">Xác nhận thông tin đăng ký</h5>
        <div className="mb-3">
            <Field
                type="checkbox"
                name="agreeTerms"
                id="agreeTerms"
                checked={values.agreeTerms}
                onChange={() => setFieldValue('agreeTerms', !values.agreeTerms)}
            />
            <label htmlFor="agreeTerms" className="mx-2">
                Tôi đồng ý với <a href="/terms">Điều khoản dịch vụ</a>
            </label>
            <ErrorMessage name="agreeTerms" component="div" style={{ color: 'red' }} />
        </div>
        <div className="mb-3">
            <Field
                type="checkbox"
                name="confirmInfo"
                id="confirmInfo"
                checked={values.confirmInfo}
                onChange={() => setFieldValue('confirmInfo', !values.confirmInfo)}
            />
            <label htmlFor="confirmInfo" className="mx-2">
                Tôi cam đoan rằng tất cả thông tin đã cung cấp là chính xác
            </label>
            <ErrorMessage name="confirmInfo" component="div" style={{ color: 'red' }} />
        </div>
    </div>
);


const steps = [Step1, Step2, Step3, Step4, Step5, Step6];

const validationSchemas = [
    Yup.object({
        companyName: Yup.string().required('Tên công ty là bắt buộc'),
    }),
    Yup.object({
        address: Yup.string().required('Địa chỉ là bắt buộc'),
    }),
    Yup.object({
        accountName: Yup.string().required('Tên tài khoản là bắt buộc'),
    }),
    Yup.object({
        email: Yup.string()
          .required('Email là bắt buộc')
          .email('Email không hợp lệ')
          .test('email-not-taken', 'Email này đã được sử dụng', function (value) {
            return !this.parent.emailExists;
          }),
        password: Yup.string().required('Mật khẩu là bắt buộc'),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref('password'), null], 'Mật khẩu không khớp')
          .required('Xác nhận mật khẩu là bắt buộc'),
      }),
    Yup.object({
        logo: Yup.mixed().required('Logo là bắt buộc'),
    }),
    Yup.object({
        agreeTerms: Yup.boolean().oneOf([true], 'Bạn phải đồng ý với Điều khoản dịch vụ'),
        confirmInfo: Yup.boolean().oneOf([true], 'Bạn phải cam đoan rằng thông tin là chính xác'),
    }),
];

const Register = () => {
    const [step, setStep] = useState(0);
    const navigate = useNavigate();

    const checkEmail = async (email) => {
        try {
          const response = await fetch('http://localhost:5000/api/company/check-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });
          const data = await response.json();
          return data.exists;
        } catch (error) {
          console.error('Error checking email:', error);
          return false;
        }
      };

      const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
        if (step === 3) { // Email step
            const emailExists = await checkEmail(values.email);
            if (emailExists) {
                setFieldError('email', 'Email này đã được sử dụng');
                setSubmitting(false);
                return;
            }
        }

        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            const formData = new FormData();
            for (const key in values) {
                formData.append(key, values[key]);
            }

            // API call with formData
            fetch('http://localhost:5000/api/company/register', {
                method: 'POST',
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        message.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
                        setStep(step + 1);
                    } else {
                        message.error(data.message);
                    }
                })
                .catch((error) => {
                    message.error('Đã xảy ra lỗi!');
                    console.error(error);
                });
        }
        setSubmitting(false);
    };

    return (
        <Container fluid className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: '#F0F2F5' }}>
            <Row className="justify-content-center w-100 min-vh-100">
                <Col md={7} className="py-4">
                    <div className="d-flex justify-content-start mb-4" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <img src="/logo.png" height="50" alt="Logo" />
                        <h2 className="ml-2" style={{ color: '#060270' }}>Internship</h2>
                    </div>
                    <div className="p-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2 className="text-center mb-4" style={{ fontWeight: 600 }}>ĐĂNG KÝ TÀI KHOẢN CHO CÔNG TY</h2>
                        <ProgressBar now={(step / (steps.length - 1)) * 100} className="mb-4" animated />

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
                                emailExists: false,
                            }}
                            validationSchema={validationSchemas[step]}
                            onSubmit={handleSubmit}
                        >

                            {({ isSubmitting, values, setFieldValue }) => (
                                <Form>
                                    {React.createElement(steps[step], { values, setFieldValue })}
                                    <div className="d-flex justify-content-between mt-4">
                                        {step > 0 && (
                                            <Button onClick={() => setStep(step - 1)} disabled={isSubmitting} variant="secondary">
                                                Quay lại
                                            </Button>
                                        )}
                                        <Button type="submit" disabled={isSubmitting} variant="primary">
                                            {step < steps.length - 1 ? 'Tiếp theo' : 'Gửi email xác nhận'}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </Col>
                <Col md={5} className="p-0">
                    <Card className="h-100 d-none d-md-block" style={{ position: 'relative' }}>
                        <div
                            style={{
                                backgroundImage: 'url(/assets/company-banner.png)',
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

export default Register;
