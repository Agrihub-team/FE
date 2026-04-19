// src/views/PaymentError.tsx
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const PaymentError = () => {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('code');
  const msg = searchParams.get('msg');

  // Dịch mã lỗi VNPay sang tiếng Việt
  let errorMessage = "Giao dịch không thành công. Vui lòng thử lại!";
  if (errorCode === '24') errorMessage = "Bạn đã hủy giao dịch thanh toán.";
  if (errorCode === '11') errorMessage = "Chưa thanh toán (Pending).";
  if (errorCode === '51') errorMessage = "Tài khoản của bạn không đủ số dư.";
  if (msg === 'Chu_ky_khong_hop_le') errorMessage = "Lỗi bảo mật: Chữ ký thanh toán không hợp lệ!";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-lg max-w-md w-full text-center border-t-[8px] border-red-500">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={56} className="text-red-500" />
          </div>
          
          <h1 className="text-2xl font-black text-slate-800 uppercase mb-4">THANH TOÁN THẤT BẠI</h1>
          <p className="text-slate-600 font-medium mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {errorMessage}
          </p>

          <div className="space-y-3">
            <Link to="/checkout" className="w-full flex items-center justify-center gap-2 bg-[#047857] hover:bg-[#035b42] text-white py-4 rounded-xl font-bold uppercase transition-all shadow-md">
              Thử thanh toán lại
            </Link>
            <Link to="/" className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 py-4 rounded-xl font-bold uppercase transition-all">
              <ArrowLeft size={18} /> Về trang chủ
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};