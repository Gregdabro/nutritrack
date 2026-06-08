import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index';
import styles from './Workouts.module.css';

const WORKOUT_TYPES = [
  { value: 'home',  label: 'Домашняя' },
  { value: 'gym',   label: 'Тренажёрный зал' },
  { value: 'run',   label: 'Бег' },
  { value: 'bike',  label: 'Велосипед' },
  { value: 'swim',  label: 'Плавание' },
  { value: 'other', label: 'Другое' },
];

const TYPE_ICONS = {
  home:  '🏠',
  gym:   '🏋️',
  run:   '🏃',
  bike:  '🚴',
  swim:  '🏊',
  other: '💪',
};

/** Returns Monday of the ISO week for a YYYY-MM-DD string */
function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay() || 7; // 1=Mon..7=Sun
  d.setDate(d.getDate() - day + 1);
  return d.toLocaleDateString('sv-SE');
}

/** Format YYYY-MM-DD → "31 мая" */
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/** Format YYYY-MM-DD week start → "Неделя 26 мая — 1 июня" */
function formatWeekLabel(weekStart) {
  const start = new Date(weekStart + 'T12:00:00');
  const end = new Date(weekStart + 'T12:00:00');
  end.setDate(end.getDate() + 6);
  const opts = { day: 'numeric', month: 'long' };
  return `Неделя ${start.toLocaleDateString('ru-RU', opts)} — ${end.toLocaleDateString('ru-RU', opts)}`;
}

/** Group workouts by week (Mon–Sun) */
function groupByWeek(workouts) {
  const groups = {};
  for (const w of workouts) {
    const wk = getWeekStart(w.date);
    if (!groups[wk]) groups[wk] = [];
    groups[wk].push(w);
  }
  // Sort groups descending by week start
  return Object.entries(groups).sort(([a], [b]) => (a < b ? 1 : -1));
}

/** Today as YYYY-MM-DD */
function todayStr() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}

export default function Workouts() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.workouts.list();
      setWorkouts(res.data);
    } catch {
      setError('Не удалось загрузить тренировки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  function handleCreated(newWorkout) {
    setWorkouts((prev) => [newWorkout, ...prev]);
    setShowForm(false);
  }

  const weeks = groupByWeek(workouts);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1>Тренировки</h1>
        <button id="add-workout-btn" className={styles.addBtn} onClick={() => setShowForm(true)}>
          <i className="ti ti-plus" aria-hidden="true" /> Добавить
        </button>
      </div>

      {loading && <p className={styles.loading}>Загружаю...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && workouts.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🏋️</span>
          <p>Тренировок ещё нет.<br />Запиши первую!</p>
        </div>
      )}

      {weeks.map(([weekStart, items]) => (
        <div key={weekStart} className={styles.weekGroup}>
          <div className={styles.weekLabel}>{formatWeekLabel(weekStart)}</div>
          {items.map((w) => (
            <WorkoutCard key={w._id} workout={w} onClick={() => navigate(`/workouts/${w._id}`)} />
          ))}
        </div>
      ))}

      {showForm && (
        <AddWorkoutModal
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function WorkoutCard({ workout, onClick }) {
  const { name, date, type, durationMinutes, caloriesBurned, exercises } = workout;
  const icon = TYPE_ICONS[type] || '💪';
  const exCount = exercises?.length || 0;

  return (
    <div
      className={styles.workoutCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={styles.cardTop}>
        <span>{icon}</span>
        <span className={styles.workoutName}>{name}</span>
        <span className={styles.workoutDate}>{formatDate(date)}</span>
      </div>
      <div className={styles.cardMeta}>
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
        {exCount > 0 && (
          <span className={`${styles.pill} ${styles.pillBlue}`}>
            {exCount} упр.
          </span>
        )}
      </div>
    </div>
  );
}

function AddWorkoutModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    date: todayStr(),
    name: '',
    type: 'home',
    durationMinutes: '',
    perceivedEffort: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      date: form.date,
      name: form.name.trim(),
      type: form.type,
    };
    if (form.durationMinutes) payload.durationMinutes = Number(form.durationMinutes);
    if (form.perceivedEffort) payload.perceivedEffort = Number(form.perceivedEffort);
    if (form.notes.trim()) payload.notes = form.notes.trim();

    try {
      const res = await api.workouts.create(payload);
      onCreated(res.data);
    } catch (err) {
      const msg = err.response?.data?.details?.[0]?.message
        || err.response?.data?.message
        || 'Ошибка при сохранении';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Добавить тренировку">
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Добавить тренировку</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workout-date">Дата</label>
            <input
              id="workout-date"
              type="date"
              className={styles.formInput}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workout-name">Название *</label>
            <input
              id="workout-name"
              type="text"
              className={styles.formInput}
              placeholder="Например: Жим + подтягивания"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workout-type">Тип</label>
            <select
              id="workout-type"
              className={styles.formSelect}
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
            >
              {WORKOUT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="workout-duration">Длительность (мин)</label>
              <input
                id="workout-duration"
                type="number"
                className={styles.formInput}
                placeholder="45"
                value={form.durationMinutes}
                onChange={(e) => set('durationMinutes', e.target.value)}
                min={1}
                max={600}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="workout-effort">Сложность (1–10)</label>
              <input
                id="workout-effort"
                type="number"
                className={styles.formInput}
                placeholder="7"
                value={form.perceivedEffort}
                onChange={(e) => set('perceivedEffort', e.target.value)}
                min={1}
                max={10}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workout-notes">Заметки</label>
            <input
              id="workout-notes"
              type="text"
              className={styles.formInput}
              placeholder="Необязательно"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              maxLength={1000}
            />
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Отмена</button>
            <button type="submit" className={styles.submitBtn} disabled={saving || !form.name.trim()}>
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
