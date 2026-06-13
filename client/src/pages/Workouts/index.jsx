import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/index';
import Skeleton from '../../components/Skeleton/Skeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
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

      {loading && (
        <div style={{ marginTop: '20px' }}>
          <Skeleton height="80px" style={{ marginBottom: 16 }} />
          <Skeleton height="80px" style={{ marginBottom: 16 }} />
          <Skeleton height="80px" />
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && workouts.length === 0 && (
        <EmptyState
          icon="💪"
          title="Нет тренировок"
          description="Запиши первую тренировку через бота или вручную"
          actionLabel="Добавить тренировку"
          onAction={() => setShowForm(true)}
        />
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
  
  // Exercises state: array of { name: '', sets: [{ reps: '', weightKg: '', durationSec: '' }] }
  const [exercises, setExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Exercise handlers
  function addExercise() {
    setExercises(prev => [...prev, { name: '', sets: [{ reps: '', weightKg: '', durationSec: '' }] }]);
  }

  function updateExercise(exIdx, field, value) {
    setExercises(prev => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], [field]: value };
      return next;
    });
  }

  function removeExercise(exIdx) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  }

  function addSet(exIdx) {
    setExercises(prev => {
      const next = [...prev];
      next[exIdx].sets.push({ reps: '', weightKg: '', durationSec: '' });
      return next;
    });
  }

  function updateSet(exIdx, setIdx, field, value) {
    setExercises(prev => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx].sets = sets;
      return next;
    });
  }

  function removeSet(exIdx, setIdx) {
    setExercises(prev => {
      const next = [...prev];
      next[exIdx].sets = next[exIdx].sets.filter((_, i) => i !== setIdx);
      return next;
    });
  }

  // Calculate calories approx based on duration & type (using 70kg as avg if not loaded)
  // Hardcoding MET logic here just for display
  const MET = { home: 4.5, gym: 5.5, run: 8.0, bike: 7.5, swim: 7.0, other: 4.0 };
  const caloriesEst = form.durationMinutes 
    ? Math.round((MET[form.type] || 4.0) * 70 * (Number(form.durationMinutes) / 60))
    : 0;

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

    // Add exercises if present and valid
    const cleanExercises = exercises
      .filter(ex => ex.name.trim())
      .map(ex => ({
        name: ex.name.trim(),
        sets: ex.sets.map(s => {
          const set = {};
          if (s.reps) set.reps = Number(s.reps);
          if (s.weightKg) set.weightKg = Number(s.weightKg);
          if (s.durationSec) set.durationSec = Number(s.durationSec);
          return set;
        }).filter(s => Object.keys(s).length > 0)
      }));
      
    if (cleanExercises.length > 0) {
      payload.exercises = cleanExercises;
    }

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
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
            <label className={styles.formLabel}>Тип</label>
            <div className={styles.typeChips}>
              {WORKOUT_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  className={`${styles.typeChip} ${form.type === t.value ? styles.typeChipActive : ''}`}
                  onClick={() => set('type', t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
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
          
          <div className={styles.caloriesEstBox}>
            <div className={styles.caloriesEstHeader}>Расход калорий</div>
            <div className={styles.caloriesEstValue}>{caloriesEst} ккал</div>
            <div className={styles.caloriesEstHint}>Норма скорр. +{caloriesEst} ккал</div>
          </div>

          <div className={styles.exercisesSection}>
            <div className={styles.exercisesHeader}>
              <span className={styles.formLabel}>Упражнения</span>
              <button type="button" className={styles.addExBtn} onClick={addExercise}>
                Упражнение
              </button>
            </div>
            
            {exercises.map((ex, exIdx) => (
              <div key={exIdx} className={styles.exCard}>
                <div className={styles.exTopRow}>
                  <input
                    type="text"
                    className={styles.exNameInput}
                    placeholder="Название упражнения"
                    value={ex.name}
                    onChange={(e) => updateExercise(exIdx, 'name', e.target.value)}
                    required
                  />
                  <button type="button" className={styles.removeBtn} onClick={() => removeExercise(exIdx)}>
                    <i className="ti ti-trash" aria-hidden="true" />
                  </button>
                </div>
                
                <div className={styles.setsList}>
                  {ex.sets.map((set, setIdx) => (
                    <div key={setIdx} className={styles.setRow}>
                      <span className={styles.setLabel}>Подход {setIdx + 1}</span>
                      <input
                        type="number"
                        className={styles.setInput}
                        placeholder="Повт."
                        value={set.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                      />
                      <input
                        type="number"
                        className={styles.setInput}
                        placeholder="Вес (кг)"
                        value={set.weightKg}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weightKg', e.target.value)}
                      />
                      {ex.sets.length > 1 && (
                        <button type="button" className={styles.removeBtn} onClick={() => removeSet(exIdx, setIdx)}>
                          <i className="ti ti-x" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className={styles.addSetTextBtn} onClick={() => addSet(exIdx)}>
                    Подход
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="workout-notes">Заметки</label>
            <textarea
              id="workout-notes"
              className={styles.formTextarea}
              placeholder="Ощущения, особенности тренировки..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              maxLength={1000}
              rows={3}
            />
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Отмена</button>
            <button type="submit" className={styles.submitBtn} disabled={saving || !form.name.trim()}>
              {saving ? 'Сохраняю...' : 'Сохранить тренировку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
