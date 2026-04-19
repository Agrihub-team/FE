import { create } from 'zustand';
import { User } from '../models/user';

interface AuthState {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Khởi tạo state từ localStorage
  user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
  
  login: (user: User, token: string) => { 
    // Lưu token với key thống nhất là 'token'
    localStorage.setItem('token', token); 
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });
  }
}));