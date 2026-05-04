import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Search, Clock, Tag, ChevronRight, Newspaper } from 'lucide-react';

const NEWS = [
  {
    id: 1,
    category: 'Sức khỏe',
    title: 'Công dụng của gạo lứt tím hữu cơ và cách nấu đúng chuẩn',
    date: '20/04/2024',
    readTime: '5 phút đọc',
    desc: 'Gạo lứt tím là một loại gạo được chế biến từ các hạt gạo nguyên cám có màu tím đặc trưng, chứa nhiều anthocyanin — chất chống oxy hóa mạnh. Tìm hiểu cách nấu đúng để giữ nguyên dưỡng chất.',
    tags: ['Gạo lứt', 'Hữu cơ', 'Sức khỏe'],
    color: 'bg-purple-100 text-purple-700',
  },
  {
    id: 2,
    category: 'Ẩm thực',
    title: 'Hướng dẫn cách làm salad dưa chuột thanh mát, bổ dưỡng cho ngày hè',
    date: '18/04/2024',
    readTime: '4 phút đọc',
    desc: 'Salad dưa chuột là món ăn rất được yêu thích vào ngày hè vì có tính thanh mát, bổ dưỡng. Chỉ với 10 phút và nguyên liệu đơn giản, bạn đã có ngay món salad thơm ngon, giàu vitamin.',
    tags: ['Salad', 'Dưa chuột', 'Ẩm thực'],
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 3,
    category: 'Mẹo hay',
    title: 'Công dụng bất ngờ của tỏi ngâm mật ong mà bạn chưa biết',
    date: '15/04/2024',
    readTime: '6 phút đọc',
    desc: 'Tỏi và mật ong đều là những gia vị phổ biến trong mọi căn bếp. Kết hợp hai nguyên liệu này tạo ra hỗn hợp có khả năng tăng đề kháng, chống viêm, hỗ trợ tiêu hóa và cải thiện sức khỏe tim mạch.',
    tags: ['Tỏi', 'Mật ong', 'Sức khỏe'],
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 4,
    category: 'Dinh dưỡng',
    title: '10 công dụng của khoai tây bạn nhất định phải biết',
    date: '12/04/2024',
    readTime: '7 phút đọc',
    desc: 'Khoai tây là thực phẩm được sử dụng rộng rãi để chế biến các món ăn từ Á sang Âu. Không chỉ ngon miệng, khoai tây còn chứa nhiều kali, vitamin C, chất xơ và các khoáng chất cần thiết cho cơ thể.',
    tags: ['Khoai tây', 'Dinh dưỡng', 'Vitamin'],
    color: 'bg-orange-100 text-orange-700',
  },
  {
    id: 5,
    category: 'Sức khỏe',
    title: 'Ăn ớt chuông đỏ có tác dụng gì cho sức khỏe?',
    date: '10/04/2024',
    readTime: '5 phút đọc',
    desc: 'Ớt chuông đỏ là loại rau quả rất được yêu thích vì tác dụng tuyệt vời mà nó đem lại. Với hàm lượng vitamin C cao gấp 3 lần cam, đây là "siêu thực phẩm" đáng có trong mọi bữa ăn.',
    tags: ['Ớt chuông', 'Vitamin C', 'Sức khỏe'],
    color: 'bg-red-100 text-red-700',
  },
  {
    id: 6,
    category: 'Nông nghiệp',
    title: 'Xu hướng nông nghiệp hữu cơ tại Việt Nam 2024: Cơ hội và thách thức',
    date: '08/04/2024',
    readTime: '8 phút đọc',
    desc: 'Nông nghiệp hữu cơ đang phát triển mạnh mẽ tại Việt Nam với diện tích canh tác tăng gấp đôi trong 3 năm qua. Tìm hiểu những cơ hội và thách thức mà ngành nông nghiệp sạch phải đối mặt.',
    tags: ['Hữu cơ', 'Nông nghiệp', 'Bền vững'],
    color: 'bg-green-100 text-green-700',
  },
];

