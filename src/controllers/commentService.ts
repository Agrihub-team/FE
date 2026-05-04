import { apiClient } from '../utils/api';
import { Comment } from '../models/comment';

export const commentService = {
  getByPost: async (postId: string): Promise<Comment[]> => {
    // Gọi thông qua apiClient tự động nhận diện Base URL (cổng 3001) và kẹp token
    const response = await apiClient.get(`/comments/post/${postId}`);
    return response as unknown as Comment[];
  },
  
  create: async (data: any): Promise<Comment> => {
    const response = await apiClient.post(`/comments`, data);
    return response as unknown as Comment;
  },
  
  approve: async (id: string): Promise<Comment> => {
    const response = await apiClient.put(`/comments/${id}/approve`);
    return response as unknown as Comment;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  }
};