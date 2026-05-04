// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { productService } from "../controllers/productService";
import { categoryService } from "../controllers/categoryService";
import { useCartStore } from "../store/cartStore";
import { toast } from "sonner";
import { ChevronRight, ShoppingCart, Zap, Clock } from "lucide-react";
import { IMAGE_URL as IMAGE_PRODUCT_URL, IMAGE_CAT_URL } from "../utils/config";

const calculateSalePrice = (product, originalPrice) => {
  if (!product.voucherInfo || originalPrice <= 0) return originalPrice;
  const { discount, type } = product.voucherInfo;
  const discountVal = parseFloat(discount) || 0;
  if (type === "percentage") return originalPrice * (1 - discountVal / 100);
  return Math.max(0, originalPrice - discountVal);
};

// ── COUNTDOWN ────────────────────────────────────────────────────────────────
const CountdownTimer = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const distance = new Date(endDate).getTime() - Date.now();
      if (distance <= 0) { setTimeLeft({ h: "00", m: "00", s: "00" }); return; }
      const h = String(Math.floor(distance / 3_600_000)).padStart(2, "0");
      const m = String(Math.floor((distance % 3_600_000) / 60_000)).padStart(2, "0");
      const s = String(Math.floor((distance % 60_000) / 1_000)).padStart(2, "0");
      setTimeLeft({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1">
      {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-red-600 text-white text-[11px] font-black px-1.5 py-0.5 rounded min-w-[26px] text-center tabular-nums">
            {v}
          </span>
          {i < 2 && <span className="text-red-500 font-black text-xs">:</span>}
        </span>
      ))}
    </div>
  );
};

