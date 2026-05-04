// @ts-nocheck
import { create } from 'zustand';
import { apiClient } from '../utils/api';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSync = (items: CartItem[]) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    apiClient.post('/cart/sync', { items }).catch((e: any) =>
      console.error('Lỗi đồng bộ giỏ hàng:', e.message)
    );
  }, 500);
};

interface CartItem {
  _id: string;
  product: string; 
  name: string;
  image?: string;
  p25: number;
  p50: number;
  pKg: number;
  q25: number;
  q50: number;
  qKg: number;
  selected?: boolean;
  itemVoucher?: Voucher | null;
}

interface Voucher {
  _id: string;
  code: string;
  discount: number; 
  minAmount: number; 
}

interface CartStore {
  items: CartItem[];
  appliedVoucher: Voucher | null;
  loadCart: () => Promise<void>; 
  addItem: (product: any) => boolean;
  updateDetailQuantity: (id: string, type: 'q25' | 'q50' | 'qKg', value: number) => Promise<void>;
  setVoucher: (voucher: Voucher | null) => void;
  removeItem: (id: string) => Promise<void>;
  getSubTotal: () => number;
  getFinalTotal: () => number;
  clearCart: () => void;
  toggleSelect: (id: string) => Promise<void>;
  applyVoucherToItem: (id: string, voucher: Voucher) => Promise<void>;
  getSelectedTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  appliedVoucher: null,

  loadCart: async () => {
    try {
      const data = await apiClient.get('/cart');
      if (data) {
        set({ items: data.items || [] });
      }
    } catch (error) {
      console.error("Lỗi load giỏ hàng:", error.message);
    }
  },

  addItem: (product) => {
    try {
      const { items } = get();
      const originalProductId = (product._id || product.originalId || '').toString().split('-')[0];
      if (!originalProductId) return false;

      const newItem = {
        ...product,
        _id: `${originalProductId}-${Date.now()}`,
        product: originalProductId,
        q25: Number(product.q25) || 1,
        q50: Number(product.q50) || 0,
        qKg: Number(product.qKg) || 0,
        selected: true,
        itemVoucher: product.itemVoucher ?? null,
      };

      const updated = [newItem, ...items];
      set({ items: updated });

      // Sync lên server nếu đã đăng nhập, không thì chỉ lưu local
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.post('/cart/sync', { items: updated }).catch((error: any) => {
          console.error("Lỗi đồng bộ giỏ hàng:", error.message);
        });
      }

      return true;
    } catch (err: any) {
      console.error('addItem error:', err);
      return false;
    }
  },

  updateDetailQuantity: (id, type, value) => {
    const updatedItems = get().items.map((item) => {
      if (item._id !== id) return item;
      const newItem = { ...item, [type]: Math.max(0, Number(value) || 0) };
      if (newItem.q25 + newItem.q50 + newItem.qKg === 0) newItem[type] = 1;
      return newItem;
    });
    set({ items: updatedItems });
    debouncedSync(updatedItems);
  },

  setVoucher: (voucher) => set({ appliedVoucher: voucher }),

  removeItem: (id) => {
    const updated = get().items.filter((i) => i._id !== id);
    set({ items: updated });
    debouncedSync(updated);
  },

  getSubTotal: () => {
    return get().items.reduce((sum, item) => {
      return (
        sum +
        Number(item.q25) * Number(item.p25) +
        Number(item.q50) * Number(item.p50) +
        Number(item.qKg) * Number(item.pKg)
      );
    }, 0);
  },

  getFinalTotal: () => {
    const subTotal = get().getSelectedTotal(); 
    const discount = get().appliedVoucher?.discount ? Number(get().appliedVoucher.discount) : 0;
    const minReq = get().appliedVoucher?.minAmount || 0;
    const actualDiscount = subTotal >= minReq ? discount : 0;
    return Math.max(0, subTotal - actualDiscount);
  },

  clearCart: async () => {
    try {
      await apiClient.post('/cart/sync', { items: [] });
      set({ items: [], appliedVoucher: null });
    } catch (error) { console.error(error.message); }
  },

  toggleSelect: (id) => {
    const updated = get().items.map((item) =>
      item._id === id ? { ...item, selected: !item.selected } : item
    );
    set({ items: updated });
    debouncedSync(updated);
  },

  applyVoucherToItem: (id, voucher) => {
    const updated = get().items.map((item) =>
      item._id === id
        ? { ...item, itemVoucher: item.itemVoucher?._id === voucher._id ? null : voucher }
        : item
    );
    set({ items: updated });
    debouncedSync(updated);
  },

  getSelectedTotal: () => {
    return get().items.reduce((sum, item) => {
      if (!item.selected) return sum;
      const itemTotal = (Number(item.q25) * Number(item.p25)) + (Number(item.q50) * Number(item.p50)) + (Number(item.qKg) * Number(item.pKg));
      const discount = item.itemVoucher ? Number(item.itemVoucher.discount) : 0;
      return sum + Math.max(0, itemTotal - discount);
    }, 0);
  },
}));