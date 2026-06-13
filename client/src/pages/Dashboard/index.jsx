import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useDashboardStore from '../../store/dashboardStore';
import CalorieRing from '../../components/CalorieRing';
import NutrientBar from '../../components/NutrientBar';
import FoodEntry from '../../components/FoodEntry';
import WeightChart from '../../components/WeightChart';
import QuickAdd from '../../components/QuickAdd';
import api from '../../api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { todayData, weekData, fetchToday, fetchWeek, isLoadingToday, isLoadingWeek } = useDashboardStore();
  const [repeating, setRepeating] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addingWater, setAddingWater] = useState(false);

  useEffect(() => {
    fetchToday();
    fetchWeek();
  }, [fetchToday, fetchWeek]);

  const handleRepeatBreakfast = async () => {
    if (!todayData?.repeatSuggestion || repeating) return;
    setRepeating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterdayObj = new Date();
      yesterdayObj.setDate(yesterdayObj.getDate() - 1);
      const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

      await api.foodLogs.repeat({
        sourceDate: yesterdayStr,
        mealType: 'breakfast',
        targetDate: today
      });
      // Refresh dashboard
      fetchToday();
      fetchWeek();
    } catch (err) {
      console.error('Failed to repeat breakfast', err);
    } finally {
      setRepeating(false);
    }
  };

  const handleAddWater = async () => {
    if (addingWater) return;
    setAddingWater(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentWater = todayData?.waterMl || 0;
      await api.water.create({
        date: today,
        amountMl: currentWater + 250
      });
      fetchToday();
    } catch (err) {
      console.error('Failed to add water', err);
    } finally {
      setAddingWater(false);
    }
  };

  const isDataLoading = isLoadingToday || !todayData;

  const todayStr = new Intl.DateTimeFormat('ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  }).format(new Date());

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  if (isDataLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: 150, height: 24, marginBottom: 8 }} />
            <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ width: 100, height: 16 }} />
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.ringSection}>
            <div className={`${styles.skeleton} ${styles.skeletonRing}`} />
            <div className={styles.macros} style={{ width: '100%' }}>
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ height: 20 }} />
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ height: 20 }} />
              <div className={`${styles.skeleton} ${styles.skeletonBar}`} style={{ height: 20 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { goals, foodTotals, workout, wellbeing, weight, recentMeals, repeatSuggestion } = todayData;

  const eatenCals = foodTotals?.calories || 0;
  const burnedCals = workout?.caloriesBurned || 0;
  const goalCals = goals?.calories || 2000;

  // For WeightChart we can extract the past 14 days if we had them.
  // We only fetched 7 days in weekData. So we will pass those 7 days.
  const chartData = weekData?.days
    ?.filter(d => d.weight)
    .map(d => ({ date: d.date, weightKg: d.weight.weightKg }))
    .reverse() || []; // Reverse to show chronologically if not already

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Привет, {user?.firstName || 'Друг'}!</h1>
          <div className={styles.date}>{capitalize(todayStr)}</div>
        </div>
        <button className={styles.addButton} onClick={() => setQuickAddOpen(true)}>
          <i className="ti ti-plus" /> Добавить
        </button>
      </header>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Прогресс</h2>
        <div className={styles.ringSection}>
          <CalorieRing eaten={eatenCals} goal={goalCals} burned={burnedCals} />
          
          <div className={styles.macros}>
            <NutrientBar 
              label="Б" 
              current={foodTotals?.protein || 0} 
              goal={goals?.protein || 100} 
              color="var(--nt-blue-mid)" 
            />
            <NutrientBar 
              label="Ж" 
              current={foodTotals?.fat || 0} 
              goal={goals?.fat || 100} 
              color="var(--nt-amber-mid)" 
            />
            <NutrientBar 
              label="У" 
              current={foodTotals?.carbs || 0} 
              goal={goals?.carbs || 200} 
              color="var(--nt-green-mid)" 
            />
          </div>
        </div>
      </section>

      <section className={styles.quickActions}>
        <button className={styles.actionBtn} onClick={() => setQuickAddOpen(true)}>
          <i className={`ti ti-apple ${styles.actionIcon}`} />
          <span>+ Еда</span>
        </button>
        <button className={styles.actionBtn} onClick={handleAddWater} disabled={addingWater}>
          <i className={`ti ti-droplet ${styles.actionIcon}`} style={{ color: 'var(--nt-blue-mid)' }} />
          <span>+ Вода</span>
        </button>
        <button className={styles.actionBtn} onClick={() => navigate('/workouts')}>
          <i className={`ti ti-barbell ${styles.actionIcon}`} />
          <span>+ Тренировка</span>
        </button>
        <button className={styles.actionBtn} onClick={() => navigate('/weight')}>
          <i className={`ti ti-scale ${styles.actionIcon}`} />
          <span>+ Вес</span>
        </button>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Последние приёмы</h2>
        {recentMeals && recentMeals.length > 0 ? (
          <div className={styles.mealsList}>
            {recentMeals.map((meal, idx) => (
              <FoodEntry 
                key={meal._id || idx} 
                entry={meal} 
                onDelete={() => {
                  fetchToday();
                  fetchWeek();
                }} 
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>Сегодня вы ещё ничего не ели</div>
        )}

        {repeatSuggestion && (
          <div className={styles.repeatBox}>
            <span className={styles.repeatText}>Повторить завтрак как вчера?</span>
            <button className={styles.repeatBtn} onClick={handleRepeatBreakfast} disabled={repeating}>
              {repeating ? 'Добавляю...' : 'Повторить'}
            </button>
          </div>
        )}
      </section>

      <section className={styles.miniCards}>
        <div className={styles.miniCard} onClick={() => navigate('/workouts')}>
          <span className={styles.miniLabel}>Тренировка</span>
          <span className={styles.miniValue}>
            {workout ? `${workout.durationMinutes || 0} мин` : 'Нет'}
          </span>
        </div>
        <div className={styles.miniCard} onClick={() => navigate('/wellbeing')}>
          <span className={styles.miniLabel}>Самочувствие</span>
          <span className={styles.miniValue}>
            {wellbeing ? wellbeing.overall : 'Не указано'}
          </span>
        </div>
        <div className={styles.miniCard} onClick={() => navigate('/weight')}>
          <span className={styles.miniLabel}>Вес сегодня</span>
          <span className={styles.miniValue}>
            {weight ? `${weight.weightKg} кг` : 'Нет'}
          </span>
        </div>
        <div className={styles.miniCard}>
          <span className={styles.miniLabel}>Вода</span>
          <span className={styles.miniValue}>
            {todayData.waterMl || 0} мл
          </span>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Динамика веса</h2>
        {chartData.length > 0 ? (
          <WeightChart data={chartData} />
        ) : (
          <div className={styles.emptyState}>Добавьте вес, чтобы увидеть график</div>
        )}
      </section>

      {quickAddOpen && (
        <QuickAdd
          date={new Date().toISOString().split('T')[0]}
          onClose={() => setQuickAddOpen(false)}
          onAdded={() => {
            fetchToday();
            fetchWeek();
          }}
        />
      )}
    </div>
  );
}
