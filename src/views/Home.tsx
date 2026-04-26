// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { productService } from "../controllers/productService";
import { categoryService } from "../controllers/categoryService";
import { useCartStore } from "../store/cartStore";

const IMAGE_PRODUCT_URL = import.meta.env?.VITE_IMAGE_URL || 'http://localhost:3001/images/products';
const IMAGE_CAT_URL = import.meta.env?.VITE_CAT_IMAGE_URL || 'http://localhost:3001/images/categories';

// --- HÀM TÍNH GIÁ SALE DÙNG CHUNG ---
const calculateSalePrice = (product, originalPrice) => {
  if (!product.voucherInfo || originalPrice <= 0) return originalPrice;
  const { discount, type } = product.voucherInfo;
  const discountVal = parseFloat(discount) || 0;
  
  if (type === 'percentage') {
    return originalPrice * (1 - discountVal / 100);
  }
  return Math.max(0, originalPrice - discountVal);
};

// --- COMPONENT ĐẾM NGƯỢC THỜI GIAN THỰC ---
const CountdownTimer = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!endDate) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endDate).getTime() - now;

      if (distance < 0) {
        setTimeLeft("Đã hết hạn");
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days > 0 ? days + "n " : ""}${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return <b className="text-red-600 font-black ml-1">{timeLeft || "00:00:00"}</b>;
};

// Component Sản phẩm thường - ĐÃ CẬP NHẬT HIỂN THỊ GIÁ SALE
const ProductCard = ({ product, onAdd }: any) => {
  const originalPrice = parseFloat(product.price_bag_25kg) || parseFloat(product.price_bag_50kg) || parseFloat(product.price_bag) || 0;
  const salePrice = calculateSalePrice(product, originalPrice);
  const hasSale = salePrice < originalPrice;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#047857] hover:shadow-md transition flex flex-col h-full group relative">
      <Link to={`/products/${product._id}`} className="flex flex-col flex-1">
        <div className="h-40 mb-3 flex items-center justify-center overflow-hidden">
          <img src={`${IMAGE_PRODUCT_URL}/${product.image}`} alt={product.name} className="max-h-full object-contain group-hover:scale-105 transition duration-300" />
        </div>
        <h3 className="text-sm text-gray-800 mb-1 group-hover:text-[#047857] line-clamp-2 h-10 uppercase font-medium">{product.name}</h3>
        
        <div className="mt-auto mb-3 flex flex-col">
          {hasSale && (
            <span className="text-[11px] text-gray-400 line-through">{(originalPrice).toLocaleString()}đ</span>
          )}
          <span className={`text-base font-bold ${hasSale ? 'text-red-600' : 'text-[#047857]'}`}>
            {(salePrice).toLocaleString()}đ
          </span>
        </div>
      </Link>
      <button 
        onClick={(e) => { e.preventDefault(); onAdd(product); }} 
        className="w-full bg-[#047857] text-white py-2 rounded-full text-sm font-medium hover:bg-[#fbc02d] hover:text-gray-900 transition-colors"
      >
        Thêm vào giỏ
      </button>
    </div>
  );
};

