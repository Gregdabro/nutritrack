import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';

export default function LoginToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser, token } = useAuthStore();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
      return;
    }

    const rawToken = searchParams.get('t');
    if (!rawToken) {
      navigate('/login', { replace: true });
      return;
    }

    api.get(`/auth/login-token/${rawToken}`)
      .then(({ data }) => {
        setToken(data.token);
        setUser(data.user);
        navigate('/', { replace: true });
      })
      .catch(() => {
        setError('Ссылка истекла или недействительна. Отправь /login боту ещё раз.');
      });
  }, []);

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        {error ? (
          <>
            <p style={{ color: '#c62828', fontSize: 16, margin: '0 0 16px' }}>{error}</p>
            <a href="/login" style={{ color: '#3390ec' }}>← Вернуться на страницу входа</a>
          </>
        ) : (
          <p style={{ color: '#666', fontSize: 16 }}>Вход...</p>
        )}
      </div>
    </div>
  );
}
