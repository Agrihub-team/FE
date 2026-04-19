import { apiClient } from '../utils/api';
import { Product } from '../models/product';

export const productService = {
  /**
   * Lấy tất cả sản phẩm
   * Đảm bảo luôn trả về Array để tránh lỗi .map() ở UI
   */
  getAll: async (): Promise<Product[]> => {
    try {
      const res = await apiClient.get<any>('/products');
      
      // Trường hợp 1: Backend trả về { products: [...] }
      if (res && res.products && Array.isArray(res.products)) {
        return res.products;
      }
      
      // Trường hợp 2: Backend trả về mảng trực tiếp [...]
      if (Array.isArray(res)) {
        return res;
      }
      
      // Trường hợp 3: Dữ liệu nằm trong res.data (do apiClient đã bóc tách)
      if (res && res.data && Array.isArray(res.data)) {
        return res.data;
      }

      return [];
    } catch (error) {
      console.error("❌ Lỗi API Product (GetAll):", error);
      return [];
    }
  },

  /**
   * Lấy chi tiết 1 sản phẩm theo ID
   */
  getById: async (id: string): Promise<Product | null> => {
    try {
      const res = await apiClient.get<any>(`/products/${id}`);
      
      // Trả về trực tiếp object sản phẩm
      // Logic bọc data đã được xử lý ở apiClient hoặc kiểm tra tại đây
      return res?.product || res?.data || res || null;
    } catch (error) {
      console.error(`❌ Lỗi API Product (GetById: ${id}):`, error);
      return null;
    }
  }
};