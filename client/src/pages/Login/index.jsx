import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';
import styles from './Login.module.css';

// URL колбэка — через Vercel (прокси → Railway). Тот же домен что и виджет.
const CALLBACK_URL = `${window.location.origin}/api/auth/oidc/callback`;

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, token } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(searchParams.get('error'));
  const [loading, setLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/');
      return;
    }
  }, [token, navigate]);

  // ---- Telegram Widget с data-auth-url (редирект, без попапа) ----
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', import.meta.env.VITE_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', CALLBACK_URL);

    const container = document.getElementById('telegram-widget');
    if (container) {
      container.appendChild(script);
    }
  }, []);

  // ---- Dev Login (тестирование) ----
  async function handleDevLogin() {
    setLoading(true);
    try {
      const { data } = await api.auth.devLogin({ telegramId: '99999', firstName: 'Dev' });
      setToken(data.token);
      setUser(data.user);
      navigate('/');
    } catch {
      setError('Ошибка Dev-входа');
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>NutriTrack</h1>
        <p className={styles.subtitle}>Войди через Telegram, чтобы начать</p>

        {error && (
          <div className={styles.error}>
            {error === 'auth_failed'
              ? 'Ошибка авторизации. Попробуй ещё раз.'
              : error === 'expired_state'
                ? 'Сессия истекла. Попробуй ещё раз.'
                : error}
          </div>
        )}

        {/* Telegram Login Widget — использует data-auth-url для редиректа */}
        <div id="telegram-widget" className={styles.widget} />

        <p className={styles.oidcHint}>
          После нажатия кнопки откроется страница Telegram для подтверждения.
          Без всплывающих окон — просто редирект.
        </p>

        <hr className={styles.divider} />

        <button
          type="button"
          className={styles.devToggle}
          onClick={() => setDevMode(!devMode)}
        >
          {devMode ? 'Скрыть Dev Login' : 'Dev Login ▼'}
        </button>

        {devMode && (
          <button
            type="button"
            className={styles.devBtn}
            onClick={handleDevLogin}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти как Dev (telegramId: 99999)'}
          </button>
        )}
      </div>
    </div>
  );
}
