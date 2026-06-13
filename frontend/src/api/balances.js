import api from './axios';
export const getGroupBalances = (groupId) => api.get(`/groups/${groupId}/balances/`);
export const getUserSummary = () => api.get('/balances/summary/');
