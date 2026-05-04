import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Leaf, ShieldCheck, Truck, Users, Award, HeartHandshake } from 'lucide-react';

const STATS = [
  { value: '10+', label: 'Năm kinh nghiệm' },
  { value: '500+', label: 'Sản phẩm nông sản' },
  { value: '50.000+', label: 'Khách hàng tin dùng' },
  { value: '63', label: 'Tỉnh thành phân phối' },
];

const VALUES = [
  {
    icon: <Leaf size={28} className="text-[#047857]" />,
    title: 'Nông sản sạch – Nguồn gốc rõ ràng',
    desc: 'Toàn bộ sản phẩm trên Agri-Hub đều có tem truy xuất nguồn gốc, được kiểm định chất lượng nghiêm ngặt trước khi đến tay người tiêu dùng.',
  },
  {
    icon: <ShieldCheck size={28} className="text-[#047857]" />,
    title: 'Uy tín – Cam kết chất lượng',
    desc: 'Chúng tôi cam kết 100% hoàn tiền nếu sản phẩm không đúng mô tả hoặc không đạt chất lượng. Sự hài lòng của bạn là ưu tiên số một.',
  },
  {
    icon: <Truck size={28} className="text-[#047857]" />,
    title: 'Giao hàng nhanh – Toàn quốc',
    desc: 'Hệ thống vận chuyển phủ rộng 63 tỉnh thành với đội ngũ logistics chuyên nghiệp, đảm bảo nông sản tươi ngon đến tay bạn trong thời gian ngắn nhất.',
  },
  {
    icon: <HeartHandshake size={28} className="text-[#047857]" />,
    title: 'Đồng hành cùng nông dân Việt',
    desc: 'Agri-Hub kết nối trực tiếp nông dân và người tiêu dùng, giúp nông sản Việt được tiêu thụ đúng giá, nông dân có thu nhập ổn định, người mua có hàng chất lượng.',
  },
];

const TEAM = [
  { name: 'Nguyễn Văn An', role: 'Founder & CEO', bg: 'bg-emerald-100', letter: 'A' },
  { name: 'Trần Thị Bích', role: 'Giám đốc Vận hành', bg: 'bg-sky-100', letter: 'B' },
  { name: 'Lê Minh Cường', role: 'Trưởng phòng Chất lượng', bg: 'bg-yellow-100', letter: 'C' },
  { name: 'Phạm Thị Duyên', role: 'Giám đốc Marketing', bg: 'bg-orange-100', letter: 'D' },
];

export const AboutPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header />

      <main className="flex-grow">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
          <nav className="text-gray-500 text-sm">
            <Link to="/" className="hover:text-[#047857]">Trang chủ</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-[#047857] font-medium">Giới thiệu</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-[#047857] to-[#065f46] text-white py-20">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Leaf size={16} /> Nền tảng nông sản Việt uy tín số 1
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              Agri-Hub — Cầu nối<br />nông sản Việt đến mọi nhà
            </h1>
            <p className="text-emerald-100 text-lg leading-relaxed max-w-3xl mx-auto">
              Chúng tôi xây dựng hệ thống phân phối thức ăn chăn nuôi, thuốc thú y và nông sản sạch
              kết nối trực tiếp từ vùng trồng trọt đến người tiêu dùng — minh bạch, uy tín và bền vững.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-[#047857]">{s.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-[#047857] uppercase tracking-widest">Câu chuyện của chúng tôi</span>
              <h2 className="text-3xl font-black text-slate-800 mt-3 mb-5 leading-tight">
                Từ cánh đồng lúa Đồng bằng sông Cửu Long đến bàn ăn của bạn
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Agri-Hub ra đời năm 2014 với xuất phát điểm là một cơ sở thu mua lúa gạo nhỏ tại An Giang.
                Nhận thấy sự mất kết nối giữa nông dân và người tiêu dùng — nơi trung gian lấy phần lợi quá lớn —
                chúng tôi quyết định xây dựng một nền tảng minh bạch hơn.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Hơn 10 năm sau, Agri-Hub đã mở rộng sang toàn bộ ngành nông sản, thức ăn chăn nuôi và
                thuốc thú y, phục vụ hàng chục nghìn khách hàng và đối tác nông dân trên khắp cả nước.
              </p>
              <Link
                to="/products"
                className="inline-block bg-[#047857] text-white px-7 py-3 rounded-full text-sm font-bold hover:bg-[#035b42] transition-colors"
              >
                Xem sản phẩm của chúng tôi
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col gap-2">
                <Award size={32} className="text-[#047857]" />
                <p className="font-bold text-slate-800 text-sm">Top 10 nền tảng thương mại điện tử nông sản Việt Nam 2023</p>
              </div>
              <div className="bg-yellow-50 rounded-2xl p-6 flex flex-col gap-2 mt-6">
                <Users size={32} className="text-yellow-600" />
                <p className="font-bold text-slate-800 text-sm">Mạng lưới hơn 2.000 hộ nông dân đối tác trên 20 tỉnh thành</p>
              </div>
              <div className="bg-sky-50 rounded-2xl p-6 flex flex-col gap-2 -mt-6">
                <ShieldCheck size={32} className="text-sky-600" />
                <p className="font-bold text-slate-800 text-sm">Chứng nhận VietGAP, GlobalGAP và HACCP cho toàn bộ sản phẩm</p>
              </div>
              <div className="bg-orange-50 rounded-2xl p-6 flex flex-col gap-2">
                <Truck size={32} className="text-orange-500" />
                <p className="font-bold text-slate-800 text-sm">Giao hàng trong 24–48h tại TP.HCM và các tỉnh lân cận</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-slate-50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#047857] uppercase tracking-widest">Giá trị cốt lõi</span>
              <h2 className="text-3xl font-black text-slate-800 mt-3">Tại sao chọn Agri-Hub?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="bg-white rounded-2xl p-7 border border-slate-100 flex gap-5 items-start">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-2">{v.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-[#047857] uppercase tracking-widest">Con người</span>
            <h2 className="text-3xl font-black text-slate-800 mt-3">Đội ngũ sáng lập</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM.map((m) => (
              <div key={m.name} className="text-center">
                <div className={`w-20 h-20 ${m.bg} rounded-full flex items-center justify-center text-2xl font-black text-slate-700 mx-auto mb-3`}>
                  {m.letter}
                </div>
                <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#047857] text-white py-14">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-black mb-4">Sẵn sàng mua sắm nông sản sạch?</h2>
            <p className="text-emerald-100 mb-8">Hàng nghìn sản phẩm chất lượng đang chờ bạn khám phá.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/products" className="bg-white text-[#047857] px-8 py-3 rounded-full font-bold text-sm hover:bg-emerald-50 transition-colors">
                Mua sắm ngay
              </Link>
              <Link to="/contact" className="border-2 border-white text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-white/10 transition-colors">
                Liên hệ tư vấn
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
