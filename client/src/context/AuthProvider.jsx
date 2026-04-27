import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      const { token, user } = res.data.data;

      localStorage.setItem('token', token);
      setUser(user);
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isEmployer: user?.role === 'employer',
    isEmployee: user?.role === 'employee'
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};