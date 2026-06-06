import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function LoginSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const firstName = searchParams.get('firstName');
    const telegramId = searchParams.get('telegramId');

    if (token) {
      setToken(token);
      setUser({ id: userId, firstName, telegramId });
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=no_token', { replace: true });
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p style={{ fontSize: 16, color: '#666' }}>Вход...</p>
    </div>
  );
}
