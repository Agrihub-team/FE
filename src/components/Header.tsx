// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Category } from "../models/category";
import { categoryService } from "../controllers/categoryService";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { apiClient } from "../utils/api";
import { useIdleTimeout } from "../hooks/useIdleTimeout";
import { IMAGE_URL as IMAGE_BASE_URL, IMAGE_CAT_URL } from "../utils/config";

export const Header = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // State điều khiển Menu User
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [repurchaseIds, setRepurchaseIds] = useState<string[]>([]);

  const { items, loadCart } = useCartStore(); // Lấy thêm hàm loadCart
  const { user, logout } = useAuthStore(); // Lấy thêm hàm logout
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null); // Ref để bắt sự kiện click ra ngoài menu

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (!user) return;
    loadCart();
    apiClient.get('/orders/my').then((res: any) => {
      const orders: any[] = Array.isArray(res) ? res : res?.data || [];
      const ids = [...new Set(
        orders.flatMap((o: any) => (o.items || []).map((i: any) =>
          (i.product?._id || i.product || '').toString().split('-')[0]
        ))
      )].filter(Boolean) as string[];
      setRepurchaseIds(ids);
    }).catch(() => {});
  }, [user, loadCart]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 🔴 FIX: Lấy danh mục và LỌC CHỈ LẤY "active"
        const cats: any = await categoryService.getAll();
        const activeCategories = (cats || []).filter(
          (c: Category) => c.status === "active",
        );
        setCategories(activeCategories);

        // Lấy sản phẩm
        const prodData: any = await apiClient.get("/products");
        const prods = prodData?.products || prodData || [];
        setAllProducts(prods);
      } catch (error: any) {
        console.error("Lỗi tải dữ liệu Header:", error.message);
      }
    };

    fetchInitialData();

    const handleClickOutside = (e) => {
      // Đóng search suggestions
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
      // Đóng user menu
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const filtered = allProducts
        .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, allProducts]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/login");
  };

  useIdleTimeout(!!user, () => {
    logout();
    navigate("/login");
    import('sonner').then(({ toast }) => toast.error('Phiên đăng nhập đã hết hạn do không hoạt động.'));
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="w-full bg-white relative z-50 border-b border-gray-100 font-sans">
      {/* 1. TOP BAR */}
      <div className="bg-[#1f5f2a] text-white text-[13px] py-1.5 px-4 md:px-10 flex justify-between items-center">
        <p>Chào mừng bạn đến với AGRI-HUB!</p>
        <p>
          Hotline: <span className="text-[#fbc02d] font-bold">1900 000</span>
        </p>
      </div>

      {/* 2. MIDDLE BAR */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-5 flex items-center justify-between gap-10">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img
            src="/logo.jpg"
            alt="Agri-Hub"
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* Search Bar */}
        <div
          className="flex-1 max-w-3xl relative hidden md:block"
          ref={searchRef}
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() =>
                searchTerm.trim().length > 1 && setShowSuggestions(true)
              }
              placeholder="Cám, Gạo, Nguyên Liệu Thô ..."
              className="w-full py-2.5 pl-6 pr-12 rounded-full border border-gray-300 bg-white focus:outline-none focus:border-[#047857] text-sm text-gray-700 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#047857]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>
          </form>

          {showSuggestions && (
            <div className="absolute top-[110%] left-0 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-[100] overflow-hidden">
              <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                {suggestions.length > 0 ? (
                  suggestions.map((p) => {
                    const price =
                      parseFloat(p.price_bag_25kg) ||
                      parseFloat(p.price_bag_50kg) ||
                      parseFloat(p.price_kg) ||
                      0;
                    return (
                      <Link
                        key={p._id}
                        to={`/products/${p._id}`}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchTerm("");
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 border-b border-gray-50 last:border-0 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={`${IMAGE_BASE_URL}/${p.image}`}
                            alt={p.name}
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-semibold text-gray-800 group-hover:text-[#047857] line-clamp-1">
                            {p.name}
                          </h4>
                          <p className="text-[#047857] font-bold text-xs mt-0.5">
                            {price.toLocaleString()}đ
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-5 text-center text-sm text-gray-400">
                    Không tìm thấy sản phẩm phù hợp
                  </div>
                )}
              </div>
              {suggestions.length > 0 && (
                <button
                  type="submit"
                  onClick={handleSearch}
                  className="w-full py-2.5 text-center text-[12px] font-bold text-[#047857] bg-emerald-50 hover:bg-emerald-100 transition-colors border-t border-emerald-100"
                >
                  Xem tất cả kết quả cho &ldquo;{searchTerm}&rdquo; →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Giỏ hàng (Tự động cập nhật số lượng) */}
          <Link
            to="/cart"
            className="group flex items-center gap-2 border border-gray-200 rounded-full px-5 py-2.5 hover:bg-[#fbc02d] hover:border-[#fbc02d] transition-all duration-200"
          >
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-600 group-hover:text-gray-900"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#e53935] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
                  {items.length}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 hidden lg:block">
              Giỏ hàng
            </span>
          </Link>

          {/* User Profile / Dropdown */}
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 border rounded-full px-5 py-2.5 transition-all duration-200 ${showUserMenu ? "bg-[#fbc02d] border-[#fbc02d]" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <div className="w-6 h-6 bg-[#047857] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {user.fullname?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">
                    {user.fullname}
                  </span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 9l-7 7-7-7"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-xs text-gray-400 font-medium">
                        Tài khoản của bạn
                      </p>
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-emerald-50 hover:text-[#047857] transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                      Xem thông tin
                    </Link>

                    <Link
                      to="/change-password"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-emerald-50 hover:text-[#047857] transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        ></path>
                      </svg>
                      Đổi mật khẩu
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-bold border-t border-gray-50"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          ></path>
                        </svg>
                        Trang quản trị
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-50 mt-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        ></path>
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                to="/login"
                className="group flex items-center gap-2 border border-gray-200 rounded-full px-5 py-2.5 hover:bg-[#fbc02d] hover:border-[#fbc02d] transition-all duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-600 group-hover:text-gray-900"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 hidden lg:block">
                  Tài khoản
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pb-4 flex items-center justify-between">
        {/* Nút Danh mục */}
        <div className="relative group z-40">
          <button className="bg-[#047857] text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-[#035b42] transition-colors duration-200 text-[13px]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            Danh mục sản phẩm
          </button>

          <div className="absolute top-full left-0 w-[340px] pt-2 hidden group-hover:block">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-[#047857] px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] font-black text-white uppercase tracking-widest">
                  Tất cả danh mục
                </span>
                <Link
                  to="/products"
                  className="text-[10px] text-yellow-200 hover:text-white font-bold transition-colors"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="p-2 grid grid-cols-2 gap-1 max-h-[420px] overflow-y-auto custom-scrollbar">
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/products?category=${cat._id}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-[#047857] transition-all group/item"
                  >
                    <div className="w-9 h-9 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                      <img
                        src={
                          cat.image?.startsWith("http")
                            ? cat.image
                            : `${IMAGE_CAT_URL}/${cat.image}`
                        }
                        alt={cat.name}
                        className="w-full h-full object-contain p-1 mix-blend-multiply"
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-gray-700 group-hover/item:text-[#047857] leading-tight line-clamp-2">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-3 text-[13px] font-medium">
          <Link
            to="/"
            className={`px-5 py-2.5 rounded-full transition-colors ${isActive("/") ? "bg-[#047857] text-white" : "bg-gray-50 text-gray-700 hover:text-[#047857]"}`}
          >
            Trang chủ
          </Link>
          <Link
            to="/about"
            className={`px-5 py-2.5 rounded-full transition-colors ${isActive("/about") ? "bg-[#047857] text-white" : "bg-gray-50 text-gray-700 hover:text-[#047857]"}`}
          >
            Giới thiệu
          </Link>
          <Link
            to="/products"
            className={`px-5 py-2.5 rounded-full transition-colors ${isActive("/products") ? "bg-[#047857] text-white" : "bg-gray-50 text-gray-700 hover:text-[#047857]"}`}
          >
            Sản phẩm
          </Link>
          <Link
            to="/faq"
            className={`px-5 py-2.5 rounded-full transition-colors ${isActive("/faq") ? "bg-[#047857] text-white" : "bg-gray-50 text-gray-700 hover:text-[#047857]"}`}
          >
            Câu hỏi thường gặp
          </Link>
          <Link
            to="/news"
            className={`px-5 py-2.5 rounded-full transition-colors ${isActive("/news") ? "bg-[#047857] text-white" : "bg-gray-50 text-gray-700 hover:text-[#047857]"}`}
          >
            Tin Tức
          </Link>
          <Link
            to="/contact"
            className={`px-5 py-2.5 rounded-full transition-colors ${isActive("/contact") ? "bg-[#047857] text-white" : "bg-gray-50 text-gray-700 hover:text-[#047857]"}`}
          >
            Liên hệ
          </Link>
        </nav>

        {/* Nút Mua hàng nhanh — invisible khi chưa đăng nhập để giữ layout */}
        <Link
          to={repurchaseIds.length > 0 ? `/products?repurchase=${repurchaseIds.join(',')}` : '/products'}
          className={`font-bold px-5 py-2.5 rounded-full transition-colors text-[13px] ${!user ? 'invisible pointer-events-none' : ''} ${repurchaseIds.length > 0 ? 'bg-[#e53935] hover:bg-red-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}
        >
          {repurchaseIds.length > 0 ? '⚡ Mua lại' : 'Mua hàng nhanh'}
        </Link>
      </div>
    </header>
  );
};
