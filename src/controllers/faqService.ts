import apiClient from '../utils/api';
import { FAQ } from '../models/faq';

export const faqService = {
  getAll: async (): Promise<FAQ[]> => {
    const response = await apiClient.get('/faqs');
    return response as unknown as FAQ[];
  },

  create: async (data: Partial<FAQ>): Promise<FAQ> => {
    const response = await apiClient.post('/faqs', data);
    return response as unknown as FAQ;
  },

  update: async (id: string, data: Partial<FAQ>): Promise<FAQ> => {
    const response = await apiClient.put(`/faqs/${id}`, data);
    return response as unknown as FAQ;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/faqs/${id}`);
  }
};