import { useEffect, useState } from 'react';
import useDiaryStore from '../../store/diaryStore';
import FoodEntry from '../../components/FoodEntry';
import NutrientBar from '../../components/NutrientBar';
import QuickAdd from '../../components/QuickAdd';
import styles from './Diary.module.css';

const MEAL_TYPES = [
  { id: 'breakfast', label: '🌅 Завтрак' },
  { id: 'lunch',     label: '☀️ Обед' },
  { id: 'dinner',    label: '🌙 Ужин' },
  { id: 'snack',     label: '🍎 Перекусы' },
];

/** Returns today as YYYY-MM-DD in local Europe/Rome timezone */
function getTodayStr() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}

/** Format date for display: "31 мая" */
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/** Add days to a YYYY-MM-DD string */
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('sv-SE');
}

export default function Diary() {
  const today = getTodayStr();
  const [currentDate, setCurrentDate] = useState(today);
  const [quickAdd, setQuickAdd] = useState(null); // { mealType }

  const { logs, dailyTotals, goals, loading, error, fetchDay, fetchGoals, removeLog } =
    useDiaryStore();

  useEffect(() => {
    fetchDay(currentDate);
  }, [currentDate]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const g = goals || { protein: 100, fat: 100, carbs: 200, fiber: 30, calories: 2100 };

  const isToday   = currentDate === today;
  const isTomorrow = currentDate > today;

  function navigate(delta) {
    const next = addDays(currentDate, delta);
    if (next > today) return; // don't allow future
    setCurrentDate(next);
  }

  function handleLogDeleted(id) {
    removeLog(id);
  }

  function handleAdded() {
    fetchDay(currentDate);
  }

  return (
    <div className={styles.page}>
      {/* Date navigation */}
      <div className={styles.dateNav}>
        <button
          className={styles.navBtn}
          onClick={() => navigate(-1)}
          aria-label="Предыдущий день"
        >
          ←
        </button>
        <span className={styles.dateLabel}>
          {isToday ? `Сегодня, ${formatDate(currentDate)}` : formatDate(currentDate)}
        </span>
        <button
          className={styles.navBtn}
          onClick={() => navigate(1)}
          disabled={isToday}
          aria-label="Следующий день"
        >
          →
        </button>
      </div>

      {loading && <p className={styles.hint}>Загружаю...</p>}
      {error   && <p className={styles.errorMsg}>{error}</p>}

      {/* Meal sections */}
      <div className={styles.sections}>
        {MEAL_TYPES.map((meal) => {
          const mealLogs = logs.filter((l) => l.mealType === meal.id);
          const mealTotals = mealLogs.reduce(
            (acc, log) => {
              const t = log.totals || {};
              return {
                protein:  parseFloat(((acc.protein  || 0) + (t.protein  || 0)).toFixed(1)),
                fat:      parseFloat(((acc.fat      || 0) + (t.fat      || 0)).toFixed(1)),
                carbs:    parseFloat(((acc.carbs    || 0) + (t.carbs    || 0)).toFixed(1)),
                calories: parseFloat(((acc.calories || 0) + (t.calories || 0)).toFixed(0)),
              };
            },
            { protein: 0, fat: 0, carbs: 0, calories: 0 },
          );

          return (
            <section key={meal.id} className={styles.mealSection}>
              <div className={styles.mealHeader}>
                <h2 className={styles.mealTitle}>{meal.label}</h2>
                <div className={styles.mealMeta}>
                  {mealLogs.length > 0 && (
                    <span className={styles.mealTotals}>
                      Б{mealTotals.protein} Ж{mealTotals.fat} У{mealTotals.carbs} |{' '}
                      {mealTotals.calories} ккал
                    </span>
                  )}
                  <button
                    id={`add-${meal.id}`}
                    className={styles.addBtn}
                    onClick={() => setQuickAdd({ mealType: meal.id })}
                  >
                    + Добавить
                  </button>
                </div>
              </div>

              {mealLogs.length === 0 ? (
                <p className={styles.emptyHint}>Ничего не добавлено</p>
              ) : (
                mealLogs.map((log) => (
                  <FoodEntry key={log._id} entry={log} onDelete={handleLogDeleted} />
                ))
              )}
            </section>
          );
        })}
      </div>

      {/* Daily totals */}
      <section className={styles.summarySection}>
        <h2 className={styles.summaryTitle}>Итого за день</h2>
        <div className={styles.nutrientBars}>
          <NutrientBar
            label="Белки"
            current={dailyTotals.protein || 0}
            goal={g.protein}
            color="#4f8ef7"
          />
          <NutrientBar
            label="Жиры"
            current={dailyTotals.fat || 0}
            goal={g.fat}
            color="#f6ad55"
          />
          <NutrientBar
            label="Углеводы"
            current={dailyTotals.carbs || 0}
            goal={g.carbs}
            color="#68d391"
          />
          <NutrientBar
            label="Клетчатка"
            current={dailyTotals.fiber || 0}
            goal={g.fiber}
            color="#9f7aea"
          />
        </div>
        <div className={styles.caloriesRow}>
          <span className={styles.caloriesLabel}>Калории</span>
          <span className={styles.caloriesValue}>
            {dailyTotals.calories || 0} / {g.calories} ккал
          </span>
        </div>
      </section>

      {/* QuickAdd modal */}
      {quickAdd && (
        <QuickAdd
          date={currentDate}
          mealType={quickAdd.mealType}
          onClose={() => setQuickAdd(null)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
