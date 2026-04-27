import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

import { AuthProvider } from './context/AuthProvider';
import { EmployeeProvider } from './context/EmployeeContext';
import { ThemeProvider } from './context/ThemeContext';

import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <EmployeeProvider>
            <App />
          </EmployeeProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);