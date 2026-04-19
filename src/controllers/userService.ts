import { apiClient } from '../utils/api';
import { User } from '../models/user';

export const userService = {
  getAll: () => apiClient.get<User[]>('/users'),
  delete: (id: string) => apiClient.delete(`/users/${id}`)
};