import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import AuthContext from './AuthContext';

export default function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ems_user'));
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('ems_token')
  );

  const [loading, setLoading] = useState(true);

  const persist = useCallback((u, t) => {
    localStorage.setItem('ems_user', JSON.stringify(u));
    localStorage.setItem('ems_token', t);
  }, []);

  const clear = useCallback(() => {
    setUser(null);
    setToken(null);

    localStorage.removeItem('ems_user');
    localStorage.removeItem('ems_token');

    delete api.defaults.headers.common.Authorization;
    }, []);

  // Verify current token
  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');

        setUser(data.data.user);

        persist(data.data.user, token);
      } catch {
        clear();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [token, persist, clear]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', {
        email,
        password,
    });

    const authToken = data.data.token;

    setUser(data.data.user);
    setToken(authToken);

    persist(data.data.user, authToken);

    return data.data.user;
    }, [persist]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);

    const authToken = data.data.token;

    setUser(data.data.user);
    setToken(authToken);

    persist(data.data.user, authToken);

    return data.data.user;
    }, [persist]);

  const logout = useCallback(() => {
    clear();

    navigate('/login', {
      replace: true,
    });
  }, [clear, navigate]);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');

    setUser(data.data.user);

    if (token) {
      persist(data.data.user, token);
    }
  }, [token, persist]);

  const isAdmin = ['admin', 'superuser'].includes(user?.role);

  const isHR = [
    'admin',
    'superuser',
    'hr',
  ].includes(user?.role);

  const isManager = [
    'admin',
    'superuser',
    'hr',
    'manager',
  ].includes(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isHR,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}