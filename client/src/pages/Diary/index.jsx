import { useEffect, useState } from 'react';
import useDiaryStore from '../../store/diaryStore';
import useGoalsStore from '../../store/goalsStore';
import FoodEntry from '../../components/FoodEntry';
import NutrientBar from '../../components/NutrientBar';
import QuickAdd from '../../components/QuickAdd';
import Skeleton from '../../components/Skeleton/Skeleton';
import EmptyState from '../../components/EmptyState/EmptyState';
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

  const { logs, dailyTotals, loading, error, fetchDay, removeLog } = useDiaryStore();
  const { goals, fetchGoals } = useGoalsStore();

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
          <i className="ti ti-chevron-left" aria-hidden="true" />
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
          <i className="ti ti-chevron-right" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px 0' }}>
          <Skeleton height="100px" style={{ marginBottom: 16 }} />
          <Skeleton height="60px" style={{ marginBottom: 8 }} />
          <Skeleton height="60px" style={{ marginBottom: 8 }} />
          <Skeleton height="60px" style={{ marginBottom: 8 }} />
          <Skeleton height="60px" />
        </div>
      ) : error ? (
        <p className={styles.errorMsg}>{error}</p>
      ) : (
        <>
          {/* Daily totals (TOP) */}
          <div className={styles.summaryCard}>
        <div className={styles.summaryContent}>
          <div className={styles.summaryBars}>
            <NutrientBar
              label="Белки"
              current={dailyTotals.protein || 0}
              goal={g.protein}
              color="var(--nt-blue-mid)"
            />
            <NutrientBar
              label="Жиры"
              current={dailyTotals.fat || 0}
              goal={g.fat}
              color="var(--nt-amber-mid)"
            />
            <NutrientBar
              label="Углеводы"
              current={dailyTotals.carbs || 0}
              goal={g.carbs}
              color="var(--nt-green-mid)"
            />
            <NutrientBar
              label="Клетчатка"
              current={dailyTotals.fiber || 0}
              goal={g.fiber}
              color="var(--nt-teal-mid)"
            />
          </div>
          
          <div className={styles.summaryStats}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Ккал</div>
              <div className={styles.statValue}>{dailyTotals.calories || 0}</div>
              <div className={styles.statSub}>/ {g.calories}</div>
            </div>
            
            {logs.some(l => l.product && l.product.pricePer100g) && (
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Стоимость</div>
                <div className={styles.statValue}>
                  {logs.reduce((sum, log) => sum + (log.product?.pricePer100g ? (log.product.pricePer100g * log.amountG / 100) : 0), 0).toFixed(2)}
                </div>
                <div className={styles.statSub}>€ за день</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon="🍽"
          title="Пока пусто"
          description="Напиши боту что съел или добавь вручную"
          actionLabel="Добавить еду"
          onAction={() => setQuickAdd({ mealType: 'snack' })}
        />
      ) : (
        <div className={styles.mealsCard}>
          {MEAL_TYPES.map((meal, index) => {
          const mealLogs = logs.filter((l) => l.mealType === meal.id);
          const mealTotals = mealLogs.reduce(
            (acc, log) => {
              const t = log.totals || {};
              const cost = log.product && log.product.pricePer100g 
                ? (log.product.pricePer100g * log.amountG / 100)
                : 0;
              return {
                protein:  parseFloat(((acc.protein  || 0) + (t.protein  || 0)).toFixed(1)),
                fat:      parseFloat(((acc.fat      || 0) + (t.fat      || 0)).toFixed(1)),
                carbs:    parseFloat(((acc.carbs    || 0) + (t.carbs    || 0)).toFixed(1)),
                calories: parseFloat(((acc.calories || 0) + (t.calories || 0)).toFixed(0)),
                cost:     parseFloat(((acc.cost     || 0) + cost).toFixed(2)),
              };
            },
            { protein: 0, fat: 0, carbs: 0, calories: 0, cost: 0 },
          );

          // Get icon based on meal type
          let icon = 'ti-sun';
          let iconColor = 'var(--nt-amber-mid)';
          if (meal.id === 'lunch') { icon = 'ti-tools-kitchen-2'; iconColor = 'var(--nt-green-mid)'; }
          if (meal.id === 'dinner') { icon = 'ti-moon'; iconColor = 'var(--nt-blue-mid)'; }
          if (meal.id === 'snack') { icon = 'ti-apple'; iconColor = 'var(--nt-coral-mid)'; }

          // Remove emoji from label if it exists (assuming label has emoji like '🌅 Завтрак')
          const cleanLabel = meal.label.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u, '');

          return (
            <div key={meal.id} className={`${styles.mealSection} ${index === MEAL_TYPES.length - 1 ? styles.lastMealSection : ''}`}>
              <div className={styles.mealHeader}>
                <span className={styles.mealName}>
                  <i className={`ti ${icon}`} style={{ fontSize: '14px', color: iconColor }} aria-hidden="true" />
                  {cleanLabel}
                </span>
                <span className={styles.mealTotal}>
                  Б:{mealTotals.protein}г Ж:{mealTotals.fat}г У:{mealTotals.carbs}г · {mealTotals.calories} ккал {mealTotals.cost > 0 && `· ${mealTotals.cost}€`}
                </span>
              </div>

              {mealLogs.length === 0 ? (
                <div className={styles.emptyHint}>Ничего не добавлено</div>
              ) : (
                mealLogs.map((log) => (
                  <FoodEntry key={log._id} entry={log} onDelete={handleLogDeleted} />
                ))
              )}
              
              <div className={styles.addFoodRow} onClick={() => setQuickAdd({ mealType: meal.id })}>
                <i className="ti ti-plus" style={{ fontSize: '14px' }} aria-hidden="true" />
                Добавить продукт
              </div>
            </div>
          );
        })}

        <div className={styles.divider}></div>
        <div className={styles.totalsFooter}>
          <div className={styles.totalsFooterText}>
            Итого за день: Б:{dailyTotals.protein || 0}г Ж:{dailyTotals.fat || 0}г У:{dailyTotals.carbs || 0}г Кл:{dailyTotals.fiber || 0}г
          </div>
          <div className={styles.totalsFooterNums}>
            {dailyTotals.calories || 0} ккал
            {logs.some(l => l.product && l.product.pricePer100g) && 
              ` · €${logs.reduce((sum, log) => sum + (log.product?.pricePer100g ? (log.product.pricePer100g * log.amountG / 100) : 0), 0).toFixed(2)}`
            }
          </div>
        </div>
      </div>
      )}
        </>
      )}

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
