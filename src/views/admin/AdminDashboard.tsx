// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import { toast } from "sonner";
import { apiClient } from "../../utils/api";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  
  // States chứa toàn bộ dữ liệu gốc từ DB
  const [allOrders, setAllOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allCats, setAllCats] = useState([]);

  const [timeFilter, setTimeFilter] = useState(7); // Số ngày muốn xem (7, 14, 30)
  const [orderFilter, setOrderFilter] = useState("all");

  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        setLoading(true);
        // Lấy tất cả dữ liệu từ DB một lần duy nhất
        const [ordersRes, prodsRes, usersRes, catsRes] = await Promise.all([
          apiClient.get("/orders"),
          apiClient.get("/products"),
          apiClient.get("/users"),
          apiClient.get("/categories")
        ]);

        setAllOrders(ordersRes?.data || ordersRes || []);
        setAllProducts(prodsRes?.products || prodsRes?.data || prodsRes || []);
        setAllUsers(usersRes?.data || usersRes || []);
        setAllCats(catsRes?.data || catsRes || []);
      } catch (error: any) {
        toast.error(error.message || "Lỗi lấy dữ liệu hệ thống");
      } finally {
        setLoading(false);
      }
    };

    fetchCoreData();
    // Tự động làm mới dữ liệu ngầm mỗi 5 phút
    const interval = setInterval(fetchCoreData, 300000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // LOGIC TÍNH TOÁN DỮ LIỆU ĐỘNG THEO SỐ NGÀY
  // ==========================================
  const { 
    periodOrders, 
    stats, 
    chartData, 
    topProducts, 
    finalCategories, 
    lowStockProducts, 
    maxRevenue 
  } = useMemo(() => {
    
    // 1. Mốc thời gian (X ngày qua tới hiện tại)
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(end.getDate() - timeFilter + 1);
    start.setHours(0, 0, 0, 0);

    // 2. Lọc đơn hàng nằm trong khoảng X ngày
    const pOrders = allOrders.filter((o: any) => {
      if (!o.createdAt) return false;
      const d = new Date(o.createdAt).getTime();
      return d >= start.getTime() && d <= end.getTime();
    });

    let revenue = 0; // tổng đã thanh toán
    let revenueDelivered = 0; // đã giao
    let revenuePending = 0; // chưa giao
    let revenueCancelled = 0; // đã hủy
    const orderStats = { pending: 0, confirmed: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    let deliveredCount = 0;

    // 3. Quét thông số đơn hàng & Tính DOANH THU CHUẨN
    pOrders.forEach((o: any) => {
      // Đếm trạng thái đơn
      if (o.status === 'delivered') { 
        deliveredCount++; 
        orderStats.delivered++; 
      }
      else if (o.status === 'cancelled' || o.status === 'failed') orderStats.cancelled++;
      else if (o.status === 'shipped' || o.status === 'shipping') orderStats.shipped++;
      else if (o.status === 'preparing') orderStats.preparing++;
      else if (o.status === 'confirmed') orderStats.confirmed++;
      else orderStats.pending++;

      // TÍNH DOANH THU CHUẨN (Loại trừ tuyệt đối đơn Đã hủy/Thất bại)
      const isPaidOnline =
        o.paymentStatus === 'paid' ||
        o.paymentStatus === 'success' ||
        o.isPaid === true;

      if (!isPaidOnline) return;

      const amount = Number(o.totalAmount || 0);

      // 👉 Tổng (ô lớn)
      revenue += amount;

      // 👉 Phân loại
      if (o.status === 'delivered') {
        revenueDelivered += amount;
      } 
      else if (o.status === 'cancelled' || o.status === 'failed') {
        revenueCancelled += amount;
      } 
      else {
        revenuePending += amount;
      }
    });

    // 4. Khởi tạo Biểu đồ Đơn hàng
    const cData = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
      const count = pOrders.filter((o: any) => {
        if (!o.createdAt) return false;
        return new Date(o.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' }) === dateStr;
      }).length;
      cData.push({ day: dateStr, value: count });
    }

    // 5. Tính Top Sản phẩm & Danh mục bán chạy
    const prodMap: any = {};
    const catMap: any = {};

    pOrders.forEach((o: any) => {
      // Logic xét duyệt doanh thu áp dụng y hệt cho Danh mục & Sản phẩm
      const isPaidOnline = o.paymentStatus === 'paid' || o.paymentStatus === 'success' || o.isPaid === true;
      const isValidForRevenue = o.status !== 'cancelled' && o.status !== 'failed' && (o.status === 'delivered' || isPaidOnline);
      
      // Bỏ qua không tính vào Top nếu không đủ điều kiện sinh doanh thu
      if (!isValidForRevenue) return; 
      
      o.items?.forEach((item: any) => {
        // Tích lũy sản phẩm
        if (!prodMap[item.name]) {
          prodMap[item.name] = { name: item.name, totalKg: 0, kgLe: 0, kg25: 0, kg50: 0 };
        }
        prodMap[item.name].kgLe += Number(item.qKg || 0);
        prodMap[item.name].kg25 += Number(item.q25 || 0);
        prodMap[item.name].kg50 += Number(item.q50 || 0);
        prodMap[item.name].totalKg += Number(item.qKg || 0) + (Number(item.q25 || 0) * 25) + (Number(item.q50 || 0) * 50);

        // Tích lũy Danh mục
        const prodId = String(item.product?._id || item.product);
        const fullProduct = allProducts.find((p: any) => String(p._id) === prodId);
        
        const catId = fullProduct?.category_id?._id || fullProduct?.category_id || fullProduct?.categoryId || "";
        
        let catName = "Sản phẩm không có danh mục"; 
        const foundCat = allCats.find((c: any) => String(c._id) === String(catId));
        
        if (foundCat) {
          catName = foundCat.name;
        } else {
          // Dự phòng ID dạng số cũ
          const idStr = String(catId);
          if (idStr === "1") catName = "Thức ăn cho Heo";
          else if (idStr === "2") catName = "Thức ăn Gia cầm";
          else if (idStr === "3") catName = "Thức ăn Gia súc lớn";
          else if (idStr === "4") catName = "Thủy sản";
          else if (idStr === "5") catName = "Gạo Đặc Sản";
          else if (idStr === "6") catName = "Gạo Bình Dân";
        }

        const itemRev = (Number(item.q25) * Number(item.p25)) + (Number(item.q50) * Number(item.p50)) + (Number(item.qKg) * Number(item.pKg));
        catMap[catName] = (catMap[catName] || 0) + itemRev;
      });
    });

    const topProds = Object.values(prodMap).sort((a: any, b: any) => b.totalKg - a.totalKg).slice(0, 5);
    
    const sortedCats = Object.keys(catMap)
      .map(key => ({ name: key, revenue: catMap[key] }))
      .sort((a, b) => b.revenue - a.revenue);
    
    const top5Cats = sortedCats.slice(0, 5);
    const othersRev = sortedCats.slice(5).reduce((sum, c) => sum + c.revenue, 0);
    const finCats = othersRev > 0 ? [...top5Cats, { name: "Các danh mục còn lại", revenue: othersRev }] : top5Cats;
    const mRev = Math.max(...finCats.map((c: any) => c.revenue), 0);

// 6. TÍNH CẢNH BÁO TỒN KHO (CHỈ BAO 50KG)
const lowStockAlerts: any[] = [];

allProducts.forEach((p: any) => {
  const stock50 = Number(p.stock_50kg || 0);
  const stock25 = Number(p.stock_25kg || 0);

  const min50 = Number(p.min_stock_50kg ?? 5);
  const min25 = Number(p.min_stock_25kg ?? 5);

if ((p.stock_50kg || 0) <= min50) {
  lowStockAlerts.push({
    productName: p.name,
    productId: p._id,
    type: "Bao 50kg",
    value: p.stock_50kg || 0,
    unit: "bao"
  });
}

if ((p.stock_25kg || 0) <= min25) {
  lowStockAlerts.push({
    productName: p.name,
    productId: p._id,
    type: "Bao 25kg",
    value: p.stock_25kg || 0,
    unit: "bao"
  });
}
});

const lowStock = lowStockAlerts;
    return {
      periodOrders: pOrders,
      stats: { 
          revenue,
          revenueDelivered,
          revenuePending,
          revenueCancelled,
          orders: pOrders.length,
          customers: allUsers.length,
          warnings: lowStockAlerts.length,
          orderStats,
          deliveredCount
        },
      chartData: cData,
      topProducts: topProds,
      finalCategories: finCats,
      lowStockProducts: lowStock,
      maxRevenue: mRev
    };
  }, [allOrders, allProducts, allUsers, allCats, timeFilter]);

  // Bộ lọc bảng đơn hàng ở giao diện
  const displayOrders = periodOrders.filter((o: any) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "shipped") return o.status === "shipped" || o.status === "shipping";
    return o.status === orderFilter;
  }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#047857] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#047857] font-bold text-sm uppercase tracking-widest">Đang tải dữ liệu...</p>
      </div>
    );

  const statusFilters = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Đang xử lý" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "preparing", label: "Đang chuẩn bị" },
    { value: "shipped", label: "Đang giao" }, 
    { value: "delivered", label: "Đã giao" },
    { value: "cancelled", label: "Đã hủy" }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] w-full font-sans pb-12">
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        
        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-[#047857] uppercase italic border-b-4 border-[#A3E635] w-fit pb-2">
            Bảng Điều Khiển
          </h1>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(Number(e.target.value))}
            className="border border-gray-200 bg-white px-4 py-2.5 rounded-xl shadow-sm outline-none focus:border-[#047857] transition-all font-bold text-gray-700 cursor-pointer"
          >
            <option value={7}>Thống kê 7 ngày qua</option>
            <option value={14}>Thống kê 14 ngày qua</option>
            <option value={30}>Thống kê 30 ngày qua</option>
          </select>
        </div>

        {/* 🟢 TOP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
        {/* Card Doanh thu */}
        <div className="bg-white p-6 border border-gray-200 shadow-sm border-t-4 border-t-[#047857] rounded-xl flex flex-col justify-between relative group cursor-pointer">
          
          {/* Title */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Doanh thu tổng ({timeFilter} ngày)
          </p>

          {/* Tổng tiền */}
          <h2 className="text-2xl font-black text-[#047857] mt-2">
            {stats.revenue.toLocaleString()}đ
          </h2>

          {/* Note */}
          <p className="text-[10px] text-gray-400 mt-2 font-medium bg-gray-50 p-1.5 rounded-md w-fit">
            Tổng tiền đã thanh toán
          </p>

          {/* 🔥 POPUP HOVER */}
          <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 shadow-lg rounded-xl p-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none">
            
            <div className="space-y-2 text-xs font-bold text-gray-600">

              {/* Doanh thu thật */}
              <div className="flex justify-between">
                <span>Doanh thu ({timeFilter} ngày)</span>
                <span className="text-green-600">
                  {stats.revenueDelivered.toLocaleString()}đ
                </span>
              </div>

              {/* Doanh thu chờ */}
              <div className="flex justify-between">
                <span>Doanh thu chờ ({timeFilter} ngày)</span>
                <span className="text-yellow-600">
                  {stats.revenuePending.toLocaleString()}đ
                </span>
              </div>

              {/* Doanh thu huỷ */}
              <div className="flex justify-between">
                <span>Doanh thu đã hủy ({timeFilter} ngày)</span>
                <span className="text-red-500">
                  {stats.revenueCancelled.toLocaleString()}đ
                </span>
              </div>

            </div>
          </div>

        </div>
          {/* Card Tổng đơn hàng (Đã gắn link) */}
          <div 
            onClick={() => window.location.href = '/admin/orders'}
            className="bg-white p-6 border border-gray-200 shadow-sm border-t-4 border-t-blue-600 rounded-xl flex flex-col justify-between relative group cursor-pointer hover:shadow-md hover:bg-blue-50/20 transition-all"
          >
            <div className="flex justify-between items-start">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-blue-600 transition-colors">Tổng đơn hàng</p>
               <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-100">Xem đơn ➡️</span>
            </div>
            <h2 className="text-2xl font-black text-blue-600 mt-2">{stats.orders} <span className="text-sm">đơn</span></h2>
            <p className="text-[11px] text-blue-400 mt-2 font-medium underline decoration-dashed underline-offset-2">Xem chi tiết trạng thái</p>
            
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 shadow-lg rounded-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              <div className="space-y-2 text-xs font-bold text-gray-600">
                <div className="flex justify-between"><span>Đang chờ xử lý</span><span>{stats.orderStats.pending}</span></div>
                <div className="flex justify-between"><span>Đã xác nhận</span><span>{stats.orderStats.confirmed}</span></div>
                <div className="flex justify-between"><span>Đang chuẩn bị</span><span>{stats.orderStats.preparing}</span></div>
                <div className="flex justify-between"><span>Đang giao</span><span>{stats.orderStats.shipped}</span></div>
                <div className="flex justify-between"><span>Đã giao</span><span className="text-[#047857]">{stats.orderStats.delivered}</span></div>
                <div className="flex justify-between"><span>Đã hủy</span><span className="text-red-500">{stats.orderStats.cancelled}</span></div>
              </div>
            </div>
          </div>

          {/* Card Khách hàng (Đã gắn link) */}
          <div 
            onClick={() => window.location.href = '/admin/users'}
            className="bg-white p-6 border border-gray-200 shadow-sm border-t-4 border-t-purple-600 rounded-xl flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-purple-50/20 transition-all group"
          >
            <div className="flex justify-between items-start">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-purple-600 transition-colors">Khách hàng hệ thống</p>
               <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold border border-purple-100">Xem user ➡️</span>
            </div>
            <h2 className="text-2xl font-black text-purple-600 mt-2">{stats.customers} <span className="text-sm">người</span></h2>
            <p className="text-[11px] text-gray-400 mt-2 font-medium bg-gray-50 p-1.5 rounded-md w-fit">Tổng tài khoản đã đăng ký</p>
          </div>

          {/* Card CẢNH BÁO TỒN KHO */}
          <div 
            onClick={() => window.location.href = '/admin/products'} 
            className="bg-white p-6 border border-gray-200 shadow-sm border-t-4 border-t-rose-600 rounded-xl flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-rose-50/20 transition-all group"
          >
            <div className="flex justify-between items-start">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide group-hover:text-rose-600 transition-colors">Cảnh báo tồn kho</p>
               <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded font-bold border border-rose-100">Xem kho ➡️</span>
            </div>
            <h2 className="text-2xl font-black text-rose-600 mt-2 flex items-center gap-2">
              {stats.warnings} <span className="text-sm">mục sắp hết</span>
            </h2>
            <p className="text-[11px] text-rose-500 mt-2 font-medium bg-rose-50 p-1.5 rounded-md w-fit font-bold">Cần nhập hàng gấp!</p>
          </div>
        </div>

        {/* 📊 CHART */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h3 className="text-sm font-bold text-gray-800 uppercase mb-6 border-l-4 border-[#047857] pl-3">Biểu đồ giao dịch ({timeFilter} ngày)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
              <YAxis tickCount={5} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontWeight: "bold" }} />
              <Bar dataKey="value" fill="#047857" barSize={timeFilter > 14 ? 16 : 32} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="value" position="top" formatter={(val: any) => (val === 0 ? "" : val)} fill="#047857" fontSize={11} fontWeight="bold" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🔥 TOP PRODUCTS & CATEGORIES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 border-l-4 border-[#047857] pl-3">Sản phẩm bán chạy</h3>
            <div className="space-y-2">
              {topProducts.length > 0 ? (
                topProducts.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors rounded-lg">
                    <span className="text-sm font-semibold text-gray-700 truncate mr-2">{p.name}</span>
                    <span className="text-[#047857] font-black whitespace-nowrap bg-emerald-50 px-2 py-1 rounded-md text-xs">{p.totalKg} kg</span>
                  </div>
                ))
              ) : (<p className="text-sm text-gray-400 italic py-6 text-center">Chưa có dữ liệu sinh doanh thu...</p>)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 border-l-4 border-[#047857] pl-3">Doanh thu theo danh mục</h3>
            <div className="space-y-4">
              {finalCategories.length > 0 ? (
                finalCategories.map((c: any, index: number) => {
                  const percent = maxRevenue ? (c.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-xs font-bold mb-1.5 text-gray-700">
                        <span>{c.name}</span>
                        <span className="text-[#047857]">{c.revenue.toLocaleString()}đ</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#047857]" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (<p className="text-sm text-gray-400 italic py-6 text-center">Chưa có dữ liệu sinh doanh thu...</p>)}
            </div>
          </div>
        </div>

        {/* 📋 TABLES & LOW STOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-gray-800 uppercase border-l-4 border-[#047857] pl-3">Lịch sử giao dịch ({displayOrders.length})</h3>
            </div>
            
            <div className="flex gap-2 mb-4 flex-wrap">
              {statusFilters.map((st) => (
                <button
                  key={st.value}
                  onClick={() => setOrderFilter(st.value)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${orderFilter === st.value ? "bg-[#047857] text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto max-h-[400px] border border-gray-100 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                    <th className="p-4">Mã Đơn</th>
                    <th className="p-4">Ngày Đặt</th>
                    <th className="p-4 text-right">Tổng Tiền</th>
                    <th className="p-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-gray-700 divide-y divide-gray-100">
                  {displayOrders.length > 0 ? (
                    displayOrders.map((o: any) => (
                      <tr key={o._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-mono text-gray-500 text-xs">{o.orderCode || `#${o._id.slice(-6).toUpperCase()}`}</td>
                        <td className="p-4">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                        <td className="p-4 text-right font-bold text-[#047857]">{(o.totalAmount || 0).toLocaleString()}đ</td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase 
                            ${o.status === "pending" ? "bg-yellow-100 text-yellow-700" 
                            : o.status === "confirmed" ? "bg-blue-100 text-blue-700" 
                            : o.status === "preparing" ? "bg-indigo-100 text-indigo-700" 
                            : (o.status === "shipped" || o.status === "shipping") ? "bg-purple-100 text-purple-700" 
                            : o.status === "delivered" ? "bg-emerald-100 text-emerald-700" 
                            : o.status === "cancelled" ? "bg-red-100 text-red-700" 
                            : "bg-gray-100 text-gray-700"}`}>
                            {o.status === "pending" ? "Đang xử lý" 
                             : o.status === "confirmed" ? "Đã xác nhận" 
                             : o.status === "preparing" ? "Chuẩn bị hàng" 
                             : (o.status === "shipped" || o.status === "shipping") ? "Đang giao" 
                             : o.status === "delivered" ? "Đã giao" 
                             : o.status === "cancelled" ? "Đã hủy" : o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400 italic">Không có giao dịch nào...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-rose-600 flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 border-l-4 border-rose-600 pl-3">Sắp hết hàng</h3>
            <div className="space-y-3 flex-1 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p: any, index: number) => (
                  <div
                      key={index}
                      onClick={() => window.location.href = `/admin/products?highlight=${p.productId}&import=${p.productId}`}
                      className="cursor-pointer flex flex-col p-3 border border-gray-100 rounded-lg bg-rose-50/30 hover:bg-rose-100 transition"
                    >
                    <span className="text-xs font-bold text-gray-700 truncate mb-1" title={p.productName}>{p.productName}</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">{p.type}</span>
                      <span className="text-rose-600 font-black text-xs">{p.value} {p.unit}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="text-2xl mb-2">📦</span>
                  <p className="text-xs font-bold uppercase">Kho bãi ổn định</p>
                </div>
              )}
            </div>
            {lowStockProducts.length > 0 && (
              <button onClick={() => window.location.href = '/admin/products'} className="w-full mt-4 py-2 bg-white border border-rose-600 text-rose-600 rounded-lg text-xs font-bold uppercase hover:bg-rose-600 hover:text-white transition-colors">
                Quản lý kho
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
