import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import styles from './Wellbeing.module.css';
import api from '../../api';
import Skeleton from '../../components/Skeleton/Skeleton';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const OVERALL_OPTIONS = [
  { value: 'great', label: 'Отлично', emoji: '😁', color: '#4caf50' },
  { value: 'good', label: 'Хорошо', emoji: '🙂', color: '#8bc34a' },
  { value: 'ok', label: 'Нормально', emoji: '😐', color: '#ffc107' },
  { value: 'bad', label: 'Плохо', emoji: '😔', color: '#ff9800' },
  { value: 'sick', label: 'Болею', emoji: '🤒', color: '#f44336' },
];

export default function Wellbeing() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formOverall, setFormOverall] = useState('');
  const [formDetails, setFormDetails] = useState({ energy: '', sleep: '', stress: '', mood: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  async function fetchData() {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const lastDay = getDaysInMonth(year, currentDate.getMonth());
      
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-${lastDay}`;

      const res = await api.wellbeing.get({ startDate, endDate });
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePrevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!formOverall) return alert('Выберите общее самочувствие');

    try {
      setSaving(true);
      const data = { date: formDate, overall: formOverall };
      Object.keys(formDetails).forEach(k => {
        if (formDetails[k]) data[k] = parseInt(formDetails[k], 10);
      });

      await api.wellbeing.create(data);
      
      setFormOverall('');
      setFormDetails({ energy: '', sleep: '', stress: '', mood: '' });
      fetchData();
      alert('Запись добавлена!');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        alert('Запись за эту дату уже существует!');
      } else {
        alert('Ошибка при сохранении');
      }
    } finally {
      setSaving(false);
    }
  }

  const heatmapDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const log = logs.find(l => l.date === dateStr);
      days.push({
        date: dateStr,
        label: `${i} ${currentDate.toLocaleDateString('ru-RU', { month: 'short' })}`,
        overall: log ? log.overall : 'none'
      });
    }
    return days;
  }, [logs, currentDate]);

  const chartData = useMemo(() => {
    return logs
      .filter(l => l.energy || l.sleep || l.stress || l.mood)
      .map(log => ({
        date: formatDate(log.date),
        energy: log.energy || null,
        sleep: log.sleep || null,
        stress: log.stress || null,
        mood: log.mood || null,
      }));
  }, [logs]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Самочувствие</h1>
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={handlePrevMonth}>
            <i className="ti ti-chevron-left" />
          </button>
          <span className={styles.monthLabel}>
            {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>
          <button className={styles.navBtn} onClick={handleNextMonth}>
            <i className="ti ti-chevron-right" />
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Как ты себя чувствуешь?</h2>
        <form className={styles.addForm} onSubmit={handleAdd}>
          <div className={styles.formSection}>
            <label className={styles.label}>Дата</label>
            <input
              type="date"
              className={styles.select}
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
              style={{ maxWidth: '200px' }}
            />
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>Общее состояние</label>
            <div className={styles.overallButtons}>
              {OVERALL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.overallBtn} ${formOverall === opt.value ? styles.overallBtnActive : ''}`}
                  onClick={() => setFormOverall(opt.value)}
                >
                  <span style={{ fontSize: '24px' }}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>Детали (опционально, 1-5)</label>
            <div className={styles.detailsGrid}>
              {[
                { key: 'energy', label: 'Энергия' },
                { key: 'sleep', label: 'Сон' },
                { key: 'stress', label: 'Стресс' },
                { key: 'mood', label: 'Настроение' }
              ].map(field => (
                <div key={field.key} className={styles.detailItem}>
                  <label style={{ fontSize: '12px', color: 'var(--nt-text3)' }}>{field.label}</label>
                  <select
                    className={styles.select}
                    value={formDetails[field.key]}
                    onChange={(e) => setFormDetails({ ...formDetails, [field.key]: e.target.value })}
                  >
                    <option value="">Не указано</option>
                    <option value="1">1 - Плохо</option>
                    <option value="2">2</option>
                    <option value="3">3 - Нормально</option>
                    <option value="4">4</option>
                    <option value="5">5 - Отлично</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className={styles.btn} disabled={saving || !formOverall}>
            {saving ? 'Сохранение...' : 'Записать'}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Карта месяца</h2>
        {loading ? (
          <div style={{ padding: '20px 0' }}>
            <Skeleton height="150px" />
          </div>
        ) : (
          <div className={styles.heatmapContainer}>
            <div className={styles.heatmapGrid}>
              {heatmapDays.map((day) => (
                <div
                  key={day.date}
                  className={`${styles.heatmapCell} ${styles[`cell_${day.overall}`]}`}
                  title={`${day.label}: ${OVERALL_OPTIONS.find(o => o.value === day.overall)?.label || 'Нет данных'}`}
                />
              ))}
            </div>
            <div className={styles.heatmapLegend}>
              {OVERALL_OPTIONS.map((opt) => (
                <div key={opt.value} className={styles.legendItem}>
                  <div className={styles.legendColor} style={{ background: opt.color }} />
                  <span>{opt.label}</span>
                </div>
              ))}
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ background: 'var(--nt-surface2)' }} />
                <span>Нет данных</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Динамика показателей</h2>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--nt-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--nt-text3)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 12, fill: 'var(--nt-text3)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--nt-surface)', border: '1px solid var(--nt-border)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="energy" name="Энергия" stroke="#ffeb3b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sleep" name="Сон" stroke="#9c27b0" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="stress" name="Стресс" stroke="#f44336" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="mood" name="Настроение" stroke="#00bcd4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
