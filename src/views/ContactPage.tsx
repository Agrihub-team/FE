import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const ContactPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 w-full pt-4 pb-12">
        {/* Breadcrumb khớp 100% với Tin tức */}
        <nav className="text-gray-500 text-sm mb-6">
          <Link to="/" className="hover:text-green-700">Trang chủ</Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-orange-500">Liên hệ</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Cột trái: Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 uppercase mb-2">NƠI GIẢI ĐÁP TOÀN BỘ MỌI THẮC MẮC CỦA BẠN?</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Agri-Hub: Hệ thống phân phối thức ăn chăn nuôi, thuốc thú y và thu mua nông sản uy tín hàng đầu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-6">
              <div className="flex gap-3">
                <span className="text-green-700 font-bold italic">📍</span>
                <div>
                  <p className="font-bold text-sm">Địa chỉ</p>
                  <p className="text-sm text-gray-600">Quận 11, TP.HCM</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-green-700 font-bold italic">⏰</span>
                <div>
                  <p className="font-bold text-sm">Thời gian làm việc</p>
                  <p className="text-sm text-gray-600">8h - 22h từ thứ 2 đến CN</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-green-700 font-bold italic">📞</span>
                <div>
                  <p className="font-bold text-sm">HOTLINE</p>
                  <p className="text-sm text-green-700 font-bold">1900 6750</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-green-700 font-bold italic">✉️</span>
                <div>
                  <p className="font-bold text-sm">Email</p>
                  <p className="text-sm text-gray-600">support@agrihub.vn</p>
                </div>
              </div>
            </div>

            {/* Form liên hệ */}
            <div className="space-y-4">
              <h3 className="font-bold text-[16px]">Liên hệ với chúng tôi</h3>
              <p className="text-gray-500 text-[13px] leading-relaxed">
                Nếu bạn có thắc mắc gì, có thể gửi yêu cầu cho chúng tôi, và chúng tôi sẽ liên lạc lại với bạn sớm nhất có thể .
              </p>
              
              <form className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Họ và tên" 
                  className="w-full border border-gray-300 rounded-lg p-3 text-[14px] outline-none focus:border-green-600 placeholder-gray-400" 
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full border border-gray-300 rounded-lg p-3 text-[14px] outline-none focus:border-green-600 placeholder-gray-400" 
                />
                <input 
                  type="text" 
                  placeholder="Điện thoại" 
                  className="w-full border border-gray-300 rounded-lg p-3 text-[14px] outline-none focus:border-green-600 placeholder-gray-400" 
                />
                <textarea 
                  placeholder="Nội dung" 
                  rows={5} 
                  className="w-full border border-gray-300 rounded-lg p-3 text-[14px] outline-none focus:border-green-600 placeholder-gray-400 resize-none"
                ></textarea>
                
                <button className="bg-[#008848] text-white px-8 py-2.5 rounded-full text-[14px] font-medium hover:bg-black transition-colors">
                  Gửi thông tin
                </button>
              </form>
            </div>
         
          </div>

          {/* Cột phải: Map */}
          <div className="h-[500px] border border-gray-200">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.6697269371!2d106.66488007465352!3d10.759917089387844!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752ee5240aa595%3A0x446979509df6382!2zUXXhuq1uIDExLCBUaMOgbmggcGjhu5EgSOG7kyBDaMOtIE1pbmgsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1713600000000!5m2!1svi!2s" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy"
              title="Bản đồ"
            ></iframe>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};