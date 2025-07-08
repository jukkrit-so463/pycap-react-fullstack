// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Buffer } from 'buffer';
import process from 'process';

// กำหนด Buffer และ process ให้เป็น global variables
window.Buffer = Buffer;
window.process = process;

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
