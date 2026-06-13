import api from './axios';
export const getMessages = (expenseId) => api.get(`/expenses/${expenseId}/messages/`);
