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

export default api;

