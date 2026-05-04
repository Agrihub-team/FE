import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { authService } from "../controllers/authService";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập Email")
    .email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải từ 6 ký tự"),
});

const requestOtpSchema = z.object({
  resetEmail: z
    .string()
    .min(1, "Vui lòng nhập Email")
    .email("Email không hợp lệ"),
});

const resetPasswordSchema = z.object({
  otp: z.string().length(6, "Mã OTP phải đúng 6 số"),
  newPassword: z.string().min(6, "Mật khẩu mới phải từ 6 ký tự"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;
type RequestOtpInputs = z.infer<typeof requestOtpSchema>;
type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

export const Login = () => {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [savedResetEmail, setSavedResetEmail] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register: regLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrs, isSubmitting: isLoginLoading },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const {
    register: regReq,
    handleSubmit: handleReqSubmit,
    formState: { errors: reqErrs, isSubmitting: isReqLoading },
    reset: resetReqForm,
  } = useForm<RequestOtpInputs>({
    resolver: zodResolver(requestOtpSchema),
    mode: "onChange",
  });

  const {
    register: regReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrs, isSubmitting: isResetLoading },
    reset: resetPasswordForm,
  } = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const saveLogin = async (res: any) => {
    const responseData = res?.data || res;
    const userData = responseData?.user || responseData?.data?.user;
    const tokenData = responseData?.token || responseData?.data?.token;

    if (!userData || !tokenData) {
      throw new Error("Dữ liệu tài khoản bị thiếu!");
    }

    // Lưu token trước để apiClient có thể dùng ngay
    localStorage.setItem("token", tokenData);
    localStorage.setItem("user", JSON.stringify(userData));

    // Merge giỏ hàng local (chưa đăng nhập) lên server
    const localItems = useCartStore.getState().items;
    if (localItems.length > 0) {
      await apiClient.post("/cart/sync", { items: localItems }).catch(() => {});
    }

    loginAction(userData, tokenData);
    toast.success("Đăng nhập thành công!");
    navigate(userData.role?.toUpperCase() === "ADMIN" ? "/admin" : "/");
  };

  const onLogin = async (data: LoginFormInputs) => {
    try {
      const res: any = await authService.login(data);
      saveLogin(res);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Sai tài khoản hoặc mật khẩu!"
      );
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsGoogleLoading(true);

      if (!credentialResponse.credential) {
        toast.error("Không lấy được thông tin Google!");
        return;
      }

      const res: any = await authService.googleLogin({
        credential: credentialResponse.credential,
      });

      saveLogin(res);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Đăng nhập Google thất bại!"
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onRequestOtp = async (data: RequestOtpInputs) => {
    try {
      await authService.sendOtp({
        email: data.resetEmail,
        type: "forgot",
      });

      setSavedResetEmail(data.resetEmail);
      setIsOtpSent(true);
      toast.success(`Mã xác nhận đã gửi đến ${data.resetEmail}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Lỗi gửi mã xác nhận!"
      );
    }
  };

  const onResetPassword = async (data: ResetPasswordInputs) => {
    try {
      await authService.resetPassword({
        email: savedResetEmail,
        otp: data.otp,
        newPassword: data.newPassword,
      });

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");

      setIsOtpSent(false);
      setShowForgot(false);
      resetReqForm();
      resetPasswordForm();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Mã OTP sai hoặc hết hạn!"
      );
    }
  };

  return (
    <div className="font-sans text-[#333333] bg-gray-50 min-h-screen flex flex-col">
      <Header />

      <div className="bg-white py-3 px-4 md:px-10 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-[14px]">
          <Link to="/" className="text-gray-600 hover:text-[#047857]">
            Trang chủ
          </Link>
          <span className="text-gray-400 text-xs">›</span>
          <span className="text-[#fbc02d]">Đăng nhập tài khoản</span>
        </div>
      </div>

      <main className="flex-grow bg-white py-10 px-4 flex flex-col items-center">
        <div className="w-full max-w-[500px] mb-10">
          <div className="flex justify-center border-b border-gray-200 mb-8">
            <div className="w-1/2 text-center py-3 border-b-2 border-[#047857] text-[#047857] text-[15px] font-medium uppercase cursor-pointer">
              ĐĂNG NHẬP
            </div>

            <Link
              to="/register"
              className="w-1/2 text-center py-3 text-gray-500 hover:text-[#047857] text-[15px] uppercase transition-colors"
            >
              ĐĂNG KÝ
            </Link>
          </div>

          <h1 className="text-2xl text-center font-normal mb-6 uppercase">
            ĐĂNG NHẬP
          </h1>

          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                {...regLogin("email")}
                className={`w-full border px-4 py-2.5 rounded text-[14px] outline-none transition-colors ${loginErrs.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-[#047857]"
                  }`}
              />

              {loginErrs.email && (
                <p className="text-red-500 text-xs mt-1">
                  {loginErrs.email.message}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                {...regLogin("password")}
                className={`w-full border px-4 py-2.5 rounded text-[14px] outline-none transition-colors ${loginErrs.password
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-[#047857]"
                  }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[18px] text-gray-400 hover:text-[#047857] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              {loginErrs.password && (
                <p className="text-red-500 text-xs mt-1">
                  {loginErrs.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoginLoading}
              className="w-full flex justify-center items-center gap-2 bg-[#047857] hover:bg-[#036046] text-white py-2.5 rounded text-[15px] transition-colors mt-2 disabled:bg-gray-400"
            >
              {isLoginLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoginLoading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <div className="text-center mt-5 mb-2">
            <button
              type="button"
              onClick={() => {
                setShowForgot(!showForgot);
                setIsOtpSent(false);
              }}
              className="text-gray-600 hover:text-[#047857] text-[14px] transition-colors"
            >
              Quên mật khẩu
            </button>
          </div>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${showForgot ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
          >
            {!isOtpSent ? (
              <form
                onSubmit={handleReqSubmit(onRequestOtp)}
                className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <p className="text-sm text-gray-600 text-center mb-2">
                  Nhập email để nhận mã xác nhận
                </p>

                <div>
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    {...regReq("resetEmail")}
                    className={`w-full border px-4 py-2.5 rounded text-[14px] outline-none transition-colors bg-white ${reqErrs.resetEmail
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#047857]"
                      }`}
                  />

                  {reqErrs.resetEmail && (
                    <p className="text-red-500 text-xs mt-1">
                      {reqErrs.resetEmail.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isReqLoading}
                  className="w-full flex justify-center items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded text-[15px] transition-colors font-medium disabled:bg-gray-400"
                >
                  {isReqLoading && <Loader2 className="animate-spin" size={18} />}
                  {isReqLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleResetSubmit(onResetPassword)}
                className="space-y-4 bg-emerald-50 p-4 rounded-lg border border-emerald-200"
              >
                <p className="text-sm text-[#047857] text-center mb-2">
                  Mã đã được gửi đến: <b>{savedResetEmail}</b>
                </p>

                <div>
                  <input
                    type="text"
                    placeholder="Nhập mã xác nhận (6 số)"
                    maxLength={6}
                    {...regReset("otp")}
                    className={`w-full border px-4 py-2.5 rounded text-[14px] outline-none transition-colors bg-white tracking-widest text-center font-bold ${resetErrs.otp
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#047857]"
                      }`}
                  />

                  {resetErrs.otp && (
                    <p className="text-red-500 text-xs mt-1 text-center">
                      {resetErrs.otp.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    {...regReset("newPassword")}
                    className={`w-full border px-4 py-2.5 rounded text-[14px] outline-none transition-colors bg-white ${resetErrs.newPassword
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#047857]"
                      }`}
                  />

                  {resetErrs.newPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {resetErrs.newPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isResetLoading}
                  className="w-full flex justify-center items-center gap-2 bg-[#047857] hover:bg-[#036046] text-white py-2.5 rounded text-[15px] transition-colors font-medium disabled:bg-gray-400"
                >
                  {isResetLoading && (
                    <Loader2 className="animate-spin" size={18} />
                  )}
                  {isResetLoading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-800 mt-2"
                >
                  Nhập lại email khác
                </button>
              </form>
            )}
          </div>

          <div className="text-center mt-8 text-[14px]">
            <p className="text-gray-600 mb-4">Hoặc đăng nhập bằng</p>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                className="bg-[#3b5998] hover:bg-[#2d4373] text-white py-2 w-[120px] rounded flex items-center justify-center gap-2 text-[13px] transition-colors"
              >
                <span className="font-bold text-lg font-serif leading-none">
                  f
                </span>
                Facebook
              </button>

              <div className="w-[120px] relative">
                {isGoogleLoading ? (
                  <button
                    type="button"
                    disabled
                    className="bg-gray-400 text-white py-2 w-full rounded flex items-center justify-center gap-2 text-[13px]"
                  >
                    <Loader2 className="animate-spin" size={16} />
                    Google
                  </button>
                ) : (
                  <>

                    <div className="absolute inset-0 bg-[#dd4b39] hover:bg-[#c23321] text-white py-2 rounded flex items-center justify-center gap-2 text-[13px] pointer-events-none z-10">
                      <span className="font-bold text-lg font-sans leading-none">G+</span>
                      Google
                    </div>


                    <div className="opacity-0 cursor-pointer relative z-20">
                      <GoogleLogin
                        onSuccess={onGoogleSuccess}
                        onError={() => {
                          toast.error("Bạn đã hủy hoặc đăng nhập Google thất bại!");
                        }}
                        useOneTap={false}
                        auto_select={false}
                        width="120"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};