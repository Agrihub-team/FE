// src/controllers/orderService.ts
import { apiClient } from '../utils/api';

export const orderService = {
  // Tạo đơn hàng mới
  create: async (data: any) => {
    try {
      const response = await apiClient.post('/orders', data);
      return response;   // Trả về nguyên response để Checkout xử lý order + vnpUrl
    } catch (error: any) {
      console.error("Lỗi tạo đơn hàng:", error);
      throw error;
    }
  },

  // Lấy chi tiết đơn hàng (dùng cho OrderSuccess)
  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return response;
    } catch (error: any) {
      console.error("Lỗi lấy chi tiết đơn hàng:", error);
      throw error;
    }
  },

  // Lấy tất cả đơn hàng (nếu cần)
  getAll: async () => {
    try {
      return await apiClient.get('/orders');
    } catch (error: any) {
      console.error("Lỗi lấy danh sách đơn hàng:", error);
      throw error;
    }
  }
};