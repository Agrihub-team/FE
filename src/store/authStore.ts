import { create } from 'zustand';
import { User } from '../models/user';
import { useCartStore } from './cartStore';

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
    // 1. Sync cart lên server TRƯỚC khi xóa token (token đọc ngay lúc gọi hàm)
    useCartStore.getState().syncNow();

    // 2. Xóa auth local
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 3. Xóa cart local (giữ server nguyên để login lại còn hàng)
    localStorage.removeItem('agrihub-cart');
    useCartStore.setState({ items: [], appliedVoucher: null });

    set({ user: null });
  }
}));