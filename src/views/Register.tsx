import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { authService } from "../controllers/authService";
import { toast } from "sonner";

export const Register = () => {
  const navigate = useNavigate();

  const [f, setF] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!f.firstName.trim()) errors.firstName = "Vui lòng nhập họ";
    if (!f.lastName.trim()) errors.lastName = "Vui lòng nhập tên";
    if (!f.email.trim()) errors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errors.email = "Email không đúng định dạng";
    if (!f.phone.trim()) errors.phone = "Vui lòng nhập số điện thoại";
    else if (!/^(0[35789])[0-9]{8}$/.test(f.phone)) errors.phone = "Số điện thoại không hợp lệ (VD: 0987654321)";
    if (!f.password) errors.password = "Vui lòng nhập mật khẩu";
    else if (f.password.length < 6) errors.password = "Mật khẩu phải từ 6 ký tự trở lên";
    if (!f.confirmPassword) errors.confirmPassword = "Vui lòng nhập lại mật khẩu";
    else if (f.password !== f.confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    return errors;
  };

  const handleRequestRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSuccessMsg("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true);
      await authService.sendOtp({ email: f.email, type: 'register' });
      setSuccessMsg(`Mã OTP đã được gửi đến email: ${f.email}`);
      setStep(2);
    } catch (e: any) {
      setFieldErrors({ email: e.message || "Email này có thể đã được sử dụng!" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();

    try {
      setLoading(true);
      const payload = {
        fullname: `${f.firstName} ${f.lastName}`.trim(),
        email: f.email,
        password: f.password,
        phone: f.phone,
        otp: otp
      };

      await authService.register(payload);
      toast.success("Đăng ký thành công! Đang chuyển hướng...");
      navigate("/login");
    } catch (e: any) {
      toast.error(e.message || "Mã OTP không chính xác hoặc đã hết hạn!");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (err?: string) =>
    `w-full border px-4 py-2.5 rounded text-[14px] outline-none transition-colors ${
      err ? "border-red-400 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-[#047857]"
    }`;

  return (
    <div className="font-sans text-[#333333]">
      <Header />

      <div className="bg-white py-3 px-4 md:px-10">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-[14px]">
          <Link to="/" className="text-gray-600 hover:text-[#047857]">Trang chủ</Link>
          <span className="text-gray-400 text-xs">›</span>
          <span className="text-[#fbc02d]">Đăng ký tài khoản</span>
        </div>
      </div>

      <main className="min-h-[50vh] bg-white py-10 px-4 flex flex-col items-center">
        <div className="w-full max-w-[500px] mb-20">

          <div className="flex justify-center border-b border-gray-200 mb-8">
            <Link to="/login" className="w-1/2 text-center py-3 text-gray-500 hover:text-[#047857] text-[15px] uppercase transition-colors">
              ĐĂNG NHẬP
            </Link>
            <div className="w-1/2 text-center py-3 border-b-2 border-[#047857] text-[#047857] text-[15px] font-medium uppercase">
              ĐĂNG KÝ
            </div>
          </div>

          <h1 className="text-2xl text-center font-normal mb-6 uppercase">ĐĂNG KÝ</h1>

          {successMsg && (
            <p className="text-[#047857] text-center mb-4 text-sm font-bold bg-green-50 py-2 rounded border border-green-200">
              {successMsg}
            </p>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestRegister} className="space-y-4" noValidate>
              <div>
                <input
                  type="text"
                  placeholder="Họ"
                  className={inputCls(fieldErrors.firstName)}
                  value={f.firstName}
                  onChange={e => setF({...f, firstName: e.target.value})}
                />
                {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Tên"
                  className={inputCls(fieldErrors.lastName)}
                  value={f.lastName}
                  onChange={e => setF({...f, lastName: e.target.value})}
                />
                {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  className={inputCls(fieldErrors.email)}
                  value={f.email}
                  onChange={e => setF({...f, email: e.target.value})}
                />
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  className={inputCls(fieldErrors.phone)}
                  value={f.phone}
                  onChange={e => setF({...f, phone: e.target.value})}
                />
                {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  className={inputCls(fieldErrors.password)}
                  value={f.password}
                  onChange={e => setF({...f, password: e.target.value})}
                />
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  className={inputCls(fieldErrors.confirmPassword)}
                  value={f.confirmPassword}
                  onChange={e => setF({...f, confirmPassword: e.target.value})}
                />
                {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#047857] hover:bg-[#036046] text-white py-2.5 rounded text-[15px] transition-colors mt-2 disabled:bg-gray-400"
              >
                {loading ? 'Đang gửi mã...' : 'Đăng ký'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTPAndRegister} className="space-y-4 bg-emerald-50 p-6 rounded-lg border border-emerald-200">
              <p className="text-sm text-center text-gray-700">Vui lòng kiểm tra hộp thư đến (hoặc thư rác) để lấy mã xác nhận.</p>
              <input
                type="text"
                placeholder="Nhập mã OTP 6 số"
                className="w-full border border-gray-300 px-4 py-3 rounded text-xl text-center tracking-[0.5em] font-bold outline-none focus:border-[#047857]"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
              />
              <button type="submit" disabled={loading} className="w-full bg-[#047857] hover:bg-[#036046] text-white py-2.5 rounded text-[15px] font-bold transition-colors mt-2 disabled:bg-gray-400">
                {loading ? 'Đang xác thực...' : 'Xác nhận & Đăng ký'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:text-[#047857] mt-2 underline">
                Quay lại chỉnh sửa thông tin
              </button>
            </form>
          )}

          <div className="text-center mt-6 text-[14px]">
            <p className="text-gray-600 mb-4">Hoặc đăng nhập bằng</p>

            <div className="flex justify-center gap-2">
              <button type="button" className="bg-[#3b5998] hover:bg-[#2d4373] text-white py-2 w-[120px] rounded flex items-center justify-center gap-2 text-[13px] transition-colors">
                <span className="font-bold text-lg font-serif leading-none">f</span> Facebook
              </button>
              <button type="button" className="bg-[#dd4b39] hover:bg-[#c23321] text-white py-2 w-[120px] rounded flex items-center justify-center gap-2 text-[13px] transition-colors">
                <span className="font-bold text-lg font-sans leading-none">G+</span> Google
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
