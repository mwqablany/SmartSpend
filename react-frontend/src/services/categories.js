import api from './api'

export const getCategories = () =>
  api.get('/categories/').then(res => res.data)

export const createCategory = (data) =>
  api.post('/categories/', data).then(res => res.data)

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then(res => res.data)

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then(res => res.data)

// Optional: if you have a backend endpoint for category stats
export const getCategoryStats = () =>
  api.get('/categories/stats').then(res => res.data)