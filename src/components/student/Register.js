import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form as BootstrapForm } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { message, Select, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { FaCheckCircle, FaHome, FaEnvelope } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import Cookies from 'js-cookie';

const { Option } = Select;

const SchoolSelect = ({ onSelect, initialValue }) => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        if (initialValue) {
            fetchInitialSchool(initialValue);
        }
    }, [initialValue]);

    const fetchInitialSchool = async (schoolId) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/auth/schools?query=${schoolId}`);
            if (response.data && response.data.length > 0) {
                setSchools(response.data);
                const initialSchool = response.data.find(school => school._id === schoolId);
                setSelectedSchool(initialSchool);
                onSelect(initialSchool._id);
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin trường:', error);
            message.error('Không thể lấy thông tin trường');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (value) => {
        setSearchValue(value);
        if (value.length >= 2) {
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/auth/schools?query=${value}`);
                setSchools(response.data);
                if (response.data.length === 1 && response.data[0]._id === value) {
                    setSelectedSchool(response.data[0]);
                }
            } catch (error) {
                console.error('Lỗi khi tìm kiếm trường học:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    message.error(error.response.data.message);
                } else {
                    message.error('Không thể tìm kiếm trường học');
                }
            } finally {
                setLoading(false);
            }
        } else {
            setSchools([]);
        }
    };

    const handleChange = (value, option) => {
        const selected = schools.find(school => school._id === value);
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
            notFoundContent={null}
            style={{ width: '100%' }}
            value={selectedSchool ? selectedSchool._id : undefined}
            loading={loading}
            className="bootstrap-select" // Thêm class này
        >
            {schools.map((school) => (
                <Option key={school._id} value={school._id}>
                    <Avatar src={school.logo} size="small" style={{ marginRight: 8 }} />
                    {school.name}
                </Option>
            ))}
        </Select>
    );
};

const MajorSelect = ({ onSelect, initialValue }) => {
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMajors();
  }, []);

  const fetchMajors = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/guest/majors');
      setMajors(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách ngành học:', error);
      message.error('Không thể lấy danh sách ngành học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      showSearch
      placeholder="Chọn ngành học"
      optionFilterProp="children"
      onChange={onSelect}
      value={initialValue}
      loading={loading}
      className="bootstrap-select w-100"
    >
      <Option value="" disabled>Chọn ngành học</Option>
      {majors.map((major) => (
        <Option key={major._id} value={major._id}>
          {major.name}
        </Option>
      ))}
    </Select>
  );
};

