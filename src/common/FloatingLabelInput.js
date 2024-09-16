import React from 'react';
import { Input } from 'antd';
import '../style/FloatingLabelInput.css';

const FloatingLabelInput = ({ label, type = 'text', icon, ...props }) => {
    return (
      <div className="floating-label-input">
        {icon && <div className="input-icon">{icon}</div>}
        <input type={type} {...props} className="floating-input" />
        <label className="floating-label">{label}</label>
      </div>
    );
  };
  
  export default FloatingLabelInput;
