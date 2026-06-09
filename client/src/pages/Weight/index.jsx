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
import styles from './Weight.module.css';
import api from '../../api';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function Weight() {
  const [logs, setLogs] = useState([]);
  const [movingAvg, setMovingAvg] = useState([]);
  const [limit, setLimit] = useState(30);
  const [loading, setLoading] = useState(true);

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWeight, setFormWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [limit]);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await api.weight.get({ limit });
      setLogs(res.data.logs);
      setMovingAvg(res.data.movingAverage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const w = parseFloat(formWeight);
    if (!w || isNaN(w)) return;

    try {
      setSaving(true);
      await api.weight.create({ date: formDate, weightKg: w });
      setFormWeight('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении веса');
    } finally {
      setSaving(false);
    }
  }

  // Подготавливаем данные для графика
  const chartData = useMemo(() => {
    // logs и movingAvg имеют одинаковую длину и соответствуют друг другу по индексам
    return logs.map((log, i) => {
      const avgItem = movingAvg[i];
      return {
        date: formatDate(log.date),
        rawDate: log.date,
        weight: log.weightKg,
        avg: avgItem ? avgItem.avg : null,
      };
    });
  }, [logs, movingAvg]);

  // Вычисляем domain для Y оси
  const yDomain = useMemo(() => {
    if (!logs.length) return ['auto', 'auto'];
    const min = Math.min(...logs.map(l => l.weightKg)) - 1;
    const max = Math.max(...logs.map(l => l.weightKg)) + 1;
    return [Math.floor(min), Math.ceil(max)];
  }, [logs]);

  // Данные для таблицы (с разницей от предыдущего)
  const tableData = useMemo(() => {
    const arr = [...logs].reverse(); // новые сверху
    return arr.map((log, i) => {
      const nextOlder = arr[i + 1];
      let diff = 0;
      if (nextOlder) {
        diff = log.weightKg - nextOlder.weightKg;
      }
      return { ...log, diff };
    });
  }, [logs]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--nt-surface)', padding: '10px', border: '1px solid var(--nt-border)', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 5px', fontSize: '13px', color: 'var(--nt-text2)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#4f8ef7', fontWeight: 500 }}>
            Вес: {payload[0]?.value} кг
          </p>
          {payload[1] && payload[1].value && (
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#ff9800' }}>
              Среднее: {payload[1].value} кг
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Вес</h1>
        <div className={styles.periodToggle}>
          <button
            className={`${styles.periodBtn} ${limit === 14 ? styles.periodBtnActive : ''}`}
            onClick={() => setLimit(14)}
          >
            2 нед
          </button>
          <button
            className={`${styles.periodBtn} ${limit === 30 ? styles.periodBtnActive : ''}`}
            onClick={() => setLimit(30)}
          >
            1 мес
          </button>
          <button
            className={`${styles.periodBtn} ${limit === 90 ? styles.periodBtnActive : ''}`}
            onClick={() => setLimit(90)}
          >
            3 мес
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <form className={styles.addForm} onSubmit={handleAdd}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Дата</label>
            <input
              type="date"
              className={styles.input}
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Вес (кг)</label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              className={styles.input}
              value={formWeight}
              onChange={(e) => setFormWeight(e.target.value)}
              placeholder="0.0"
              required
            />
          </div>
          <button type="submit" className={styles.btn} disabled={saving}>
            {saving ? 'Сохранение...' : 'Записать'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Загрузка...</div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>Нет записей за этот период. Добавьте свой первый вес!</div>
      ) : (
        <>
          <div className={styles.card}>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--nt-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--nt-text3)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={yDomain} tick={{ fontSize: 12, fill: 'var(--nt-text3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    name="Реальный вес"
                    dataKey="weight"
                    stroke="#4f8ef7"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#4f8ef7', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    name="Скользящее среднее (7 дн)"
                    dataKey="avg"
                    stroke="#ff9800"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Вес (кг)</th>
                  <th>Изменение</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row._id}>
                    <td>{formatDate(row.date)}</td>
                    <td style={{ fontWeight: 500 }}>{row.weightKg.toFixed(1)}</td>
                    <td>
                      {row.diff === 0 ? (
                        <span className={styles.diffZero}>0.0</span>
                      ) : row.diff > 0 ? (
                        <span className={styles.diffPos}>+{row.diff.toFixed(1)}</span>
                      ) : (
                        <span className={styles.diffNeg}>{row.diff.toFixed(1)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
