import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import './styles/variables.css';
import './styles/global.css';
import './styles/animations.css';
import './styles/forms.css';
import './styles/tables.css';
import './styles/navbar.css';
import './styles/sidebar.css';
import './styles/dashboard.css';
import './styles/auth.css';
import './styles/responsive.css';

import App from './App.jsx';

import AuthProvider from './context/AuthProvider.jsx';
import ThemeProvider from './context/ThemeProvider.jsx';
import NotificationProvider from './context/NotificationContext';

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
          <NotificationProvider>
            <App />

            <ToastContainer
              position="top-right"
              autoClose={3500}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
            />
          </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);