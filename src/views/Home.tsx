// @ts-nocheck
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { productService } from "../controllers/productService";
import { categoryService } from "../controllers/categoryService";
import { useCartStore } from "../store/cartStore";

// Đưa cấu hình URL ra đầu trang để dễ quản lý đồng bộ
const IMAGE_PRODUCT_URL = import.meta.env?.VITE_IMAGE_URL || 'http://localhost:3001/images/products';
const IMAGE_CAT_URL = import.meta.env?.VITE_CAT_IMAGE_URL || 'http://localhost:3001/images/categories';

export const Home = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const getProductsByCategory = (catIdMatch: string, keyword: string) => {
    return allProducts.filter(p => {
      const pCatId = (p.category_id?._id || p.category_id || p.categoryId || "").toString();
      const pCatName = p.category_id?.name || p.categoryId?.name || "";
      return pCatId === catIdMatch || pCatName.toLowerCase().includes(keyword.toLowerCase());
    });
  };

  // ====================== LOGIC THÊM VÀO GIỎ (GIỮ NGUYÊN) ======================
  const handleAddToCart = (p: any) => {
    const price25 = parseFloat(p.price_bag_25kg) || parseFloat(p.price_bag) || 0;
    const price50 = parseFloat(p.price_bag_50kg) || 0;
    const priceKg  = parseFloat(p.price_kg) || 0;

    const uniqueId = `${p._id}-${Date.now()}`;

    addItem({
      _id: uniqueId,
      originalId: p._id,
      name: p.name,
      image: p.image,
      q25: 1,
      p25: price25,
      q50: 0,
      p50: price50,
      qKg: 0,
      pKg: priceKg
    });

    alert(`✅ Đã thêm ${p.name} (1 bao 25kg) vào giỏ hàng!`);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Tận dụng Promise.all để load nhanh hơn
        const [catData, prodData] = await Promise.all([
          categoryService.getAll(),
          productService.getAll()
        ]);
        
        // Cập nhật state với data đã bóc tách từ apiClient (nếu service đã dùng apiClient)
        setCategories(catData?.data || catData || []);
        setAllProducts(prodData?.data || prodData?.products || prodData || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu Home:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Logic Flash Sale
    const target = new Date().getTime() + (10 * 24 * 60 * 60 * 1000);
    const interval = setInterval(() => {
      const dist = target - new Date().getTime();
      if (dist < 0) return clearInterval(interval);
      setTimeLeft({
        days: Math.floor(dist / (1000 * 60 * 60 * 24)),
        hours: Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((dist % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#047857] text-lg">Đang tải Agri-Hub...</div>;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f5f5f5] pb-12 font-sans text-gray-800">
        
        {/* 1. HERO BANNER */}
        <section className="max-w-[1200px] mx-auto px-4 mt-6">
          <div className="w-full rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
            <img src="/banner.jpg" alt="Banner" className="w-full h-auto object-cover" />
          </div>
        </section>

        {/* 2. DANH MỤC NỔI BẬT */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Danh mục nổi bật</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat, idx) => (
                <Link key={cat._id || idx} to={`/products?category=${cat._id}`} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col items-center hover:border-[#047857] hover:shadow-md transition cursor-pointer group">
                  <div className="w-full aspect-square bg-gray-50 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <img src={cat.image?.startsWith('http') ? cat.image : `${IMAGE_CAT_URL}/${cat.image}`} alt={cat.name} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 text-center group-hover:text-[#047857]">{cat.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 7. SẢN PHẨM MỚI NHẬP */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900">Sản phẩm mới nhập</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {allProducts.slice(0, 5).map((p, idx) => (
                <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
              ))}
            </div>
          </div>
        </section>

        {/* 3. BÁN CHẠY NHẤT HÀNG NGÀY */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-[25%] bg-[#a58641] rounded-lg p-6 text-white flex flex-col justify-center bg-gradient-to-b from-[#b39556] to-[#457c4f]">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">Bán chạy nhất<br />hàng ngày</h2>
                <p className="text-sm mb-4 text-yellow-200 border-b border-white/20 pb-3 inline-block w-fit">Ưu đãi độc quyền - Giảm giá 20%</p>
                <Link to="/products" className="bg-white text-gray-800 font-bold px-6 py-2 rounded-full text-sm hover:bg-[#fbc02d] hover:text-gray-900 w-fit mt-auto transition">Mua ngay</Link>
              </div>
              <div className="lg:w-[75%] grid grid-cols-2 md:grid-cols-4 gap-4">
                {allProducts.slice(0, 4).map((p, idx) => (
                  <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. BA BANNER QUẢNG CÁO NHỎ */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PromoCard color="bg-[#f3deaa]" title="Thức ăn chăn nuôi" desc="Tăng trọng nhanh, nở đùi nở vai" />
            <div className="bg-[#bce0f4] rounded-lg p-6 flex justify-between items-center min-h-[160px] border border-gray-200 shadow-sm hover:shadow-md transition">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Thuốc thú y</h3>
                <p className="text-gray-700 text-sm mb-4">Đặc trị bệnh, hiệu quả cao</p>
                <Link to="/products" className="bg-[#047857] text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#fbc02d] hover:text-gray-900 transition">Xem ngay</Link>
              </div>
            </div>
            <PromoCard color="bg-[#c8e6c9]" title="Gạo & Nông sản" desc="Gạo thơm sạch, giá sỉ" />
          </div>
        </section>

        {/* 5. KHUYẾN MÃI FLASH SALE */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="border-2 border-[#047857] rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-[#047857] p-3 md:p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">Khuyến mãi đặc biệt ⚡</h2>
              <div className="flex gap-2 text-center">
                <TimeBox val={timeLeft.days} label="Ngày" /><TimeBox val={timeLeft.hours} label="Giờ" />
                <TimeBox val={timeLeft.minutes} label="Phút" /><TimeBox val={timeLeft.seconds} label="Giây" />
              </div>
            </div>
            <div className="p-4 md:p-6 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {allProducts.slice(4, 10).map((p, idx) => (
                <FlashSaleCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
              ))}
            </div>
          </div>
        </section>

        {/* 6. CÁM HEO / BÒ / GÀ */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-[75%]">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-100 pb-2 inline-block border-b-2 border-yellow-400">Cám Heo / Cám Bò / Cám Gà</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getProductsByCategory("1", "Heo").slice(0, 8).map((p, idx) => (
                    <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                  ))}
                </div>
              </div>
              <div className="lg:w-[25%] bg-[#6a7f45] rounded-lg p-6 text-white flex flex-col items-center text-center">
                 <h3 className="text-2xl font-bold mb-3 mt-4">Sản phẩm nổi bật</h3>
                 <p className="text-sm mb-8 opacity-90">Mua sắm thoải mái chỉ từ 200.000đ</p>
                 <Link to="/products" className="bg-white text-gray-800 px-8 py-2 rounded-full text-sm font-bold w-fit hover:bg-[#fbc02d] transition mb-10">Mua ngay</Link>
                 <div className="w-full h-48 bg-white/10 rounded-md flex items-center justify-center font-bold text-sm">AGRI-HUB QC</div>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button onClick={() => navigate('/products')} className="border border-[#047857] text-[#047857] px-8 py-2 rounded-full text-sm font-medium hover:bg-[#fbc02d] hover:text-gray-900 hover:border-[#fbc02d] transition-colors">Xem tất cả</button>
            </div>
          </div>
        </section>

        {/* 8. THỨC ĂN GIA CẦM & THỦY SẢN */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8 pb-10">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b-2 border-yellow-400 pb-2 inline-block">Thức ăn gia cầm & thủy sản</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-[25%] h-[300px] bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-bold border border-blue-200 text-center px-6">Banner Thủy Sản</div>
              <div className="md:w-[75%] grid grid-cols-2 md:grid-cols-4 gap-4">
                {getProductsByCategory("4", "Thủy sản").slice(0, 4).map((p, idx) => (
                  <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

// --- COMPONENT CON (GIỮ NGUYÊN UI) ---

function ProductCard({ product, onAdd }: any) {
  const price = parseFloat(product.price_bag_25kg) || parseFloat(product.price_bag_50kg) || parseFloat(product.price_bag) || 0;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#047857] hover:shadow-md transition flex flex-col h-full group relative">
      <Link to={`/products/${product._id}`} className="flex flex-col flex-1">
        <div className="h-40 mb-3 flex items-center justify-center overflow-hidden">
          <img src={`${IMAGE_PRODUCT_URL}/${product.image}`} alt={product.name} className="max-h-full object-contain group-hover:scale-105 transition duration-300" />
        </div>
        <h3 className="text-sm text-gray-800 mb-1 group-hover:text-[#047857] line-clamp-2 h-10">{product.name}</h3>
        <span className="text-base font-bold text-[#047857] mt-auto mb-3">{(price).toLocaleString()}đ</span>
      </Link>
      <button 
        onClick={(e) => { 
          e.preventDefault(); 
          onAdd(product); 
        }} 
        className="w-full bg-[#047857] text-white py-2 rounded-full text-sm font-medium hover:bg-[#fbc02d] hover:text-gray-900 transition-colors"
      >
        Thêm vào giỏ
      </button>
    </div>
  );
}

function FlashSaleCard({ product, onAdd }: any) {
  const originalPrice = parseFloat(product.price_bag_25kg) || parseFloat(product.price_bag) || 0;
  const salePrice = originalPrice * 0.85;
  
  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#047857] hover:shadow-md transition group relative">
      <Link to={`/products/${product._id}`} className="w-1/3 relative flex items-center justify-center p-1">
        <span className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">-15%</span>
        <img src={`${IMAGE_PRODUCT_URL}/${product.image}`} alt={product.name} className="max-h-full object-contain" />
      </Link>
      <div className="w-2/3 flex flex-col justify-center">
        <h3 className="font-medium text-gray-800 text-sm line-clamp-2 hover:text-[#047857] mb-2">{product.name}</h3>
        <div>
           <div className="flex justify-between text-[11px] text-gray-500 mb-1">
             <span>Đã bán: 120/200</span>
           </div>
           <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
             <div className="bg-orange-500 h-full rounded-full w-[60%]"></div>
           </div>
           <span className="text-xs text-gray-400 line-through">{(originalPrice).toLocaleString()}đ</span>
           <div className="flex justify-between items-center">
             <span className="text-base font-bold text-[#047857]">{(salePrice).toLocaleString()}đ</span>
             <button 
               onClick={(e) => { 
                 e.preventDefault(); 
                 onAdd(product); 
               }} 
               className="bg-[#047857] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-[#fbc02d] hover:text-gray-900 transition-colors"
             >
               Thêm vào giỏ
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function PromoCard({ color, title, desc }: any) {
  return (
    <div className={`${color} rounded-lg p-6 min-h-[160px] border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-center`}>
      <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-700 text-sm mb-4">{desc}</p>
      <Link to="/products" className="bg-[#047857] text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#fbc02d] hover:text-gray-900 transition-colors w-fit">Xem ngay</Link>
    </div>
  );
}

const TimeBox = ({ val, label }: any) => (
  <div className="bg-white rounded p-1.5 min-w-[45px] text-center shadow-sm">
    <div className="text-[#047857] font-bold text-xl leading-none">{val.toString().padStart(2, '0')}</div>
    <div className="text-gray-600 text-[10px] mt-0.5">{label}</div>
  </div>
);