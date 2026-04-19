// src/schemas/checkoutSchema.ts
import { z } from 'zod';

// Biểu thức chính quy check đúng định dạng số điện thoại Việt Nam
const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

export const checkoutSchema = z.object({
  receiver_name: z.string().min(2, "Tên người nhận phải từ 2 ký tự trở lên"),
  phone: z.string().regex(phoneRegex, "Số điện thoại không hợp lệ (VD: 0912345678)"),
  province: z.string().min(1, "Vui lòng nhập/chọn Tỉnh/Thành phố"),
  district: z.string().min(1, "Vui lòng nhập/chọn Quận/Huyện"),
  ward: z.string().min(1, "Vui lòng nhập/chọn Phường/Xã"),
  street: z.string().min(5, "Địa chỉ cụ thể quá ngắn"),
  paymentMethod: z.enum(['COD', 'VNPAY']),
  orderNotes: z.string().optional()
});

export type CheckoutFormInputs = z.infer<typeof checkoutSchema>;