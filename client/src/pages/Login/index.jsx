import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, token } = useAuthStore();

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
    script.setAttribute('data-request-access', 'write');

    const container = document.getElementById('telegram-widget');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>NutriTrack</h1>
        <p className={styles.subtitle}>Войди через Telegram, чтобы начать</p>
        <div id="telegram-widget" className={styles.widget} />
      </div>
    </div>
  );
}
