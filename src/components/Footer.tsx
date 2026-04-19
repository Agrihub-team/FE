// @ts-nocheck
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-white pt-8 w-full border-t border-gray-200 mt-20 font-sans">
      
      {/* 1. ĐỐI TÁC CHÍNH (Nổi màu tĩnh, không hover) */}
      <div className="bg-gray-50 py-8 mb-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-[17px] font-bold mb-6 text-gray-800">
            Đối tác của chúng tôi
          </h2>
          {/* Đã xóa grayscale và hover, giữ nguyên flexbox */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            <span className="font-bold text-3xl italic tracking-tight text-black">Cargill</span>
            <span className="font-bold text-xl text-blue-800">de heus</span>
            <span className="font-bold text-2xl text-orange-600">JAPFA</span>
            <span className="font-bold text-xl text-blue-900">
              bio<span className="text-gray-500 font-normal">pharm</span>
            </span>
            <span className="font-bold text-xl text-green-700 tracking-wider">
              GREENFEED
            </span>
            <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-bold text-sm">
              C.P.
            </div>
          </div>
        </div>
      </div>

      {/* 2. DẢI BĂNG LỢI ÍCH */}
      <div className="max-w-[1200px] mx-auto px-4 mb-10">
        <div className="border border-dashed border-blue-400 bg-blue-50/10 p-4 grid grid-cols-1 md:grid-cols-4">
          <BenefitItem 
            img="🚚" 
            title="Vận chuyển miễn phí" 
            desc="Hóa đơn trên 5 triệu" 
          />
          <BenefitItem 
            img="📦" 
            title="Đổi trả miễn phí" 
            desc="Trong vòng 7 ngày" 
          />
          <BenefitItem 
            img="📝" 
            title="100% Hoàn tiền" 
            desc="Nếu sản phẩm lỗi" 
          />
          <BenefitItem 
            img="📞" 
            title="Hotline: 1900 6750" 
            desc="Hỗ trợ 24/7" 
            noBorder={true}
          />
        </div>
      </div>

      {/* 3. NỘI DUNG FOOTER CHÍNH */}
      <div className="max-w-[1200px] mx-auto px-4 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Cột 1: Thông tin liên hệ */}
        <div className="pr-4">
          <div className="mb-4 flex items-center gap-2">
            <img src="/logo.jpg" alt="Agri-Hub" className="h-14 w-auto object-contain" />
          </div>
          <p className="text-[13px] text-gray-700 mb-2 leading-relaxed">
            Hệ thống phân phối thức ăn chăn nuôi, thuốc thú y và thu mua nông sản uy tín hàng đầu tại Bình Phước.
          </p>
          <p className="text-[13px] font-bold text-[#047857] mb-4">
            Giá siêu tốt - Giao siêu tốc.
          </p>
          <div className="space-y-2 text-[13px] text-gray-700">
            <p><strong className="text-gray-900 font-bold">Địa chỉ:</strong> Đường DT741, TP. Đồng Xoài, Tỉnh Bình Phước</p>
            <p><strong className="text-gray-900 font-bold">Điện thoại:</strong> <span className="text-[#047857] font-bold">1900 6750</span></p>
            <p><strong className="text-gray-900 font-bold">Email:</strong> <span className="text-[#047857]">support@sapo.vn</span></p>
          </div>
        </div>

        {/* Cột 2: Chính sách */}
        <FooterLinkGroup 
          title="CHÍNH SÁCH" 
          links={[
            { name: "Chính sách thành viên", to: "/policy/member" },
            { name: "Chính sách thanh toán", to: "/policy/payment" },
            { name: "Chính sách đổi sản phẩm", to: "/policy/return" },
            { name: "Chính sách bảo mật", to: "/policy/privacy" },
            { name: "Chính sách cộng tác viên", to: "/policy/affiliate" },
            { name: "Chính sách bảo hành", to: "/policy/warranty" }
          ]} 
        />

        {/* Cột 3: Hướng dẫn */}
        <FooterLinkGroup 
          title="HƯỚNG DẪN" 
          links={[
            { name: "Hướng dẫn mua hàng", to: "/guide/buy" },
            { name: "Hướng dẫn đổi trả", to: "/guide/return" },
            { name: "Hướng dẫn thanh toán", to: "/guide/payment" },
            { name: "Chương trình cộng tác viên", to: "/affiliate" },
            { name: "Tìm kiếm", to: "/search" },
            { name: "Liên hệ", to: "/contact" }
          ]} 
        />

        {/* Cột 4: Kết nối & Thanh toán */}
        <div>
          <h4 className="text-[15px] font-bold text-[#047857] uppercase mb-4">
            KẾT NỐI VỚI CHÚNG TÔI
          </h4>
          <div className="flex gap-2 mb-6">
            <SocialIcon label="f" color="bg-blue-600" />
            <SocialIcon label="t" color="bg-sky-400" />
            <SocialIcon label="▶" color="bg-red-600" />
            <SocialIcon label="ig" color="bg-pink-600" />
          </div>
          
          <h4 className="text-[15px] font-bold text-[#047857] uppercase mb-4">
            HÌNH THỨC THANH TOÁN
          </h4>
          <div className="flex flex-wrap gap-2 mb-6">
             <PaymentBadge label="Tiền mặt" color="text-blue-500" />
             <PaymentBadge label="Chuyển khoản" color="text-green-600" />
             <PaymentBadge label="Visa" color="text-blue-800" />
             <PaymentBadge label="MoMo" color="text-pink-600" />
          </div>

          <h4 className="text-[15px] font-bold text-[#047857] uppercase mb-2">
            ZALO MINI APPS
          </h4>
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 bg-gray-200 border border-gray-300 p-1 flex items-center justify-center shrink-0">
               <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=agrihub" alt="QR" className="w-full h-full object-contain" />
            </div>
            <p className="text-[12px] text-gray-600 leading-snug pt-1">
              Quét mã QR để mua hàng nhanh chóng
            </p>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM BAR */}
      <div className="w-full bg-[#047857] py-3 text-center text-[13px] text-white">
        © Bản quyền thuộc về <span className="text-[#facc15] font-bold">AGRI-HUB</span> | Cung cấp bởi FPT POLYTECHNIC
      </div>
    </footer>
  );
};

const BenefitItem = ({ img, title, desc, noBorder }: any) => (
  <div className={`flex items-center justify-center md:justify-start gap-3 p-2 ${noBorder ? '' : 'md:border-r border-dashed border-blue-300'}`}>
    <div className="text-3xl">{img}</div>
    <div>
      <h4 className="text-[14px] font-bold text-[#047857]">{title}</h4>
      <p className="text-[12px] text-gray-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

const FooterLinkGroup = ({ title, links }: any) => (
  <div>
    <h4 className="text-[15px] font-bold text-[#047857] uppercase mb-4">
      {title}
    </h4>
    <ul className="text-[13px] text-gray-700 space-y-3">
      {links.map((link: any) => (
        <li key={link.name}>
          <Link to={link.to} className="hover:text-[#047857] transition-colors block">
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialIcon = ({ label, color }: any) => (
  <div className={`w-8 h-8 ${color} text-white flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity cursor-pointer`}>
    {label}
  </div>
);

const PaymentBadge = ({ label, color }: any) => (
  <div className={`px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold uppercase ${color}`}>
    {label}
  </div>
);