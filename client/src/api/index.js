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
  get:    ()     => api.get('/goals'),
  update: (data) => api.put('/goals', data),
};

api.products = {
  list:     (params)     => api.get('/products', { params }),
  get:      (id)         => api.get(`/products/${id}`),
  create:   (data)       => api.post('/products', data),
  update:   (id, data)   => api.put(`/products/${id}`, data),
  remove:   (id)         => api.delete(`/products/${id}`),
  addPrice: (id, data)   => api.post(`/products/${id}/price`, data),
};

api.foodLogs = {
  list:   (params)     => api.get('/food-logs', { params }),
  week:   (params)     => api.get('/food-logs/week', { params }),
  create: (data)       => api.post('/food-logs', data),
  parse:  (text)       => api.post('/food-logs/parse', { text }),
  repeat: (data)       => api.post('/food-logs/repeat', data),
  update: (id, data)   => api.put(`/food-logs/${id}`, data),
  remove: (id)         => api.delete(`/food-logs/${id}`),
};

api.recipes = {
  list:   (params)     => api.get('/recipes', { params }),
  get:    (id)         => api.get(`/recipes/${id}`),
  create: (data)       => api.post('/recipes', data),
  update: (id, data)   => api.put(`/recipes/${id}`, data),
  remove: (id)         => api.delete(`/recipes/${id}`),
};

api.workouts = {
  list:   (params)     => api.get('/workouts', { params }),
  get:    (id)         => api.get(`/workouts/${id}`),
  create: (data)       => api.post('/workouts', data),
  update: (id, data)   => api.put(`/workouts/${id}`, data),
  remove: (id)         => api.delete(`/workouts/${id}`),
};

api.wellbeing = {
  get:    (params)     => api.get('/wellbeing', { params }), // params: { date } or { startDate, endDate }
  create: (data)       => api.post('/wellbeing', data),
  update: (id, data)   => api.put(`/wellbeing/${id}`, data),
};

api.weight = {
  get:    (params)     => api.get('/weight', { params }), // params: { limit }
  create: (data)       => api.post('/weight', data),
  update: (id, data)   => api.put(`/weight/${id}`, data),
};

api.dashboard = {
  today: (params) => api.get('/dashboard/today', { params }), // params: { date }
  week:  (params) => api.get('/dashboard/week', { params }),  // params: { startDate }
};

export default api;
