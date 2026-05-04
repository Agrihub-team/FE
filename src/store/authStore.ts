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
    localStorage.removeItem('agrihub-cart'); // xóa cart persist ngay lập tức
    set({ user: null });
    // Reset Zustand cart state (không await để không chặn logout)
    import('./cartStore').then(({ useCartStore }) => {
      useCartStore.getState().clearCart();
    });
  }
}));