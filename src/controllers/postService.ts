// src/controllers/postService.ts
import { apiClient } from '../utils/api';
import { Post } from '../models/post';

export const postService = {
  getAll: async (): Promise<Post[]> => {
    try {
      const response = await apiClient.get('/posts');
      return response as unknown as Post[];
    } catch (error) {
      console.error("Lỗi lấy danh sách bài viết:", error);
      throw error;
    }
  },

  getById: async (id: string): Promise<Post> => {
    try {
      const response = await apiClient.get(`/posts/${id}`);
      return response as unknown as Post;
    } catch (error) {
      console.error(`Lỗi lấy bài viết ${id}:`, error);
      throw error;
    }
  },

  create: async (post: Partial<Post>): Promise<Post> => {
    try {
      const response = await apiClient.post('/posts', post);
      return response as unknown as Post;
    } catch (error) {
      console.error("Lỗi tạo bài viết:", error);
      throw error;
    }
  },

  update: async (id: string, post: Partial<Post>): Promise<Post> => {
    try {
      const response = await apiClient.put(`/posts/${id}`, post);
      return response as unknown as Post;
    } catch (error) {
      console.error(`Lỗi cập nhật bài viết ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/posts/${id}`);
    } catch (error) {
      console.error(`Lỗi xóa bài viết ${id}:`, error);
      throw error;
    }
  }
};