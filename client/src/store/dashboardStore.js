import { create } from 'zustand';
import api from '../api';

const useDashboardStore = create((set, get) => ({
  todayData: null,
  weekData: null,
  isLoadingToday: false,
  isLoadingWeek: false,
  errorToday: null,
  errorWeek: null,

  fetchToday: async (date) => {
    set({ isLoadingToday: true, errorToday: null });
    try {
      const response = await api.dashboard.today(date ? { date } : undefined);
      set({ todayData: response.data, isLoadingToday: false });
    } catch (err) {
      set({ errorToday: err.response?.data?.message || err.message, isLoadingToday: false });
    }
  },

  fetchWeek: async (startDate) => {
    set({ isLoadingWeek: true, errorWeek: null });
    try {
      const response = await api.dashboard.week(startDate ? { startDate } : undefined);
      set({ weekData: response.data, isLoadingWeek: false });
    } catch (err) {
      set({ errorWeek: err.response?.data?.message || err.message, isLoadingWeek: false });
    }
  },

  clearData: () => set({ todayData: null, weekData: null, errorToday: null, errorWeek: null }),
}));

export default useDashboardStore;
