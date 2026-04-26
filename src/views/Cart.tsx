// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";
import { ShoppingBag, ArrowLeft, Ticket } from "lucide-react";

export const Cart = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const { 
    items, removeItem, updateDetailQuantity, toggleSelect, loadCart 
  } = useCartStore();

  useEffect(() => {
    loadCart();
    apiClient.get("/vouchers")
      .then(res => setVouchers(res?.data || res || []))
      .catch(err => console.error("Lỗi lấy voucher:", err));
    window.scrollTo(0, 0);
  }, [loadCart]);

  // Lọc sản phẩm đang được chọn (checkbox)
  const selectedItems = useMemo(() => {
    return items.filter(i => i.selected === true);
  }, [items]);

  // 1. TỔNG TIỀN HÀNG (Chưa giảm)
  const rawTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const itemSub = (Number(item.q25 || 0) * Number(item.p25 || 0)) + 
                      (Number(item.q50 || 0) * Number(item.p50 || 0)) + 
                      (Number(item.qKg || 0) * Number(item.pKg || 0));
      return acc + itemSub;
    }, 0);
  }, [selectedItems]);

  // 2. GIẢM GIÁ (Dựa trên voucher chọn ở sidebar)
  const discountAmount = useMemo(() => {
    if (!selectedVoucher || rawTotal < selectedVoucher.minAmount) return 0;
    return Number(selectedVoucher.discount);
  }, [selectedVoucher, rawTotal]);

  // 3. TỔNG THANH TOÁN
  const finalTotal = Math.max(0, rawTotal - discountAmount);

  // Tự động gỡ voucher nếu tổng tiền tụt xuống dưới mức tối thiểu
  useEffect(() => {
    if (selectedVoucher && rawTotal < selectedVoucher.minAmount) {
      setSelectedVoucher(null);
    }
  }, [rawTotal, selectedVoucher]);

  // FIX: Hàm xử lý thanh toán chuẩn
  const handleCheckout = (e) => {
    if (e) e.preventDefault(); // Ngăn chặn load lại trang nếu nằm trong form
    
    if (selectedItems.length === 0) {
      alert("⚠️ Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    console.log("Đang chuyển hướng sang thanh toán...");
    navigate("/checkout", { 
      state: { 
        voucher: selectedVoucher,
        totalPay: finalTotal,
        discount: discountAmount
      } 
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fcfcfc] pb-20 font-sans text-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          
          <div className="py-6 text-[14px] text-gray-400 font-medium flex gap-2">
            <Link to="/" className="hover:text-[#047857]">Trang chủ</Link> <span>›</span>
            <span className="text-gray-900 font-bold uppercase tracking-tighter">Giỏ hàng</span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-8 uppercase italic border-l-4 border-[#047857] pl-4">
            GIỎ HÀNG CHI TIẾT ({selectedItems.length})
          </h1>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center mb-10">
              <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-[#047857]">
                <ShoppingBag size={64} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Giỏ hàng đang trống</h2>
              <Link to="/products" className="bg-[#047857] text-white px-8 py-3.5 rounded-full font-bold shadow-lg flex items-center gap-2">
                <ArrowLeft size={20} /> Mua hàng ngay
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* PHẦN DANH SÁCH BÊN TRÁI */}
              <div className="lg:w-[68%] space-y-4 w-full">
                {items.map((item) => {
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
                        <div className="w-20 h-20 bg-slate-50 rounded-xl p-1 border border-gray-100 shrink-0 overflow-hidden">
                          <img src={`http://localhost:3001/images/products/${item.image}`} className="w-full h-full object-contain" />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-[14px] font-bold text-gray-800 uppercase pr-4">{item.name}</h3>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 tracking-widest">Thành tiền</span>
                              <span className="text-[18px] font-bold text-[#047857] italic leading-none">{itemSubTotal.toLocaleString()}đ</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                              {[{ k: 'q25', p: item.p25, label: 'BAO 25KG' }, { k: 'q50', p: item.p50, label: 'BAO 50KG' }, { k: 'qKg', p: item.pKg, label: 'KÝ LẺ' }].map((spec) => (
                                Number(spec.p) > 0 && (
                                  <div key={spec.k} className="bg-slate-50/50 border border-gray-200 rounded-xl p-2 flex flex-col">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{spec.label}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center bg-white border border-gray-300 rounded p-0.5 shadow-sm">
                                        <button onClick={() => updateDetailQuantity(item._id, spec.k, item[spec.k] - 1)} className="w-5 h-5 flex items-center justify-center font-bold text-gray-400 hover:text-red-500">-</button>
                                        <span className="w-6 text-center text-[11px] font-bold text-gray-700">{item[spec.k]}</span>
                                        <button onClick={() => updateDetailQuantity(item._id, spec.k, item[spec.k] + 1)} className="w-5 h-5 flex items-center justify-center font-bold text-gray-400 hover:text-[#047857]">+</button>
                                      </div>
                                      <span className="text-[10px] font-bold text-[#047857] italic">x{Number(spec.p).toLocaleString()}đ</span>
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                            <button onClick={() => removeItem(item._id)} className="p-3 text-gray-300 hover:text-red-500 transition-all bg-gray-50 rounded-full hover:bg-red-50">
                                <ShoppingBag size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BÊN PHẢI: SIDEBAR XÁC NHẬN */}
              <div className="lg:w-[32%] w-full sticky top-6">
                <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm border-b-[8px] border-[#047857]">
                  <h3 className="text-[14px] font-black text-gray-900 uppercase mb-6 tracking-widest border-b border-gray-100 pb-3 italic text-center">XÁC NHẬN ĐƠN HÀNG</h3>
                  
                  {/* PHẦN CHỌN VOUCHER TẠI SIDEBAR */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Ticket size={16} className="text-[#047857]" />
                      <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Mã giảm giá đơn hàng:</span>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {/* SỬA TẠI ĐÂY: Thêm .filter(v => v.applicableProducts?.length === 0) */}
                      {vouchers.length > 0 ? vouchers
                        .filter(v => !v.applicableProducts || v.applicableProducts.length === 0) 
                        .map((v) => {
                        const isActive = selectedVoucher?._id === v._id;
                        const canUse = rawTotal >= v.minAmount;
                        return (
                          <button 
                            key={v._id} 
                            type="button"
                            disabled={!canUse} 
                            onClick={() => setSelectedVoucher(isActive ? null : v)}
                            className={`w-full px-4 py-3 rounded-xl border transition-all text-left relative overflow-hidden flex flex-col ${
                              isActive 
                              ? 'bg-[#047857] text-white border-[#047857] shadow-md scale-[1.02]' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-[#047857]'
                            } ${!canUse ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                              {isActive && <span>✓</span>} {v.code}
                            </div>
                            <div className={`text-[9px] mt-1 italic ${isActive ? 'text-green-100' : 'text-gray-500'}`}>
                              Giảm {Number(v.discount).toLocaleString()}đ (Đơn từ {Number(v.minAmount).toLocaleString()}đ)
                            </div>
                          </button>
                        );
                      }) : (
                        <span className="text-[10px] text-gray-300 italic pl-1">Không có mã giảm giá nào hiện dụng</span>
                      )}
                    </div>
                  </div>

                  {/* HIỂN THỊ LOGIC TỔNG -> GIẢM -> THANH TOÁN */}
                  <div className="pt-4 border-t-2 border-gray-100 space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">Tổng tiền hàng:</span>
                      <span className="text-[15px] font-bold text-gray-700">{rawTotal.toLocaleString()}đ</span>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">Giảm giá voucher:</span>
                      <span className="text-[15px] font-bold text-red-500">-{discountAmount.toLocaleString()}đ</span>
                    </div>

                    <div className="flex flex-col gap-1 px-1 pt-3 border-t border-dashed border-gray-200">
                      <span className="text-[11px] font-bold uppercase text-gray-900 tracking-widest">TỔNG THANH TOÁN:</span>
                      <span className="text-[32px] font-black text-[#047857] italic tracking-tighter leading-none">
                        {finalTotal.toLocaleString()}<span className="text-[18px] ml-1">đ</span>
                      </span>
                    </div>

                    {/* NÚT XÁC NHẬN ĐẶT HÀNG */}
                    <button 
                      type="button"
                      onClick={handleCheckout}
                      className="w-full bg-[#047857] hover:bg-[#036046] text-white py-5 rounded-full font-black uppercase tracking-widest transition-all shadow-lg text-[14px] active:scale-95 mt-4"
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