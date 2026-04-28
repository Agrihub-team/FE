// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [suggestionProducts, setSuggestionProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [qty25, setQty25] = useState(0);
  const [qty50, setQty50] = useState(0);
  const [qtyKg, setQtyKg] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [activeTab, setActiveTab] = useState('desc');

  const addItem = useCartStore((s) => s.addItem);
  const setVoucherStore = useCartStore((s) => s.setVoucher);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodData, vData, allProdData] = await Promise.all([
          apiClient.get(`/products/${id}`),
          apiClient.get(`/vouchers`),
          apiClient.get(`/products`)
        ]);

        const item = prodData?.product || prodData;
        setProduct(item);
        setVouchers(vData || []);
        
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

  if (loading || !product) return <div className="min-h-screen flex items-center justify-center font-bold text-[#047857]">Đang tải Agri-Hub...</div>;

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
  
  // Lọc voucher toàn sàn (không có applicableProducts hoặc mảng rỗng)
  const globalVouchers = vouchers.filter(v => !v.applicableProducts || v.applicableProducts.length === 0);

  const isEligible = selectedVoucher && subTotal >= (parseFloat(selectedVoucher.minAmount) || 0);
  const discountVal = isEligible ? parseFloat(selectedVoucher.discount) : 0;
  const finalTotal = Math.max(0, subTotal - discountVal);

  const handleAddToCart = () => {
    if (subTotal === 0) return alert("Vui lòng chọn số lượng hàng!");
    
    addItem({
      _id: `${product._id}-${Date.now()}`, 
      originalId: product._id, 
      name: product.name, 
      image: product.image,
      q25: qty25, 
      p25: p25, // Giá đã sale
      q50: qty50, 
      p50: p50, // Giá đã sale
      qKg: qtyKg, 
      pKg: pk,  // Giá đã sale
      itemVoucher: isEligible ? selectedVoucher : (product.voucherInfo || null) 
    });
    
    if (isEligible) setVoucherStore(selectedVoucher);
    
    alert(`✅ Đã thêm vào giỏ hàng thành công với giá sale: ${finalTotal.toLocaleString()}đ`);
    setQty25(0); setQty50(0); setQtyKg(0); setSelectedVoucher(null);
  };

  const handleSelectVoucher = (v) => {
    const minReq = parseFloat(v.minAmount) || 0;
    if (subTotal < minReq) {
      alert(`⚠️ Mã ${v.code} yêu cầu đơn hàng từ ${minReq.toLocaleString()}đ. Bạn cần mua thêm ${(minReq - subTotal).toLocaleString()}đ.`);
      return;
    }
    setSelectedVoucher(selectedVoucher?._id === v._id ? null : v);
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
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="aspect-square flex items-center justify-center overflow-hidden">
                  <img src={`http://localhost:3001/images/products/${product.image}`} className="max-h-full object-contain" />
                </div>
              </div>
              <div className="bg-slate-50 border border-gray-300 rounded-xl p-6 shadow-sm border-t-4 border-[#047857]">
                 <div className="space-y-4">
                    <div className="flex justify-between text-[13px] border-b border-gray-200 pb-3">
                       <span className="text-gray-500 font-bold uppercase tracking-wider">Thương hiệu</span>
                       <span className="text-[#047857] font-bold uppercase">{product.brand_id?.name || 'AGRI-HUB'}</span>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] font-bold text-gray-500 uppercase">Trạng thái kho:</p>
                       <div className="flex flex-wrap gap-2 text-[11px] font-medium text-gray-600">
                          <span className="bg-white px-2.5 py-1 rounded border border-gray-300 shadow-sm font-bold italic">25kg: {product.stock_25kg || 0}</span>
                          <span className="bg-white px-2.5 py-1 rounded border border-gray-300 shadow-sm font-bold italic">50kg: {product.stock_50kg || 0}</span>
                          <span className="bg-white px-2.5 py-1 rounded border border-gray-300 shadow-sm font-bold italic">Lẻ: {product.stock_total_kg || 0}kg</span>
                       </div>
                    </div>
                    <p className="text-[12px] font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-full inline-block border border-orange-100 italic">🔥 Đã bán: {Math.floor(Math.random() * 500) + 100} sản phẩm</p>
                 </div>
              </div>
            </div>

            {/* PHẢI: CHỌN HÀNG & RECIEPT */}
            <div className="md:w-[58%] w-full">
              <h1 className="text-2xl font-bold text-gray-900 mb-8 uppercase tracking-tight leading-tight border-b border-gray-200 pb-5">{product.name}</h1>
              
              <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
                <div className="lg:w-1/2 flex flex-col bg-slate-50 border border-gray-300 rounded-xl p-5 shadow-sm">
                   <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5 border-l-4 border-[#047857] pl-3">1. QUY CÁCH ĐÓNG GÓI</p>
                   <div className="space-y-3 flex-1 flex flex-col justify-center">
                     {[
                       { label: 'Bao 25kg', price: p25, oldPrice: p25Raw, qty: qty25, set: setQty25 },
                       { label: 'Bao 50kg', price: p50, oldPrice: p50Raw, qty: qty50, set: setQty50 },
                       { label: 'Ký lẻ nông sản', price: pk, oldPrice: pkRaw, qty: qtyKg, set: setQtyKg }
                     ].map((item, idx) => (
                       <div key={idx} className={`p-3 border-2 rounded-xl flex justify-between items-center transition-all ${item.qty > 0 ? 'border-[#047857] bg-white shadow-md' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                         <div>
                            <p className="text-[12px] font-bold uppercase text-gray-600">{item.label}</p>
                            <div className="flex items-center gap-2">
                               <p className="text-[#047857] font-bold text-[14px]">{item.price.toLocaleString()}đ</p>
                               {item.price < item.oldPrice && (
                                 <span className="text-[11px] text-gray-400 line-through">{item.oldPrice.toLocaleString()}đ</span>
                               )}
                            </div>
                         </div>
                         <div className="flex items-center bg-slate-100 border border-gray-200 rounded-lg p-1">
                            <button onClick={() => item.set(Math.max(0, item.qty - 1))} className="w-7 h-7 font-bold text-gray-400 hover:text-red-500">−</button>
                            <span className="w-8 text-center text-[13px] font-bold">{item.qty}</span>
                            <button onClick={() => item.set(item.qty + 1)} className="w-7 h-7 font-bold text-gray-400 hover:text-[#047857]">+</button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="lg:w-1/2 flex flex-col bg-slate-50 border border-gray-300 rounded-xl p-5 shadow-sm">
                   <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5 border-l-4 border-[#047857] pl-3">2. VOUCHER TOÀN SÀN</p>
                   <div className="space-y-3 flex-1 overflow-y-auto max-h-[240px] pr-1">
                     {globalVouchers.length > 0 ? globalVouchers.map((v) => {
                       const active = selectedVoucher?._id === v._id;
                       const canSelect = subTotal >= (v.minAmount || 0);
                       return (
                         <div key={v._id} onClick={() => handleSelectVoucher(v)}
                           className={`p-3 border-2 rounded-xl transition-all relative cursor-pointer ${active ? 'border-[#047857] bg-white shadow-md' : 'border-dashed border-gray-300 bg-white hover:border-[#047857]'} ${!canSelect ? 'opacity-50' : ''}`}>
                           <div className="flex justify-between items-center">
                              <p className="text-[12px] font-bold uppercase text-gray-800">{v.code}</p>
                              <p className="text-[#047857] font-bold text-[15px]">-{parseFloat(v.discount || 0).toLocaleString()}đ</p>
                           </div>
                           <p className="text-[10px] text-gray-400 font-medium uppercase mt-1 tracking-tighter">Đơn từ {Number(v.minAmount || 0).toLocaleString()}đ</p>
                         </div>
                       );
                     }) : (
                        <p className="text-[11px] text-gray-400 italic text-center py-10">Hiện không có voucher toàn sàn nào.</p>
                     )}
                   </div>
                </div>
              </div>

              {/* 🧾 TÓM TẮT ĐƠN HÀNG */}
              <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-sm">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase mb-6 tracking-widest border-b border-gray-100 pb-3">TÓM TẮT ĐƠN HÀNG</h3>
                <div className="space-y-4 mb-8 border-b border-gray-100 pb-6 font-medium text-[14px]">
                  {qty25 > 0 && <div className="flex justify-between text-gray-600 italic"><span>{qty25} bao 25kg x {p25.toLocaleString()}đ:</span><span>{(qty25*p25).toLocaleString()}đ</span></div>}
                  {qty50 > 0 && <div className="flex justify-between text-gray-600 italic"><span>{qty50} bao 50kg x {p50.toLocaleString()}đ:</span><span>{(qty50*p50).toLocaleString()}đ</span></div>}
                  {qtyKg > 0 && <div className="flex justify-between text-gray-600 italic"><span>{qtyKg} ký lẻ x {pk.toLocaleString()}đ:</span><span>{(qtyKg*pk).toLocaleString()}đ</span></div>}
                  
                  {isEligible && (
                    <div className="flex justify-between items-center text-[14px] font-bold text-[#047857] bg-green-50 p-4 rounded-xl border border-green-100">
                      <span>Voucher toàn sàn: <b className="uppercase underline decoration-dotted ml-1">{selectedVoucher.code}</b></span>
                      <span>-{discountVal.toLocaleString()}đ</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mb-10 px-2">
                   <span className="text-[13px] font-bold uppercase text-gray-400 tracking-wider italic">THỰC TRẢ:</span>
                   <span className="text-2xl font-bold text-[#047857] tracking-tight italic">{(finalTotal).toLocaleString()}đ</span>
                </div>
                <button 
                  onClick={handleAddToCart} 
                  className="w-full bg-[#047857] hover:bg-[#fbc02d] hover:text-gray-900 text-white py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                >
                  THÊM VÀO GIỎ HÀNG
                </button>
              </div>
            </div>
          </div>

          {/* TAB MÔ TẢ */}
          <div className="flex flex-col lg:flex-row gap-10 mb-24 items-stretch">
             <div className="lg:w-[75%] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                <div className="flex border-b border-gray-200 bg-white">
                  {['MÔ TẢ SẢN PHẨM', 'HƯỚNG DẪN KỸ THUẬT', 'ĐÁNH GIÁ'].map((tab, i) => (
                    <button key={i} onClick={() => setActiveTab(['desc', 'guide', 'review'][i])}
                      className={`px-12 py-5 text-[12px] font-bold uppercase tracking-widest border-b-4 transition-all ${activeTab === ['desc', 'guide', 'review'][i] ? 'text-[#047857] border-[#047857]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="p-12 text-[15px] text-gray-500 leading-relaxed flex-1">
                  {activeTab === 'desc' && <div className="whitespace-pre-line border-l-4 border-gray-100 pl-8 italic">{product.description}</div>}
                  {activeTab === 'guide' && <p className="text-center py-20 text-gray-400 font-medium">Hệ thống đang cập nhật tài liệu kỹ thuật chăn nuôi...</p>}
                  {activeTab === 'review' && <p className="text-center py-20 text-gray-400 font-medium">Chưa có đánh giá nào từ đại lý.</p>}
                </div>
             </div>

             {/* GỢI Ý BÊN CẠNH */}
             <div className="lg:w-[25%] flex flex-col">
                <h2 className="text-[12px] font-bold text-gray-900 uppercase tracking-widest border-l-4 border-yellow-400 pl-4 mb-8">CÓ THỂ BẠN QUAN TÂM</h2>
                <div className="flex flex-col gap-5 flex-1">
                   {suggestionProducts.map((p) => (
                     <Link to={`/products/${p._id}`} key={p._id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-5 hover:border-[#047857] hover:shadow-md transition-all shadow-sm">
                        <div className="w-14 h-14 flex-shrink-0 p-1 bg-gray-50 rounded-lg overflow-hidden">
                           <img src={`http://localhost:3001/images/products/${p.image}`} className="w-full h-full object-contain" />
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-[11px] font-bold text-gray-700 line-clamp-2 uppercase leading-tight mb-1">{p.name}</h4>
                          <p className="text-[#047857] font-bold text-[13px] italic">{(parseFloat(p.price_bag_25kg) || 0).toLocaleString()}đ</p>
                        </div>
                     </Link>
                   ))}
                </div>
             </div>
          </div>

          {/* SẢN PHẨM CÙNG DANH MỤC */}
          <section className="pt-16 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-12 border-b-4 border-yellow-400 pb-3 inline-block uppercase tracking-wider italic">SẢN PHẨM CÙNG DANH MỤC</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {relatedProducts.map((p) => {
                const price = parseFloat(p.price_bag_25kg) || 0;
                return (
                  <div key={p._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#047857] hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden shadow-sm text-center">
                    <Link to={`/products/${p._id}`} className="flex-1">
                      <div className="aspect-square mb-8 flex items-center justify-center overflow-hidden bg-gray-50 rounded-xl p-5 shadow-inner">
                        <img src={`http://localhost:3001/images/products/${p.image}`} className="max-h-full object-contain hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h3 className="text-[12px] font-bold text-gray-800 mb-3 line-clamp-2 uppercase leading-tight h-10">{p.name}</h3>
                      <p className="text-[#047857] font-bold text-xl italic mb-6">{price.toLocaleString()}đ</p>
                    </Link>
                    <button 
                      onClick={() => {
                          addItem({
                            _id: `${p._id}-${Date.now()}`, originalId: p._id, name: p.name, image: p.image,
                            q25: 1, p25: price, q50: 0, p50: 0, qKg: 0, pKg: 0
                          });
                          alert(`✅ Đã thêm ${p.name} vào giỏ hàng!`);
                      }}
                      className="w-full bg-[#047857] text-white py-3 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#fbc02d] hover:text-slate-900 transition-all shadow-sm"
                    >
                      THÊM VÀO GIỎ HÀNG
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
};