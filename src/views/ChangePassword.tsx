// @ts-nocheck
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { apiClient } from "../utils/api";

export const ChangePassword = () => {
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const rawUser = JSON.parse(localStorage.getItem("user") || "{}");
  const profileData = rawUser.user || rawUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const errors: Record<string, string> = {};
    if (!formData.oldPassword) errors.oldPassword = "Vui lòng nhập mật khẩu cũ";
    if (!formData.newPassword) errors.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (formData.newPassword.length < 6) errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    if (!formData.confirmPassword) errors.confirmPassword = "Vui lòng nhập lại mật khẩu mới";
    else if (formData.newPassword !== formData.confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận không khớp";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      await apiClient.post("/auth/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });
      setSuccess(true);
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      setFieldErrors({
        oldPassword: error.response?.data?.message || "Mật khẩu cũ không chính xác!",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full border rounded px-4 py-3 text-sm outline-none transition-all pr-12 ${
      err ? "border-red-400 focus:border-red-500 bg-red-50" : "border-slate-200 focus:border-[#047857]"
    }`;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800">
      <Header />

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 md:px-8 py-6">
        <div className="pb-4 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-[#047857]">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/profile" className="hover:text-[#047857]">Tài khoản</Link>
          <ChevronRight size={14} />
          <span className="text-slate-800">Đổi mật khẩu</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 lg:sticky top-6">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-lg font-bold border border-slate-300 shrink-0">
                {profileData.fullname?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm text-slate-800 truncate">{profileData.fullname || "Người dùng"}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <User size={12} /> Thành viên
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                to="/profile"
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium text-slate-700 hover:text-[#047857] transition-colors"
              >
                <User size={18} className="text-blue-500" /> Hồ sơ cá nhân
              </Link>
              <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-bold text-[#047857] bg-emerald-50 shadow-sm border-l-4 border-[#047857]">
                <Lock size={18} /> Đổi mật khẩu
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white shadow-sm p-6 md:p-8 min-h-[500px] rounded-sm border border-slate-100">
              <div className="border-b border-slate-100 pb-4 mb-8">
                <h2 className="text-lg font-medium text-slate-800">Đổi Mật Khẩu</h2>
                <p className="text-sm text-slate-500 mt-1">Vui lòng không chia sẻ mật khẩu để bảo vệ tài khoản của bạn</p>
              </div>

              {success && (
                <div className="mb-6 max-w-xl ml-0 md:ml-40 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <span>Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="max-w-3xl space-y-6" noValidate>
                {/* Mật khẩu cũ */}
                <div className="flex flex-col md:flex-row md:items-start">
                  <label className="md:w-60 text-sm text-slate-500 md:text-right pr-9 mb-2 md:mb-0 md:pt-3">
                    Mật khẩu cũ
                  </label>
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type={showOldPass ? "text" : "password"}
                        value={formData.oldPassword}
                        onChange={e => setFormData({ ...formData, oldPassword: e.target.value })}
                        className={inputCls(fieldErrors.oldPassword)}
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button type="button" onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.oldPassword && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.oldPassword}</p>
                    )}
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div className="flex flex-col md:flex-row md:items-start">
                  <label className="md:w-60 text-sm text-slate-500 md:text-right pr-9 mb-2 md:mb-0 md:pt-3">
                    Mật khẩu mới
                  </label>
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                        className={inputCls(fieldErrors.newPassword)}
                        placeholder="Ít nhất 6 ký tự"
                      />
                      <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>
                    )}
                  </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div className="flex flex-col md:flex-row md:items-start">
                  <label className="md:w-60 text-sm text-slate-500 md:text-right pr-9 mb-2 md:mb-0 md:pt-3">
                    Xác nhận
                  </label>
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={inputCls(fieldErrors.confirmPassword)}
                        placeholder="Nhập lại mật khẩu mới"
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center pt-2">
                  <div className="md:w-60"></div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-[#047857] text-white px-12 py-3 text-sm font-bold rounded shadow-md hover:bg-[#035b42] transition-all ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