const Register = () => {
    const navigate = useNavigate();
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [schoolId, setSchoolId] = useState(Cookies.get('selectedSchool') || '');

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const response = await axiosInstance.post('/student/register', values);
            if (response.status === 201) {
                setRegistrationSuccess(true);
                setUserEmail(values.email);
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký!');
        }
        setSubmitting(false);
    };

    const handleSchoolSelect = (value) => {
        setSchoolId(value);
        Cookies.set('selectedSchool', value, { expires: 7 });
    };

    if (registrationSuccess) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center min-vh-100" style={{ background: 'linear-gradient(135deg, #E6F3FF 0%, #B5D8FF 100%)' }}>
                <Row className="justify-content-center w-100">
                    <Col md={8} lg={6} className="bg-white p-5 rounded shadow text-center">
                        <FaCheckCircle className="text-success mb-4" style={{ fontSize: '100px' }} />
                        <h2 className="mb-4" style={{ color: '#060270', fontWeight: 'bold' }}>Chúc mừng! Đăng ký thành công!</h2>
                        <p className="mb-4" style={{ fontSize: '18px', color: '#555' }}>Vui lòng liên hệ với nhà trường để được kích hoạt tài khoản của bạn.</p>
                        <div className="d-flex justify-content-center">
                            <Button variant="primary" size="lg" onClick={() => navigate('/')} className="px-4 py-2">
                                <FaHome className="me-2" /> Quay về trang chủ
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
                <Col md={10} lg={8} className="bg-white p-4 p-md-5 rounded shadow">
                    <div className="d-flex justify-content-start mb-4" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        <img src="/logo.png" height="50" alt="Logo" />
                        <h2 className="ms-2" style={{ color: '#060270' }}>Internship</h2>
                    </div>
                    <h2 className="text-center mb-4" style={{ fontWeight: 600, color: '#060270' }}>ĐĂNG KÝ TÀI KHOẢN SINH VIÊN</h2>

                    <Formik
                        initialValues={{
                            name: '',
                            email: '',
                            password: '',
                            confirmPassword: '',
                            studentId: '',
                            schoolId: schoolId,
                            majorId: '',
                            agreeTerms: false,
                            confirmInfo: false,
                        }}
                        validationSchema={Yup.object({
                            name: Yup.string().required('Họ tên là bắt buộc'),
                            email: Yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
                            password: Yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Mật khẩu là bắt buộc'),
                            confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Mật khẩu không khớp').required('Xác nhận mật khẩu là bắt buộc'),
                            studentId: Yup.string().required('Mã số sinh viên là bắt buộc'),
                            schoolId: Yup.string().required('Vui lòng chọn trường'),
                            majorId: Yup.string().required('Vui lòng chọn ngành học'),
                            agreeTerms: Yup.boolean().oneOf([true], 'Bạn phải đồng ý với Điều khoản dịch vụ'),
                            confirmInfo: Yup.boolean().oneOf([true], 'Bạn phải cam đoan rằng thông tin là chính xác'),
                        })}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting, setFieldValue, values }) => (
                            <Form>
                                <Row className="gy-3">
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="name" type="text" placeholder="Họ tên" as={BootstrapForm.Control} />
                                            <label htmlFor="name">Họ tên</label>
                                            <ErrorMessage name="name" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="email" type="email" placeholder="Email" as={BootstrapForm.Control} />
                                            <label htmlFor="email">Email</label>
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
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <Field name="studentId" type="text" placeholder="Mã số sinh viên" as={BootstrapForm.Control} />
                                            <label htmlFor="studentId">Mã số sinh viên</label>
                                            <ErrorMessage name="studentId" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={6}>
                                        <BootstrapForm.Floating>
                                            <SchoolSelect
                                                onSelect={(value) => {
                                                    handleSchoolSelect(value);
                                                    setFieldValue('schoolId', value);
                                                }}
                                                initialValue={values.schoolId}
                                            />
                                            <ErrorMessage name="schoolId" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
                                    </Col>
                                    <Col md={12} className="mb-3"> {/* Thêm class mb-3 ở đây */}
                                        <BootstrapForm.Floating>
                                            <MajorSelect
                                                onSelect={(value) => setFieldValue('majorId', value)}
                                                initialValue={values.majorId}
                                            />
                                            <ErrorMessage name="majorId" component="div" className="text-danger mt-1" />
                                        </BootstrapForm.Floating>
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
                </Col>
            </Row>
            <style jsx>{`
                .bootstrap-select .ant-select-selector {
                    height: calc(3.5rem + 2px) !important;
                    padding: 1rem 0.75rem !important;
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.5;
                    color: #212529;
                    background-color: #fff;
                    border: 1px solid #ced4da !important;
                    border-radius: 0.25rem;
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                .bootstrap-select .ant-select-selection-placeholder {
                    line-height: 1.5rem;
                }
                .bootstrap-select .ant-select-selection-search-input {
                    height: 100% !important;
                }
                .bootstrap-select .ant-select-arrow {
                    top: 50%;
                    right: 11px;
                    margin-top: -6px;
                }
                .bootstrap-select.ant-select-focused .ant-select-selector {
                    border-color: #86b7fe !important;
                    outline: 0;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                }
                .bootstrap-select.w-100 {
                    width: 100% !important;
                }
                .bootstrap-select.w-100 .ant-select-selector {
                    width: 100% !important;
                }
            `}</style>
        </Container>
    );
};

export default Register;
