// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  User, LogOut, Settings, MapPin, ChevronRight, FileText, 
  Store, X, Calendar, CreditCard, Tag, Edit2, Check, XCircle, NotebookPen, CheckCircle2
} from "lucide-react";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { apiClient } from "../utils/api";
import { AGRI_LOCATIONS } from "../utils/locations"; 

export const Profile = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("orders"); 
  const [orderFilter, setOrderFilter] = useState("all"); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rawUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = rawUser.user?._id || rawUser._id;
  const userRole = rawUser.user?.role || rawUser.role;

  const [profileData, setProfileData] = useState({
    fullname: "", phone: "", email: "",
    province: "", district: "", ward: "", street: ""
  });
  const [defaultAddressId, setDefaultAddressId] = useState(""); 
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await apiClient.get(`/users/${currentUserId}`).catch(() => null);
        const userData = userRes?.data || userRes;

        const addrRes = await apiClient.get("/addresses").catch(() => []);
        const addresses = Array.isArray(addrRes) ? addrRes : (addrRes?.data || []);
        const defaultAddr = addresses.find((a: any) => a.is_default) || addresses[0];

        if (userData) {
          setProfileData({
            fullname: userData.fullname || "",
            phone: userData.phone || "",
            email: userData.email || "",
            province: defaultAddr?.province || "",
            district: defaultAddr?.district || "",
            ward: defaultAddr?.ward || "",
            street: defaultAddr?.street || ""
          });
          if (defaultAddr) setDefaultAddressId(defaultAddr._id);
        }

        const orderRes = await apiClient.get("/orders");
        const allOrders = orderRes?.data || orderRes || [];
        const myOrders = allOrders.filter((o: any) => o.user?._id === currentUserId || o.user === currentUserId);
        myOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(myOrders);

      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [currentUserId, navigate]);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      toast.success("Đã đăng xuất thành công!");
      navigate("/login");
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      await apiClient.put(`/users/${currentUserId}`, {
        fullname: profileData.fullname,
        phone: profileData.phone
      });
      
      const addressPayload = {
        receiver_name: profileData.fullname,
        phone: profileData.phone,
        province: profileData.province,
        district: profileData.district,
        ward: profileData.ward,
        street: profileData.street,
        is_default: true
      };

      if (defaultAddressId) {
        await apiClient.put(`/addresses/${defaultAddressId}`, addressPayload);
      } else {
        const newAddr = await apiClient.post(`/addresses`, addressPayload);
        const newAddrData = newAddr?.data || newAddr;
        if (newAddrData?._id) setDefaultAddressId(newAddrData._id);
      }

      const updatedUser = { ...rawUser.user, fullname: profileData.fullname, phone: profileData.phone };
      localStorage.setItem("user", JSON.stringify({ ...rawUser, user: updatedUser }));
      
      toast.success("Cập nhật hồ sơ & địa chỉ thành công!");
      setIsEditingProfile(false); 
    } catch (error) {
      toast.error("Cập nhật thất bại. Vui lòng kiểm tra lại!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === "province") { newData.district = ""; newData.ward = ""; }
      if (name === "district") { newData.ward = ""; }
      return newData;
    });
  };

  const availableDistricts = useMemo(() => {
    const prov = AGRI_LOCATIONS.find(p => p.name === profileData.province);
    return prov ? prov.districts.map(d => d.name) : [];
  }, [profileData.province]);

  const availableWards = useMemo(() => {
    const prov = AGRI_LOCATIONS.find(p => p.name === profileData.province);
    if (prov && profileData.district) {
      const dist = prov.districts.find(d => d.name === profileData.district);
      return dist ? dist.wards : [];
    }
    return [];
  }, [profileData.province, profileData.district]);

  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // 🚀 ĐÃ FIX: Logic lọc chuẩn theo Enum trong Schema Mongoose
  const filteredOrders = orders.filter((o: any) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "preparing") return o.status === "pending" || o.status === "confirmed" || o.status === "preparing";
    if (orderFilter === "shipping") return o.status === "shipped";
    if (orderFilter === "completed") return o.status === "delivered";
    if (orderFilter === "cancelled") return o.status === "cancelled";
    return true;
  });

  // 🚀 ĐÃ FIX: Logic hiển thị màu sắc và text chuẩn theo Schema
  const getStatusDisplay = (order: any) => {
    const { status } = order;
    if (status === 'cancelled') return { text: "ĐÃ HỦY", color: "text-red-500" };
    if (status === 'delivered') return { text: "HOÀN THÀNH", color: "text-[#047857]" };
    if (status === 'shipped') return { text: "ĐANG GIAO HÀNG", color: "text-blue-500" };
    if (status === 'pending' || status === 'confirmed' || status === 'preparing') 
      return { text: "SHOP ĐANG CHUẨN BỊ", color: "text-orange-500" };
    return { text: status?.toUpperCase(), color: "text-slate-500" };
  };

  const getOrderVoucherInfo = (order: any) => {
    if (!order) return { totalDiscount: 0, codes: "" };
    let totalDiscount = 0;
    let codes: string[] = [];

    if (order.voucher) {
      const globalDiscount = order.voucher.discountAmount || 0;
      if (globalDiscount > 0) {
        totalDiscount += globalDiscount;
        if (order.voucher.code && !codes.includes(order.voucher.code)) codes.push(order.voucher.code);
      }
    }

    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const itemV = item.itemVoucher;
        if (itemV) {
          const itemDiscount = itemV.discount || 0;
          if (itemDiscount > 0) {
            totalDiscount += itemDiscount;
            if (itemV.code && !codes.includes(itemV.code)) codes.push(itemV.code);
          }
        }
      });
    }
    return { totalDiscount, codes: codes.join(", ") };
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col font-sans text-slate-800 relative">
      <Header />

      <main className="flex-grow max-w-[1200px] mx-auto w-full px-4 md:px-8 py-6">
        <div className="pb-4 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/" className="hover:text-[#047857]">Trang chủ</Link> 
          <ChevronRight size={14} /> 
          <span className="text-slate-800">Tài khoản của tôi</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= SIDEBAR MENU ================= */}
          <div className="lg:col-span-3 lg:sticky top-6">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-lg font-bold border border-slate-300 shrink-0">
                {profileData.fullname?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm text-slate-800 truncate">{profileData.fullname || "Đang tải..."}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><User size={12}/> Thành viên</p>
              </div>
            </div>

            <div className="space-y-1">
              <button onClick={() => setActiveMenu('profile')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${activeMenu === 'profile' ? 'text-[#047857]' : 'text-slate-700 hover:text-[#047857]'}`}>
                <User size={18} className={activeMenu === 'profile' ? 'text-[#047857]' : 'text-blue-500'} /> Hồ sơ cá nhân
              </button>
              
              <button onClick={() => setActiveMenu('orders')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${activeMenu === 'orders' ? 'text-[#047857]' : 'text-slate-700 hover:text-[#047857]'}`}>
                <FileText size={18} className={activeMenu === 'orders' ? 'text-[#047857]' : 'text-orange-500'} /> Đơn Mua
              </button>

              {userRole === 'admin' && (
                <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium text-slate-700 hover:text-[#047857] transition-colors">
                  <Settings size={18} className="text-slate-600" /> Quản lý Admin
                </Link>
              )}

              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium text-slate-700 hover:text-red-500 transition-colors mt-4">
                <LogOut size={18} className="text-slate-400" /> Đăng xuất
              </button>
            </div>
          </div>

          {/* ================= NỘI DUNG CHÍNH ================= */}
          <div className="lg:col-span-9 space-y-4">
            
            {activeMenu === 'orders' && (
              <>
                <div className="bg-white flex overflow-x-auto shadow-sm sticky top-0 z-10">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'preparing', label: 'Chờ xử lý' },
                    { id: 'shipping', label: 'Đang giao' },
                    { id: 'completed', label: 'Hoàn thành' },
                    { id: 'cancelled', label: 'Đã hủy' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderFilter(tab.id)}
                      className={`flex-1 py-4 text-sm font-medium whitespace-nowrap px-4 border-b-2 transition-colors ${orderFilter === tab.id ? 'border-[#047857] text-[#047857]' : 'border-transparent text-slate-600 hover:text-[#047857]'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#047857]"></div></div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white shadow-sm flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FileText size={40} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm">Chưa có đơn hàng trong mục này</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order: any) => {
                      const displayStatus = getStatusDisplay(order);
                      const voucherInfo = getOrderVoucherInfo(order);
                      const isPaid = order.paymentStatus === 'paid';
                      
                      return (
                        <div key={order._id} className="bg-white shadow-sm">
                          <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Store size={14} className="text-slate-600"/>
                              <span className="text-sm font-bold text-slate-800">Agri-Hub Official</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {isPaid && <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-emerald-100"><CheckCircle2 size={10}/> ĐÃ THANH TOÁN</span>}
                              <span className={`font-medium ${displayStatus.color} uppercase`}>{displayStatus.text}</span>
                            </div>
                          </div>

                          <div className="px-6 py-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50/50" onClick={() => openOrderModal(order)}>
                            {order.items?.map((item: any, idx: number) => {
                              const rawPrice = (Number(item.q25)*Number(item.p25)) + (Number(item.q50)*Number(item.p50)) + (Number(item.qKg)*Number(item.pKg));
                              const itemV = item.itemVoucher;
                              const itemDiscount = itemV ? (itemV.discount || 0) : 0;
                              
                              return (
                                <div key={idx} className="flex gap-3 mb-4 last:mb-0">
                                  <div className="w-20 h-20 border border-slate-200 shrink-0 bg-white flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={`http://localhost:3001/images/products/${item.image}`} 
                                      className="w-full h-full object-contain p-1" 
                                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image'; }} 
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-800 line-clamp-2 font-medium">{item.name}</p>
                                    <div className="text-xs text-slate-500 mt-1">
                                      Phân loại: {item.q25 > 0 ? '25kg ' : ''}{item.q50 > 0 ? '50kg ' : ''}{item.qKg > 0 ? 'Ký' : ''}
                                    </div>
                                    {itemDiscount > 0 && itemV.code && (
                                      <div className="mt-1 flex items-center gap-1 w-fit text-[9px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded font-bold uppercase border border-yellow-100">
                                        <Tag size={10} /> Mã {itemV.code}: -{itemDiscount.toLocaleString()}đ
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    {itemDiscount > 0 && <p className="text-[10px] text-slate-400 line-through mb-0.5">{(rawPrice || 0).toLocaleString()}đ</p>}
                                    <span className="text-sm text-slate-800 font-bold">{(rawPrice - itemDiscount).toLocaleString()}đ</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="px-6 py-4 bg-slate-50/50 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                            <div className="flex flex-col gap-1">
                               <div className="text-xs text-slate-500">Mã đơn: #{order.orderCode}</div>
                               {order.orderNotes && <div className="text-[10px] text-orange-500 font-medium italic flex items-center gap-1"><NotebookPen size={10}/> {order.orderNotes}</div>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {voucherInfo.totalDiscount > 0 && (
                                <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1">
                                  <Tag size={12} /> Đã giảm: -{voucherInfo.totalDiscount.toLocaleString()}đ
                                </div>
                              )}
                              <div className="text-sm text-slate-800 flex items-center gap-2">
                                <span>Thành tiền:</span>
                                <span className="text-xl font-bold text-[#047857]">{(order.totalAmount || 0).toLocaleString()}đ</span>
                              </div>
                              <button onClick={() => openOrderModal(order)} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded hover:bg-slate-50 transition-colors">
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeMenu === 'profile' && (
              <div className="bg-white shadow-sm p-6 md:p-8 min-h-[500px]">
                <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-lg font-medium text-slate-800">Hồ sơ của tôi</h2>
                    <p className="text-sm text-slate-500 mt-1">Quản lý thông tin cá nhân</p>
                  </div>
                  {!isEditingProfile ? (
                    <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-sm font-bold text-[#047857] bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                      <Edit2 size={16} /> Chỉnh sửa
                    </button>
                  ) : (
                    <button onClick={() => setIsEditingProfile(false)} className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                      <XCircle size={16} /> Hủy sửa
                    </button>
                  )}
                </div>

                <div className="max-w-2xl flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-5">
                    <div className="flex items-center">
                      <div className="w-28 text-sm text-slate-500 text-right pr-4">Email</div>
                      <div className="flex-1 text-sm text-slate-800 font-bold bg-slate-50 p-2.5 rounded border border-slate-100">{profileData.email}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-28 text-sm text-slate-500 text-right pr-4">Họ và Tên</div>
                      <div className="flex-1">
                        {!isEditingProfile ? (<div className="text-sm text-slate-800 font-medium py-2.5">{profileData.fullname}</div>) : (
                          <input name="fullname" value={profileData.fullname} onChange={handleProfileChange} type="text" className="w-full border border-[#047857] rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-28 text-sm text-slate-500 text-right pr-4">Số ĐT</div>
                      <div className="flex-1">
                        {!isEditingProfile ? (<div className="text-sm text-slate-800 font-medium py-2.5">{profileData.phone}</div>) : (
                          <input name="phone" value={profileData.phone} onChange={handleProfileChange} type="text" className="w-full border border-[#047857] rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-start pt-2 border-t border-slate-100">
                      <div className="w-28 text-sm text-slate-500 text-right pr-4 pt-2">Địa chỉ</div>
                      <div className="flex-1">
                        {!isEditingProfile ? (
                          <div className="text-sm text-slate-800 font-medium py-2.5 leading-relaxed">
                            {profileData.province ? `${profileData.street}, ${profileData.ward}, ${profileData.district}, ${profileData.province}` : "Chưa cập nhật địa chỉ"}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <select name="province" value={profileData.province} onChange={handleProfileChange} className="w-full border border-[#047857] rounded px-3 py-2.5 text-sm bg-white tracking-wide">
                              <option value="">Chọn Tỉnh/Thành</option>
                              {AGRI_LOCATIONS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                              <select name="district" value={profileData.district} onChange={handleProfileChange} className="w-full border border-[#047857] rounded px-3 py-2.5 text-sm bg-white">
                                <option value="">Quận/Huyện</option>
                                {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <select name="ward" value={profileData.ward} onChange={handleProfileChange} className="w-full border border-[#047857] rounded px-3 py-2.5 text-sm bg-white">
                                <option value="">Phường/Xã</option>
                                {availableWards.map((w) => <option key={w} value={w}>{w}</option>)}
                              </select>
                            </div>
                            <input name="street" value={profileData.street} onChange={handleProfileChange} type="text" placeholder="Số nhà, Tên đường..." className="w-full border border-[#047857] rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
                          </div>
                        )}
                      </div>
                    </div>
                    {isEditingProfile && (
                      <div className="flex items-center pt-6">
                        <div className="w-28"></div>
                        <button onClick={handleUpdateProfile} disabled={isUpdating} className={`flex items-center gap-2 bg-[#047857] text-white px-8 py-3 text-sm font-bold rounded shadow-md transition-colors ${isUpdating ? 'opacity-50' : 'hover:bg-[#035b42]'}`}>
                          {isUpdating ? 'Đang lưu...' : <><Check size={18} /> Lưu thay đổi</>}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-64 md:border-l border-slate-100 flex flex-col items-center pt-4">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full border-2 border-emerald-100 flex items-center justify-center text-3xl font-black text-[#047857] mb-4 shadow-inner">
                      {profileData.fullname?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* ================= MODAL CHI TIẾT ĐƠN HÀNG ================= */}
      {isModalOpen && selectedOrder && (() => {
        const vInfo = getOrderVoucherInfo(selectedOrder);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Chi tiết đơn hàng</h3>
                  <p className="text-xs text-slate-500 font-medium">Mã đơn: #{selectedOrder.orderCode}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={12}/> Người nhận</p>
                    <p className="text-sm font-bold text-slate-800">{selectedOrder.shippingAddress?.receiver_name}</p>
                    <p className="text-xs text-slate-600 font-medium">{selectedOrder.shippingAddress?.phone}</p>
                    <p className="text-xs text-slate-600 mt-1 pr-2 leading-relaxed italic">{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.ward}, {selectedOrder.shippingAddress?.district}, {selectedOrder.shippingAddress?.province}</p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1"><CreditCard size={12}/> Thanh toán</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{selectedOrder.paymentMethod}</p>
                    <p className="text-xs mt-1">{selectedOrder.paymentStatus === 'paid' ? <span className="text-emerald-600 font-black">ĐÃ THANH TOÁN</span> : <span className="text-orange-500 font-bold">CHƯA THANH TOÁN</span>}</p>
                    <p className="text-[10px] text-slate-500 mt-3 flex items-center gap-1 font-medium"><Calendar size={10}/> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                {selectedOrder.orderNotes && (
                  <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex items-start gap-2">
                    <NotebookPen size={16} className="text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-yellow-600 uppercase mb-0.5">Ghi chú</p>
                      <p className="text-sm font-medium text-yellow-800 leading-relaxed italic">"{selectedOrder.orderNotes}"</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-3 border-b border-slate-100 pb-2">Danh sách mặt hàng</p>
                  <div className="space-y-4">
                    {selectedOrder.items?.map((item: any, idx: number) => {
                      const itemPrice = (Number(item.q25)*Number(item.p25)) + (Number(item.q50)*Number(item.p50)) + (Number(item.qKg)*Number(item.pKg));
                      const iV = item.itemVoucher;
                      const iDisc = iV ? (iV.discount || 0) : 0;
                      
                      return (
                        <div key={idx} className="flex gap-3 items-center">
                          <img src={`http://localhost:3001/images/products/${item.image}`} className="w-14 h-14 bg-white border border-slate-200 rounded object-contain p-1" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</p>
                            <p className="text-xs text-slate-500">Phân loại: {item.q25 > 0 ? '25kg ' : ''}{item.q50 > 0 ? '50kg ' : ''}{item.qKg > 0 ? 'Lẻ' : ''}</p>
                            {iDisc > 0 && <p className="text-[10px] text-yellow-600 font-black mt-1 uppercase flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 w-fit"><Tag size={10}/> Voucher: -{iDisc.toLocaleString()}đ</p>}
                          </div>
                          <div className="text-right">
                            {iDisc > 0 && <p className="text-[10px] text-slate-300 line-through">{(itemPrice || 0).toLocaleString()}đ</p>}
                            <p className="text-sm font-bold text-slate-800">{(itemPrice - iDisc).toLocaleString()}đ</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">x{Number(item.q25)+Number(item.q50)+Number(item.qKg)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600"><span>Tiền hàng:</span><span className="font-semibold text-slate-800">{(selectedOrder.subTotal || 0).toLocaleString()}đ</span></div>
                  <div className="flex justify-between text-sm text-slate-600"><span>Vận chuyển:</span><span className="font-semibold text-slate-800">+{(selectedOrder.shippingFee || 0).toLocaleString()}đ</span></div>
                  {vInfo.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-bold bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100">
                      <span>Giảm giá Voucher:</span>
                      <span>-{vInfo.totalDiscount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-base font-bold text-slate-800">Tổng cộng:</span>
                    <span className="text-2xl font-black text-[#047857]">{(selectedOrder.totalAmount || 0).toLocaleString()}đ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};