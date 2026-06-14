import api from './axios';
export const getExpenses = (groupId) => api.get(`/groups/${groupId}/expenses/`);
export const createExpense = (groupId, data) => api.post(`/groups/${groupId}/expenses/`, data);
export const getExpense = (groupId, expenseId) => api.get(`/groups/${groupId}/expenses/${expenseId}/`);
export const deleteExpense = (groupId, expenseId) => api.delete(`/groups/${groupId}/expenses/${expenseId}/`);

export const uploadCSV = (groupId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/groups/${groupId}/import/upload/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const commitCSV = (groupId, data) => api.post(`/groups/${groupId}/import/commit/`, data);
