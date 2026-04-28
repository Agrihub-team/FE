import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  // Cập nhật đường dẫn khớp với Router.tsx
  const menuItems = [
    { name: '📊 Dashboard', href: '/admin' },
    { name: '📁 Danh mục', href: '/admin/categories' },
    { name: '📦 Sản phẩm', href: '/admin/products' },
    { name: '🛒 Đơn hàng', href: '/admin/orders' },
    { name: '👥 Người dùng', href: '/admin/users' },
    { name: '⭐ Đánh giá', href: '/admin/reviews' },
    
  ];

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[#5CB85C] flex flex-col items-center py-10 z-40 shadow-xl border-r border-white/10">
      
      {/* Avatar Section - Tự động lấy tên User từ Store để hiện avatar giả lập */}
      <div className="relative mb-12">
        <div className="w-28 h-28 bg-[#D9D9D9] rounded-full border-4 border-white/20 shadow-inner overflow-hidden flex items-center justify-center">
          <img 
            src={`https://ui-avatars.com/api/?name=${user?.fullname || 'Admin'}&background=A3E635&color=1A5319&bold=true`} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        </div>
        {/* Chấm xanh Online */}
        <span className="absolute bottom-2 right-2 w-6 h-6 bg-[#A3E635] border-4 border-[#5CB85C] rounded-full animate-pulse shadow-sm"></span>
      </div>

      <div className="text-center mb-10">
        <h3 className="text-white font-black uppercase tracking-widest text-sm">
          {user?.fullname || 'Quản trị viên'}        </h3>
        <p className="text-[#A3E635] text-[10px] font-bold uppercase mt-1 opacity-80">
          Agri-Hub Admin v1.0
        </p>
      </div>
      
      <nav className="w-full px-4 space-y-2 flex-1">
        {menuItems.map((item) => {
          // Kiểm tra Active chuẩn React Router
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold uppercase tracking-widest text-xs ${
                isActive 
                  ? 'bg-[#A3E635] text-gray-800 shadow-lg scale-105' 
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Nút thoát về trang chủ người dùng */}
      <div className="w-full px-4 mt-auto">
        <Link 
          to="/" 
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/5 text-white/50 font-bold uppercase text-[10px] tracking-widest hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5"
        >
          🏠 VỀ TRANG CHỦ
        </Link>
      </div>
    </aside>
  );
};