// Component Flash Sale
const FlashSaleCard = ({ product, onAdd }: any) => {
  const originalPrice = parseFloat(product.price_bag_25kg) || parseFloat(product.price_bag) || 0;
  const discountValue = parseFloat(product.voucherInfo?.discount) || 0;
  const salePrice = calculateSalePrice(product, originalPrice);

  return (
    <div className="min-w-[280px] md:min-w-[350px] flex flex-col p-4 bg-white rounded-2xl border border-gray-200 hover:border-[#047857] hover:shadow-lg transition-all group relative h-full flex-shrink-0">
      <div className="flex gap-4 flex-1">
        <Link to={`/products/${product._id}`} className="w-1/3 relative flex items-center justify-center p-1 h-24">
          <img src={`${IMAGE_PRODUCT_URL}/${product.image}`} alt={product.name} className="max-h-full object-contain" />
        </Link>
        <div className="w-2/3 flex flex-col justify-center">
          <h3 className="font-bold text-gray-800 text-sm line-clamp-2 hover:text-[#047857] mb-1 leading-tight uppercase">{product.name}</h3>
          
          <p className="text-[10px] text-red-600 font-bold uppercase italic mb-1">
            Đang giảm: {discountValue.toLocaleString()}{product.voucherInfo?.type === 'percentage' ? '%' : 'đ'}
          </p>

          <span className="text-[11px] text-gray-400 line-through">{(originalPrice).toLocaleString()}đ</span>
          <span className="text-lg font-black text-red-600">{(salePrice).toLocaleString()}đ</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-dashed border-gray-100">
        <div className="flex justify-between items-center text-[10px] mb-2 uppercase font-bold">
          <div className="flex items-center text-gray-500">
            <span>Kết thúc:</span>
            <CountdownTimer endDate={product.voucherInfo?.endDate} />
          </div>
          <span className="text-gray-500">Còn: <b className="text-blue-600">{product.voucherInfo?.quantity || 0}</b></span>
        </div>
        
        <button 
          onClick={(e) => { e.preventDefault(); onAdd(product); }} 
          className="w-full py-3 rounded-xl text-xs font-black text-white uppercase tracking-widest transition-all btn-rainbow shadow-md hover:shadow-xl active:scale-95"
        >
          MUA NGAY
        </button>
      </div>
    </div>
  );
};

const PromoCard = ({ color, title, desc }: any) => (
  <div className={`${color} rounded-lg p-6 min-h-[160px] border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-center`}>
    <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
    <p className="text-gray-700 text-sm mb-4">{desc}</p>
    <Link to="/products" className="bg-[#047857] text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#fbc02d] hover:text-gray-900 transition-colors w-fit">Xem ngay</Link>
  </div>
);

