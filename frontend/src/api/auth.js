import api from './axios';
export const register = (data) => api.post('/auth/register/', data);
export const login = (data) => api.post('/auth/login/', data);
export const getMe = () => api.get('/auth/me/');
export const searchUsers = (email) => api.get(`/auth/users/search/?email=${encodeURIComponent(email)}`);
