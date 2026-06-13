import { create } from 'zustand';
import api from '../api';

const useDiaryStore = create((set, get) => ({
  logs:        [],
  dailyTotals: { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 },
  loading:     false,
  error:       null,

  async fetchDay(date) {
    set({ loading: true, error: null });
    try {
      const res = await api.foodLogs.list({ date });
      set({
        logs:        res.data.logs || [],
        dailyTotals: res.data.dailyTotals || {},
        loading:     false,
      });
    } catch (err) {
      set({ error: err.message || 'Ошибка загрузки', loading: false });
    }
  },



  removeLog(id) {
    const logs = get().logs.filter((l) => l._id !== id);
    // Recompute dailyTotals after removal
    const dailyTotals = logs.reduce(
      (acc, log) => {
        const t = log.totals || {};
        return {
          protein:  parseFloat(((acc.protein  || 0) + (t.protein  || 0)).toFixed(1)),
          fat:      parseFloat(((acc.fat      || 0) + (t.fat      || 0)).toFixed(1)),
          carbs:    parseFloat(((acc.carbs    || 0) + (t.carbs    || 0)).toFixed(1)),
          fiber:    parseFloat(((acc.fiber    || 0) + (t.fiber    || 0)).toFixed(1)),
          calories: parseFloat(((acc.calories || 0) + (t.calories || 0)).toFixed(0)),
          costEur: acc.costEur !== null && t.costEur !== null
            ? parseFloat(((acc.costEur || 0) + (t.costEur || 0)).toFixed(2))
            : null,
        };
      },
      { protein: 0, fat: 0, carbs: 0, fiber: 0, calories: 0, costEur: 0 },
    );
    set({ logs, dailyTotals });
  },
}));

export default useDiaryStore;
