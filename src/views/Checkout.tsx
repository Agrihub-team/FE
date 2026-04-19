// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner"; 
import { Truck, Zap, CreditCard, Wallet, MapPin, ChevronRight, Loader2, Trash2, Tag, Info } from "lucide-react";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api"; 

import { AGRI_LOCATIONS } from "../utils/locations"; 

export const Checkout = () => {
  const navigate = useNavigate();
  const { items, getSelectedTotal, clearCart } = useCartStore();
  const selectedItems = items.filter(i => i.selected);

  const [formData, setFormData] = useState({
    receiver_name: "", phone: "", province: "", district: "", ward: "", street: "", note: ""
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(""); 
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [shippingMethod, setShippingMethod] = useState("STANDARD"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSelectedAddressId(""); 
    
    if (name === "province") setFormData(prev => ({ ...prev, district: "", ward: "" }));
    if (name === "district") setFormData(prev => ({ ...prev, ward: "" }));
  };

  const handleSelectSavedAddress = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (!id) return setFormData({ receiver_name: "", phone: "", province: "", district: "", ward: "", street: "", note: "" });

    const addr = savedAddresses.find(a => a._id === id);
    if (addr) setFormData({ ...addr, note: "" });
  };

  const handleDeleteAddress = async () => {
    if (!selectedAddressId) return;
    if (!window.confirm("Xóa địa chỉ này?")) return;
    try {
      await apiClient.delete(`/addresses/${selectedAddressId}`);
      toast.success("Đã xóa địa chỉ!");
      setSavedAddresses(prev => prev.filter(a => a._id !== selectedAddressId));
      setSelectedAddressId("");
      setFormData({ receiver_name: "", phone: "", province: "", district: "", ward: "", street: "", note: "" });
    } catch (err) { toast.error("Xóa địa chỉ thất bại!"); }
  };

  useEffect(() => {
    if (selectedItems.length === 0) return navigate("/cart");
    window.scrollTo(0, 0);

    const loadUserData = async () => {
      try {
        const rawUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userStored = rawUser.user ? rawUser.user : rawUser; 

        const addrRes = await apiClient.get("/addresses").catch(() => []);
        const listAddr = Array.isArray(addrRes) ? addrRes : (addrRes?.data || []);
        setSavedAddresses(listAddr);

        const defaultAddr = listAddr.find((a: any) => a.is_default) || listAddr[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
          setFormData({ ...defaultAddr, note: "" });
        } else if (userStored) {
          setFormData(prev => ({ ...prev, receiver_name: userStored.fullname || "", phone: userStored.phone || "" }));
        }
      } catch (err) { console.error("Lỗi tải thông tin:", err); }
    };
    loadUserData();
  }, [navigate, selectedItems.length]);

  const availableDistricts = useMemo(() => {
    const prov = AGRI_LOCATIONS.find(p => p.name === formData.province);
    return prov ? prov.districts.map(d => d.name) : [];
  }, [formData.province]);

  const availableWards = useMemo(() => {
    const prov = AGRI_LOCATIONS.find(p => p.name === formData.province);
    if (prov && formData.district) {
      const dist = prov.districts.find(d => d.name === formData.district);
      return dist ? dist.wards : [];
    }
    return [];
  }, [formData.province, formData.district]);

  // Logic tính tổng và áp dụng nghiệp vụ phí ship đặc thù
  const subTotal = getSelectedTotal(); 
  const totalWeight = selectedItems.reduce((acc, i) => acc + (Number(i.q25)*25) + (Number(i.q50)*50) + Number(i.qKg), 0);
  
  let shippingFee = 0;
  const isFreeShip = formData.province === "Bình Phước" || formData.province === "Hồ Chí Minh" || totalWeight > 500;

  if (!isFreeShip) {
    // Nếu không thuộc diện miễn phí, tính phí theo khối lượng
    const baseShip = totalWeight * 200; 
    shippingFee = shippingMethod === "FAST" ? Math.round(baseShip * 1.2) : baseShip;
  }
  
  const finalTotal = subTotal + shippingFee;

  const onPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiver_name) return toast.error("Vui lòng nhập họ tên người nhận!");
    if (!formData.phone) return toast.error("Vui lòng nhập số điện thoại!");
    if (!formData.province) return toast.error("Vui lòng chọn Tỉnh/Thành phố!");
    if (!formData.district) return toast.error("Vui lòng chọn Quận/Huyện!");
    if (!formData.ward) return toast.error("Vui lòng chọn Phường/Xã!");
    if (!formData.street) return toast.error("Vui lòng nhập địa chỉ cụ thể!");

    setIsSubmitting(true);
    try {
      if (!selectedAddressId) await apiClient.post("/addresses", { ...formData, is_default: true }).catch(() => {});

      const cleanItems = selectedItems.map((i: any) => {
        let productId = i.originalId || i.product?._id || i._id || "";
        if (typeof productId === 'string' && productId.includes('-')) productId = productId.split('-')[0];
        
        return { 
          product: productId, 
          q25: Number(i.q25) || 0, 
          q50: Number(i.q50) || 0, 
          qKg: Number(i.qKg) || 0,
          itemVoucher: i.itemVoucher || null 
        };
      });

      const appliedVoucherItem = selectedItems.find(i => i.itemVoucher);
      const globalVoucherCode = appliedVoucherItem ? appliedVoucherItem.itemVoucher.code : undefined;

      const response = await apiClient.post('/orders', {
        items: cleanItems, 
        addressData: { ...formData }, 
        paymentMethod, 
        shippingFee, 
        voucherCode: globalVoucherCode, 
        orderNotes: formData.note || "",
      });

      const result = response?.data || response;
      clearCart();
      toast.success("Đặt hàng thành công!");
      
      if (paymentMethod === 'VNPAY' && result?.vnpUrl) window.location.href = result.vnpUrl;
      else navigate(`/order-success/${result?.order?._id}`);
    } catch (err: any) { toast.error(err.message || "Lỗi khi đặt hàng!"); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800">
        <form onSubmit={onPlaceOrder} className="max-w-[1200px] mx-auto px-4 md:px-6">
          
          <div className="py-6 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <Link to="/cart" className="hover:text-[#047857]">Giỏ hàng</Link> <ChevronRight size={14} /> <span className="text-[#047857]">Thanh toán</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-200">
                <h3 className="text-[15px] font-bold uppercase mb-5 flex items-center gap-2 border-b pb-3"><MapPin size={18} className="text-[#047857]"/> Thông tin nhận hàng</h3>

                {savedAddresses.length > 0 && (
                  <div className="mb-5 bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex gap-2">
                    <select 
                      value={selectedAddressId} 
                      onChange={handleSelectSavedAddress} 
                      className="flex-1 px-3 py-2 bg-white rounded-md border border-emerald-200 outline-none text-sm font-semibold text-slate-700 cursor-pointer focus:border-[#047857] truncate"
                    >
                      <option value="">+ Nhập địa chỉ mới bên dưới</option>
                      {savedAddresses.map((addr) => {
                        const fullStr = `${addr.receiver_name} - ${addr.phone} - ${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`;
                        const displayStr = fullStr.length > 60 ? fullStr.substring(0, 60) + "..." : fullStr;
                        return <option key={addr._id} value={addr._id}>{displayStr}</option>;
                      })}
                    </select>
                    {selectedAddressId && (
                      <button type="button" onClick={handleDeleteAddress} className="px-3 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"><Trash2 size={16} /></button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Họ tên người nhận *</label>
                    <input name="receiver_name" value={formData.receiver_name} onChange={handleChange} className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Số điện thoại *</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold" />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-3 gap-3">
                    <select name="province" value={formData.province} onChange={handleChange} className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-xs font-semibold truncate">
                      <option value="">Tỉnh/Thành</option>
                      {AGRI_LOCATIONS.map((p, idx) => <option key={`prov-${idx}`} value={p.name}>{p.name}</option>)}
                    </select>
                    <select name="district" value={formData.district} onChange={handleChange} disabled={!formData.province} className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-xs font-semibold disabled:opacity-50 truncate">
                      <option value="">Quận/Huyện</option>
                      {availableDistricts.map((d, idx) => <option key={`dist-${idx}`} value={d}>{d}</option>)}
                    </select>
                    <select name="ward" value={formData.ward} onChange={handleChange} disabled={!formData.district} className="px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-xs font-semibold disabled:opacity-50 truncate">
                      <option value="">Phường/Xã</option>
                      {availableWards.map((w, idx) => <option key={`ward-${idx}`} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Địa chỉ chi tiết *</label>
                    <input name="street" value={formData.street} onChange={handleChange} placeholder="Số nhà, tên đường..." className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Ghi chú giao hàng</label>
                    <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold resize-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
                   <h3 className="text-[15px] font-bold uppercase">Sản phẩm thanh toán ({selectedItems.length})</h3>
                </div>
                <div className="space-y-4">
                  {selectedItems.map((item) => {
                    const rawPrice = (item.q25*item.p25) + (item.q50*item.p50) + (item.qKg*item.pKg);
                    const discount = item.itemVoucher?.discount || 0;
                    const finalPrice = Math.max(0, rawPrice - discount);

                    return (
                      <div key={item._id} className="flex flex-col border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-lg p-2 border border-slate-100 shrink-0">
                            <img src={`http://localhost:3001/images/products/${item.image}`} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-800 uppercase line-clamp-1">{item.name}</h4>
                            <div className="text-[10px] text-slate-500 mt-1 space-x-2">
                              {item.q25 > 0 && <span>25kg: x{item.q25}</span>}
                              {item.q50 > 0 && <span>50kg: x{item.q50}</span>}
                              {item.qKg > 0 && <span>Lẻ: {item.qKg}kg</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            {discount > 0 && <p className="text-[10px] text-slate-400 line-through mb-0.5">{rawPrice.toLocaleString()}đ</p>}
                            <p className="text-sm font-bold text-[#047857]">{finalPrice.toLocaleString()}đ</p>
                          </div>
                        </div>

                        {discount > 0 && item.itemVoucher && (
                          <div className="mt-2 ml-20 flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 w-fit">
                            <Tag size={12} className="text-yellow-600" />
                            <span className="text-[10px] text-yellow-700 font-semibold">
                              Mã <b className="uppercase">{item.itemVoucher.code}</b>: Giảm {discount.toLocaleString()}đ
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 sticky top-6">
              <div className="bg-white rounded-xl p-5 md:p-6 shadow-md border-t-4 border-[#047857]">
                <h3 className="text-sm font-bold uppercase text-center mb-5 border-b pb-3">TỔNG KẾT ĐƠN</h3>
                
                <div className="space-y-2 mb-6">
                  <div onClick={() => setShippingMethod("STANDARD")} className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${shippingMethod === "STANDARD" ? "border-[#047857] bg-emerald-50" : "bg-slate-50"}`}>
                    <Truck size={18} className={shippingMethod === "STANDARD" ? "text-[#047857]" : "text-slate-400"} />
                    <div className="flex-1 flex justify-between items-center"><span className="text-xs font-bold uppercase">Tiêu chuẩn</span><span className="text-[10px] font-bold text-[#047857]">{isFreeShip ? "Miễn phí" : "200đ/kg"}</span></div>
                  </div>
                  {!isFreeShip && (
                    <div onClick={() => setShippingMethod("FAST")} className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${shippingMethod === "FAST" ? "border-orange-500 bg-orange-50" : "bg-slate-50"}`}>
                      <Zap size={18} className={shippingMethod === "FAST" ? "text-orange-600" : "text-slate-400"} />
                      <div className="flex-1 flex justify-between items-center"><span className="text-xs font-bold uppercase text-orange-600">Hỏa tốc</span><span className="text-[10px] font-bold text-orange-600">240đ/kg</span></div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div onClick={() => setPaymentMethod('COD')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-[#047857] bg-[#047857] text-white' : 'bg-slate-50 text-slate-500'}`}>
                    <Wallet size={16} /><span className="text-[10px] font-bold uppercase">Tiền mặt</span>
                  </div>
                  <div onClick={() => setPaymentMethod('VNPAY')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'VNPAY' ? 'border-[#047857] bg-[#047857] text-white' : 'bg-slate-50 text-slate-500'}`}>
                    <CreditCard size={16} /><span className="text-[10px] font-bold uppercase">VNPay</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 border-t pt-4 border-dashed text-sm">
                  <div className="flex justify-between text-slate-500"><span className="font-semibold">Tiền hàng sau giảm:</span><span className="text-slate-800 font-bold">{subTotal.toLocaleString()}đ</span></div>
                  <div className="flex justify-between text-slate-500">
                    <span className="font-semibold">Phí vận chuyển ({totalWeight}kg):</span>
                    <span className={`font-bold ${shippingFee === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {shippingFee === 0 ? "Miễn phí" : `+${shippingFee.toLocaleString()}đ`}
                    </span>
                  </div>
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-bold uppercase">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-[#047857]">{finalTotal.toLocaleString()}đ</span>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-lg font-bold uppercase transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-300 text-slate-500' : 'bg-[#047857] text-white hover:bg-[#035b42]'}`}>
                  {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                  {isSubmitting ? 'ĐANG LƯU ĐƠN...' : 'XÁC NHẬN ĐẶT HÀNG'}
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 opacity-40 italic">
                   <Info size={12} />
                   <span className="text-[10px] font-bold">Thanh toán an toàn cùng Agri-Hub</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
};