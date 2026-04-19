import { apiClient } from '../utils/api';
import { Category } from '../models/category';

export const categoryService = {
  getAll: () => apiClient.get<Category[]>('/categories'),
  create: (data: any) => apiClient.post('/categories', data),
  delete: (id: string) => apiClient.delete(`/categories/${id}`)
};