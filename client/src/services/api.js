import axios from 'axios';

const api = axios.create({
  baseURL: '/api',

  headers: {
    'Content-Type':
      'application/json',
  },

  timeout: 15000,
});

/**
 * REQUEST INTERCEPTOR
 */

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        'ems_token'
      );

    if (
      token &&
      token !== 'undefined' &&
      token !== 'null'
    ) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 */

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    /**
     * Ignore cancelled requests
     */

    if (
      error.code ===
      'ERR_CANCELED'
    ) {
      return Promise.reject(error);
    }

    /**
     * Only hard logout if:
     *
     * - token truly invalid
     * - expired
     * - auth endpoint fails
     */

    const status =
      error?.response?.status;

    const message =
      error?.response?.data
        ?.message || '';

    const isAuthFailure =
      status === 401 &&
      (
        message.includes(
          'Token expired'
        ) ||

        message.includes(
          'Invalid token'
        ) ||

        message.includes(
          'No token provided'
        )
      );

    if (isAuthFailure) {
      localStorage.removeItem(
        'ems_token'
      );

      localStorage.removeItem(
        'ems_user'
      );

      /**
       * Prevent redirect loop
       */

      if (
        window.location.pathname !==
        '/login'
      ) {
        window.location.href =
          '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const getError = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.errors?.[0]
    ?.msg ||
  err?.message ||
  'Something went wrong.';

export default api;