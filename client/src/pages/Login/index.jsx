import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';
import styles from './Login.module.css';

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

  // ---- Telegram Widget (старый способ) ----
  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      try {
        const { data } = await api.auth.telegram(user);
        setToken(data.token);
        setUser(data.user);
        navigate('/');
      } catch {
        setError('Ошибка авторизации через Telegram');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', import.meta.env.VITE_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');

    const container = document.getElementById('telegram-widget');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, []);

  // ---- OIDC Redirect (новый надёжный способ) ----
  async function handleOidcLogin() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/auth/oidc/auth-url');
      window.location.href = data.url;
    } catch {
      setError('Не удалось начать вход через Telegram');
      setLoading(false);
    }
  }

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

        {/* Основная кнопка — OIDC редирект */}
        <button
          type="button"
          className={styles.oidcBtn}
          onClick={handleOidcLogin}
          disabled={loading}
        >
          {loading ? 'Перенаправление...' : '🔵 Войти через Telegram'}
        </button>

        <p className={styles.oidcHint}>
          Откроется страница Telegram для подтверждения входа. Это надёжнее,
          чем всплывающее окно.
        </p>

        {/* Запасной вариант — старый виджет */}
        <details className={styles.fallback}>
          <summary className={styles.fallbackSummary}>
            Если основной способ не работает — старый виджет ▼
          </summary>
          <div id="telegram-widget" className={styles.widget} />
        </details>

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
          >
            Войти как Dev (telegramId: 99999)
          </button>
        )}
      </div>
    </div>
  );
}
