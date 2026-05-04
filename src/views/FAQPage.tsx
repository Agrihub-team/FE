import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ChevronDown, Search, ShoppingCart, CreditCard, Truck, RotateCcw, Leaf, Phone } from 'lucide-react';

type FAQ = { q: string; a: string };
type Section = { id: string; icon: React.ReactNode; title: string; faqs: FAQ[] };

const SECTIONS: Section[] = [
  {
    id: 'products',
    icon: <Leaf size={18} />,
    title: 'Về sản phẩm',
    faqs: [
      {
        q: 'Sản phẩm trên Agri-Hub có đảm bảo chất lượng không?',
        a: 'Có. Toàn bộ sản phẩm trên Agri-Hub đều đã qua kiểm định chất lượng, có tem truy xuất nguồn gốc rõ ràng. Nhiều sản phẩm đạt chứng nhận VietGAP, GlobalGAP hoặc hữu cơ được công nhận. Chúng tôi cam kết hoàn tiền 100% nếu sản phẩm không đúng mô tả.',
      },
      {
        q: 'Agri-Hub có bán thức ăn chăn nuôi và thuốc thú y không?',
        a: 'Có. Ngoài nông sản tươi và thực phẩm sạch, Agri-Hub còn phân phối thức ăn chăn nuôi các loại (heo, gà, vịt, cá, tôm...) và thuốc thú y từ các thương hiệu uy tín được Bộ NN&PTNT cấp phép.',
      },
      {
        q: 'Tôi có thể mua lẻ theo ký hay chỉ mua theo bao?',
        a: 'Agri-Hub hỗ trợ cả hai hình thức: mua theo bao (25kg hoặc 50kg) với giá ưu đãi hơn, và mua lẻ theo ký phù hợp với nhu cầu nhỏ lẻ của hộ gia đình. Giá mỗi hình thức được hiển thị rõ trên trang sản phẩm.',
      },
      {
        q: 'Sản phẩm còn hàng hay hết hàng làm sao biết?',
        a: 'Trang chi tiết sản phẩm hiển thị tồn kho theo từng quy cách (bao 25kg, bao 50kg, lẻ theo ký). Nếu sản phẩm hết hàng, nút mua sẽ bị vô hiệu hóa và hiển thị thông báo "Hết hàng".',
      },
    ],
  },
  {
    id: 'order',
    icon: <ShoppingCart size={18} />,
    title: 'Về đặt hàng',
    faqs: [
      {
        q: 'Tôi có cần đăng ký tài khoản để đặt hàng không?',
        a: 'Bạn có thể thêm sản phẩm vào giỏ hàng mà không cần đăng nhập. Tuy nhiên, để hoàn tất thanh toán và theo dõi đơn hàng, bạn cần đăng ký hoặc đăng nhập tài khoản. Việc đăng ký hoàn toàn miễn phí.',
      },
      {
        q: 'Làm sao để theo dõi đơn hàng đã đặt?',
        a: 'Sau khi đặt hàng thành công, bạn vào mục "Tài khoản" → "Đơn Mua" để theo dõi trạng thái đơn hàng theo thời gian thực. Trang này tự động cập nhật mỗi 30 giây và hiển thị thông báo ngay khi admin cập nhật trạng thái.',
      },
      {
        q: 'Tôi có thể hủy đơn hàng sau khi đặt không?',
        a: 'Bạn có thể liên hệ hotline 1900 6750 hoặc email support@agrihub.vn để yêu cầu hủy đơn. Đơn hàng ở trạng thái "Chờ xác nhận" có thể hủy ngay. Đơn đã được xác nhận hoặc đang chuẩn bị sẽ phụ thuộc vào tình trạng thực tế.',
      },
      {
        q: 'Tôi có thể đặt số lượng lớn (sỉ) không?',
        a: 'Có. Agri-Hub hỗ trợ đơn hàng sỉ với giá ưu đãi hơn. Vui lòng liên hệ trực tiếp qua hotline 1900 6750 hoặc email sales@agrihub.vn để được tư vấn và báo giá sỉ phù hợp.',
      },
      {
        q: 'Mã voucher áp dụng như thế nào?',
        a: 'Tại trang giỏ hàng hoặc thanh toán, nhập mã voucher vào ô "Mã giảm giá" và nhấn Áp dụng. Hệ thống sẽ tự động tính lại giá. Mỗi đơn hàng có thể áp dụng tối đa 1 mã voucher toàn đơn và 1 mã voucher theo sản phẩm.',
      },
    ],
  },
  {
    id: 'payment',
    icon: <CreditCard size={18} />,
    title: 'Về thanh toán',
    faqs: [
      {
        q: 'Agri-Hub chấp nhận những hình thức thanh toán nào?',
        a: 'Hiện tại Agri-Hub hỗ trợ: (1) Thanh toán khi nhận hàng (COD), (2) Chuyển khoản ngân hàng, (3) Thanh toán qua VNPay (thẻ ATM nội địa, thẻ Visa/Master/JCB, ví điện tử MoMo, ZaloPay, ShopeePay).',
      },
      {
        q: 'Thanh toán online có an toàn không?',
        a: 'Agri-Hub sử dụng cổng thanh toán VNPay được Ngân hàng Nhà nước cấp phép, áp dụng mã hóa SSL 256-bit và xác thực OTP. Agri-Hub không lưu trữ thông tin thẻ của bạn.',
      },
      {
        q: 'Tôi bị lỗi khi thanh toán, tiền đã trừ nhưng đơn chưa xác nhận?',
        a: 'Vui lòng không thanh toán lại. Liên hệ ngay hotline 1900 6750 hoặc email support@agrihub.vn kèm mã giao dịch. Chúng tôi sẽ kiểm tra và xử lý trong vòng 24 giờ làm việc.',
      },
      {
        q: 'Hóa đơn VAT có thể xuất không?',
        a: 'Có. Nếu bạn cần hóa đơn VAT (đỏ), vui lòng ghi chú tên công ty, mã số thuế, địa chỉ khi đặt hàng, hoặc liên hệ hotline trong vòng 24h sau khi đặt hàng.',
      },
    ],
  },
  {
    id: 'shipping',
    icon: <Truck size={18} />,
    title: 'Về giao hàng',
    faqs: [
      {
        q: 'Agri-Hub giao hàng những tỉnh thành nào?',
        a: 'Agri-Hub giao hàng toàn quốc 63 tỉnh thành. Một số vùng sâu vùng xa có thể phát sinh phụ phí vận chuyển, nhân viên sẽ liên hệ báo trước khi xác nhận đơn.',
      },
      {
        q: 'Thời gian giao hàng là bao lâu?',
        a: 'TP.HCM và các tỉnh lân cận (Bình Dương, Đồng Nai, Long An): 24–48 giờ. Các tỉnh miền Tây, miền Trung: 2–4 ngày. Các tỉnh miền Bắc, Tây Nguyên: 3–5 ngày. Thời gian có thể thay đổi tùy lễ Tết.',
      },
      {
        q: 'Phí vận chuyển được tính như thế nào?',
        a: 'Phí vận chuyển hiển thị rõ tại trang thanh toán trước khi bạn xác nhận. Đơn hàng từ 500.000đ trở lên được miễn phí vận chuyển nội thành TP.HCM. Các tỉnh thành khác áp dụng bảng giá cố định theo vùng.',
      },
      {
        q: 'Làm sao nếu hàng giao bị hư hỏng hoặc sai?',
        a: 'Vui lòng quay video kiểm tra khi mở kiện hàng (ngay tại chỗ), chụp ảnh sản phẩm bị lỗi và liên hệ hotline 1900 6750 trong vòng 48 giờ kể từ khi nhận hàng. Chúng tôi sẽ đổi/trả hàng và chịu toàn bộ phí vận chuyển.',
      },
    ],
  },
  {
    id: 'return',
    icon: <RotateCcw size={18} />,
    title: 'Đổi trả & Hoàn tiền',
    faqs: [
      {
        q: 'Chính sách đổi trả của Agri-Hub như thế nào?',
        a: 'Agri-Hub chấp nhận đổi trả trong vòng 7 ngày nếu: sản phẩm bị hư hỏng trong quá trình vận chuyển, sản phẩm không đúng mô tả, hoặc giao sai hàng. Sản phẩm tươi sống chỉ đổi trả khi nhận hàng hoặc trong 24 giờ.',
      },
      {
        q: 'Quy trình hoàn tiền mất bao lâu?',
        a: 'Sau khi yêu cầu hoàn tiền được duyệt: Thanh toán COD hoàn qua chuyển khoản trong 3–5 ngày làm việc. Thanh toán qua VNPay hoàn trực tiếp về tài khoản/thẻ trong 7–15 ngày làm việc tùy ngân hàng.',
      },
      {
        q: 'Những trường hợp nào không được đổi trả?',
        a: 'Sản phẩm đã qua sử dụng, đã mở bao bì (trừ trường hợp kiểm tra hàng), sản phẩm bị hư hỏng do lỗi người dùng, đơn hàng đặt quá 7 ngày (trừ trường hợp khiếu nại trong vòng 48h khi nhận).',
      },
    ],
  },
  {
    id: 'contact',
    icon: <Phone size={18} />,
    title: 'Hỗ trợ khách hàng',
    faqs: [
      {
        q: 'Tôi có thể liên hệ Agri-Hub qua kênh nào?',
        a: 'Hotline: 1900 6750 (8h–22h, thứ 2 đến Chủ nhật). Email: support@agrihub.vn (phản hồi trong 4 giờ làm việc). Chat trực tuyến trên website (góc phải màn hình). Fanpage Facebook: facebook.com/agrihub.vn.',
      },
      {
        q: 'Tôi muốn trở thành đối tác cung ứng của Agri-Hub?',
        a: 'Agri-Hub luôn tìm kiếm các hộ nông dân, HTX và doanh nghiệp nông sản uy tín. Vui lòng gửi hồ sơ năng lực về email partner@agrihub.vn hoặc liên hệ phòng kinh doanh 1900 6750 (nhánh 2) để được tư vấn.',
      },
    ],
  },
];

