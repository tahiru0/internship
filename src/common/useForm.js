import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, DatePicker, Upload, Checkbox, InputNumber, Modal, Row, Col, Select, Radio, Switch, Slider, Rate, TimePicker } from 'antd';
import { UploadOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styled from 'styled-components';
import moment from 'moment';
import Cropper from 'react-easy-crop';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Tạo một styled component cho Form.Item
const StyledFormItem = styled(Form.Item)`
  .ant-form-item-label > label {
    font-size: 16px;
    font-weight: 600;
  }
`;

const LinkInput = ({ value = '', onChange, ...rest }) => {
  const [inputValue, setInputValue] = useState(value.replace(/^https?:\/\//, ''));

  useEffect(() => {
    setInputValue(value.replace(/^https?:\/\//, ''));
  }, [value]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = () => {
    if (!/^https?:\/\//.test(inputValue)) {
      const newValue = `https://${inputValue}`;
      if (onChange) {
        onChange({ target: { value: newValue } });
      }
    }
  };

  return (
    <Input
      {...rest}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      addonBefore="https://"
    />
  );
};

const useForm = ({ fields, onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState([]);
  const [isRecruiting, setIsRecruiting] = useState(initialValues?.isRecruiting || false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setIsRecruiting(initialValues.isRecruiting || false);
      if (initialValues.logo) {
        setFileList([
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: initialValues.logo,
          },
        ]);
      }
    }
  }, [initialValues, form]);

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  const handleChange = ({ fileList }, maxCount) => {
    if (fileList.length <= maxCount) {
      setFileList(fileList);
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg(
        previewImage,
        croppedAreaPixels,
        rotation
      );
      setFileList([
        {
          uid: '-1',
          name: 'cropped-image.png',
          status: 'done',
          url: croppedImage,
        },
      ]);
      setIsCropping(false);
    } catch (e) {
      console.error(e);
    }
  }, [previewImage, croppedAreaPixels, rotation]);

  const renderField = (field) => {
    const { name, label, type, options, maxCount = 1, dependsOn, inputFields, extra, ...rest } = field;

    if (dependsOn && !form.getFieldValue(dependsOn)) {
      return null;
    }

    const commonStyle = { width: '100%' };

    switch (type) {
      case 'text':
        return <Input style={commonStyle} {...rest} />;
      case 'textarea':
        return (
          <>
            <TextArea style={commonStyle} {...rest} />
            {extra && <div style={{ marginTop: 8 }}>{extra}</div>}
          </>
        );
      case 'number':
        return <InputNumber style={commonStyle} {...rest} />;
      case 'password':
        return <Input.Password style={commonStyle} {...rest} />;
      case 'email':
        return <Input style={commonStyle} type="email" {...rest} />;
      case 'url':
        return <Input style={commonStyle} type="url" {...rest} />;
      case 'date':
        return <DatePicker style={commonStyle} {...rest} value={rest.value ? moment(rest.value) : null} />;
      case 'dateRange':
        return <RangePicker style={commonStyle} {...rest} />;
      case 'time':
        return <TimePicker style={commonStyle} {...rest} />;
      case 'select':
        return <Select style={commonStyle} options={options} {...rest} mode={rest.mode} />;
      case 'multiSelect':
        return <Select style={commonStyle} mode="multiple" options={options} {...rest} />;
      case 'checkbox':
        return (
          <Checkbox
            {...rest}
            onChange={(e) => {
              if (name === 'isRecruiting') {
                setIsRecruiting(e.target.checked);
              }
              if (rest.onChange) {
                rest.onChange(e);
              }
            }}
          >
            {label}
          </Checkbox>
        );
      case 'radio':
        return <Radio.Group style={commonStyle} options={options} {...rest} />;
      case 'switch':
        return <Switch {...rest} />;
      case 'slider':
        return <Slider style={commonStyle} {...rest} />;
      case 'rate':
        return <Rate style={commonStyle} {...rest} />;
      case 'upload':
        return (
          <>
            <Upload
              {...rest}
              fileList={fileList}
              onPreview={(file) => {
                setPreviewImage(file.url || file.preview);
                setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
                setIsCropping(true);
              }}
              onChange={(info) => handleChange(info, maxCount)}
              listType="picture-card"
            >
              {fileList.length >= maxCount ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
            <Modal
              visible={isCropping}
              title="Cắt và xoay ảnh"
              onCancel={() => setIsCropping(false)}
              footer={[
                <Button key="back" onClick={() => setIsCropping(false)}>
                  Hủy
                </Button>,
                <Button key="submit" type="primary" onClick={handleCropConfirm}>
                  Xác nhận
                </Button>,
              ]}
            >
              <div style={{ height: 400, position: 'relative' }}>
                <Cropper
                  image={previewImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  rotation={rotation}
                  onRotationChange={setRotation}
                />
              </div>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(value) => setZoom(value)}
              />
              <Slider
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(value) => setRotation(value)}
              />
            </Modal>
          </>
        );
      case 'uploadList':
        return (
          <Upload
            {...rest}
            fileList={fileList}
            onPreview={handlePreview}
            onChange={(info) => handleChange(info, maxCount)}
            listType="picture"
          >
            {fileList.length >= maxCount ? null : (
              <Button icon={<UploadOutlined />}>Upload</Button>
            )}
          </Upload>
        );
      case 'wysiwyg':
        return <ReactQuill theme="snow" style={commonStyle} {...rest} />;
      case 'link':
        return <LinkInput style={commonStyle} {...rest} />;
      case 'tags':
        return <Select mode="tags" style={commonStyle} options={options} {...rest} />;
      case 'dynamicInput':
        return (
          <Form.List name={name}>
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Row key={field.key} gutter={16} align="middle">
                    {inputFields.map((inputField, inputIndex) => (
                      <Col key={inputIndex} span={24 / inputFields.length}>
                        <Form.Item
                          {...field}
                          name={[field.name, inputField.name]}
                          fieldKey={[field.fieldKey, inputField.name]}
                          rules={inputField.rules}
                        >
                          {renderField({ ...inputField, name: [field.name, inputField.name] })}
                        </Form.Item>
                      </Col>
                    ))}
                    <Col span={24 / inputFields.length}>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm tài liệu
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        );
      default:
        return <Input style={commonStyle} {...rest} />;
    }
  };

  const renderFields = () => {
    return (
      <Row gutter={16}>
        {fields.map((field, index) => {
          if (field.dependsOn && !form.getFieldValue(field.dependsOn)) {
            return null;
          }
          return (
            <Col key={index} xs={24} sm={field.colSpan || 24}>
              <StyledFormItem
                name={field.name}
                label={field.type !== 'checkbox' ? field.label : null}
                valuePropName={field.type === 'checkbox' || field.type === 'switch' ? 'checked' : 'value'}
                rules={field.rules}
                getValueFromEvent={field.type === 'upload' || field.type === 'uploadList' ? (e) => {
                  if (Array.isArray(e)) {
                    return e;
                  }
                  return e && e.fileList;
                } : undefined}
              >
                {renderField(field)}
              </StyledFormItem>
            </Col>
          );
        })}
      </Row>
    );
  };

  const handleSubmit = (values) => {
    if (fileList.length > 0 && fileList[0].originFileObj) {
      values.logo = fileList[0].originFileObj;
    }
    onSubmit(values);
  };

  const renderForm = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={initialValues}>
      {renderFields()}
      <Form.Item>
        <Button type="primary" htmlType="submit">Submit</Button>
      </Form.Item>
    </Form>
  );

  return {
    form,
    renderForm,
  };
};

// Hàm để cắt ảnh
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
    0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(URL.createObjectURL(file));
    }, 'image/png');
  });
};

export default useForm;