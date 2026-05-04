// @ts-nocheck
import { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User, LogOut, Settings, MapPin, ChevronRight, FileText,
  Store, X, Calendar, CreditCard, Tag, Edit2, Check, XCircle, NotebookPen, CheckCircle2, RefreshCw
} from "lucide-react";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { apiClient } from "../utils/api";
import { AGRI_LOCATIONS } from "../utils/locations";
import { IMAGE_URL } from '../utils/config';

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string; badgeCls: string }> = {
  pending:   { label: "Chờ xác nhận",   cls: "bg-yellow-50 text-yellow-700 border-yellow-200",   dot: "bg-yellow-400",  badgeCls: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Đã duyệt",       cls: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-400",    badgeCls: "bg-blue-100 text-blue-700" },
  preparing: { label: "Đang chuẩn bị",  cls: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-400",  badgeCls: "bg-orange-100 text-orange-700" },
  shipped:   { label: "Đang giao hàng", cls: "bg-sky-50 text-sky-700 border-sky-200",            dot: "bg-sky-400",     badgeCls: "bg-sky-100 text-sky-700" },
  delivered: { label: "Đã giao",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", badgeCls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Đã hủy",         cls: "bg-red-50 text-red-600 border-red-200",            dot: "bg-red-400",     badgeCls: "bg-red-100 text-red-600" },
};

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

        const orderRes = await apiClient.get("/orders/my");
        const myOrders: any[] = Array.isArray(orderRes) ? orderRes : orderRes?.data || [];
        myOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  // --- polling: re-fetch orders every 30s and toast on status change ---
  const prevStatusesRef = useRef<Record<string, string>>({});
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshOrders = async (silent = true) => {
    if (!currentUserId) return;
    if (!silent) setIsRefreshing(true);
    try {
      const orderRes = await apiClient.get("/orders/my");
      const latest: any[] = Array.isArray(orderRes) ? orderRes : (orderRes?.data || []);
      latest.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const prev = prevStatusesRef.current;
      latest.forEach((o) => {
        if (prev[o._id] && prev[o._id] !== o.status) {
          const s = STATUS_MAP[o.status];
          toast.info(`Đơn #${o.orderCode} → ${s?.label || o.status}`, {
            description: "Trạng thái đơn hàng vừa được cập nhật",
            duration: 6000,
          });
        }
      });
      const newMap: Record<string, string> = {};
      latest.forEach((o) => { newMap[o._id] = o.status; });
      prevStatusesRef.current = newMap;

      setOrders(latest);
      setLastRefreshed(new Date());
    } catch (_) {}
    finally { if (!silent) setIsRefreshing(false); }
  };

  const seededRef = useRef(false);
  useEffect(() => {
    if (!currentUserId || orders.length === 0 || seededRef.current) return;
    seededRef.current = true;
    const seed: Record<string, string> = {};
    orders.forEach((o: any) => { seed[o._id] = o.status; });
    prevStatusesRef.current = seed;
    setLastRefreshed(new Date());
  }, [orders]);

  useEffect(() => {
    if (!currentUserId) return;
    const id = setInterval(() => refreshOrders(true), 30_000);
    return () => clearInterval(id);
  }, [currentUserId]);

  const statusCounts = useMemo(() =>
    orders.reduce((acc: Record<string, number>, o: any) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}),
  [orders]);

  const filteredOrders = orders.filter((o: any) => {
    if (orderFilter === "all") return true;
    return o.status === orderFilter;
  });

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

              {userRole === 'ADMIN' && (
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
                <div className="bg-white shadow-sm">
                  {/* Tab bar */}
                  <div className="flex overflow-x-auto border-b border-slate-100">
                    {[
                      { id: 'all',       label: 'Tất cả' },
                      { id: 'pending',   label: 'Chờ xác nhận' },
                      { id: 'confirmed', label: 'Đã duyệt' },
                      { id: 'preparing', label: 'Đang chuẩn bị' },
                      { id: 'shipped',   label: 'Đang giao' },
                      { id: 'delivered', label: 'Đã giao' },
                      { id: 'cancelled', label: 'Đã hủy' },
                    ].map(tab => {
                      const count = tab.id === 'all' ? orders.length : (statusCounts[tab.id] || 0);
                      const sm = STATUS_MAP[tab.id];
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setOrderFilter(tab.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 py-3.5 text-sm font-medium whitespace-nowrap px-4 border-b-2 transition-colors ${orderFilter === tab.id ? 'border-[#047857] text-[#047857]' : 'border-transparent text-slate-500 hover:text-[#047857]'}`}
                        >
                          {tab.label}
                          {count > 0 && (
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none ${orderFilter === tab.id ? 'bg-emerald-100 text-[#047857]' : (sm?.badgeCls || 'bg-slate-100 text-slate-500')}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Refresh bar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-50/70 border-b border-slate-100">
                    <p className="text-[11px] text-slate-400">
                      {lastRefreshed ? `Cập nhật lúc ${lastRefreshed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Đang tải...'}
                    </p>
                    <button
                      onClick={() => refreshOrders(false)}
                      disabled={isRefreshing}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-[#047857] hover:text-[#035b42] disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                      Làm mới
                    </button>
                  </div>
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
                      const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400", badgeCls: "bg-slate-100 text-slate-500" };
                      const voucherInfo = getOrderVoucherInfo(order);
                      const isPaid = order.paymentStatus === 'paid';
                      const previewItems = order.items?.slice(0, 2) || [];
                      const extraCount = (order.items?.length || 0) - 2;

                      return (
                        <div key={order._id} className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-200">

                          {/* Card header */}
                          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/70">
                            <div className="flex items-center gap-2">
                              <Store size={14} className="text-[#047857]" />
                              <span className="text-sm font-bold text-slate-700">Agri-Hub Official</span>
                              <span className="text-slate-200 select-none">|</span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                <Calendar size={10}/> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPaid && (
                                <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                  <CheckCircle2 size={10}/> Đã TT
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${statusInfo.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusInfo.dot}`}></span>
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Items preview */}
                          <div
                            className="px-5 py-4 cursor-pointer hover:bg-slate-50/40 transition-colors"
                            onClick={() => openOrderModal(order)}
                          >
                            <div className="space-y-3">
                              {previewItems.map((item: any, idx: number) => {
                                const qty = Number(item.q25) + Number(item.q50) + Number(item.qKg);
                                const itemPrice = (Number(item.q25)*Number(item.p25)) + (Number(item.q50)*Number(item.p50)) + (Number(item.qKg)*Number(item.pKg));
                                const iDisc = item.itemVoucher?.discount || 0;
                                const specs = [item.q25 > 0 && `${item.q25} bao 25kg`, item.q50 > 0 && `${item.q50} bao 50kg`, item.qKg > 0 && `${item.qKg} ký`].filter(Boolean).join(" · ");
                                return (
                                  <div key={idx} className="flex items-center gap-3">
                                    <div className="w-[60px] h-[60px] rounded-lg border border-slate-100 bg-white shrink-0 overflow-hidden">
                                      <img
                                        src={`${IMAGE_URL}/${item.image}`}
                                        className="w-full h-full object-contain p-1"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/60?text=?'; }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 line-clamp-1 leading-snug">{item.name}</p>
                                      <p className="text-xs text-slate-400 mt-0.5">{specs || "—"}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-sm font-bold text-slate-700">{(itemPrice - iDisc).toLocaleString()}đ</p>
                                      <p className="text-[11px] text-slate-400">×{qty}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              {extraCount > 0 && (
                                <p className="text-xs text-[#047857] font-semibold text-center py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                  Xem thêm {extraCount} sản phẩm →
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Card footer */}
                          <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">#{order.orderCode}</span>
                              {voucherInfo.totalDiscount > 0 && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 shrink-0">
                                  <Tag size={9}/> -{voucherInfo.totalDiscount.toLocaleString()}đ
                                </span>
                              )}
                              {order.orderNotes && (
                                <span className="text-[11px] text-orange-400 italic flex items-center gap-1 truncate">
                                  <NotebookPen size={10}/> {order.orderNotes}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Tổng tiền</p>
                                <p className="text-lg font-black text-[#047857] leading-none">{(order.totalAmount || 0).toLocaleString()}<span className="text-sm font-bold ml-0.5">đ</span></p>
                              </div>
                              <button
                                onClick={() => openOrderModal(order)}
                                className="px-4 py-2 text-xs font-bold text-[#047857] border-2 border-[#047857]/30 rounded-lg hover:border-[#047857] hover:bg-[#047857] hover:text-white transition-all"
                              >
                                Chi tiết
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
                  {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-sm font-bold text-[#047857] bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">
                      <Edit2 size={16} /> Chỉnh sửa
                    </button>
                  )}
                </div>

                <div className="max-w-2xl flex flex-col md:flex-row gap-8">
                  <div className="flex-1">

                    {/* Avatar + name (view mode only) */}
                    {!isEditingProfile && (
                      <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full border-2 border-emerald-100 flex items-center justify-center text-2xl font-black text-[#047857] shrink-0">
                          {profileData.fullname?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-800">{profileData.fullname || "—"}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{profileData.email}</p>
                          <p className="text-sm text-slate-500">{profileData.phone || "Chưa có số điện thoại"}</p>
                        </div>
                      </div>
                    )}

                    {/* Info rows — view mode */}
                    {!isEditingProfile && (
                      <div className="space-y-0 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        <div className="flex items-start px-4 py-3 bg-white">
                          <span className="w-32 text-xs font-semibold text-slate-400 uppercase tracking-wider pt-0.5">Địa chỉ</span>
                          <span className="flex-1 text-sm text-slate-700 leading-relaxed">
                            {profileData.province
                              ? [profileData.street, profileData.ward, profileData.district, profileData.province].filter(Boolean).join(", ")
                              : <span className="text-slate-400 italic">Chưa cập nhật địa chỉ</span>}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditingProfile && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Họ và Tên</label>
                            <input
                              name="fullname"
                              value={profileData.fullname}
                              onChange={handleProfileChange}
                              type="text"
                              placeholder="Nhập họ và tên..."
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-[#047857] focus:ring-2 focus:ring-emerald-50 transition-colors placeholder:text-slate-300"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                            <input
                              name="phone"
                              value={profileData.phone}
                              onChange={handleProfileChange}
                              type="text"
                              placeholder="VD: 0987654321"
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-[#047857] focus:ring-2 focus:ring-emerald-50 transition-colors placeholder:text-slate-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                          <div className="w-full border border-slate-100 rounded-lg px-3.5 py-2.5 text-sm text-slate-400 bg-slate-50 select-none">{profileData.email}</div>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <MapPin size={12} className="text-slate-400" /> Địa chỉ giao hàng
                          </p>
                          <div className="space-y-3">
                            <select
                              name="province"
                              value={profileData.province}
                              onChange={handleProfileChange}
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-[#047857] focus:ring-2 focus:ring-emerald-50 transition-colors appearance-none cursor-pointer"
                            >
                              <option value="">— Chọn Tỉnh / Thành phố —</option>
                              {AGRI_LOCATIONS.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                name="district"
                                value={profileData.district}
                                onChange={handleProfileChange}
                                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-[#047857] focus:ring-2 focus:ring-emerald-50 transition-colors appearance-none cursor-pointer"
                              >
                                <option value="">— Quận / Huyện —</option>
                                {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <select
                                name="ward"
                                value={profileData.ward}
                                onChange={handleProfileChange}
                                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-[#047857] focus:ring-2 focus:ring-emerald-50 transition-colors appearance-none cursor-pointer"
                              >
                                <option value="">— Phường / Xã —</option>
                                {availableWards.map((w) => <option key={w} value={w}>{w}</option>)}
                              </select>
                            </div>
                            <input
                              name="street"
                              value={profileData.street}
                              onChange={handleProfileChange}
                              type="text"
                              placeholder="Số nhà, tên đường..."
                              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 bg-white outline-none focus:border-[#047857] focus:ring-2 focus:ring-emerald-50 transition-colors placeholder:text-slate-300"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={handleUpdateProfile}
                            disabled={isUpdating}
                            className={`flex items-center gap-2 bg-[#047857] text-white px-6 py-2.5 text-sm font-bold rounded-lg shadow-sm transition-colors ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#035b42]'}`}
                          >
                            {isUpdating ? (
                              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span> Đang lưu...</>
                            ) : (
                              <><Check size={16} /> Lưu thay đổi</>
                            )}
                          </button>
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-5 py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <XCircle size={16} /> Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Avatar — shown only in edit mode (moved inline in view mode) */}
                  {isEditingProfile && (
                    <div className="w-full md:w-48 flex flex-col items-center gap-3 pt-2">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full border-2 border-emerald-100 flex items-center justify-center text-3xl font-black text-[#047857] shadow-inner">
                        {profileData.fullname?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <p className="text-xs text-slate-400 text-center">Ảnh đại diện</p>
                    </div>
                  )}
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
        const statusInfo = STATUS_MAP[selectedOrder.status] ?? { label: selectedOrder.status, cls: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400", badgeCls: "bg-slate-100 text-slate-500" };
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <div className="bg-white w-full sm:rounded-2xl sm:max-w-[560px] max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Chi tiết đơn hàng</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400 font-semibold">#{selectedOrder.orderCode}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                      {statusInfo.label}
                    </span>
                    {selectedOrder.paymentStatus === 'paid' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10}/> Đã TT
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-5 space-y-4">

                {/* Địa chỉ + thanh toán */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                      <MapPin size={11}/> Giao tới
                    </p>
                    <p className="text-sm font-bold text-slate-800">{selectedOrder.shippingAddress?.receiver_name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedOrder.shippingAddress?.phone}</p>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {[selectedOrder.shippingAddress?.street, selectedOrder.shippingAddress?.ward, selectedOrder.shippingAddress?.district, selectedOrder.shippingAddress?.province].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                      <CreditCard size={11}/> Thanh toán
                    </p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{selectedOrder.paymentMethod}</p>
                    <span className={`inline-block text-[10px] font-black mt-1.5 px-2.5 py-1 rounded-full ${selectedOrder.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600'}`}>
                      {selectedOrder.paymentStatus === 'paid' ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1 font-medium">
                      <Calendar size={10}/> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Ghi chú */}
                {selectedOrder.orderNotes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-3">
                    <NotebookPen size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-wide mb-0.5">Ghi chú</p>
                      <p className="text-sm text-amber-800 italic leading-relaxed">"{selectedOrder.orderNotes}"</p>
                    </div>
                  </div>
                )}

                {/* Danh sách sản phẩm */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
                    <FileText size={11}/> Sản phẩm ({selectedOrder.items?.length || 0})
                  </p>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {selectedOrder.items?.map((item: any, idx: number) => {
                      const itemPrice = (Number(item.q25)*Number(item.p25)) + (Number(item.q50)*Number(item.p50)) + (Number(item.qKg)*Number(item.pKg));
                      const iV = item.itemVoucher;
                      const iDisc = iV ? (iV.discount || 0) : 0;
                      const qty = Number(item.q25)+Number(item.q50)+Number(item.qKg);
                      const specs = [item.q25 > 0 && `${item.q25} bao 25kg`, item.q50 > 0 && `${item.q50} bao 50kg`, item.qKg > 0 && `${item.qKg} ký lẻ`].filter(Boolean).join(" · ");
                      return (
                        <div key={idx} className="flex gap-3 p-3.5 bg-white">
                          <div className="w-[56px] h-[56px] rounded-xl border border-slate-100 bg-slate-50 shrink-0 overflow-hidden flex items-center justify-center">
                            <img src={`${IMAGE_URL}/${item.image}`} className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{item.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{specs || "—"}</p>
                            {iDisc > 0 && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100 font-bold mt-1">
                                <Tag size={8}/> -{iDisc.toLocaleString()}đ
                              </span>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {iDisc > 0 && <p className="text-[10px] text-slate-300 line-through">{(itemPrice || 0).toLocaleString()}đ</p>}
                            <p className="text-sm font-bold text-slate-800">{(itemPrice - iDisc).toLocaleString()}đ</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">×{qty}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tổng kết */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between items-center px-4 py-3 text-sm text-slate-600">
                      <span>Tiền hàng</span>
                      <span className="font-semibold text-slate-800">{(selectedOrder.subTotal || 0).toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-sm text-slate-600">
                      <span className="flex items-center gap-2">
                        Phí vận chuyển
                        {selectedOrder.shippingMethod === 'FAST' && (
                          <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">⚡ Hỏa tốc</span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-800">+{(selectedOrder.shippingFee || 0).toLocaleString()}đ</span>
                    </div>
                    {vInfo.totalDiscount > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 text-sm font-bold text-emerald-700 bg-emerald-50/60">
                        <span className="flex items-center gap-1.5"><Tag size={13}/> Giảm giá voucher</span>
                        <span>-{vInfo.totalDiscount.toLocaleString()}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-4 py-4 bg-white">
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Tổng thanh toán</span>
                      <span className="text-2xl font-black text-[#047857]">
                        {(selectedOrder.totalAmount || 0).toLocaleString()}<span className="text-base font-bold ml-0.5">đ</span>
                      </span>
                    </div>
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