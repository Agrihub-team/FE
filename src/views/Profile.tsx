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
                  <div className="space-y-4">
                    {filteredOrders.map((order: any) => {
                      const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, cls: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400", badgeCls: "bg-slate-100 text-slate-500" };
                      const voucherInfo = getOrderVoucherInfo(order);
                      const isPaid = order.paymentStatus === 'paid';

                      return (
                        <div key={order._id} className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-100">

                          {/* Card header */}
                          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                              <Store size={15} className="text-slate-500"/>
                              <span className="text-sm font-bold text-slate-700">Agri-Hub Official</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Calendar size={11}/> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPaid && (
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full text-[10px] flex items-center gap-1 border border-emerald-100">
                                  <CheckCircle2 size={11}/> ĐÃ THANH TOÁN
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusInfo.cls}`}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dot}`}></span>
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="px-5 py-5 border-b border-slate-100 cursor-pointer hover:bg-slate-50/60 transition-colors" onClick={() => openOrderModal(order)}>
                            {order.items?.map((item: any, idx: number) => {
                              const rawPrice = (Number(item.q25)*Number(item.p25)) + (Number(item.q50)*Number(item.p50)) + (Number(item.qKg)*Number(item.pKg));
                              const itemV = item.itemVoucher;
                              const itemDiscount = itemV ? (itemV.discount || 0) : 0;
                              const qty = Number(item.q25) + Number(item.q50) + Number(item.qKg);
                              const specs = [item.q25 > 0 && `${item.q25} bao 25kg`, item.q50 > 0 && `${item.q50} bao 50kg`, item.qKg > 0 && `${item.qKg} ký`].filter(Boolean).join(" · ");

                              return (
                                <div key={idx} className="flex gap-4 mb-5 last:mb-0">
                                  <div className="w-24 h-24 border border-slate-200 rounded-lg shrink-0 bg-white flex items-center justify-center overflow-hidden">
                                    <img
                                      src={`${IMAGE_URL}/${item.image}`}
                                      className="w-full h-full object-contain p-1.5"
                                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=?'; }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base text-slate-800 font-semibold line-clamp-2 leading-snug">{item.name}</p>
                                    <p className="text-sm text-slate-500 mt-1">{specs || "—"}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">x{qty} sản phẩm</span>
                                      {itemDiscount > 0 && itemV?.code && (
                                        <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full font-bold border border-yellow-100 flex items-center gap-1">
                                          <Tag size={9}/> {itemV.code}: -{itemDiscount.toLocaleString()}đ
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    {itemDiscount > 0 && (
                                      <p className="text-xs text-slate-300 line-through mb-0.5">{(rawPrice || 0).toLocaleString()}đ</p>
                                    )}
                                    <span className="text-base text-slate-800 font-bold">{(rawPrice - itemDiscount).toLocaleString()}đ</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Card footer */}
                          <div className="px-5 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-500">Mã đơn: <span className="text-slate-700">#{order.orderCode}</span></p>
                              {order.orderNotes && (
                                <p className="text-xs text-orange-500 italic mt-1 flex items-center gap-1"><NotebookPen size={11}/> {order.orderNotes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              {voucherInfo.totalDiscount > 0 && (
                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full flex items-center gap-1 border border-emerald-100">
                                  <Tag size={13}/> -{voucherInfo.totalDiscount.toLocaleString()}đ
                                </span>
                              )}
                              <div className="text-right">
                                <p className="text-xs text-slate-400 font-medium">Thành tiền</p>
                                <p className="text-2xl font-black text-[#047857] leading-tight">{(order.totalAmount || 0).toLocaleString()}đ</p>
                              </div>
                              <button
                                onClick={() => openOrderModal(order)}
                                className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:border-[#047857] hover:text-[#047857] transition-colors"
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
                          <img src={`${IMAGE_URL}/${item.image}`} className="w-14 h-14 bg-white border border-slate-200 rounded object-contain p-1" />
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