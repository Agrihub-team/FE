// @ts-nocheck
import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom"; // Thêm useSearchParams
import { orderService } from "../controllers/orderService";
import { 
  CheckCircle2, Printer, ShoppingBag, Calendar, MapPin, 
  CreditCard, Tag, PackageCheck, ChevronRight, FileText, NotebookPen
} from "lucide-react";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const OrderSuccess = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams(); // Hook để lấy query string từ VNPay (?vnp_...)
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Lấy mã đơn hàng từ VNPay (nếu có)
    const vnpOrderCode = searchParams.get("vnp_TxnRef");
    
    // 2. Ưu tiên lấy ID từ URL params, nếu không có (trường hợp VNPay về) thì dùng vnpOrderCode
    const targetId = (id && id !== "undefined") ? id : vnpOrderCode;

    if (!targetId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        // Lưu ý: Đảm bảo Backend của bạn hỗ trợ tìm đơn hàng bằng cả _id hoặc orderCode
        const res = await orderService.getById(targetId);
        const data = res?.data || res;
        setOrder(data);
      } catch (err) {
        console.error("Lỗi lấy chi tiết đơn hàng:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    window.scrollTo(0, 0);
  }, [id, searchParams]);

  // --- LOGIC XỬ LÝ TRẠNG THÁI THANH TOÁN ---
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  
  // Được coi là đã thanh toán nếu: Database báo 'paid' HOẶC VNPay trả về code '00'
  const isPaid = order?.paymentStatus === 'paid' || vnpResponseCode === '00';
  
  const paymentStatusText = isPaid 
    ? 'Đã thanh toán thành công (VNPay)' 
    : (order?.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chờ xác nhận thanh toán');

  const paymentStatusColor = isPaid 
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200' 
    : 'text-orange-600 bg-orange-50 border-orange-200';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-[#047857] border-slate-200"></div>
          <p className="font-bold text-slate-400 uppercase tracking-wide text-sm">Đang tải biên lai...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-center p-4">
        <Header />
        <div className="flex-grow flex items-center justify-center">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full">
                <h2 className="text-xl font-black text-red-500 mb-2 uppercase">Không tìm thấy đơn hàng!</h2>
                <p className="text-slate-500 text-sm mb-6">Vui lòng kiểm tra lại mã đơn hàng hoặc lịch sử mua hàng.</p>
                <Link to="/" className="block w-full bg-[#047857] text-white py-3.5 rounded-xl font-bold uppercase hover:bg-[#035b42]">Quay lại cửa hàng</Link>
            </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 🚀 LOGIC QUÉT VOUCHER (Giữ nguyên của bạn)
  const voucherDetails = (() => {
    let totalDiscount = 0;
    let listCodes = [];
    if (order.voucher) {
      const disc = order.voucher.discountAmount || 0;
      if (disc > 0) {
        totalDiscount += disc;
        if (order.voucher.code) listCodes.push(order.voucher.code);
      }
    }
    if (order.items) {
      order.items.forEach(item => {
        if (item.itemVoucher && item.itemVoucher.discount > 0) {
          totalDiscount += Number(item.itemVoucher.discount);
          if (item.itemVoucher.code && !listCodes.includes(item.itemVoucher.code)) {
            listCodes.push(item.itemVoucher.code);
          }
        }
      });
    }
    return { totalDiscount, codes: listCodes.join(", ") };
  })();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 print:bg-white">
      <div className="print:hidden"><Header /></div>
      
      <main className="flex-grow max-w-[1000px] mx-auto w-full px-4 md:px-8 py-8 print:py-0 print:px-0">
        
        <div className="pb-6 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase print:hidden">
          <Link to="/" className="hover:text-[#047857]">Trang chủ</Link> 
          <ChevronRight size={14} /> 
          <span className="text-[#047857]">Hóa đơn đơn hàng</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none print:rounded-none">
          
          <div className="bg-emerald-50 border-b border-emerald-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 print:bg-white print:border-b-2 print:border-black">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={48} className="text-[#047857] print:hidden" />
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-black text-[#047857] uppercase tracking-wide">Đặt hàng thành công!</h2>
                <p className="text-sm font-medium text-emerald-700 mt-1">Nông sản của bạn đang được Shop chuẩn bị</p>
              </div>
            </div>
            <div className="text-center md:text-right bg-white p-3 md:p-4 rounded-xl border border-emerald-100 shadow-sm print:border-none print:p-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mã tra cứu hóa đơn</p>
              <p className="text-lg font-black tracking-widest text-slate-800">#{order.orderCode || order._id?.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-sm">
                <h3 className="font-bold uppercase mb-3 flex items-center gap-2 text-slate-400 border-b pb-2"><MapPin size={14}/> Giao hàng tới</h3>
                <p className="font-bold text-slate-800 uppercase">{order.shippingAddress?.receiver_name || 'Người nhận'}</p>
                <p className="font-semibold text-slate-500">{order.shippingAddress?.phone}</p>
                <p className="text-slate-600 leading-relaxed mt-1">
                  {order.shippingAddress?.street} {order.shippingAddress?.ward} {order.shippingAddress?.district} {order.shippingAddress?.province}
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-sm">
                <h3 className="font-bold uppercase mb-3 flex items-center gap-2 text-slate-400 border-b pb-2"><CreditCard size={14}/> Thanh toán</h3>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Phương thức:</span><span className="font-bold uppercase">{order.paymentMethod}</span></div>
                  <div className="flex justify-between items-center">
                    <span>Trạng thái:</span>
                    <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded border ${paymentStatusColor}`}>{paymentStatusText}</span>
                  </div>
                  <div className="flex justify-between"><span>Ngày đặt:</span><span className="font-bold">{new Date(order.createdAt).toLocaleString('vi-VN')}</span></div>
                </div>
              </div>
            </div>

            {/* Danh sách mặt hàng (Giữ nguyên logic của bạn) */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-4 border-b pb-2">
                <PackageCheck size={14} /> Danh sách mặt hàng ({order.items?.length || 0})
              </h3>
              
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => {
                  const itemRawPrice = (item.q25 * item.p25) + (item.q50 * item.p50) + (item.qKg * item.pKg);
                  const itemDiscount = item.itemVoucher?.discount || 0;
                  return (
                    <div key={idx} className="flex gap-4 items-center border border-slate-100 p-4 rounded-xl bg-white">
                      <div className="w-16 h-16 bg-slate-50 rounded-lg p-1 border border-slate-100 shrink-0 flex items-center justify-center print:hidden">
                        <img src={`http://localhost:3001/images/products/${item.image}`} className="w-full h-full object-contain" alt={item.name} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 uppercase text-[13px]">{item.name}</p>
                        <div className="text-[10px] font-semibold text-slate-500 mt-1 flex gap-2 flex-wrap">
                          {item.q25 > 0 && <span className="bg-slate-50 px-1.5 py-0.5 rounded">25kg: x{item.q25}</span>}
                          {item.q50 > 0 && <span className="bg-slate-50 px-1.5 py-0.5 rounded">50kg: x{item.q50}</span>}
                          {item.qKg > 0 && <span className="bg-slate-50 px-1.5 py-0.5 rounded">{item.qKg}kg lẻ</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {itemDiscount > 0 && <p className="text-[10px] text-slate-400 line-through">{itemRawPrice.toLocaleString()}đ</p>}
                        <p className="font-black text-sm text-[#047857]">{(itemRawPrice - itemDiscount).toLocaleString()}đ</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tổng cộng */}
            <div className="flex flex-col items-end border-t border-slate-200 pt-6">
              <div className="w-full md:w-[380px] space-y-3 text-sm">
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>Tiền hàng (Gốc):</span>
                  <span className="text-slate-800">{order.subTotal?.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>Vận chuyển:</span>
                  <span className="text-slate-800">+{order.shippingFee?.toLocaleString()}đ</span>
                </div>
                {voucherDetails.totalDiscount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                    <span className="flex items-center gap-1.5"><Tag size={14} /> Voucher giảm giá:</span>
                    <span>-{voucherDetails.totalDiscount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="pt-4 border-t-2 border-slate-800 flex justify-between items-center mt-2">
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">TỔNG THANH TOÁN:</span>
                  <span className="text-3xl font-black text-[#047857]">
                    {order.totalAmount?.toLocaleString()}đ
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Nút thao tác */}
        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl font-bold uppercase text-xs hover:bg-slate-50 transition-all">
            <Printer size={18} /> In Hóa Đơn
          </button>
          <Link to="/profile" className="flex items-center justify-center gap-2 bg-[#047857] text-white px-8 py-3.5 rounded-xl font-bold uppercase text-xs hover:bg-[#035b42] shadow-lg shadow-emerald-100">
            <FileText size={18} /> Theo dõi đơn hàng
          </Link>
        </div>

      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
};