import { create } from 'zustand';
import api from '../api';

const useGoalsStore = create((set) => ({
  goals: null,
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.goals.get();
      set({ goals: data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  updateGoals: async (goalsData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.goals.update(goalsData);
      set({ goals: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  clearGoals: () => set({ goals: null, error: null }),
}));

export default useGoalsStore;
