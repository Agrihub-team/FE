// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";
import { ShoppingBag, ArrowLeft, Ticket, Info, ClipboardList, ChevronRight, Clock, X } from "lucide-react";
import { SHIP_TIERS } from "../utils/locations";
import { toast } from "sonner";
import { IMAGE_URL } from '../utils/config';

export const Cart = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stockMap, setStockMap] = useState<Record<string, { s25: number; s50: number; sKg: number }>>({});

  const { items, removeItem, updateDetailQuantity, toggleSelect, loadCart } =
    useCartStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    loadCart();
    apiClient
      .get("/vouchers")
      .then((res) => setVouchers(res?.data || res || []))
      .catch(() => {});
    if (token) {
      apiClient
        .get("/orders/my")
        .then((res) => {
          const list: any[] = Array.isArray(res) ? res : res?.data || [];
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecentOrders(list);
        })
        .catch(() => {});
    }
    window.scrollTo(0, 0);
  }, [loadCart]);

  // Fetch stock cho tất cả sản phẩm trong giỏ
  useEffect(() => {
    const productIds = [...new Set(items.map((i) => i.product).filter(Boolean))];
    if (productIds.length === 0) return;
    Promise.all(productIds.map((id) => apiClient.get(`/products/${id}`).catch(() => null)))
      .then((results) => {
        const map: Record<string, { s25: number; s50: number; sKg: number }> = {};
        results.forEach((res) => {
          const p = res?.data || res;
          if (p?._id) {
            map[p._id] = {
              s25: p.stock_25kg ?? 0,
              s50: p.stock_50kg ?? 0,
              sKg: p.stock_total_kg ?? 0,
            };
          }
        });
        setStockMap(map);
      });
  }, [items.length]);

  // Lọc sản phẩm đang được chọn (checkbox)
  const selectedItems = useMemo(() => {
    return items.filter((i) => i.selected === true);
  }, [items]);

  // 1. TỔNG TIỀN HÀNG (Chưa giảm)
  const rawTotal = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const itemSub =
        Number(item.q25 || 0) * Number(item.p25 || 0) +
        Number(item.q50 || 0) * Number(item.p50 || 0) +
        Number(item.qKg || 0) * Number(item.pKg || 0);
      return acc + itemSub;
    }, 0);
  }, [selectedItems]);

  // 2. GIẢM GIÁ (Dựa trên voucher chọn ở sidebar)
  const discountAmount = useMemo(() => {
    if (!selectedVoucher || rawTotal < selectedVoucher.minAmount) return 0;
    if (selectedVoucher.type === 'percentage') {
      return Math.round(rawTotal * Math.min(100, Number(selectedVoucher.discount)) / 100);
    }
    return Number(selectedVoucher.discount) || 0;
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
    if (e) e.preventDefault();

    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }

    if (!localStorage.getItem('token')) {
      toast.warning("Vui lòng đăng nhập để tiến hành thanh toán!");
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    navigate("/checkout", {
      state: {
        voucher: selectedVoucher,
        totalPay: finalTotal,
        discount: discountAmount,
      },
    });
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fcfcfc] pb-20 font-sans text-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div className="py-6 text-[14px] text-gray-400 font-medium flex gap-2">
            <Link to="/" className="hover:text-[#047857]">
              Trang chủ
            </Link>{" "}
            <span>›</span>
            <span className="text-gray-900 font-bold uppercase tracking-tighter">
              Giỏ hàng
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-8 uppercase italic border-l-4 border-[#047857] pl-4">
            GIỎ HÀNG CHI TIẾT ({selectedItems.length})
          </h1>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center flex flex-col items-center mb-10">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-5 text-[#047857]">
                <ShoppingBag size={48} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1 uppercase tracking-wide">Giỏ hàng đang trống</h2>
              <p className="text-sm text-gray-400 mb-6">Hãy chọn sản phẩm để bắt đầu đặt hàng</p>
              <Link
                to="/products"
                className="bg-[#047857] text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 text-sm hover:bg-[#035b42] transition-colors"
              >
                <ArrowLeft size={18} /> Mua hàng ngay
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* PHẦN DANH SÁCH BÊN TRÁI */}
              <div className="lg:w-[68%] space-y-4 w-full">
                {items.map((item) => {
                  const itemSubTotal =
                    Number(item.q25) * Number(item.p25) +
                    Number(item.q50) * Number(item.p50) +
                    Number(item.qKg) * Number(item.pKg);
                  return (
                    <div
                      key={item._id}
                      className={`bg-white border-2 rounded-2xl p-4 transition-all ${item.selected ? "border-[#047857] shadow-sm" : "border-gray-100 opacity-60"}`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleSelect(item._id)}
                          className="w-5 h-5 accent-[#047857] cursor-pointer shrink-0"
                        />
                        <div className="w-16 h-16 bg-slate-50 rounded-xl p-1 border border-gray-100 shrink-0 overflow-hidden">
                          <img
                            src={`${IMAGE_URL}/${item.image}`}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-[14px] font-bold text-gray-800 uppercase pr-4">
                              {item.name}
                            </h3>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-0.5 tracking-widest">
                                Thành tiền
                              </span>
                              <span className="text-[18px] font-bold text-[#047857] italic leading-none">
                                {itemSubTotal.toLocaleString()}đ
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                              {[
                                { k: "q25", p: item.p25, label: "BAO 25KG", sk: "s25" },
                                { k: "q50", p: item.p50, label: "BAO 50KG", sk: "s50" },
                                { k: "qKg", p: item.pKg, label: "KÝ LẺ",   sk: "sKg" },
                              ].map(
                                (spec) =>
                                  Number(spec.p) > 0 && (() => {
                                    const stock = stockMap[item.product]?.[spec.sk] ?? Infinity;
                                    const atMax = item[spec.k] >= stock;
                                    const outOfStock = stock === 0;
                                    return (
                                      <div
                                        key={spec.k}
                                        className="bg-slate-50/50 border border-gray-200 rounded-xl p-2 flex flex-col"
                                      >
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                          {spec.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center bg-white border border-gray-300 rounded p-0.5 shadow-sm">
                                            <button
                                              onClick={() =>
                                                updateDetailQuantity(
                                                  item._id,
                                                  spec.k,
                                                  item[spec.k] - 1,
                                                )
                                              }
                                              className="w-5 h-5 flex items-center justify-center font-bold text-gray-400 hover:text-red-500"
                                            >
                                              -
                                            </button>
                                            <span className="w-6 text-center text-[11px] font-bold text-gray-700">
                                              {item[spec.k]}
                                            </span>
                                            <button
                                              onClick={() =>
                                                updateDetailQuantity(
                                                  item._id,
                                                  spec.k,
                                                  Math.min(stock, item[spec.k] + 1),
                                                )
                                              }
                                              disabled={atMax || outOfStock}
                                              className="w-5 h-5 flex items-center justify-center font-bold text-gray-400 hover:text-[#047857] disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                              +
                                            </button>
                                          </div>
                                          <span className="text-[10px] font-bold text-[#047857] italic">
                                            x{Number(spec.p).toLocaleString()}đ
                                          </span>
                                        </div>
                                        {stock !== Infinity && (
                                          <span className={`text-[8px] font-semibold mt-0.5 ${outOfStock ? "text-red-500" : atMax ? "text-orange-500" : "text-gray-400"}`}>
                                            {outOfStock ? "Hết hàng" : atMax ? `Tối đa (còn ${stock})` : `Còn ${stock}`}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })(),
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item._id)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-all bg-gray-50 rounded-full hover:bg-red-50 shrink-0"
                            >
                              <X size={16} />
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
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm border-t-4 border-t-emerald-700">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-5 border-l-4 border-[#047857] pl-3">
                    XÁC NHẬN ĐƠN HÀNG
                  </p>

                  {/* PHẦN CHỌN VOUCHER TẠI SIDEBAR */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <Ticket size={16} className="text-[#047857]" />
                      <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">
                        Mã giảm giá đơn hàng:
                      </span>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                      {/* SỬA TẠI ĐÂY: Thêm .filter(v => v.applicableProducts?.length === 0) */}
                      {vouchers.length > 0 ? (
                        vouchers
                          .filter(
                            (v) =>
                              !v.applicableProducts ||
                              v.applicableProducts.length === 0,
                          )
                          .map((v) => {
                            const isActive = selectedVoucher?._id === v._id;
                            const canUse = rawTotal >= v.minAmount;
                            return (
                              <button
                                key={v._id}
                                type="button"
                                disabled={!canUse}
                                onClick={() =>
                                  setSelectedVoucher(isActive ? null : v)
                                }
                                className={`w-full px-4 py-3 rounded-xl border transition-all text-left relative overflow-hidden flex flex-col ${
                                  isActive
                                    ? "bg-[#047857] text-white border-[#047857] shadow-md scale-[1.02]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#047857]"
                                } ${!canUse ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                                  {isActive && <span>✓</span>} {v.code}
                                </div>
                                <div
                                  className={`text-[9px] mt-1 italic ${isActive ? "text-green-100" : "text-gray-500"}`}
                                >
                                  Giảm {v.type === 'percentage'
                                    ? `${Number(v.discount)}%`
                                    : `${Number(v.discount).toLocaleString()}đ`}
                                  {' '}(Đơn từ {Number(v.minAmount).toLocaleString()}đ)
                                </div>
                              </button>
                            );
                          })
                      ) : (
                        <span className="text-[10px] text-gray-300 italic pl-1">
                          Không có mã giảm giá nào hiện dụng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chính sách phí ship */}
                  <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[10px] text-slate-600 space-y-1">
                    <p className="font-bold text-emerald-800 flex items-center gap-1">
                      <Info size={11} /> Chính sách vận chuyển
                    </p>
                    {SHIP_TIERS.map((t, i) => (
                      <p key={i}>
                        {i === 0
                          ? `Nội thành HCM: cố định 50,000đ · Từ ${t.freeKg}kg: Miễn phí`
                          : `≤${t.maxKm}km: tối thiểu ${t.minKg}kg · ${(t.perKg as number).toLocaleString()}đ/kg · Từ ${t.freeKg.toLocaleString()}kg: Miễn phí`}
                      </p>
                    ))}
                    <p className="text-orange-600 font-semibold">⚡ Hỏa tốc (≤80km, ≤500kg): phí × 1.5</p>
                  </div>

                  {/* HIỂN THỊ LOGIC TỔNG -> GIẢM -> THANH TOÁN */}
                  <div className="pt-4 border-t-2 border-gray-100 space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">
                        Tổng tiền hàng:
                      </span>
                      <span className="text-[15px] font-bold text-gray-700">
                        {rawTotal.toLocaleString()}đ
                      </span>
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-bold uppercase text-gray-400 tracking-widest">
                        Giảm giá voucher:
                      </span>
                      <span className="text-[15px] font-bold text-red-500">
                        -{discountAmount.toLocaleString()}đ
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 px-1 pt-3 border-t border-dashed border-gray-200">
                      <span className="text-[11px] font-bold uppercase text-gray-900 tracking-widest">
                        TỔNG THANH TOÁN:
                      </span>
                      <span className="text-[32px] font-black text-[#047857] italic tracking-tighter leading-none">
                        {finalTotal.toLocaleString()}
                        <span className="text-[18px] ml-1">đ</span>
                      </span>
                    </div>

                    {/* NÚT XÁC NHẬN ĐẶT HÀNG */}
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="w-full bg-[#047857] hover:bg-[#035b42] text-white py-4 rounded-full font-black uppercase tracking-widest transition-all shadow-lg text-[13px] active:scale-95 mt-2"
                    >
                      TIẾN HÀNH ĐẶT HÀNG
                    </button>

                    <div className="flex items-center justify-center gap-2 opacity-30 mt-6">
                      <div className="h-[1px] flex-1 bg-gray-400"></div>
                      <span className="text-[9px] font-black uppercase tracking-tighter">
                        Agri-Hub Security
                      </span>
                      <div className="h-[1px] flex-1 bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        {/* ĐƠN HÀNG GẦN ĐÂY */}
        {recentOrders.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-black uppercase italic border-l-4 border-[#047857] pl-4 flex items-center gap-2 text-gray-900">
                <ClipboardList size={18} className="text-[#047857]" /> Đơn hàng gần đây
              </h2>
              <Link to="/profile" className="text-xs font-bold text-[#047857] hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order: any) => {
                const statusMap: Record<string, { label: string; cls: string }> = {
                  pending:   { label: "Chờ xác nhận", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                  confirmed: { label: "Đã xác nhận",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
                  shipping:  { label: "Đang giao",    cls: "bg-sky-50 text-sky-700 border-sky-200" },
                  delivered: { label: "Đã giao",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                  cancelled: { label: "Đã hủy",       cls: "bg-red-50 text-red-500 border-red-200" },
                };
                const s = statusMap[order.status] ?? { label: order.status, cls: "bg-slate-50 text-slate-500 border-slate-200" };
                return (
                  <Link
                    key={order._id}
                    to="/profile"
                    className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-[#047857] hover:shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <ClipboardList size={16} className="text-[#047857]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-gray-800 uppercase tracking-tight">
                        #{order.orderCode || order._id?.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {new Date(order.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-black text-[#047857]">{order.totalAmount?.toLocaleString()}đ</p>
                      <span className={`text-[9px] font-bold uppercase border rounded px-1.5 py-0.5 mt-0.5 inline-block ${s.cls}`}>
                        {s.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </main>
      <Footer />
    </>
  );
};
