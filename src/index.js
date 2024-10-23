import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import FullScreenLoader from './common/FullScreenLoader';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './style/button.css';
import './style/login.css';
import './style/input.css';
import './style/home.css';
import "./assets/styles/main.css";
import "./assets/styles/responsive.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Thêm đoạn mã này để bắt và ngăn chặn lỗi hiển thị trên màn hình
window.addEventListener('error', (event) => {
  if (event.message === 'ResizeObserver loop completed with undelivered notifications') {
    event.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader />}>
        <App />
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
