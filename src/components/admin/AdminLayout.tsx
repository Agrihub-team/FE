// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const userRef = useRef(null);

  // 👉 Tự mở đúng menu theo URL
  useEffect(() => {
    if (location.pathname.startsWith("/admin/products")) {
      setOpenMenu("Sản phẩm");
    } else {
      setOpenMenu(null);
    }
  }, [location.pathname]);

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return "Bảng điều khiển";
    if (path.includes("/categories")) return "Quản lý danh mục";
    if (path.includes("/products")) return "Quản lý sản phẩm";
    if (path.includes("/orders")) return "Quản lý đơn hàng";
    if (path.includes("/users")) return "Quản lý khách hàng";
    if (path.includes("/reviews")) return "Quản lý đánh giá";
    return "Hệ thống Quản trị";
  };

  // 🔐 Auth
  useEffect(() => {
    if (!user) {
      toast.error("Vui lòng đăng nhập!");
      navigate("/login");
    } else if (user?.role?.toUpperCase() !== "ADMIN") {
        toast.error("Bạn không có quyền Admin!");
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

if (!user || user?.role?.toUpperCase() !== "ADMIN") return null;  
const menuItems = [
    { to: "/admin", label: "Dashboard", icon: "📊" },
    { to: "/admin/categories", label: "Danh mục", icon: "📂" },

    {
      label: "Sản phẩm",
      icon: "📦",
      children: [
        { to: "/admin/products", label: "Tất cả sản phẩm" },
        { to: "/admin/products/discount", label: "Sản phẩm giảm giá" },
      ],
    },

    { to: "/admin/orders", label: "Đơn hàng", icon: "📜" },
    { to: "/admin/users", label: "Khách hàng", icon: "👥" },
    { to: "/admin/reviews", label: "Đánh giá", icon: "⭐" },
    { to: "/admin/vouchers", label: "Quản lý Voucher", icon: "🎫" },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#064e3b] text-white flex flex-col sticky top-0 h-screen shadow-2xl">
        <div className="p-8 flex justify-center border-b border-white/5">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center p-2">
            <img src="/logo.jpg" alt="logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const hasChildren = item.children;

            // ================= DROPDOWN =================
            if (hasChildren) {
              const isOpen = openMenu === item.label;

              // 👉 ACTIVE CHA (quan trọng nhất)
              const isActiveParent =
                location.pathname.startsWith("/admin/products");

              return (
                <div key={item.label}>
                  <div
                    onClick={() => {
                      setOpenMenu(isOpen ? null : item.label);
                      navigate("/admin/products"); // 👉 click là vào luôn
                    }}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-[11px] uppercase cursor-pointer transition-all ${
                      isActiveParent
                        ? "bg-[#facc15] text-[#064e3b] shadow-lg"
                        : "hover:bg-white/10 text-emerald-100"
                    }`}
                  >
                    <span>
                      {item.icon} {item.label}
                    </span>
                    <span
                      className={`transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </div>

                  {isOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`block px-3 py-2 rounded-lg text-[11px] font-bold ${
                            location.pathname === child.to
                              ? "bg-white/20 text-yellow-300"
                              : "text-white hover:bg-white/10"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // ================= MENU THƯỜNG =================
            const isActive =
              item.to === "/admin"
                ? location.pathname === "/admin" || location.pathname === "/admin/"
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpenMenu(null)} // 👉 đóng dropdown khi click menu khác
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-[#facc15] text-[#064e3b] shadow-lg"
                    : "hover:bg-white/10 text-emerald-100"
                }`}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-40">
          <h1 className="text-xl font-black uppercase italic tracking-tighter text-gray-800">
            {getTitle()}
          </h1>

          <div className="relative" ref={userRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border hover:bg-emerald-50 transition-all"
            >
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                {user?.fullname?.charAt(0)}
              </div>
              <span className="text-xs font-black text-gray-600 uppercase">
                {user?.fullname}
              </span>
            </button>

            {open && (
              <div className="absolute top-[120%] right-0 w-48 bg-white rounded-3xl shadow-2xl border p-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-3 text-xs font-black text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors uppercase"
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};