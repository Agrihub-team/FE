import { apiClient } from '../utils/api';

export const authService = {
  login: (data: any) => apiClient.post<{ user: any; token: string }>('/auth/login', data),
  register: (data: any) => apiClient.post<{ user: any; token: string }>('/auth/register', data),
  
  sendOtp: (data: { email: string, type: 'register' | 'forgot' }) => apiClient.post('/auth/send-otp', data),
  resetPassword: (data: any) => apiClient.post('/auth/reset-password', data),
};