import { create } from 'zustand';
import { User } from '../models/user';

interface AuthState {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,

  login: (user: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null });

    // Xóa giỏ hàng khi logout để tránh lộ dữ liệu sang user khác
    import('./cartStore').then(({ useCartStore }) => {
      useCartStore.getState().clearCart();
    });
  }
}));