const ALL_TAGS = [...new Set(NEWS.flatMap((n) => n.tags))];

const PLACEHOLDER_COLORS = [
  'from-purple-100 to-purple-200',
  'from-emerald-100 to-emerald-200',
  'from-yellow-100 to-yellow-200',
  'from-orange-100 to-orange-200',
  'from-red-100 to-red-200',
  'from-green-100 to-green-200',
];
const PLACEHOLDER_ICONS = ['🌾', '🥗', '🧄', '🥔', '🫑', '🌿'];

export const NewsPage = () => {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const filtered = NEWS.filter((n) => {
    const matchSearch = !search.trim() || n.title.toLowerCase().includes(search.toLowerCase()) || n.desc.toLowerCase().includes(search.toLowerCase());
    const matchTag = !activeTag || n.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] font-sans">
      <Header />

      <main className="flex-grow max-w-6xl mx-auto px-4 w-full pt-4 pb-14">
        {/* Breadcrumb */}
        <nav className="text-gray-500 text-sm mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#047857]">Trang chủ</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-[#047857] font-medium">Tin tức</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ===== DANH SÁCH BÀI VIẾT ===== */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black text-slate-800">Tin tức & Kiến thức</h1>
              <span className="text-sm text-slate-400">{filtered.length} bài viết</span>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
                <Newspaper size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Không tìm thấy bài viết phù hợp</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filtered.map((item, idx) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow group">
                    {/* Ảnh placeholder */}
                    <div className={`w-full sm:w-56 h-44 sm:h-auto shrink-0 bg-gradient-to-br ${PLACEHOLDER_COLORS[idx % PLACEHOLDER_COLORS.length]} flex items-center justify-center text-5xl`}>
                      {PLACEHOLDER_ICONS[idx % PLACEHOLDER_ICONS.length]}
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.color}`}>
                            {item.category}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> {item.readTime}
                          </span>
                        </div>
                        <h2 className="text-base font-bold text-slate-800 leading-snug mb-2 group-hover:text-[#047857] transition-colors line-clamp-2">
                          {item.title}
                        </h2>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-slate-400">{item.date}</span>
                        <button className="text-sm font-bold text-[#047857] hover:underline flex items-center gap-1">
                          Đọc tiếp <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="w-full lg:w-72 space-y-6 shrink-0">

            {/* Search */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tìm kiếm</p>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm bài viết..."
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-[#047857] transition-colors"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Tag size={13} /> Chủ đề
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTag('')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${!activeTag ? 'bg-[#047857] text-white border-[#047857]' : 'border-slate-200 text-slate-600 hover:border-[#047857] hover:text-[#047857]'}`}
                >
                  Tất cả
                </button>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${activeTag === tag ? 'bg-[#047857] text-white border-[#047857]' : 'border-slate-200 text-slate-600 hover:border-[#047857] hover:text-[#047857]'}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Bài viết nổi bật */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bài viết nổi bật</p>
              <div className="space-y-3">
                {NEWS.slice(0, 4).map((n, idx) => (
                  <div key={n.id} className="flex gap-3 items-start group cursor-pointer">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${PLACEHOLDER_COLORS[idx % PLACEHOLDER_COLORS.length]} flex items-center justify-center text-xl shrink-0`}>
                      {PLACEHOLDER_ICONS[idx % PLACEHOLDER_ICONS.length]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-snug line-clamp-2 group-hover:text-[#047857] transition-colors">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA liên hệ */}
            <div className="bg-[#047857] rounded-2xl p-5 text-white text-center">
              <p className="font-bold mb-1">Cần tư vấn sản phẩm?</p>
              <p className="text-emerald-100 text-xs mb-4">Hotline hỗ trợ 8h–22h mỗi ngày</p>
              <a href="tel:19006750" className="block bg-white text-[#047857] rounded-full py-2 text-sm font-black hover:bg-emerald-50 transition-colors">
                1900 6750
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
