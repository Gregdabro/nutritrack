import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.auth = {
  telegram: (data) => api.post('/auth/telegram', data),
  botLogin: (data) => api.post('/auth/bot-login', data),
  devLogin: (data) => api.post('/auth/dev-login', data),
};

api.goals = {
  get: () => api.get('/goals'),
  update: (data) => api.put('/goals', data),
};

export default api;
