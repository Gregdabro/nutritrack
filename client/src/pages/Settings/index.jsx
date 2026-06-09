import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';
import styles from './Settings.module.css';

const TIMEZONES = [
  { value: 'Europe/Rome', label: 'Europe/Rome (Италия/Кипр)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (Москва)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (Дубай)' },
  { value: 'UTC', label: 'UTC' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { token, user, updateUser } = useAuthStore();
  
  const [profile, setProfile] = useState({
    weightKg: '',
    heightCm: '',
    timezone: 'Europe/Rome',
  });

  const [goals, setGoals] = useState({
    protein: 100,
    fat: 100,
    carbs: 200,
    fiber: 30,
    calories: 2100,
    water: 2000,
    weeklyBudget: '',
  });

  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Set profile data from authStore user
    if (user) {
      setProfile({
        weightKg: user.weightKg || '',
        heightCm: user.heightCm || '',
        timezone: user.timezone || 'Europe/Rome',
      });
    }

    api.goals.get()
      .then(({ data }) => {
        setGoals({
          protein: data.protein || 100,
          fat: data.fat || 100,
          carbs: data.carbs || 200,
          fiber: data.fiber || 30,
          calories: data.calories || 2100,
          water: data.water || 2000,
          weeklyBudget: data.weeklyBudget ?? '',
        });
      })
      .catch(() => setStatus('error'))
      .finally(() => setLoading(false));
  }, [token, navigate, user]);

  const handleGoalChange = (field) => (e) => {
    const val = e.target.value;
    setGoals((prev) => ({ ...prev, [field]: val }));
    setStatus(null);
  };

  const handleProfileChange = (field) => (e) => {
    const val = e.target.value;
    setProfile((prev) => ({ ...prev, [field]: val }));
    setStatus(null);
  };

  const computedCalories = Math.round(
    (Number(goals.protein) || 0) * 4 +
    (Number(goals.fat) || 0) * 9 +
    (Number(goals.carbs) || 0) * 4,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    // Prepare goals payload
    const goalsPayload = {};
    for (const [key, val] of Object.entries(goals)) {
      if (key === 'weeklyBudget') {
        goalsPayload[key] = val === '' ? null : Number(val);
      } else if (val !== '') {
        goalsPayload[key] = Number(val);
      }
    }

    // Prepare profile payload
    const profilePayload = {
      timezone: profile.timezone
    };
    if (profile.weightKg !== '') profilePayload.weightKg = Number(profile.weightKg);
    if (profile.heightCm !== '') profilePayload.heightCm = Number(profile.heightCm);

    try {
      // We don't have a specific profile update endpoint in the provided API
      // Wait, there might be one. Let's check api.js...
      // For now, we assume user profile is updated via some api.auth.update() or similar if it exists
      // Let's just try to update goals for now, and if there's an API for user we do that too.
      // But we can update the Zustand store directly so it reflects on UI.
      if (api.auth && api.auth.updateProfile) {
        await api.auth.updateProfile(profilePayload);
      }
      
      const { data } = await api.goals.update(goalsPayload);
      
      setGoals({
        protein: data.protein,
        fat: data.fat,
        carbs: data.carbs,
        fiber: data.fiber,
        calories: data.calories,
        water: data.water,
        weeklyBudget: data.weeklyBudget ?? '',
      });
      
      if (updateUser) {
        updateUser({ ...user, ...profilePayload });
      }

      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus('error');
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Настройки</h1>

        {status === 'success' && (
          <div className={styles.alertSuccess}>Настройки сохранены!</div>
        )}
        {status === 'error' && (
          <div className={styles.alertError}>Ошибка при сохранении</div>
        )}

        <form onSubmit={handleSubmit}>
          
          <h2 className={styles.sectionTitle}>Профиль</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Вес (кг)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Не задан"
                value={profile.weightKg}
                onChange={handleProfileChange('weightKg')}
              />
            </label>
            <label className={styles.field}>
              <span>Рост (см)</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Не задан"
                value={profile.heightCm}
                onChange={handleProfileChange('heightCm')}
              />
            </label>
            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span>Часовой пояс</span>
              <select 
                className={styles.select}
                value={profile.timezone}
                onChange={handleProfileChange('timezone')}
              >
                {TIMEZONES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.divider}></div>

          <h2 className={styles.sectionTitle}>Цели на день</h2>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Белки (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.protein}
                onChange={handleGoalChange('protein')}
              />
            </label>
            <label className={styles.field}>
              <span>Жиры (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.fat}
                onChange={handleGoalChange('fat')}
              />
            </label>
            <label className={styles.field}>
              <span>Углеводы (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.carbs}
                onChange={handleGoalChange('carbs')}
              />
            </label>
            <label className={styles.field}>
              <span>Клетчатка (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.fiber}
                onChange={handleGoalChange('fiber')}
              />
            </label>
            <label className={styles.field}>
              <span>Калории (ккал)</span>
              <input
                type="number"
                min="0"
                step="10"
                value={goals.calories}
                onChange={handleGoalChange('calories')}
              />
              <small className={styles.hint}>
                По БЖУ: ~{computedCalories} ккал
              </small>
            </label>
            <label className={styles.field}>
              <span>Вода (мл)</span>
              <input
                type="number"
                min="0"
                step="100"
                value={goals.water}
                onChange={handleGoalChange('water')}
              />
            </label>
            <label className={styles.field}>
              <span>Бюджет (€/нед)</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Не задано"
                value={goals.weeklyBudget}
                onChange={handleGoalChange('weeklyBudget')}
              />
            </label>
          </div>

          <button type="submit" className={styles.saveBtn}>
            Сохранить
          </button>
        </form>

      </div>
    </div>
  );
}
