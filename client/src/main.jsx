import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import './styles/global.css';

import App from './App.jsx';

import AuthProvider from './context/AuthProvider.jsx';
import ThemeProvider from './context/ThemeProvider.jsx';
import EmployeeProvider from './context/EmployeeProvider.jsx';
import NotificationProvider from './context/NotificationContext';

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <EmployeeProvider>
          <NotificationProvider>
            <App />

            <ToastContainer
              position="top-right"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme="light"
            />
          </NotificationProvider>
        </EmployeeProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);