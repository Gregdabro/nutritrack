import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, token } = useAuthStore();
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/');
      return;
    }
  }, [token, navigate]);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      try {
        const { data } = await api.auth.telegram(user);
        setToken(data.token);
        setUser(data.user);
        navigate('/');
      } catch {
        // Ошибка авторизации — Telegram Widget покажет ошибку сам
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

  async function handleDevLogin() {
    try {
      const { data } = await api.auth.devLogin({ telegramId: '99999', firstName: 'Dev' });
      setToken(data.token);
      setUser(data.user);
      navigate('/');
    } catch {
      // ошибка
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>NutriTrack</h1>
        <p className={styles.subtitle}>Войди через Telegram, чтобы начать</p>
        <div id="telegram-widget" className={styles.widget} />
        <p className={styles.help}>
          Не приходит подтверждение? Открой Telegram на телефоне и проверь чат
          от <strong>Telegram</strong> (служебный аккаунт с синей галочкой) — там
          должно быть сообщение о входе.
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
          >
            Войти как Dev (telegramId: 99999)
          </button>
        )}
      </div>
    </div>
  );
}
