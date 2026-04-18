import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verify: (code) => api.post('/auth/verify', { code }),
  resendVerification: () => api.post('/auth/resend-verification'),
  me: () => api.get('/auth/me'),
};

export const teachers = {
  featured: () => api.get('/teachers/featured'),
  getById: (id) => api.get(`/teachers/${id}`),
  myProfile: () => api.get('/teachers/me/profile'),
  updateProfile: (data) => api.put('/teachers/me/profile', data),
};

export const announcements = {
  search: (params) => api.get('/announcements/search', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const requests = {
  create: (data) => api.post('/requests', data),
  list: (params) => api.get('/requests', { params }),
  accept: (id) => api.put(`/requests/${id}/accept`),
  reject: (id) => api.put(`/requests/${id}/reject`),
};

export const chats = {
  list: () => api.get('/chats'),
  getById: (id) => api.get(`/chats/${id}`),
  getMessages: (id, params) => api.get(`/chats/${id}/messages`, { params }),
};

export const reviews = {
  create: (data) => api.post('/reviews', data),
  byTeacher: (userId, params) => api.get(`/reviews/teacher/${userId}`, { params }),
  landing: () => api.get('/reviews/landing'),
};

export const subscriptions = {
  plans: () => api.get('/subscriptions/plans'),
  mine: () => api.get('/subscriptions/me'),
  subscribe: (plan) => api.post('/subscriptions/subscribe', { plan }),
};

export const uploads = {
  avatar: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/uploads/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  certificate: (file, name) => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    return api.post('/uploads/certificate', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteCertificate: (id) => api.delete(`/uploads/certificate/${id}`),
};

export default api;
