
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, { message: "Email không được để trống" })
    .email({ message: "Email không đúng định dạng (VD: example@gmail.com)" }),
  password: z.string()
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
});


export type LoginFormInputs = z.infer<typeof loginSchema>;