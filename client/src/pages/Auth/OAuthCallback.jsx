import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { persistLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) return navigate('/login', { replace: true });

    (async () => {
      // temporarily set header to fetch the user with this fresh token
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      const { data } = await api.get('/auth/me');
      persistLogin(token, { ...data.data.user, hasEmployeeProfile: !!data.data.employee });
      navigate('/dashboard', { replace: true });
    })();
  }, [params, navigate, persistLogin]);

  return <p>Signing you in…</p>;
}