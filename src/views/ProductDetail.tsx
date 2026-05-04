// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";
import { toast } from "sonner";
import { IMAGE_URL } from '../utils/config';
import { SHIP_TIERS } from '../utils/locations';

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [suggestionProducts, setSuggestionProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [qty25, setQty25] = useState(0);
  const [qty50, setQty50] = useState(0);
  const [qtyKg, setQtyKg] = useState(0);
  const [activeTab, setActiveTab] = useState('desc');
  const [soldCount] = useState(() => Math.floor(Math.random() * 500) + 100);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodData, allProdData] = await Promise.all([
          apiClient.get(`/products/${id}`),
          apiClient.get(`/products`)
        ]);

        const item = prodData?.product || prodData;
        setProduct(item);
        
        const allProds = allProdData?.products || allProdData || [];
        setSuggestionProducts(allProds.filter(p => p._id !== id).sort(() => 0.5 - Math.random()).slice(0, 6));
        setRelatedProducts(allProds.filter(p => p.category_id === (item.category_id || item.categoryId) && p._id !== id).slice(0, 4));
      } catch (error) { 
        console.error("Lỗi lấy dữ liệu sản phẩm:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    if (id) fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading || !product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#047857] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-[#047857]">Đang tải sản phẩm...</span>
      </div>
    </div>
  );

  // --- LOGIC TÍNH GIÁ SALE TRỰC TIẾP CHO SẢN PHẨM ---
  const getSalePrice = (originalPrice) => {
    if (!product.voucherInfo || originalPrice <= 0) return originalPrice;
    const { discount, type } = product.voucherInfo;
    if (type === 'percentage') {
      return originalPrice * (1 - parseFloat(discount) / 100);
    }
    return Math.max(0, originalPrice - parseFloat(discount));
  };

  const p25Raw = parseFloat(product.price_bag_25kg) || 0;
  const p50Raw = parseFloat(product.price_bag_50kg) || 0;
  const pkRaw = parseFloat(product.price_kg) || 0;

  // Giá sau khi đã áp dụng sale trực tiếp (nếu có)
  const p25 = getSalePrice(p25Raw);
  const p50 = getSalePrice(p50Raw);
  const pk = getSalePrice(pkRaw);

  const subTotal = (qty25 * p25) + (qty50 * p50) + (qtyKg * pk);

  const handleAddToCart = () => {
    if (subTotal === 0) { toast.warning("Vui lòng chọn số lượng hàng!"); return; }

    if (qty25 > (product.stock_25kg || 0) && (product.stock_25kg || 0) >= 0) {
      toast.error(`Chỉ còn ${product.stock_25kg} bao 25kg trong kho!`); return;
    }
    if (qty50 > (product.stock_50kg || 0)) {
      toast.error(`Chỉ còn ${product.stock_50kg} bao 50kg trong kho!`); return;
    }
    if (qtyKg > (product.stock_total_kg || 0)) {
      toast.error(`Chỉ còn ${product.stock_total_kg}kg lẻ trong kho!`); return;
    }

    addItem({
      _id: `${product._id}-${Date.now()}`,
      originalId: product._id,
      name: product.name,
      image: product.image,
      q25: qty25, p25,
      q50: qty50, p50,
      qKg: qtyKg, pKg: pk,
      itemVoucher: product.voucherInfo || null
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`, { duration: 2500 });
    setQty25(0); setQty50(0); setQtyKg(0);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pb-20 font-sans text-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div className="py-6 text-[14px] text-gray-400 font-medium flex gap-2">
            <Link to="/" className="hover:text-[#047857]">Trang chủ</Link> <span>›</span>
            <Link to="/products" className="hover:text-[#047857]">Sản phẩm</Link> <span>›</span>
            <span className="text-gray-900 font-semibold">{product.name}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-10 mb-12 items-start">
            {/* TRÁI: ẢNH & THÔNG SỐ */}
            <div className="md:w-[42%] w-full sticky top-6 space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="aspect-square flex items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                  <img src={`${IMAGE_URL}/${product.image}`} alt={product.name} className="max-h-full object-contain hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
                 <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 border-l-4 border-[#047857] pl-3">THÔNG TIN KHO</p>
                 <div className="space-y-4">
                    <div className="flex justify-between text-[13px] border-b border-gray-200 pb-3">
                       <span className="text-gray-500 font-bold uppercase tracking-wider">Thương hiệu</span>
                       <span className="text-[#047857] font-bold uppercase">{product.brand_id?.name || 'AGRI-HUB'}</span>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] font-bold text-gray-500 uppercase">Tồn kho:</p>
                       <div className="flex flex-wrap gap-2 text-[11px] font-medium text-gray-600">
                          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm font-bold">25kg: {product.stock_25kg || 0}</span>
                          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm font-bold">50kg: {product.stock_50kg || 0}</span>
                          <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm font-bold">Lẻ: {product.stock_total_kg || 0}kg</span>
                       </div>
                    </div>
                    <p className="text-[12px] font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full inline-block border border-orange-100">🔥 Đã bán: {soldCount} sản phẩm</p>
                 </div>
              </div>
            </div>

            {/* PHẢI: CHỌN HÀNG & RECIEPT */}
            <div className="md:w-[58%] w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-8 uppercase tracking-tight leading-tight border-b border-gray-200 pb-5">{product.name}</h1>
              
              <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
                <div className="lg:w-1/2 flex flex-col bg-slate-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
                   <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5 border-l-4 border-[#047857] pl-3">1. QUY CÁCH ĐÓNG GÓI</p>
                   <div className="space-y-3 flex-1 flex flex-col justify-center">
                     {[
                       { label: 'Bao 25kg', price: p25, oldPrice: p25Raw, qty: qty25, set: setQty25, stock: product.stock_25kg || 0 },
                       { label: 'Bao 50kg', price: p50, oldPrice: p50Raw, qty: qty50, set: setQty50, stock: product.stock_50kg || 0 },
                       { label: 'Ký lẻ nông sản', price: pk, oldPrice: pkRaw, qty: qtyKg, set: setQtyKg, stock: product.stock_total_kg || 0 }
                     ].map((item, idx) => {
                       const outOfStock = item.stock === 0;
                       const overLimit = item.qty > item.stock;
                       return (
                         <div key={idx} className={`p-3 border-2 rounded-xl flex justify-between items-center transition-all ${overLimit ? 'border-red-400 bg-red-50' : item.qty > 0 ? 'border-[#047857] bg-white shadow-md' : outOfStock ? 'border-gray-200 bg-gray-50 opacity-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                           <div>
                              <p className="text-[12px] font-bold uppercase text-gray-600">{item.label}</p>
                              <div className="flex items-center gap-2">
                                 <p className={`font-bold text-[14px] ${outOfStock ? 'text-gray-400' : 'text-[#047857]'}`}>{item.price.toLocaleString()}đ</p>
                                 {item.price < item.oldPrice && (
                                   <span className="text-[11px] text-gray-400 line-through">{item.oldPrice.toLocaleString()}đ</span>
                                 )}
                              </div>
                              <p className={`text-[10px] font-bold mt-0.5 ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
                                {outOfStock ? 'Hết hàng' : overLimit ? `Vượt tồn kho (còn ${item.stock})` : `Còn ${item.stock}`}
                              </p>
                           </div>
                           <div className="flex items-center bg-slate-100 border border-gray-200 rounded-lg p-1">
                              <button onClick={() => item.set(Math.max(0, item.qty - 1))} disabled={outOfStock} className="w-7 h-7 font-bold text-gray-400 hover:text-red-500 disabled:opacity-30">−</button>
                              <span className={`w-8 text-center text-[13px] font-bold ${overLimit ? 'text-red-500' : ''}`}>{item.qty}</span>
                              <button onClick={() => item.set(Math.min(item.stock, item.qty + 1))} disabled={outOfStock || item.qty >= item.stock} className="w-7 h-7 font-bold text-gray-400 hover:text-[#047857] disabled:opacity-30">+</button>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>

                <div className="lg:w-1/2 flex flex-col bg-slate-50 border border-gray-200 rounded-2xl p-5 shadow-sm">
                   <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 border-l-4 border-[#047857] pl-3">2. PHÍ VẬN CHUYỂN</p>
                   <div className="space-y-2 flex-1">
                     {SHIP_TIERS.map((t, i) => (
                       <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                         <p className="text-[11px] font-black text-gray-700 uppercase">
                           {i === 0 ? 'Nội thành TP.HCM (≤30km)' : `Khu vực ${i} — ≤${t.maxKm}km`}
                         </p>
                         <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                           {i === 0
                             ? `Dưới ${t.freeKg}kg: 50,000đ cố định · Từ ${t.freeKg}kg: Miễn phí`
                             : `Tối thiểu ${t.minKg}kg · ${(t.perKg as number).toLocaleString()}đ/kg · Từ ${t.freeKg.toLocaleString()}kg: Miễn phí`}
                         </p>
                       </div>
                     ))}
                     <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
                       <p className="text-[11px] font-black text-orange-700 uppercase">⚡ Hỏa tốc</p>
                       <p className="text-[10px] text-orange-600 mt-0.5">Trong vòng 80km · Tối đa 500kg · Phí × 1.5</p>
                     </div>
                   </div>
                </div>
              </div>

              {/* TÓM TẮT ĐƠN HÀNG */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 border-l-4 border-gray-200 pl-3">TÓM TẮT ĐƠN HÀNG</p>
                <div className="space-y-3 mb-5 border-b border-gray-100 pb-5 text-[13px]">
                  {qty25 === 0 && qty50 === 0 && qtyKg === 0 && (
                    <p className="text-gray-400 italic text-center py-2">Chưa chọn sản phẩm nào</p>
                  )}
                  {qty25 > 0 && <div className="flex justify-between text-gray-600"><span>{qty25} bao 25kg × {p25.toLocaleString()}đ</span><span className="font-bold">{(qty25*p25).toLocaleString()}đ</span></div>}
                  {qty50 > 0 && <div className="flex justify-between text-gray-600"><span>{qty50} bao 50kg × {p50.toLocaleString()}đ</span><span className="font-bold">{(qty50*p50).toLocaleString()}đ</span></div>}
                  {qtyKg > 0 && <div className="flex justify-between text-gray-600"><span>{qtyKg} ký lẻ × {pk.toLocaleString()}đ</span><span className="font-bold">{(qtyKg*pk).toLocaleString()}đ</span></div>}
                </div>
                <div className="flex justify-between items-center mb-5">
                   <span className="text-[12px] font-bold uppercase text-gray-400 tracking-wider">THỰC TRẢ:</span>
                   <span className="text-2xl font-black text-[#047857] tracking-tight">{subTotal.toLocaleString()}<span className="text-base ml-0.5">đ</span></span>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-[#047857] hover:bg-[#fbc02d] hover:text-gray-900 text-white py-3.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                >
                  THÊM VÀO GIỎ HÀNG
                </button>
              </div>
            </div>
          </div>

          {/* TAB MÔ TẢ */}
          <div className="flex flex-col lg:flex-row gap-10 mb-24 items-stretch">
             <div className="lg:w-[75%] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                <div className="flex border-b border-gray-200 bg-white overflow-x-auto no-scrollbar">
                  {['MÔ TẢ SẢN PHẨM', 'HƯỚNG DẪN KỸ THUẬT', 'ĐÁNH GIÁ'].map((tab, i) => (
                    <button key={i} onClick={() => setActiveTab(['desc', 'guide', 'review'][i])}
                      className={`px-6 md:px-10 py-4 text-[12px] font-bold uppercase tracking-widest border-b-4 whitespace-nowrap transition-all ${activeTab === ['desc', 'guide', 'review'][i] ? 'text-[#047857] border-[#047857]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-8 text-[14px] text-gray-500 leading-relaxed flex-1">
                  {activeTab === 'desc' && <div className="whitespace-pre-line border-l-4 border-gray-100 pl-6">{product.description || 'Chưa có mô tả sản phẩm.'}</div>}
                  {activeTab === 'guide' && <p className="text-center py-16 text-gray-400 font-medium">Hệ thống đang cập nhật tài liệu kỹ thuật chăn nuôi...</p>}
                  {activeTab === 'review' && <p className="text-center py-16 text-gray-400 font-medium">Chưa có đánh giá nào từ đại lý.</p>}
                </div>
             </div>

             {/* GỢI Ý BÊN CẠNH */}
             <div className="lg:w-[25%] flex flex-col">
                <h2 className="text-[12px] font-bold text-gray-900 uppercase tracking-widest border-l-4 border-yellow-400 pl-4 mb-6">CÓ THỂ BẠN QUAN TÂM</h2>
                <div className="flex flex-col gap-3 flex-1">
                   {suggestionProducts.map((p) => (
                     <Link to={`/products/${p._id}`} key={p._id} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 hover:border-[#047857] hover:shadow-md transition-all shadow-sm">
                        <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                           <img src={`${IMAGE_URL}/${p.image}`} alt={p.name} className="w-full h-full object-contain p-1" />
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <h4 className="text-[11px] font-bold text-gray-700 line-clamp-2 uppercase leading-tight mb-0.5">{p.name}</h4>
                          <p className="text-[#047857] font-bold text-[12px]">{(parseFloat(p.price_bag_25kg) || 0).toLocaleString()}đ</p>
                        </div>
                     </Link>
                   ))}
                </div>
             </div>
          </div>

          {/* SẢN PHẨM CÙNG DANH MỤC */}
          {relatedProducts.length > 0 && (
            <section className="pt-12 border-t border-gray-100">
              <h2 className="text-[15px] font-black text-gray-900 mb-8 uppercase tracking-wider border-l-4 border-yellow-400 pl-4">SẢN PHẨM CÙNG DANH MỤC</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {relatedProducts.map((p) => {
                  const price = parseFloat(p.price_bag_25kg) || 0;
                  return (
                    <div key={p._id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-[#047857] hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden shadow-sm text-center">
                      <Link to={`/products/${p._id}`} className="flex-1">
                        <div className="aspect-square mb-4 flex items-center justify-center overflow-hidden bg-gray-50 rounded-xl p-3">
                          <img src={`${IMAGE_URL}/${p.image}`} alt={p.name} className="max-h-full object-contain hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h3 className="text-[12px] font-bold text-gray-800 mb-2 line-clamp-2 uppercase leading-tight">{p.name}</h3>
                        <p className="text-[#047857] font-bold text-base mb-4">{price.toLocaleString()}đ</p>
                      </Link>
                      <button
                        onClick={() => {
                          addItem({ _id: `${p._id}-${Date.now()}`, originalId: p._id, name: p.name, image: p.image, q25: 1, p25: price, q50: 0, p50: 0, qKg: 0, pKg: 0 });
                          toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`, { duration: 2500 });
                        }}
                        className="w-full bg-[#047857] text-white py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#fbc02d] hover:text-slate-900 transition-all shadow-sm"
                      >
                        THÊM VÀO GIỎ HÀNG
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};