const FAQItem = ({ faq }: { faq: FAQ }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-slate-100 rounded-xl overflow-hidden transition-shadow ${open ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className={`text-sm font-semibold leading-snug ${open ? 'text-[#047857]' : 'text-slate-800'}`}>{faq.q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 mt-0.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-[#047857]' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 bg-white border-t border-slate-50">
          <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  );
};

export const FAQPage = () => {
  const [activeSection, setActiveSection] = useState('products');
  const [search, setSearch] = useState('');

  const current = SECTIONS.find((s) => s.id === activeSection)!;
  const filtered = search.trim()
    ? SECTIONS.flatMap((s) =>
        s.faqs
          .filter((f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))
          .map((f) => ({ ...f, _section: s.title }))
      )
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
          <nav className="text-gray-500 text-sm">
            <Link to="/" className="hover:text-[#047857]">Trang chủ</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-[#047857] font-medium">Câu hỏi thường gặp</span>
          </nav>
        </div>

        {/* Hero */}
        <div className="bg-slate-50 border-b border-slate-100 py-12">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h1 className="text-3xl font-black text-slate-800 mb-3">Câu hỏi thường gặp</h1>
            <p className="text-slate-500 mb-6">Tìm nhanh câu trả lời cho mọi thắc mắc của bạn</p>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm câu hỏi..."
                className="w-full border border-slate-200 rounded-full pl-11 pr-5 py-3 text-sm outline-none focus:border-[#047857] focus:ring-2 focus:ring-emerald-50 bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Search results */}
          {search.trim() ? (
            <div>
              <p className="text-sm text-slate-500 mb-5">
                {filtered!.length > 0 ? `Tìm thấy ${filtered!.length} kết quả cho "${search}"` : `Không tìm thấy kết quả cho "${search}"`}
              </p>
              {filtered!.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-400 text-sm mb-4">Không tìm thấy câu hỏi phù hợp.</p>
                  <Link to="/contact" className="text-sm font-bold text-[#047857] underline">
                    Gửi câu hỏi cho chúng tôi →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered!.map((f, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">{(f as any)._section}</p>
                      <FAQItem faq={f} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Sidebar */}
              <div className="w-full md:w-56 shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Danh mục</p>
                <div className="space-y-1">
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                        activeSection === s.id
                          ? 'bg-emerald-50 text-[#047857] font-bold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#047857]'
                      }`}
                    >
                      <span className={activeSection === s.id ? 'text-[#047857]' : 'text-slate-400'}>{s.icon}</span>
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ list */}
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-800 mb-5 flex items-center gap-2">
                  <span className="text-[#047857]">{current.icon}</span>
                  {current.title}
                </h2>
                <div className="space-y-3">
                  {current.faqs.map((f, i) => (
                    <FAQItem key={i} faq={f} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Still have questions */}
          <div className="mt-14 bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Vẫn còn thắc mắc?</h3>
            <p className="text-sm text-slate-500 mb-5">Đội ngũ tư vấn của chúng tôi sẵn sàng hỗ trợ bạn 8h–22h mỗi ngày.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href="tel:19006750"
                className="inline-flex items-center gap-2 bg-[#047857] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#035b42] transition-colors"
              >
                <Phone size={15} /> Gọi 1900 6750
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border-2 border-[#047857] text-[#047857] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-50 transition-colors"
              >
                Gửi câu hỏi
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
