import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './style/button.css';
import './style/login.css';
import './style/input.css'
import './assets/styles/main.css';
import "./assets/styles/responsive.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')
);