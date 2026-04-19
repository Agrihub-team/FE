// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const userRef = useRef<HTMLDivElement>(null);

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return "Bảng điều khiển";
    if (path.includes("/categories")) return "Quản lý danh mục";
    if (path.includes("/products")) return "Quản lý sản phẩm";
    if (path.includes("/orders")) return "Quản lý đơn hàng";
    if (path.includes("/users")) return "Quản lý khách hàng";
    return "Hệ thống Quản trị";
  };

  // Bảo mật Route
  useEffect(() => {
    if (!user) {
      toast.error("Vui lòng đăng nhập!");
      navigate("/login");
    } else if (user.role !== "ADMIN" && user.role !== "admin") {
      toast.error("Bạn không có quyền Admin!");
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user || (user.role !== "ADMIN" && user.role !== "admin")) return null;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      {/* SIDEBAR - Fix Absolute Paths */}
      <aside className="w-64 bg-[#064e3b] text-white flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-8 flex justify-center border-b border-white/5">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center p-2">
            <img src="/logo.jpg" alt="logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { to: "/admin", label: "Dashboard", icon: "📊" },
            { to: "/admin/categories", label: "Danh mục", icon: "📂" },
            { to: "/admin/products", label: "Sản phẩm", icon: "📦" },
            { to: "/admin/orders", label: "Đơn hàng", icon: "📜" },
            { to: "/admin/users", label: "Khách hàng", icon: "👥" },
          ].map((item) => {
             const isActive = item.to === "/admin" 
                ? (location.pathname === "/admin" || location.pathname === "/admin/") 
                : location.pathname.startsWith(item.to);

             return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all duration-300 ${
                  isActive ? "bg-[#facc15] text-[#064e3b] shadow-lg" : "hover:bg-white/10 text-emerald-100"
                }`}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
             )
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-gray-800">{getTitle()}</h1>
          
          <div className="relative" ref={userRef}>
            <button onClick={() => setOpen(!open)} className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border hover:bg-emerald-50 transition-all">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                {user?.fullname?.charAt(0)}
              </div>
              <span className="text-xs font-black text-gray-600 uppercase">{user?.fullname}</span>
            </button>

            {open && (
              <div className="absolute top-[120%] right-0 w-48 bg-white rounded-3xl shadow-2xl border p-2">
                <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors uppercase">
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-8 animate-fadeIn">
          {/* RENDER NỘI DUNG TRANG CON TẠI ĐÂY */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};