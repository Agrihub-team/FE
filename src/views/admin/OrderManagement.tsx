// @ts-nocheck
import { useEffect, useState } from "react";
import { 
  Search, XCircle, CheckCircle, Clock, Package, Truck, Eye, 
  Landmark, Tag, NotebookPen, CheckCircle2, Calendar, MapPin, CreditCard, X, Filter
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../utils/api";
import { IMAGE_URL } from '../../utils/config';

export const OrderManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- BỘ LỌC ĐƠN HÀNG ---
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("all"); // all, today, 7_days, 14_days
  const [sortOrder, setSortOrder] = useState("newest");

  // --- POPUP CHI TIẾT ---
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get("/orders");
      const data = res.data || res || [];
      setOrders(data);
    } catch (error: any) {
      toast.error("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  // --- CẬP NHẬT TRẠNG THÁI (CÓ HỎI XÁC NHẬN) ---
  const updateStatus = async (id: string, nextStatus: string, cancelledBy?: string) => {
    let actionText = "cập nhật đơn hàng này";
    if (nextStatus === "confirmed") actionText = "DUYỆT ĐƠN hàng này (và tự động trừ kho)";
    else if (nextStatus === "preparing") actionText = "chuyển sang ĐANG CHUẨN BỊ";
    else if (nextStatus === "shipped") actionText = "giao cho ĐƠN VỊ VẬN CHUYỂN";
    else if (nextStatus === "delivered") actionText = "xác nhận ĐÃ GIAO & THU TIỀN";
    else if (nextStatus === "cancelled") actionText = "HỦY ĐƠN HÀNG này (Hệ thống sẽ hoàn lại kho)";

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText}?`)) return;

    try {
      const updateData: any = { status: nextStatus, cancelledBy };
      if (nextStatus === "delivered") updateData.paymentStatus = "paid";

      await apiClient.put(`/orders/${id}`, updateData);
      toast.success("Cập nhật thành công!");

      // Cập nhật State để UI nảy ngay lập tức
      setOrders((prev) =>
        prev.map((o) => o._id === id ? { ...o, ...updateData } : o)
      );

      if (selectedOrder?._id === id) {
        setSelectedOrder((prev: any) => ({ ...prev, ...updateData }));
      }
      
      // Tải lại data nếu hủy đơn để cập nhật tồn kho chính xác
      if (nextStatus === "cancelled") fetchOrders(); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  // 🚀 LOGIC QUÉT VOUCHER (Chuẩn theo file Profile)
  const getOrderVoucherInfo = (order: any) => {
    if (!order) return { totalDiscount: 0, codes: "" };
    let totalDiscount = 0;
    let codes: string[] = [];

    // Voucher toàn đơn
    if (order.voucher && order.voucher.discountAmount) {
      totalDiscount += Number(order.voucher.discountAmount);
      if (order.voucher.code && !codes.includes(order.voucher.code)) codes.push(order.voucher.code);
    }

    // Voucher từng món hàng
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const itemV = item.itemVoucher || item.voucher;
        if (itemV && (itemV.discount || itemV.discountAmount)) {
          totalDiscount += Number(itemV.discount || itemV.discountAmount);
          if (itemV.code && !codes.includes(itemV.code)) codes.push(itemV.code);
        }
      });
    }
    return { totalDiscount, codes: codes.join(", ") };
  };

  // 🚀 TẠO BỘ LỌC GỐC (Áp dụng Tìm kiếm, Thanh toán, Thời gian TRƯỚC khi đếm Tab)
  const baseFilteredOrders = orders.filter((o) => {
    const searchTxt = search.toLowerCase();
    const matchSearch =
      o.orderCode?.toLowerCase().includes(searchTxt) ||
      o.user?.fullname?.toLowerCase().includes(searchTxt) ||
      o.shippingAddress?.receiver_name?.toLowerCase().includes(searchTxt);

    const matchMethod = paymentMethodFilter === "ALL" || o.paymentMethod === paymentMethodFilter;
    const matchPaymentStatus = paymentStatusFilter === "ALL" || o.paymentStatus === paymentStatusFilter;

    let matchTime = true;
    const now = new Date().getTime();
    const orderTime = new Date(o.createdAt).getTime();
    if (timeFilter === "today") matchTime = (now - orderTime) <= 24 * 60 * 60 * 1000;
    else if (timeFilter === "7_days") matchTime = (now - orderTime) <= 7 * 24 * 60 * 60 * 1000;
    else if (timeFilter === "14_days") matchTime = (now - orderTime) <= 14 * 24 * 60 * 60 * 1000;

    return matchSearch && matchMethod && matchPaymentStatus && matchTime;
  });

  // 🚀 BỘ LỌC CUỐI CÙNG HIỂN THỊ LÊN BẢNG (Áp dụng Tab + Sắp xếp)
  const finalFilteredOrders = baseFilteredOrders
    .filter((o) => (activeTab === "pending" ? o.status === "pending" : o.status === activeTab))
    .sort((a, b) => {
      const dA = new Date(a.createdAt).getTime();
      const dB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dB - dA : dA - dB;
    });

  // --- NÚT THAO TÁC CỦA ADMIN ---
  const renderActionButtons = (order: any) => {
    if (order.status === "cancelled") return <span className="text-rose-600 font-medium flex items-center gap-1"><XCircle size={16}/> Đã hủy</span>;
    if (order.status === "delivered") return <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={16}/> Hoàn tất</span>;

    return (
      <div className="flex gap-2">
        {order.status === "pending" && (
          <button onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "confirmed"); }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">Duyệt đơn</button>
        )}
        {order.status === "confirmed" && (
          <button onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "preparing"); }} className="bg-orange-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm">Chuẩn bị</button>
        )}
        {order.status === "preparing" && (
          <button onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "shipped"); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Giao ĐVVC</button>
        )}
        {order.status === "shipped" && (
          <button onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "delivered"); }} className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">Đã giao</button>
        )}
        <button onClick={(e) => { e.stopPropagation(); updateStatus(order._id, "cancelled", "admin"); }} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">Hủy</button>
      </div>
    );
  };

  const tabs = [
    { key: "pending", label: "Chờ xác nhận" },
    { key: "confirmed", label: "Đã duyệt" },
    { key: "preparing", label: "Đang chuẩn bị" },
    { key: "shipped", label: "Đang giao" },
    { key: "delivered", label: "Đã giao" },
    { key: "cancelled", label: "Đã hủy" },
  ];

  if (loading) return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50"><div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentVoucherInfo = selectedOrder ? getOrderVoucherInfo(selectedOrder) : { totalDiscount: 0, codes: "" };

  return (
    <div className="min-h-screen bg-gray-50/50 w-full font-sans pb-12">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        </div>

        {/* TOOLBAR FILTER (Chuẩn form bảng quản trị) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input 
                type="text" 
                placeholder="Tìm mã đơn, tên khách, SĐT..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-all" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter size={16} /> <span className="hidden sm:inline">Lọc:</span>
              </div>
              <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer">
                <option value="ALL">Tất cả thanh toán</option>
                <option value="COD">COD (Tiền mặt)</option>
                <option value="VNPAY">VNPAY</option>
              </select>

              <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer">
                <option value="ALL">Mọi trạng thái TT</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
              </select>

              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="border border-gray-300 bg-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer">
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="7_days">7 ngày qua</option>
                <option value="14_days">14 ngày qua</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABS (Dạng underline chuẩn) */}
        <div className="bg-white border-b border-gray-200 mb-6 px-4 pt-2 rounded-t-xl shadow-sm">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const count = baseFilteredOrders.filter(o => o.status === tab.key).length;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                    ${isActive 
                      ? 'border-emerald-500 text-emerald-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  {tab.label}
                  <span className={`py-0.5 px-2.5 rounded-full text-xs font-semibold ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* TABLE ĐƠN HÀNG (Chuẩn Admin Data Table) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã đơn hàng</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày đặt</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thanh toán</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finalFilteredOrders.map((o) => {
                  const vInfo = getOrderVoucherInfo(o);
                  return (
                    <tr key={o._id} onClick={() => { setSelectedOrder(o); setShowPopup(true); }} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                      
                      {/* Cột 1: Mã Đơn */}
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">#{o.orderCode || o._id.substring(0,8)}</div>
                         {o.orderNotes && <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600"><NotebookPen size={12}/> Có ghi chú</div>}
                      </td>
                      
                      {/* Cột 2: Khách hàng */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{o.user?.fullname || o.shippingAddress?.receiver_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{o.shippingAddress?.phone || 'Chưa cập nhật SĐT'}</div>
                      </td>

                      {/* Cột 3: Ngày đặt */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 ml-5">
                          {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' })}
                        </div>
                      </td>

                      {/* Cột 4: Thanh toán */}
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-col gap-1.5 items-start">
                           <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{o.paymentMethod}</span>
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                             {o.paymentStatus === 'paid' ? 'Đã thu tiền' : 'Chưa thu'}
                           </span>
                         </div>
                      </td>

                      {/* Cột 5: Tổng tiền */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-gray-900">{(o.totalAmount || 0).toLocaleString()}đ</div>
                        {vInfo.totalDiscount > 0 && <div className="text-xs text-emerald-600 font-medium mt-0.5">Giảm {(vInfo.totalDiscount).toLocaleString()}đ</div>}
                      </td>

                      {/* Cột 6: Hành động */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 p-2 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Trạng thái trống */}
          {finalFilteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Package size={48} className="text-gray-300 mb-4" />
              <p className="text-sm font-medium">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>

        {/* POPUP CHI TIẾT ĐƠN HÀNG (Thiết kế lại gọn gàng chuẩn Admin) */}
        {showPopup && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm" onClick={() => setShowPopup(false)}>
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              
              {/* Header Popup */}
              <div className="flex-none flex justify-between items-center px-6 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Đơn hàng <span className="text-emerald-600">#{selectedOrder.orderCode || selectedOrder._id.substring(0,8)}</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5"><Calendar size={14}/> Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <button onClick={() => setShowPopup(false)} className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-2 rounded-lg transition-colors"><X size={20} /></button>
              </div>

              {/* Body Popup */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Panel Trạng thái & Thao tác */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                   <div>
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Trạng thái hiện tại</p>
                     <p className="text-xl font-bold text-gray-900">{tabs.find(t => t.key === selectedOrder.status)?.label || selectedOrder.status}</p>
                     {selectedOrder.status === "cancelled" && <p className="text-rose-600 text-sm font-medium mt-1">Hủy bởi: {selectedOrder.cancelledBy === "admin" ? "Hệ thống/Admin" : "Khách hàng"}</p>}
                   </div>
                   <div>{renderActionButtons(selectedOrder)}</div>
                </div>

                {/* Thông tin Khách hàng & Thanh toán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột trái: Địa chỉ */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><MapPin size={16} className="text-emerald-600"/> Thông tin giao hàng</h4>
                    <p className="text-base font-bold text-gray-900 mb-1">{selectedOrder.user?.fullname || selectedOrder.shippingAddress?.receiver_name}</p>
                    <p className="text-sm text-gray-600 mb-3">SĐT: <span className="font-semibold">{selectedOrder.shippingAddress?.phone}</span></p>
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.ward}, {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.province}
                    </p>
                  </div>
                  
                  {/* Cột phải: Thanh toán & Ghi chú */}
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-xl p-5">
                       <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><CreditCard size={16} className="text-emerald-600"/> Phương thức thanh toán</h4>
                       <p className="text-base font-semibold text-gray-900 mb-2">{selectedOrder.paymentMethod}</p>
                       <div>
                         {selectedOrder.paymentStatus === 'paid' 
                           ? <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-semibold text-xs px-3 py-1.5 rounded-md"><CheckCircle2 size={14}/> Đã thanh toán</span> 
                           : <span className="inline-flex items-center bg-rose-100 text-rose-800 font-semibold text-xs px-3 py-1.5 rounded-md">Chưa thanh toán</span>}
                       </div>
                    </div>
                    {selectedOrder.orderNotes && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                        <NotebookPen size={18} className="text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-800 mb-1">Ghi chú của khách</p>
                          <p className="text-sm text-amber-900">"{selectedOrder.orderNotes}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Chi tiết mặt hàng</h4>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                           <tr>
                             <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                             <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Bao 25kg</th>
                             <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Bao 50kg</th>
                             <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ký lẻ</th>
                             <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thành tiền</th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {selectedOrder.items?.map((item: any, idx: number) => {
                             const itemPrice = (Number(item.q25)*Number(item.p25)) + (Number(item.q50)*Number(item.p50)) + (Number(item.qKg)*Number(item.pKg));
                             const iV = item.itemVoucher || item.voucher;
                             const iDisc = iV ? (iV.discountAmount || iV.discount || 0) : 0;

                             return (
                               <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg p-1 shrink-0">
                                      <img src={`${IMAGE_URL}/${item.image || item.product?.image}`} className="w-full h-full object-contain" onError={e=>e.target.src='https://via.placeholder.com/60'} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name || item.product?.name}</p>
                                      {iDisc > 0 && (
                                        <div className="mt-1 flex items-center gap-1 w-fit text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                          <Tag size={10} /> Voucher ({iV.code}): -{iDisc.toLocaleString()}đ
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm text-gray-600">{item.q25 || 0}</td>
                                  <td className="px-4 py-3 text-center text-sm text-gray-600">{item.q50 || 0}</td>
                                  <td className="px-4 py-3 text-center text-sm text-gray-600">{item.qKg || 0}</td>
                                  <td className="px-4 py-3 text-right">
                                     {iDisc > 0 && <p className="text-xs text-gray-400 line-through mb-0.5">{(itemPrice || 0).toLocaleString()}đ</p>}
                                     <p className="text-sm font-bold text-gray-900">{(itemPrice - iDisc).toLocaleString()}đ</p>
                                  </td>
                               </tr>
                             )
                           })}
                        </tbody>
                     </table>
                  </div>
                </div>

                {/* Tổng kết tiền */}
                <div className="border-t border-gray-200 pt-5 flex flex-col items-end gap-2 w-full max-w-sm ml-auto">
                  <div className="flex justify-between w-full text-sm text-gray-600"><span>Tiền hàng:</span><span className="font-medium">{(selectedOrder.subTotal || 0).toLocaleString()}đ</span></div>
                  <div className="flex justify-between w-full text-sm text-gray-600"><span>Phí vận chuyển:</span><span className="font-medium">+{(selectedOrder.shippingFee || 0).toLocaleString()}đ</span></div>
                  
                  {currentVoucherInfo.totalDiscount > 0 && (
                    <div className="flex justify-between w-full text-sm text-emerald-600">
                      <span className="flex items-center gap-1.5"><Tag size={14}/> Giảm Voucher:</span>
                      <span className="font-medium">-{(currentVoucherInfo.totalDiscount || 0).toLocaleString()}đ</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center w-full pt-3 mt-1 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Tổng thanh toán:</span>
                    <span className="text-2xl font-bold text-emerald-600">{(selectedOrder.totalAmount || 0).toLocaleString()}đ</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};