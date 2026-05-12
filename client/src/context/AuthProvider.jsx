import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { useNavigate }
  from 'react-router-dom';

import api from '../services/api';

import AuthContext
  from './AuthContext';

export default function AuthProvider({
  children,
}) {
  const navigate =
    useNavigate();

  /*
   STATE
  */

  const [user, setUser] =
    useState(null);

  const [token, setToken] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /*
   LOGOUT
   MUST COME BEFORE useEffect
  */

  const logout =
    useCallback(() => {
      localStorage.removeItem(
        'ems_token'
      );

      localStorage.removeItem(
        'ems_user'
      );

      setUser(null);

      setToken(null);

      navigate('/login', {
        replace: true,
      });
    }, [navigate]);

  /*
   HYDRATE LOCAL STORAGE
  */

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem(
          'ems_user'
        );

      const storedToken =
        localStorage.getItem(
          'ems_token'
        );

      if (
        storedUser &&
        storedToken
      ) {
        setUser(
          JSON.parse(storedUser)
        );

        setToken(storedToken);
      }
    } catch (err) {
      console.error(
        'Auth hydration failed:',
        err
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   VERIFY TOKEN
  */

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    const verifyUser =
      async () => {
        try {
          const { data } =
            await api.get(
              '/auth/me'
            );

          if (!mounted) return;

          setUser(
            data.data.user
          );

          localStorage.setItem(
            'ems_user',
            JSON.stringify(
              data.data.user
            )
          );
        } catch (err) {
          console.error(
            'Auth verification failed:',
            err
          );

          if (mounted) {
            logout();
          }
        }
      };

    verifyUser();

    return () => {
      mounted = false;
    };
  }, [token, logout]);

  /*
   LOGIN
  */

  const login =
    useCallback(
      async (
        email,
        password
      ) => {
        const { data } =
          await api.post(
            '/auth/login',
            {
              email,
              password,
            }
          );

        const authToken =
          data.data.token;

        const authUser =
          data.data.user;

        localStorage.setItem(
          'ems_token',
          authToken
        );

        localStorage.setItem(
          'ems_user',
          JSON.stringify(
            authUser
          )
        );

        setToken(authToken);

        setUser(authUser);

        return authUser;
      },
      []
    );

  /*
   REGISTER
  */

  const register =
    useCallback(
      async (payload) => {
        const { data } =
          await api.post(
            '/auth/register',
            payload
          );

        const authToken =
          data.data.token;

        const authUser =
          data.data.user;

        localStorage.setItem(
          'ems_token',
          authToken
        );

        localStorage.setItem(
          'ems_user',
          JSON.stringify(
            authUser
          )
        );

        setToken(authToken);

        setUser(authUser);

        return authUser;
      },
      []
    );

  /*
   REFRESH USER
  */

  const refreshUser =
    useCallback(async () => {
      const { data } =
        await api.get('/auth/me');

      setUser(data.data.user);

      localStorage.setItem(
        'ems_user',
        JSON.stringify(
          data.data.user
        )
      );
    }, []);

  /*
   ROLE FLAGS
  */

  const isAdmin = [
    'admin',
    'superuser',
  ].includes(user?.role);

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

  /*
   CONTEXT VALUE
  */

  const value = useMemo(
    () => ({
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
    }),

    [
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
    ]
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}