// ── SECTION HEADER ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, to }: { title: string; to?: string }) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-[17px] md:text-xl font-black text-gray-900 uppercase tracking-tight border-l-4 border-[#047857] pl-4">
      {title}
    </h2>
    {to && (
      <Link
        to={to}
        className="flex items-center gap-1 text-xs font-bold text-[#047857] hover:text-[#fbc02d] transition-colors"
      >
        Xem tất cả <ChevronRight size={14} />
      </Link>
    )}
  </div>
);

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onAdd }: any) => {
  const originalPrice =
    parseFloat(product.price_bag_25kg) ||
    parseFloat(product.price_bag_50kg) ||
    parseFloat(product.price_bag) || 0;
  const salePrice = calculateSalePrice(product, originalPrice);
  const hasSale = salePrice < originalPrice;
  const salePct = hasSale
    ? Math.round((1 - salePrice / originalPrice) * 100)
    : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#047857] hover:shadow-lg transition-all flex flex-col group relative">
      {hasSale && (
        <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
          -{salePct}%
        </span>
      )}
      <Link to={`/products/${product._id}`} className="block">
        <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden p-3">
          <img
            src={`${IMAGE_PRODUCT_URL}/${product.image}`}
            alt={product.name}
            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/products/${product._id}`}>
          <h3 className="text-[11px] font-bold text-gray-700 group-hover:text-[#047857] line-clamp-2 uppercase leading-tight mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto">
          {hasSale && (
            <p className="text-[10px] text-gray-400 line-through leading-none">
              {originalPrice.toLocaleString()}đ
            </p>
          )}
          <p className={`text-[15px] font-black leading-tight mb-2 ${hasSale ? "text-red-600" : "text-[#047857]"}`}>
            {salePrice.toLocaleString()}đ
          </p>
          <button
            onClick={(e) => { e.preventDefault(); onAdd(product); }}
            className="w-full flex items-center justify-center gap-1.5 bg-[#047857] hover:bg-[#fbc02d] hover:text-gray-900 text-white py-2 rounded-xl text-[11px] font-bold uppercase transition-colors active:scale-95"
          >
            <ShoppingCart size={13} /> Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
};

// ── FLASH SALE CARD ───────────────────────────────────────────────────────────
const FlashSaleCard = ({ product, onAdd }: any) => {
  const originalPrice =
    parseFloat(product.price_bag_25kg) || parseFloat(product.price_bag) || 0;
  const salePrice = calculateSalePrice(product, originalPrice);
  const pct = originalPrice > 0
    ? Math.round((1 - salePrice / originalPrice) * 100)
    : 0;

  return (
    <div className="w-[260px] md:w-[300px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 hover:border-red-300 hover:shadow-lg transition-all flex flex-col overflow-hidden group">
      <div className="flex gap-3 p-4 flex-1">
        <Link to={`/products/${product._id}`} className="relative w-20 h-20 shrink-0 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
          <img
            src={`${IMAGE_PRODUCT_URL}/${product.image}`}
            alt={product.name}
            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
          />
          {pct > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg">
              -{pct}%
            </span>
          )}
        </Link>
        <div className="flex flex-col justify-center flex-1 min-w-0">
          <h3 className="text-[12px] font-bold text-gray-800 line-clamp-2 uppercase leading-tight mb-1">
            {product.name}
          </h3>
          <p className="text-[10px] text-gray-400 line-through">
            {originalPrice.toLocaleString()}đ
          </p>
          <p className="text-[17px] font-black text-red-600 leading-tight">
            {salePrice.toLocaleString()}đ
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-dashed border-gray-100 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-red-500" /> Kết thúc:
          </span>
          <CountdownTimer endDate={product.voucherInfo?.endDate} />
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onAdd(product); }}
          className="w-full py-2.5 rounded-xl text-[11px] font-black text-white uppercase tracking-wider btn-rainbow shadow hover:shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <Zap size={12} /> Mua ngay
        </button>
      </div>
    </div>
  );
};

// ── PROMO CARD ────────────────────────────────────────────────────────────────
const PromoCard = ({ color, title, desc, to = "/products" }: any) => (
  <Link
    to={to}
    className={`${color} rounded-2xl p-6 min-h-[150px] border border-white/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group`}
  >
    <div>
      <h3 className="text-[15px] font-black text-gray-800 mb-1 uppercase">{title}</h3>
      <p className="text-gray-600 text-xs italic">{desc}</p>
    </div>
    <span className="mt-4 inline-flex items-center gap-1 bg-[#047857] group-hover:bg-[#fbc02d] text-white group-hover:text-gray-900 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase transition-colors w-fit">
      Xem ngay <ChevronRight size={12} />
    </span>
  </Link>
);

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
export const Home = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [specialOffers, setSpecialOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();

  const getProductsByCategory = (catIdMatch: string, keyword: string) =>
    allProducts.filter((p) => {
      const id = (p.category_id?._id || p.category_id || p.categoryId || "").toString();
      const name = p.category_id?.name || p.categoryId?.name || "";
      return id === catIdMatch || name.toLowerCase().includes(keyword.toLowerCase());
    });

  const handleAddToCart = (p: any) => {
    const p25r = parseFloat(p.price_bag_25kg) || parseFloat(p.price_bag) || 0;
    const p50r = parseFloat(p.price_bag_50kg) || 0;
    const pkr  = parseFloat(p.price_kg) || 0;
    addItem({
      _id: `${p._id}-${Date.now()}`,
      originalId: p._id,
      name: p.name,
      image: p.image,
      q25: 1, p25: calculateSalePrice(p, p25r),
      q50: 0, p50: calculateSalePrice(p, p50r),
      qKg: 0, pKg: calculateSalePrice(p, pkr),
      itemVoucher: p.voucherInfo || null,
    });
    toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`, { duration: 2500 });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [catData, prodData, voucherProdRes] = await Promise.all([
          categoryService.getAll(),
          productService.getAll(),
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/vouchers/special-offers`).then(r => r.json()),
        ]);
        const allCats = catData?.data || catData || [];
        setCategories(allCats.filter((c: any) => !c.status || c.status === "active"));
        setAllProducts(prodData?.data || prodData?.products || prodData || []);
        if (voucherProdRes.success) setSpecialOffers(voucherProdRes.data || []);
      } catch (e) {
        console.error("Lỗi tải dữ liệu Home:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#047857] border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-[#047857] uppercase tracking-widest">Đang tải Agri-Hub...</p>
      </div>
    );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f5f5f5] pb-16 font-sans text-gray-800">

        {/* BANNER */}
        <section className="max-w-[1200px] mx-auto px-4 pt-6">
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <img src="/banner.jpg" alt="Banner" className="w-full h-auto object-cover" />
          </div>
        </section>

        {/* DANH MỤC */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Danh mục nổi bật" to="/products" />
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {categories.map((cat, idx) => (
                <Link
                  key={cat._id || idx}
                  to={`/products?category=${cat._id}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-[#047857] hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={cat.image?.startsWith("http") ? cat.image : `${IMAGE_CAT_URL}/${cat.image}`}
                      alt={cat.name}
                      className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-[11px] font-bold text-gray-700 text-center group-hover:text-[#047857] uppercase leading-tight">
                    {cat.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SẢN PHẨM MỚI NHẬP */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader title="Sản phẩm mới nhập" to="/products" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {allProducts.slice(0, 5).map((p, idx) => (
                <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
              ))}
            </div>
          </div>
        </section>

        {/* BÁN CHẠY NHẤT */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="lg:w-[22%] bg-gradient-to-br from-[#b39556] to-[#457c4f] rounded-2xl p-6 text-white flex flex-col justify-between min-h-[200px]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-200/80 mb-2">Agri-Hub</p>
                  <h2 className="text-xl font-black leading-tight uppercase">Bán chạy nhất hàng ngày</h2>
                  <p className="text-xs text-yellow-200 mt-2 italic">Ưu đãi độc quyền – Giảm 20%</p>
                </div>
                <Link
                  to="/products"
                  className="mt-4 bg-white text-gray-800 font-bold px-5 py-2 rounded-full text-xs hover:bg-[#fbc02d] transition w-fit flex items-center gap-1"
                >
                  Mua ngay <ChevronRight size={13} />
                </Link>
              </div>
              <div className="lg:w-[78%] grid grid-cols-2 md:grid-cols-4 gap-4">
                {allProducts.slice(0, 8).map((p, idx) => (
                  <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROMO BANNERS */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PromoCard color="bg-[#f3deaa]" title="Thức ăn chăn nuôi" desc="Tăng trọng nhanh, nở đùi nở vai" />
            <PromoCard color="bg-[#bce0f4]" title="Thuốc thú y" desc="Đặc trị bệnh, hiệu quả cao" />
            <PromoCard color="bg-[#c8e6c9]" title="Gạo & Nông sản" desc="Gạo thơm sạch, giá sỉ" />
          </div>
        </section>

        {/* FLASH SALE */}
        {specialOffers.length > 0 && (
          <section className="max-w-[1200px] mx-auto px-4 mt-8">
            <div className="rounded-2xl overflow-hidden border-2 border-red-500 shadow-lg bg-white">
              <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
                  <Zap size={20} className="text-yellow-300" /> Khuyến mãi đặc biệt
                </h2>
                <span className="hidden md:block bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  Trượt để xem thêm →
                </span>
              </div>
              <div className="p-5 flex gap-4 overflow-x-auto no-scrollbar">
                {specialOffers.map((p, idx) => (
                  <FlashSaleCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* DANH MỤC SẢN PHẨM */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-5">
              <div className="lg:w-[75%]">
                <SectionHeader title="Thức ăn chăn nuôi" to="/products" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getProductsByCategory("69a0242a6b300918076f1657", "Thức ăn cho Heo")
                    .slice(0, 8)
                    .map((p, idx) => (
                      <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                    ))}
                </div>
              </div>
              <div className="lg:w-[25%] bg-gradient-to-b from-[#6a7f45] to-[#3d5a27] rounded-2xl p-6 text-white flex flex-col items-center text-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase mt-2">Sản phẩm nổi bật</h3>
                  <p className="text-xs mt-2 text-green-200 italic">Mua sắm thoải mái chỉ từ 200,000đ</p>
                </div>
                <div className="w-full h-32 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 my-5">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Agri-Hub</span>
                </div>
                <Link
                  to="/products"
                  className="bg-white text-gray-800 px-6 py-2 rounded-full text-xs font-black uppercase hover:bg-[#fbc02d] transition flex items-center gap-1"
                >
                  Mua ngay <ChevronRight size={13} />
                </Link>
              </div>
            </div>
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate("/products")}
                className="border-2 border-[#047857] text-[#047857] px-10 py-2.5 rounded-full text-sm font-bold uppercase hover:bg-[#047857] hover:text-white transition-all"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
};
