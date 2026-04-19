// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";
import { ShoppingBag, ArrowLeft } from "lucide-react"; // Đừng quên import icon này

export const Cart = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const { 
    items, removeItem, updateDetailQuantity, toggleSelect, 
    applyVoucherToItem, getSelectedTotal, loadCart 
  } = useCartStore();

  // 1. Tải dữ liệu giỏ hàng từ Server và lấy danh sách Voucher
  useEffect(() => {
    // Load giỏ hàng từ DB lên Store
    loadCart();

    // Lấy danh sách voucher
    apiClient.get("/vouchers")
      .then(res => {
        // Kiểm tra cấu trúc data trả về (res.data hoặc res)
        setVouchers(res?.data || res || []);
      })
      .catch(err => console.error("Lỗi lấy voucher:", err));
    
    // Cuộn lên đầu trang khi vào giỏ hàng
    window.scrollTo(0, 0);
  }, [loadCart]);

  const finalTotal = getSelectedTotal();
  const selectedItems = items.filter(i => i.selected);

  const handleCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("⚠️ Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
    navigate("/checkout");
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fcfcfc] pb-20 font-sans text-slate-800">
        
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          {/* Breadcrumbs */}
          <div className="py-6 text-[14px] text-gray-400 font-medium flex gap-2">
            <Link to="/" className="hover:text-[#047857]">Trang chủ</Link> <span>›</span>
            <span className="text-gray-900 font-bold uppercase tracking-tighter">Giỏ hàng</span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-8 uppercase italic border-l-4 border-[#047857] pl-4">
            GIỎ HÀNG CHI TIẾT ({selectedItems.length})
          </h1>

          {items.length === 0 ? (
            /* ================= TRẠNG THÁI GIỎ HÀNG TRỐNG MỚI ================= */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center mb-10">
              <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-[#047857]">
                <ShoppingBag size={64} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Giỏ hàng đang trống</h2>
              <p className="text-gray-500 mb-8">Có vẻ như bạn chưa thêm nông sản nào vào giỏ.</p>
              <Link 
                to="/products" 
                className="bg-[#047857] hover:bg-[#036046] text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                <ArrowLeft size={20} /> Mua hàng ngay
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* 1. DANH SÁCH DÒNG HÀNG (BÊN TRÁI) */}
              <div className="lg:w-[68%] space-y-4 w-full">
                {items.map((item) => {
                  // Tính toán tiền thô cho từng item để check điều kiện Voucher
                  const itemSubTotal = (Number(item.q25) * Number(item.p25)) + 
                                       (Number(item.q50) * Number(item.p50)) + 
                                       (Number(item.qKg) * Number(item.pKg));
                  
                  return (
                    <div key={item._id} className={`bg-white border-2 rounded-[2rem] p-5 transition-all ${item.selected ? 'border-[#047857] shadow-sm' : 'border-gray-100 opacity-60'}`}>
                      
                      <div className="flex items-center gap-4">
                        <input 
                          type="checkbox" 
                          checked={item.selected} 
                          onChange={() => toggleSelect(item._id)} 
                          className="w-5 h-5 accent-[#047857] cursor-pointer shrink-0" 
                        />
                        
                        <div className="w-16 h-16 bg-slate-50 rounded-xl p-1 border border-gray-100 shrink-0 overflow-hidden">
                            <img 
                              src={`http://localhost:3001/images/products/${item.image}`} 
                              alt={item.name}
                              className="w-full h-full object-contain" 
                              onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                            />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                             <h3 className="text-[14px] font-bold text-gray-800 uppercase leading-tight pr-4">{item.name}</h3>
                             <div className="text-right shrink-0">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 tracking-widest">Thành tiền món này</span>
                                <span className="text-[18px] font-bold text-[#047857] italic leading-none">{itemSubTotal.toLocaleString()}đ</span>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                                {[
                                  { k: 'q25', p: item.p25, label: 'BAO 25KG' }, 
                                  { k: 'q50', p: item.p50, label: 'BAO 50KG' }, 
                                  { k: 'qKg', p: item.pKg, label: 'KÝ LẺ' }
                                ].map((spec) => (
                                  Number(spec.p) > 0 && (
                                    <div key={spec.k} className="bg-slate-50/50 border border-gray-200 rounded-xl p-2.5 flex flex-col gap-1">
                                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{spec.label}</span>
                                      <div className="flex items-center gap-2 scale-95 origin-left">
                                        <div className="flex items-center bg-white border border-gray-300 rounded p-0.5 shadow-sm">
                                          <button 
                                            onClick={() => updateDetailQuantity(item._id, spec.k, item[spec.k] - 1)} 
                                            className="w-6 h-6 flex items-center justify-center font-bold text-gray-400 hover:text-red-500 transition-colors"
                                          >−</button>
                                          <span className="w-8 text-center text-[12px] font-bold text-gray-700">{item[spec.k]}</span>
                                          <button 
                                            onClick={() => updateDetailQuantity(item._id, spec.k, item[spec.k] + 1)} 
                                            className="w-6 h-6 flex items-center justify-center font-bold text-gray-400 hover:text-[#047857] transition-colors"
                                          >+</button>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#047857] italic whitespace-nowrap">x{Number(spec.p).toLocaleString()}đ</span>
                                      </div>
                                    </div>
                                  )
                                ))}
                            </div>

                            <button 
                              onClick={() => removeItem(item._id)} 
                              className="p-3 text-gray-300 hover:text-red-500 transition-all bg-gray-50 rounded-full hover:bg-red-50 self-center shadow-sm"
                              title="Xóa sản phẩm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Phần Voucher cho từng sản phẩm - ĐÃ THÊM YÊU CẦU RÕ RÀNG */}
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-200 bg-gray-50/30 -mx-5 px-5 -mb-5 pb-5 rounded-b-[2rem]">
                         <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                           <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest">🎟️ Mã giảm giá cho món này:</p>
                           <p className="text-[10px] text-gray-500 italic bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                             * <b>Lưu ý:</b> Điều kiện áp dụng được tính dựa trên <span className="text-[#047857] font-bold underline">Thành tiền món này</span>, không tính gộp cả giỏ hàng.
                           </p>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {vouchers.length > 0 ? vouchers.map((v) => {
                              const active = item.itemVoucher?._id === v._id;
                              const canUse = itemSubTotal >= v.minAmount;
                              return (
                                <button 
                                  key={v._id} 
                                  disabled={!canUse} 
                                  onClick={() => applyVoucherToItem(item._id, v)}
                                  className={`px-4 py-1.5 rounded-xl border transition-all text-left relative overflow-hidden ${
                                    active 
                                    ? 'bg-[#047857] text-white border-[#047857] shadow-md scale-105 z-10' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#047857]'
                                  } ${!canUse ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                                    {active && <span>✓</span>} {v.code}
                                  </div>
                                  <div className={`text-[9px] mt-0.5 italic ${active ? 'text-green-100' : 'text-gray-500'}`}>
                                    Giảm {Number(v.discount).toLocaleString()}đ (Cần đạt {Number(v.minAmount).toLocaleString()}đ)
                                  </div>
                                </button>
                              );
                            }) : (
                              <span className="text-[10px] text-gray-300 italic">Không có mã giảm giá nào hiện dụng</span>
                            )}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. TÓM TẮT ĐƠN HÀNG (BÊN PHẢI) */}
              <div className="lg:w-[32%] w-full sticky top-6">
                <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm border-b-[8px] border-[#047857]">
                   <h3 className="text-[14px] font-black text-gray-900 uppercase mb-8 tracking-widest border-b border-gray-100 pb-3 italic text-center">XÁC NHẬN ĐƠN HÀNG</h3>
                   
                   <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {selectedItems.map((si, idx) => {
                         const siRawTotal = (Number(si.q25) * Number(si.p25)) + 
                                            (Number(si.q50) * Number(si.p50)) + 
                                            (Number(si.qKg) * Number(si.pKg));
                         const siDiscount = si.itemVoucher ? Number(si.itemVoucher.discount) : 0;
                         const siFinalTotal = Math.max(0, siRawTotal - siDiscount);
                         
                         return (
                           <div key={si._id} className="pb-6 border-b border-gray-100 last:border-0">
                              <p className="text-[12px] font-black text-gray-800 uppercase line-clamp-1 mb-3">{idx + 1}. {si.name}</p>
                              <div className="pl-3 space-y-2 text-[11px] text-gray-500 italic font-medium">
                                 {si.q25 > 0 && <div className="flex justify-between"><span>- {si.q25} bao 25kg:</span><span>{(si.q25*si.p25).toLocaleString()}đ</span></div>}
                                 {si.q50 > 0 && <div className="flex justify-between"><span>- {si.q50} bao 50kg:</span><span>{(si.q50*si.p50).toLocaleString()}đ</span></div>}
                                 {si.qKg > 0 && <div className="flex justify-between"><span>- {si.qKg} ký lẻ:</span><span>{(si.qKg*si.pKg).toLocaleString()}đ</span></div>}
                                 
                                 {si.itemVoucher && (
                                   <div className="flex justify-between text-[#047857] font-black pt-1 bg-green-50 px-2 py-1 rounded mt-1">
                                     <span>🏷️ GIẢM GIÁ ({si.itemVoucher.code}):</span>
                                     <span>-{siDiscount.toLocaleString()}đ</span>
                                   </div>
                                 )}

                                 <div className="flex justify-between items-center text-gray-900 font-black border-t border-dashed border-gray-200 pt-2 mt-2 uppercase tracking-tighter">
                                    <span>Thành tiền món:</span>
                                    <span className="text-[13px]">{siFinalTotal.toLocaleString()}đ</span>
                                 </div>
                              </div>
                           </div>
                         );
                      })}
                   </div>

                   <div className="pt-4 border-t-2 border-gray-100 space-y-5">
                      <div className="flex flex-col gap-1 px-1">
                         <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">TỔNG CỘNG THỰC TRẢ:</span>
                         <span className="text-[32px] font-black text-[#047857] italic tracking-tighter leading-none">
                           {finalTotal.toLocaleString()}<span className="text-[18px] ml-1">đ</span>
                         </span>
                      </div>

                      <button 
                        onClick={handleCheckout}
                        className="w-full bg-[#047857] hover:bg-[#fbc02d] hover:text-slate-900 text-white py-5 rounded-full font-black uppercase tracking-widest transition-all shadow-lg text-[14px] active:scale-95"
                      >
                        TIẾN HÀNH ĐẶT HÀNG
                      </button>
                      
                      <div className="flex items-center justify-center gap-2 opacity-30 mt-6">
                         <div className="h-[1px] flex-1 bg-gray-400"></div>
                         <span className="text-[9px] font-black uppercase tracking-tighter">Agri-Hub Security</span>
                         <div className="h-[1px] flex-1 bg-gray-400"></div>
                      </div>
                   </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};