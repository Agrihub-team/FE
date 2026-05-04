// @ts-nocheck
import { create } from "zustand";
import { apiClient } from "../utils/api";

// Hàm debounce để tránh gọi API quá nhiều lần khi nhấn tăng/giảm số lượng liên tục
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const debouncedSync = (items: CartItem[]) => {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiClient
        .post("/cart/sync", { items })
        .catch((e: any) => console.error("Lỗi đồng bộ giỏ hàng:", e.message));
    }
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
  updateDetailQuantity: (
    id: string,
    type: "q25" | "q50" | "qKg",
    value: number,
  ) => Promise<void>;
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

  /**
   * Tải giỏ hàng từ Server và thực hiện gộp với giỏ hàng hiện tại (nếu có)
   */
  loadCart: async () => {
    const token = localStorage.getItem("token");

    // Nếu chưa đăng nhập, tuyệt đối không gọi API để tránh bị đá về trang Login
    if (!token) return;

    try {
      const localItems = get().items; // Lấy hàng khách vừa thêm lúc chưa đăng nhập
      const data = await apiClient.get("/cart");

      if (data && data.items) {
        const serverItems = data.items;

        if (localItems.length > 0) {
          // LOGIC GỘP HÀNG: Giữ hàng vừa thêm, bổ sung hàng cũ từ Server[cite: 1]
          const mergedItems = [...localItems];

          serverItems.forEach((sItem) => {
            // Kiểm tra trùng lặp dựa trên ID sản phẩm gốc[cite: 1]
            const sProductId = sItem.product?._id || sItem.product;
            const exists = mergedItems.find(
              (lItem) => (lItem.product || lItem.originalId) === sProductId,
            );

            if (!exists) mergedItems.push(sItem);
          });

          // Cập nhật State và đồng bộ ngay lên Server[cite: 1]
          set({ items: mergedItems });
          await apiClient.post("/cart/sync", { items: mergedItems });
        } else {
          // Nếu giỏ hàng local trống, lấy toàn bộ từ Server[cite: 1]
          set({ items: serverItems });
        }
      }
    } catch (error) {
      console.error("Lỗi tải giỏ hàng:", error.message);
    }
  },

  addItem: (product) => {
    try {
      const { items } = get();
      const originalProductId = (product._id || product.originalId || "")
        .toString()
        .split("-")[0];
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

      // Chỉ gọi API đồng bộ nếu đã có token[cite: 1]
      const token = localStorage.getItem("token");
      if (token) {
        debouncedSync(updated);
      }

      return true;
    } catch (err: any) {
      console.error("Lỗi thêm vào giỏ:", err);
      return false;
    }
  },

  updateDetailQuantity: (id, type, value) => {
    const updatedItems = get().items.map((item) => {
      if (item._id !== id) return item;
      const newItem = { ...item, [type]: Math.max(0, Number(value) || 0) };
      // Đảm bảo không để toàn bộ số lượng về 0[cite: 1]
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
    const discount = get().appliedVoucher?.discount
      ? Number(get().appliedVoucher.discount)
      : 0;
    const minReq = get().appliedVoucher?.minAmount || 0;
    const actualDiscount = subTotal >= minReq ? discount : 0;
    return Math.max(0, subTotal - actualDiscount);
  },

  clearCart: async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await apiClient.post("/cart/sync", { items: [] });
      }
      set({ items: [], appliedVoucher: null });
    } catch (error) {
      console.error(error.message);
    }
  },

  toggleSelect: (id) => {
    const updated = get().items.map((item) =>
      item._id === id ? { ...item, selected: !item.selected } : item,
    );
    set({ items: updated });
    debouncedSync(updated);
  },

  applyVoucherToItem: (id, voucher) => {
    const updated = get().items.map((item) =>
      item._id === id
        ? {
            ...item,
            itemVoucher: item.itemVoucher?._id === voucher._id ? null : voucher,
          }
        : item,
    );
    set({ items: updated });
    debouncedSync(updated);
  },

  getSelectedTotal: () => {
    return get().items.reduce((sum, item) => {
      if (!item.selected) return sum;
      const itemTotal =
        Number(item.q25) * Number(item.p25) +
        Number(item.q50) * Number(item.p50) +
        Number(item.qKg) * Number(item.pKg);
      const discount = item.itemVoucher ? Number(item.itemVoucher.discount) : 0;
      return sum + Math.max(0, itemTotal - discount);
    }, 0);
  },
}));
