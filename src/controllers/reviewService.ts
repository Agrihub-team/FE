// src/controllers/reviewService.ts
import { apiClient } from '../utils/api';
import { Review } from '../models/review';

export const reviewService = {
  getByProduct: async (productId: string): Promise<Review[]> => {
    try {
      const response = await apiClient.get(`/reviews/product/${productId}`);
      return response as unknown as Review[];
    } catch (error) {
      console.error(`Lỗi lấy đánh giá cho sản phẩm ${productId}:`, error);
      throw error;
    }
  },

  create: async (review: Partial<Review>): Promise<Review> => {
    try {
      const response = await apiClient.post('/reviews', review);
      return response as unknown as Review;
    } catch (error) {
      console.error("Lỗi tạo đánh giá:", error);
      throw error;
    }
  },

  approve: async (id: string): Promise<Review> => {
    try {
      const response = await apiClient.put(`/reviews/${id}/approve`, {});
      return response as unknown as Review;
    } catch (error) {
      console.error(`Lỗi duyệt đánh giá ${id}:`, error);
      throw error;
    }
  }
};