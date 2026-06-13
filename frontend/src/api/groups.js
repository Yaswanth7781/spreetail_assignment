import api from './axios';
export const getGroups = () => api.get('/groups/');
export const createGroup = (data) => api.post('/groups/', data);
export const getGroup = (id) => api.get(`/groups/${id}/`);
export const deleteGroup = (id) => api.delete(`/groups/${id}/`);
export const addMember = (groupId, email) => api.post(`/groups/${groupId}/members/`, { email });
export const removeMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}/`);
