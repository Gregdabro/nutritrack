import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api';
import styles from './Settings.module.css';

export default function Settings() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
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
  }, [token, navigate]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setGoals((prev) => ({ ...prev, [field]: val }));
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

    const payload = {};
    for (const [key, val] of Object.entries(goals)) {
      if (key === 'weeklyBudget') {
        payload[key] = val === '' ? null : Number(val);
      } else if (val !== '') {
        payload[key] = Number(val);
      }
    }

    try {
      const { data } = await api.goals.update(payload);
      setGoals({
        protein: data.protein,
        fat: data.fat,
        carbs: data.carbs,
        fiber: data.fiber,
        calories: data.calories,
        water: data.water,
        weeklyBudget: data.weeklyBudget ?? '',
      });
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
        <h1 className={styles.title}>Цели</h1>

        {status === 'success' && (
          <div className={styles.alertSuccess}>Цели сохранены!</div>
        )}
        {status === 'error' && (
          <div className={styles.alertError}>Ошибка при сохранении</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Белки (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.protein}
                onChange={handleChange('protein')}
              />
            </label>
            <label className={styles.field}>
              <span>Жиры (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.fat}
                onChange={handleChange('fat')}
              />
            </label>
            <label className={styles.field}>
              <span>Углеводы (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.carbs}
                onChange={handleChange('carbs')}
              />
            </label>
            <label className={styles.field}>
              <span>Клетчатка (г)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={goals.fiber}
                onChange={handleChange('fiber')}
              />
            </label>
            <label className={styles.field}>
              <span>Калории (ккал)</span>
              <input
                type="number"
                min="0"
                step="10"
                value={goals.calories}
                onChange={handleChange('calories')}
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
                onChange={handleChange('water')}
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
                onChange={handleChange('weeklyBudget')}
              />
            </label>
          </div>

          <button type="submit" className={styles.saveBtn}>
            Сохранить
          </button>
        </form>

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/')}
        >
          Назад
        </button>
      </div>
    </div>
  );
}
