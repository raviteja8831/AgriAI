import api from '../utils/api';

// Auth
export const authAPI = {
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  setupProfile: (data) => api.post('/auth/setup', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadAvatar: (formData) => api.put('/auth/profile-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data) => api.put('/auth/change-password', data),
  // Legacy password login (admin/web)
  login: (data) => api.post('/auth/login', data),
};

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const marketAPI = {
  getMyCrops: () => api.get('/market/my-crops'),
  getPrices: (crops) => api.get('/market', { params: { crops } }),
};

export const recommendationsAPI = {
  get: (params) => api.get('/recommendations', { params }),
  getSeasons: (params) => api.get('/recommendations/seasons', { params }),
};

// Farms
export const farmsAPI = {
  getAll: () => api.get('/farms'),
  getOne: (id) => api.get(`/farms/${id}`),
  create: (data) => api.post('/farms', data),
  update: (id, data) => api.put(`/farms/${id}`, data),
  remove: (id) => api.delete(`/farms/${id}`),
};

// Crops
export const cropsAPI = {
  getAll: (params) => api.get('/crops', { params }),
  getOne: (id) => api.get(`/crops/${id}`),
  create: (data) => api.post('/crops', data),
  update: (id, data) => api.put(`/crops/${id}`, data),
  remove: (id) => api.delete(`/crops/${id}`),
};

// Weather
export const weatherAPI = {
  getCurrent: (farmId) => api.get(`/weather/farm/${farmId}/current`),
  getForecast: (farmId) => api.get(`/weather/farm/${farmId}/forecast`),
};

// Calendar
export const calendarAPI = {
  getUpcoming: (days) => api.get('/calendar/upcoming', { params: { days } }),
  getCropCalendar: (cropId) => api.get(`/calendar/crop/${cropId}`),
  generate: (cropId) => api.post(`/calendar/crop/${cropId}/generate`),
  updateTask: (taskId, data) => api.put(`/calendar/task/${taskId}`, data),
  addTask: (cropId, data) => api.post(`/calendar/crop/${cropId}/task`, data),
};

// Expenses
export const expensesAPI = {
  getAll: (cropId) => api.get(`/expenses/crop/${cropId}`),
  create: (cropId, data) => api.post(`/expenses/crop/${cropId}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
};

// Harvest
export const harvestAPI = {
  get: (cropId) => api.get(`/harvests/crop/${cropId}`),
  save: (cropId, data) => api.post(`/harvests/crop/${cropId}`, data),
};

// Soil
export const soilAPI = {
  getAll: (farmId) => api.get(`/soil/farm/${farmId}`),
  getLatest: (farmId) => api.get(`/soil/farm/${farmId}/latest`),
  create: (farmId, data) => api.post(`/soil/farm/${farmId}`, data),
};

// Images
export const imagesAPI = {
  getAll: (cropId) => api.get(`/images/crop/${cropId}`),
  upload: (cropId, formData) => api.post(`/images/crop/${cropId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  remove: (imageId) => api.delete(`/images/${imageId}`),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