export const Home = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [specialOffers, setSpecialOffers] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes rainbow-btn {
        0% { background-color: #047857; }
        33% { background-color: #0d9488; }
        66% { background-color: #1d4ed8; }
        100% { background-color: #047857; }
      }
      .btn-rainbow {
        animation: rainbow-btn 3s infinite linear;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const getProductsByCategory = (catIdMatch: string, keyword: string) => {
    return allProducts.filter(p => {
      const pCatId = (p.category_id?._id || p.category_id || p.categoryId || "").toString();
      const pCatName = p.category_id?.name || p.categoryId?.name || "";
      return pCatId === catIdMatch || pCatName.toLowerCase().includes(keyword.toLowerCase());
    });
  };

  // --- HÀM ADD TO CART ĐÃ SỬA LỖI GIÁ ---
  const handleAddToCart = (p: any) => {
    // 1. Lấy giá gốc
    const price25Raw = parseFloat(p.price_bag_25kg) || parseFloat(p.price_bag) || 0;
    const price50Raw = parseFloat(p.price_bag_50kg) || 0;
    const priceKgRaw  = parseFloat(p.price_kg) || 0;

    // 2. Tính toán giá sau sale cho từng loại (nếu sản phẩm có gắn voucher trực tiếp)
    const price25 = calculateSalePrice(p, price25Raw);
    const price50 = calculateSalePrice(p, price50Raw);
    const priceKg = calculateSalePrice(p, priceKgRaw);

    const uniqueId = `${p._id}-${Date.now()}`;
    
    addItem({
      _id: uniqueId, 
      originalId: p._id, 
      name: p.name, 
      image: p.image,
      q25: 1, 
      p25: price25, // Giá đã sale
      q50: 0, 
      p50: price50, // Giá đã sale
      qKg: 0, 
      pKg: priceKg,  // Giá đã sale
      itemVoucher: p.voucherInfo || null // Đính kèm info voucher vào item
    });

    alert(`✅ Đã thêm ${p.name} vào giỏ hàng với giá ${price25.toLocaleString()}đ!`);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [catData, prodData, voucherProdRes] = await Promise.all([
          categoryService.getAll(),
          productService.getAll(),
          fetch('http://localhost:3001/api/vouchers/special-offers').then(res => res.json())
        ]);
        setCategories(catData?.data || catData || []);
        setAllProducts(prodData?.data || prodData?.products || prodData || []);
        if (voucherProdRes.success) { setSpecialOffers(voucherProdRes.products); }
      } catch (error) { console.error("Lỗi tải dữ liệu Home:", error); } 
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#047857] text-lg italic">Đang tải Agri-Hub...</div>;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f5f5f5] pb-12 font-sans text-gray-800">
        <section className="max-w-[1200px] mx-auto px-4 mt-6">
          <div className="w-full rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-white">
            <img src="/banner.jpg" alt="Banner" className="w-full h-auto object-cover" />
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 uppercase">Danh mục nổi bật</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {categories.map((cat, idx) => (
                <Link key={cat._id || idx} to={`/products?category=${cat._id}`} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col items-center hover:border-[#047857] hover:shadow-md transition cursor-pointer group">
                  <div className="w-full aspect-square bg-gray-50 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                    <img src={cat.image?.startsWith('http') ? cat.image : `${IMAGE_CAT_URL}/${cat.image}`} alt={cat.name} className="w-full h-full object-contain p-2 mix-blend-multiply" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-800 text-center group-hover:text-[#047857] uppercase">{cat.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 uppercase">Sản phẩm mới nhập</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {allProducts.slice(0, 5).map((p, idx) => (
                <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-[25%] bg-[#a58641] rounded-lg p-6 text-white flex flex-col justify-center bg-gradient-to-b from-[#b39556] to-[#457c4f]">
                <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight uppercase">Bán chạy nhất<br />hàng ngày</h2>
                <p className="text-sm mb-4 text-yellow-200 border-b border-white/20 pb-3 inline-block w-fit italic">Ưu đãi độc quyền - Giảm giá 20%</p>
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

        {/* SECTION FLASH SALE */}
        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="border-2 border-[#047857] rounded-3xl overflow-hidden bg-white shadow-lg">
            <div className="bg-[#047857] p-5 flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter">⚡ Khuyến mãi đặc biệt - Đang diễn ra</h2>
              <div className="hidden md:block bg-white/20 px-4 py-1 rounded-full text-white text-xs font-bold uppercase">Trượt để xem thêm ➜</div>
            </div>
            
            <div className="p-4 md:p-8 bg-gray-50/50 flex flex-nowrap overflow-x-auto gap-6 no-scrollbar">
              {specialOffers.length > 0 ? (
                  specialOffers.map((p, idx) => (
                    <FlashSaleCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                  ))
              ) : (
                  <div className="w-full py-16 text-center text-gray-400 italic flex-shrink-0">
                      <p className="text-lg mb-2">Agri-Hub đang chuẩn bị các mã giảm giá mới...</p>
                      <p className="text-sm">Quay lại sau ít phút để nhận ưu đãi!</p>
                  </div>
              )}
            </div>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-4 mt-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-[75%]">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b border-gray-100 pb-2 inline-block border-b-2 border-yellow-400 uppercase">Cám Heo / Cám Bò / Cám Gà</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getProductsByCategory("1", "Heo").slice(0, 8).map((p, idx) => (
                    <ProductCard key={p._id || idx} product={p} onAdd={handleAddToCart} />
                  ))}
                </div>
              </div>
              <div className="lg:w-[25%] bg-[#6a7f45] rounded-lg p-6 text-white flex flex-col items-center text-center">
                 <h3 className="text-2xl font-bold mb-3 mt-4 uppercase">Sản phẩm nổi bật</h3>
                 <p className="text-sm mb-8 opacity-90 italic">Mua sắm thoải mái chỉ từ 200.000đ</p>
                 <Link to="/products" className="bg-white text-gray-800 px-8 py-2 rounded-full text-sm font-bold w-fit hover:bg-[#fbc02d] transition mb-10">Mua ngay</Link>
                 <div className="w-full h-48 bg-white/10 rounded-md flex items-center justify-center font-bold text-sm border border-white/20">AGRI-HUB CHẤT LƯỢNG CAO</div>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button onClick={() => navigate('/products')} className="border border-[#047857] text-[#047857] px-8 py-2 rounded-full text-sm font-bold uppercase hover:bg-[#fbc02d] hover:text-gray-900 hover:border-[#fbc02d] transition-all">Xem tất cả sản phẩm</button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};