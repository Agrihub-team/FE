import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer"; 
import { authService } from "../controllers/authService";

export const Register = () => {
  const navigate = useNavigate();

  // State bao gồm ô confirmPassword
  const [f, setF] = useState({ 
    firstName: "", 
    lastName: "", 
    phone: "", 
    email: "", 
    password: "",
  confirmPassword: ""
 });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // STATE cho bước xác nhận OTP
  const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Nhập OTP
  const [otp, setOtp] = useState("");

  // BƯỚC 1: XÁC NHẬN THÔNG TIN VÀ YÊU CẦU GỬI OTP
  const handleRequestRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    // 1. Kiểm tra rỗng
    if (!f.firstName || !f.lastName || !f.email || !f.phone || !f.password || !f.confirmPassword) {
      return setErrorMsg("Vui lòng điền đầy đủ thông tin!");
    }
    
    // 2. Validate Regex SĐT Việt Nam (bắt đầu bằng số 0, đủ 10 số)
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(f.phone)) {
      return setErrorMsg("Số điện thoại không hợp lệ! (Ví dụ: 0987654321)");
    }

 // 3. Validate Mật khẩu
 if (f.password.length < 6) return setErrorMsg("Mật khẩu phải từ 6 ký tự trở lên!");
 if (f.password !== f.confirmPassword) return setErrorMsg("Mật khẩu xác nhận không khớp!");

    try { 
      setLoading(true);
      // Gọi API gửi OTP đăng ký
      await authService.sendOtp({ email: f.email, type: 'register' });
      setSuccessMsg(`Mã OTP đã được gửi đến email: ${f.email}`);
      setStep(2); // Chuyển sang bước nhập OTP
    } catch (e: any) { 
      setErrorMsg(e.message || "Lỗi. Email này có thể đã được sử dụng!"); 
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: XÁC NHẬN OTP VÀ ĐĂNG KÝ VÀO DB
  const handleVerifyOTPAndRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setErrorMsg("");

    try {
      setLoading(true);
      // Gộp Họ và Tên thành 'fullname' gửi xuống DB
      const payload = {
        fullname: `${f.firstName} ${f.lastName}`.trim(),
        email: f.email,
        password: f.password,
        phone: f.phone,
        otp: otp
      };
      
      await authService.register(payload); 
      alert("Đăng ký tài khoản thành công! Đang chuyển hướng đến trang đăng nhập..."); 
      navigate("/login"); 
    } catch (e: any) {
      setErrorMsg(e.message || "Mã OTP không chính xác hoặc đã hết hạn!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-[#333333]">
      <Header />
      
      {/* 1. BREADCRUMB */}
      <div className="bg-white py-3 px-4 md:px-10">
        <div className="max-w-[1440px] mx-auto flex items-center gap-2 text-[14px]">
          <Link to="/" className="text-gray-600 hover:text-[#047857]">Trang chủ</Link>
          <span className="text-gray-400 text-xs">›</span>
          <span className="text-[#fbc02d]">Đăng ký tài khoản</span>
        </div>
      </div>

      <main className="min-h-[50vh] bg-white py-10 px-4 flex flex-col items-center">
        {/* 2. FORM ĐĂNG KÝ */}
        <div className="w-full max-w-[500px] mb-20">
          
          {/* Tabs */}
          <div className="flex justify-center border-b border-gray-200 mb-8">
            <Link to="/login" className="w-1/2 text-center py-3 text-gray-500 hover:text-[#047857] text-[15px] uppercase transition-colors">
              ĐĂNG NHẬP
            </Link>
            <div className="w-1/2 text-center py-3 border-b-2 border-[#047857] text-[#047857] text-[15px] font-medium uppercase">
              ĐĂNG KÝ
            </div>
          </div>

          <h1 className="text-2xl text-center font-normal mb-6 uppercase">ĐĂNG KÝ</h1>
          
          {errorMsg && <p className="text-red-500 text-center mb-4 text-sm font-bold bg-red-50 py-2 rounded border border-red-200">{errorMsg}</p>}
          {successMsg && <p className="text-[#047857] text-center mb-4 text-sm font-bold bg-green-50 py-2 rounded border border-green-200">{successMsg}</p>}

          {/* HIỂN THỊ THEO BƯỚC */}
          {step === 1 ? (
            <form onSubmit={handleRequestRegister} className="space-y-4">
              {/* Giữ nguyên cấu trúc dọc không gộp hàng */}
              <input
                type="text"
                placeholder="Họ"
                className="w-full border border-gray-300 px-4 py-2.5 rounded text-[14px] outline-none focus:border-[#047857] transition-colors"
                value={f.firstName}
                onChange={e => setF({...f, firstName: e.target.value})}
                required
              />
              
              <input
                type="text"
                placeholder="Tên"
                className="w-full border border-gray-300 px-4 py-2.5 rounded text-[14px] outline-none focus:border-[#047857] transition-colors"
                value={f.lastName}
                onChange={e => setF({...f, lastName: e.target.value})}
                required
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-300 px-4 py-2.5 rounded text-[14px] outline-none focus:border-[#047857] transition-colors"
                value={f.email}
                onChange={e => setF({...f, email: e.target.value})}
                required
              />

              <input
                type="tel"
                placeholder="Số điện thoại"
                className="w-full border border-gray-300 px-4 py-2.5 rounded text-[14px] outline-none focus:border-[#047857] transition-colors"
                value={f.phone}
                onChange={e => setF({...f, phone: e.target.value})}
                required
              />
              
              <input
                type="password"
                placeholder="Mật khẩu"
                className="w-full border border-gray-300 px-4 py-2.5 rounded text-[14px] outline-none focus:border-[#047857] transition-colors"
                value={f.password}
                onChange={e => setF({...f, password: e.target.value})}
                required
              />

              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                className="w-full border border-gray-300 px-4 py-2.5 rounded text-[14px] outline-none focus:border-[#047857] transition-colors"
                value={f.confirmPassword}
                onChange={e => setF({...f, confirmPassword: e.target.value})}
                required
              />
              
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

          {/* Social Login */}
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