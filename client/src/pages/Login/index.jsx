import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';
import styles from './Login.module.css';

const BOT_URL = 'https://t.me/nutritrack19_bot';

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

  // ---- Dev Login (для тестирования) ----
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
        <p className={styles.subtitle}>Войди через Telegram-бота</p>

        {error && (
          <div className={styles.error}>
            {error === 'auth_failed' ? 'Ошибка авторизации.' : error}
          </div>
        )}

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span>
              Открой бота{' '}
              <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className={styles.link}>
                @nutritrack19_bot
              </a>
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span>Отправь команду <code className={styles.code}>/login</code></span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span>Нажми на ссылку, которую пришлёт бот</span>
          </div>
        </div>

        <a
          href={BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.oidcBtn}
        >
          Открыть бота в Telegram
        </a>

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
