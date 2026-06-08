import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/index';
import styles from './WorkoutDetail.module.css';

const TYPE_LABELS = {
  home:  'Домашняя',
  gym:   'Тренажёрный зал',
  run:   'Бег',
  bike:  'Велосипед',
  swim:  'Плавание',
  other: 'Другое',
};

const TYPE_ICONS = {
  home:  '🏠',
  gym:   '🏋️',
  run:   '🏃',
  bike:  '🚴',
  swim:  '🏊',
  other: '💪',
};

/** Format YYYY-MM-DD → "31 мая 2026" */
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Format a set into human-readable string */
function formatSet(set) {
  const parts = [];
  if (set.reps) parts.push(`${set.reps} повт`);
  if (set.weightKg) parts.push(`${set.weightKg} кг`);
  if (set.durationSec) parts.push(`${set.durationSec} с`);
  return parts.join(' × ') || '—';
}

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWorkout() {
      setLoading(true);
      setError(null);
      try {
        // Fetch workout by id — use the single-item endpoint
        const res = await api.workouts.get(id);
        setWorkout(res.data);
      } catch {
        setError('Тренировка не найдена');
      } finally {
        setLoading(false);
      }
    }
    fetchWorkout();
  }, [id]);

  if (loading) return <div className={styles.state}>Загружаю...</div>;
  if (error) return <div className={`${styles.state} ${styles.stateError}`}>{error}</div>;
  if (!workout) return null;

  const {
    name,
    date,
    type,
    exercises = [],
    durationMinutes,
    perceivedEffort,
    caloriesBurned,
    notes,
  } = workout;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button
          id="workout-back-btn"
          className={styles.backBtn}
          onClick={() => navigate('/workouts')}
          aria-label="Назад к тренировкам"
        >
          <i className="ti ti-arrow-left" aria-hidden="true" /> Назад
        </button>
      </div>

      {/* Summary card */}
      <div className={styles.card}>
        <div className={styles.summaryTop}>
          <span className={styles.typeIcon}>{TYPE_ICONS[type] || '💪'}</span>
          <div className={styles.summaryInfo}>
            <h1 className={styles.workoutName}>{name}</h1>
            <span className={styles.workoutDate}>{formatDate(date)} · {TYPE_LABELS[type] || type}</span>
          </div>
        </div>

        <div className={styles.pills}>
          {durationMinutes && (
            <span className={`${styles.pill} ${styles.pillGreen}`}>
              <i className="ti ti-clock" aria-hidden="true" /> {durationMinutes} мин
            </span>
          )}
          {caloriesBurned > 0 && (
            <span className={`${styles.pill} ${styles.pillAmber}`}>
              <i className="ti ti-flame" aria-hidden="true" /> {caloriesBurned} ккал
            </span>
          )}
          {perceivedEffort && (
            <span className={`${styles.pill} ${styles.pillBlue}`}>
              Сложность {perceivedEffort}/10
            </span>
          )}
        </div>

        {notes && <p className={styles.notes}>{notes}</p>}
      </div>

      {/* Exercises table */}
      {exercises.length > 0 ? (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Упражнения</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Упражнение</th>
                <th className={styles.th}>Подходы</th>
                <th className={styles.th}>Повторения</th>
                <th className={styles.th}>Вес</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex, ei) => {
                const sets = ex.sets && ex.sets.length > 0 ? ex.sets : [{}];
                return sets.map((set, si) => (
                  <tr key={`${ei}-${si}`} className={styles.tr}>
                    {si === 0 && (
                      <td className={`${styles.td} ${styles.exName}`} rowSpan={sets.length}>
                        {ex.name}
                      </td>
                    )}
                    <td className={styles.td}>
                      <span className={styles.setPill}>{si + 1}</span>
                    </td>
                    <td className={styles.td}>
                      {set.reps != null ? `${set.reps} повт` : '—'}
                    </td>
                    <td className={styles.td}>
                      {set.weightKg ? `${set.weightKg} кг` : set.durationSec ? `${set.durationSec} с` : '—'}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.card}>
          <p className={styles.noExercises}>Упражнения не записаны</p>
        </div>
      )}
    </div>
  );
}
