// @ts-nocheck
import { create } from 'zustand';
import { apiClient } from '../utils/api'; 

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
  addItem: (product: any) => Promise<void>;
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

  addItem: async (product) => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('token');
    if (!token) {
      alert("⚠️ Vui lòng đăng nhập để thêm vào giỏ hàng!");
      window.location.href = "/login";
      return;
    }

    const { items } = get();
    const timestamp = Date.now();
    
    // 2. Xử lý ID sạch để tránh lỗi CastError MongoDB (Lấy 24 ký tự đầu)
    const originalProductId = product._id.toString().split('-')[0];

    const newItem = {
      ...product,
      _id: `${originalProductId}-${timestamp}`, // ID dòng (Unique cho UI)
      product: originalProductId,               // ID sản phẩm chuẩn (Gửi lên BE)
      q25: Number(product.q25) || 1,
      q50: Number(product.q50) || 0,
      qKg: Number(product.qKg) || 0,
      selected: true,
      itemVoucher: null,
    };

    const updated = [...items, newItem];
    
    try {
      // 3. Đồng bộ lên Server bằng apiClient đã có sẵn token trong Header
      const result = await apiClient.post('/cart/sync', { items: updated });
      if (result) {
        set({ items: updated });
      }
    } catch (error) {
      console.error("Lỗi đồng bộ khi thêm hàng:", error.message);
    }
  },

  updateDetailQuantity: async (id, type, value) => {
    const updatedItems = get().items.map((item) => {
      if (item._id !== id) return item;
      const newItem = { ...item, [type]: Math.max(0, Number(value) || 0) };
      if (newItem.q25 + newItem.q50 + newItem.qKg === 0) newItem[type] = 1;
      return newItem;
    });

    try {
      const result = await apiClient.post('/cart/sync', { items: updatedItems });
      if (result) set({ items: updatedItems });
    } catch (error) { console.error(error.message); }
  },

  setVoucher: (voucher) => set({ appliedVoucher: voucher }),

  removeItem: async (id) => {
    const updated = get().items.filter((i) => i._id !== id);
    try {
      const result = await apiClient.post('/cart/sync', { items: updated });
      if (result) set({ items: updated });
    } catch (error) { console.error(error.message); }
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

  toggleSelect: async (id) => {
    const updated = get().items.map((item) =>
      item._id === id ? { ...item, selected: !item.selected } : item
    );
    try {
      const result = await apiClient.post('/cart/sync', { items: updated });
      if (result) set({ items: updated });
    } catch (error) { console.error(error.message); }
  },

  applyVoucherToItem: async (id, voucher) => {
    const updated = get().items.map((item) =>
      item._id === id
        ? {
            ...item,
            itemVoucher: item.itemVoucher?._id === voucher._id ? null : voucher,
          }
        : item
    );
    try {
      const result = await apiClient.post('/cart/sync', { items: updated });
      if (result) set({ items: updated });
    } catch (error) { console.error(error.message); }
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