// @ts-nocheck
import { useEffect, useState } from "react";
import { 
  Search, Shield, User as UserIcon, Mail, Phone, 
  Pencil, Trash2, Eye, EyeOff, Package, X, FileText, 
  Lock, Unlock, MapPin, CreditCard, Calendar, CheckCircle2, Tag, NotebookPen,
  Truck, Clock, Receipt, Banknote, ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../utils/api";
import { IMAGE_URL } from '../../utils/config';

export const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const rawUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = rawUser.user?._id || rawUser._id;

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form, setForm] = useState({ fullname: "", email: "", role: "USER" });

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState("info");
  
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderPopup, setShowOrderPopup] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.get("/users");
      const data = res.data || res.users || res || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Lỗi lấy danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === currentUserId) {
      toast.error("Hệ thống chặn: Bạn không thể tự xóa chính mình!");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này?")) return;
    try {
      await apiClient.delete(`/users/${id}`);
      toast.success("Đã xóa người dùng thành công");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa người dùng!");
    }
  };

  const handleToggleActive = async (user: any) => {
    if (user._id === currentUserId) {
      toast.error("Hệ thống chặn: Bạn không thể tự khóa tài khoản của mình!");
      return;
    }
    const action = user.is_active !== false ? "Khóa" : "Mở khóa";
    if (!window.confirm(`Bạn có chắc chắn muốn ${action.toLowerCase()} tài khoản của ${user.fullname}?`)) return;

    try {
      await apiClient.put(`/users/${user._id}`, { is_active: user.is_active === false ? true : false });
      toast.success(`Đã ${action.toLowerCase()} tài khoản thành công`);
      fetchUsers(); 
      
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...selectedUser, is_active: user.is_active === false ? true : false });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({ fullname: user.fullname, email: user.email, role: user.role?.toUpperCase() || "CUSTOMER" });
  };

  const handleUpdate = async () => {
    try {
      await apiClient.put(`/users/${editingUser._id}`, form);
      toast.success("Cập nhật thông tin thành công");
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật");
    }
  };

  const handleViewUser = async (user: any) => {
    try {
      setSelectedUser(user);
      setShowUserPopup(true);
      setActivePopupTab("info");
      
      const res: any = await apiClient.get("/orders");
      const orders = res.data || res || [];
      const filtered = orders.filter((o: any) => String(o.user?._id || o.user) === String(user._id));
      setUserOrders(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast.error("Không thể tải lịch sử đơn hàng");
    }
  };

  const getOrderVoucherInfo = (order: any) => {
    if (!order) return { totalDiscount: 0, codes: "" };
    let totalDiscount = 0;
    let codes: string[] = [];

    if (order.voucher && order.voucher.discountAmount) {
      totalDiscount += Number(order.voucher.discountAmount);
      if (order.voucher.code && !codes.includes(order.voucher.code)) codes.push(order.voucher.code);
    }
    if (order.items) {
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

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return u.fullname?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s);
  });

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><div className="w-8 h-8 border-4 border-[#047857] border-t-transparent rounded-full animate-spin"></div></div>;

  const currentOrderVoucherInfo = selectedOrder ? getOrderVoucherInfo(selectedOrder) : { totalDiscount: 0, codes: "" };

  return (
    <div className="min-h-screen bg-gray-50 w-full font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* HEADER */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản, phân quyền và trạng thái hoạt động</p>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input 
              type="text" 
              placeholder="Tìm tên, email hoặc SĐT..." 
              className="w-full border border-gray-300 bg-gray-50 pl-10 pr-4 py-2 rounded-lg outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] text-sm transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
            <UserIcon size={16} className="text-gray-400"/> Tổng cộng: <span className="font-bold text-gray-900">{filteredUsers.length}</span>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Tài khoản</th>
                  <th className="px-6 py-4 text-center">Phân quyền</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role?.toUpperCase() === "ADMIN";
                  const isActive = u.is_active !== false; 
                  const isMe = u._id === currentUserId; 
                  
                  return (
                    <tr key={u._id} onClick={() => handleViewUser(u)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 bg-gray-100 text-gray-600 border border-gray-200">
                            {u.fullname?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                              {u.fullname || "Chưa cập nhật"}
                              {isMe && <span className="bg-[#047857] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Bạn</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 border
                          ${isAdmin ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}
                        `}>
                          {isAdmin ? <Shield size={12}/> : <UserIcon size={12}/>}
                          {u.role || "USER"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          disabled={isMe}
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(u); }} 
                          className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1 border transition-colors
                          ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}
                          ${isMe ? "opacity-50 cursor-not-allowed" : ""}
                        `}>
                          {isActive ? "Hoạt động" : "Bị khóa"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(u); }} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Sửa"><Pencil size={18} /></button>
                          
                          <button disabled={isMe} onClick={(e) => { e.stopPropagation(); handleToggleActive(u); }} className={`p-2 rounded-lg transition-colors ${isMe ? 'opacity-30 cursor-not-allowed text-gray-400' : isActive ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title={isActive ? "Khóa" : "Mở khóa"}>
                            {isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>

                          <button disabled={isMe} onClick={(e) => { e.stopPropagation(); handleDelete(u._id); }} className={`p-2 rounded-lg transition-colors ${isMe ? 'opacity-30 cursor-not-allowed text-gray-400' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`} title="Xóa">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              <UserIcon size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Không tìm thấy người dùng nào</p>
            </div>
          )}
        </div>

        {/* MODAL EDIT */}
        {editingUser && (() => {
          const isEditingMe = editingUser._id === currentUserId;
          return (
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa người dùng</h2>
                  <button onClick={() => setEditingUser(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                    <input className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#047857] focus:border-[#047857]" value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} placeholder="VD: Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#047857] focus:border-[#047857]" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phân quyền</label>
                    <select 
                      disabled={isEditingMe} 
                      className={`w-full border px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:border-[#047857] ${isEditingMe ? 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500' : 'bg-white border-gray-300'}`} 
                      value={form.role} 
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                      <option value="ADMIN">Quản trị viên (ADMIN)</option>
                    </select>
                    {isEditingMe && <p className="text-xs text-red-500 mt-1.5">* Bạn không thể tự thay đổi quyền của chính mình.</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-8">
                  <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Hủy</button>
                  <button onClick={handleUpdate} className="px-4 py-2 bg-[#047857] text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition-colors">Lưu thay đổi</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MODAL USER DETAILS & ORDERS */}
        {showUserPopup && selectedUser && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowUserPopup(false)}>
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              
              {/* Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Chi tiết khách hàng</h3>
                <button onClick={() => setShowUserPopup(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
              </div>

              {/* TABS */}
              <div className="flex border-b border-gray-200 px-6 pt-2">
                <button onClick={() => setActivePopupTab("info")} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activePopupTab === "info" ? "border-[#047857] text-[#047857]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Thông tin cá nhân</button>
                <button onClick={() => setActivePopupTab("orders")} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activePopupTab === "orders" ? "border-[#047857] text-[#047857]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Lịch sử đơn hàng ({userOrders.length})</button>
              </div>

              <div className="p-6 bg-gray-50 min-h-[300px] max-h-[60vh] overflow-y-auto">
                {/* === TAB THÔNG TIN CÁ NHÂN === */}
                {activePopupTab === "info" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Họ tên</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.fullname || "---"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.email || "---"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.phone || "---"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Ngày tham gia</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN') : "---"}</p>
                    </div>
                  </div>
                )}

                {/* === TAB LỊCH SỬ ĐƠN HÀNG === */}
                {activePopupTab === "orders" && (
                  <div>
                    {userOrders.length > 0 ? (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50/80 text-[13px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="px-5 py-4">Mã đơn</th>
                              <th className="px-5 py-4">Ngày đặt</th>
                              <th className="px-5 py-4">Trạng thái</th>
                              <th className="px-5 py-4 text-right">Tổng tiền</th>
                              <th className="px-5 py-4 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {userOrders.map((order) => {
                              // Định nghĩa màu sắc và text cho trạng thái
                              const statusConfig: any = {
                                pending: { text: "Chờ xác nhận", color: "bg-amber-50 text-amber-600 border-amber-200" },
                                confirmed: { text: "Đã xác nhận", color: "bg-blue-50 text-blue-600 border-blue-200" },
                                preparing: { text: "Đang chuẩn bị", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
                                shipped: { text: "Đang giao hàng", color: "bg-purple-50 text-purple-600 border-purple-200" },
                                delivered: { text: "Đã giao thành công", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
                                cancelled: { text: "Đã hủy", color: "bg-red-50 text-red-600 border-red-200" },
                              };
                              const st = statusConfig[order.status] || { text: order.status, color: "bg-gray-50 text-gray-600 border-gray-200" };

                              return (
                                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                    <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-700">#{order.orderCode || order._id.substring(0,8).toUpperCase()}</span>
                                  </td>
                                  <td className="px-5 py-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={14} className="text-gray-400" />
                                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute:'2-digit' }) : "-"}
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                                      {st.text}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 text-right text-sm font-bold text-[#047857]">
                                    {(order.totalAmount || 0).toLocaleString()} đ
                                  </td>
                                  <td className="px-5 py-4 text-center">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setShowOrderPopup(true); }} 
                                      className="inline-flex items-center justify-center p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:shadow-sm transition-all"
                                      title="Xem chi tiết"
                                    >
                                      <Eye size={18}/>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        <ShoppingBag size={48} className="mx-auto mb-4 text-gray-300" />
                        <h4 className="text-lg font-medium text-gray-900 mb-1">Chưa có đơn hàng</h4>
                        <p className="text-sm">Người dùng này chưa thực hiện giao dịch nào.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === MODAL CHI TIẾT ĐƠN HÀNG === */}
        {showOrderPopup && selectedOrder && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" onClick={() => setShowOrderPopup(false)}>
            <div className="bg-gray-50 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
              
              {/* Header Modal */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-[#047857]/10 p-2.5 rounded-xl">
                    <Receipt className="text-[#047857]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      Đơn hàng <span className="text-[#047857]">#{selectedOrder.orderCode || selectedOrder._id.substring(0,8).toUpperCase()}</span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                      <Calendar size={14} /> Đặt lúc: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowOrderPopup(false)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><X size={24} /></button>
              </div>

              {/* Body Modal (Cuộn được) */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Grid 2 Cột: Thông tin Khách Hàng & Thanh Toán */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột 1: Giao hàng */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-blue-500"/> Thông tin nhận hàng
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <UserIcon size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 text-base">{selectedOrder.shippingAddress?.receiver_name}</p>
                          <p className="text-gray-600 mt-0.5">{selectedOrder.shippingAddress?.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                        <Truck size={16} className="text-gray-400 mt-0.5 shrink-0" />
                        <p className="text-gray-600 leading-relaxed">
                          {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.ward}, <br/>
                          {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.province}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cột 2: Thanh toán & Trạng thái */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard size={18} className="text-emerald-500"/> Thanh toán & Trạng thái
                    </h4>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                        <span className="text-gray-500">Phương thức</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Banknote size={16} className="text-gray-400"/> {selectedOrder.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : selectedOrder.paymentMethod}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                        <span className="text-gray-500">Trạng thái thanh toán</span>
                        {selectedOrder.paymentStatus === 'paid' 
                          ? <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold text-xs flex items-center gap-1"><CheckCircle2 size={14}/> Đã thanh toán</span> 
                          : <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-xs">Chưa thanh toán</span>}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Trạng thái đơn</span>
                        <span className="bg-gray-800 text-white px-3 py-1 rounded-full font-semibold text-xs uppercase tracking-wider shadow-sm">
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ghi chú đơn hàng (Nếu có) */}
                {selectedOrder.orderNotes && (
                   <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 items-start">
                     <NotebookPen size={18} className="text-yellow-600 mt-0.5 shrink-0" />
                     <div>
                       <p className="text-sm font-bold text-yellow-800 mb-1">Ghi chú của khách hàng:</p>
                       <p className="text-sm text-yellow-700 italic">"{selectedOrder.orderNotes}"</p>
                     </div>
                   </div>
                )}

                {/* Bảng Sản Phẩm Mua */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                    <Package size={18} className="text-gray-500"/>
                    <h4 className="font-bold text-gray-900">Chi tiết sản phẩm ({selectedOrder.items?.length || 0})</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-white text-[13px] font-semibold text-gray-500 uppercase border-b border-gray-200">
                          <tr>
                            <th className="px-5 py-4">Sản phẩm</th>
                            <th className="px-5 py-4 text-center bg-gray-50/50">SL 25kg</th>
                            <th className="px-5 py-4 text-center bg-gray-50/50">SL 50kg</th>
                            <th className="px-5 py-4 text-center bg-gray-50/50">SL Lẻ (Kg)</th>
                            <th className="px-5 py-4 text-right">Thành tiền</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {selectedOrder.items?.map((item: any, idx: number) => {
                            const itemPrice = (Number(item.q25)*Number(item.p25)) + (Number(item.q50)*Number(item.p50)) + (Number(item.qKg)*Number(item.pKg));
                            const iV = item.itemVoucher || item.voucher;
                            const iDisc = iV ? (iV.discountAmount || iV.discount || 0) : 0;

                            return (
                              <tr key={idx} className="hover:bg-gray-50/30">
                                 <td className="px-5 py-4">
                                   <div className="flex items-center gap-4">
                                     <div className="w-14 h-14 border border-gray-200 rounded-lg bg-white overflow-hidden shrink-0 shadow-sm">
                                        <img src={`${IMAGE_URL}/${item.image || item.product?.image}`} className="w-full h-full object-contain" alt={item.name} onError={e=>e.target.src='https://via.placeholder.com/60'} />
                                     </div>
                                     <div>
                                       <p className="text-sm font-bold text-gray-900 line-clamp-2">{item.name || item.product?.name}</p>
                                       {iDisc > 0 && (
                                         <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium border border-red-100">
                                           <Tag size={10}/> Voucher giảm {iDisc.toLocaleString()}đ
                                         </span>
                                       )}
                                     </div>
                                   </div>
                                 </td>
                                 <td className="px-5 py-4 text-center text-sm font-medium text-gray-700 bg-gray-50/30">{item.q25 > 0 ? <span className="bg-gray-200 px-2 py-1 rounded text-gray-800">{item.q25}</span> : "-"}</td>
                                 <td className="px-5 py-4 text-center text-sm font-medium text-gray-700 bg-gray-50/30">{item.q50 > 0 ? <span className="bg-gray-200 px-2 py-1 rounded text-gray-800">{item.q50}</span> : "-"}</td>
                                 <td className="px-5 py-4 text-center text-sm font-medium text-gray-700 bg-gray-50/30">{item.qKg > 0 ? <span className="bg-gray-200 px-2 py-1 rounded text-gray-800">{item.qKg}</span> : "-"}</td>
                                 <td className="px-5 py-4 text-right text-base font-bold text-[#047857]">
                                    {(itemPrice - iDisc).toLocaleString()}đ
                                 </td>
                              </tr>
                            )
                          })}
                       </tbody>
                    </table>
                  </div>
                </div>

                {/* Phần Tổng Kết Tiền (Invoice Style) */}
                <div className="flex justify-end pt-2">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 w-full md:w-80 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Tổng thanh toán</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Tạm tính ({selectedOrder.items?.length || 0} mục):</span>
                        <span className="font-medium text-gray-900">{(selectedOrder.subTotal || 0).toLocaleString()}đ</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Phí vận chuyển:</span>
                        <span className="font-medium text-gray-900">+{(selectedOrder.shippingFee || 0).toLocaleString()}đ</span>
                      </div>
                      
                      {currentOrderVoucherInfo.totalDiscount > 0 && (
                        <div className="flex justify-between text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100 -mx-2">
                          <span className="flex items-center gap-1.5"><Tag size={14}/> Voucher:</span>
                          <span>-{(currentOrderVoucherInfo.totalDiscount || 0).toLocaleString()}đ</span>
                        </div>
                      )}

                      <div className="pt-4 border-t border-dashed border-gray-300 mt-2 flex justify-between items-center">
                        <span className="font-bold text-gray-900 text-base">TỔNG CỘNG:</span>
                        <span className="font-black text-2xl text-[#047857]">{(selectedOrder.totalAmount || 0).toLocaleString()}đ</span>
                      </div>
                    </div>
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