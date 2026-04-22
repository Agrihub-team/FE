// @ts-nocheck
import { useEffect, useState } from "react";
import { Trash2, Star, Search, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../utils/api";

export const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/reviews");
      
      // Giữ nguyên logic check data của bạn
      if (res && res.data) {
        setReviews(res.data);
      } else if (Array.isArray(res)) {
        setReviews(res);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Lỗi load review:", error);
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await apiClient.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success("Đã xóa đánh giá");
    } catch (error) { toast.error("Lỗi khi xóa"); }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/reviews/${id}/approve`);
      setReviews(prev => prev.map(r => r._id === id ? {...r, status: 'approved'} : r));
      toast.success("Đã phê duyệt đánh giá");
    } catch (error) { toast.error("Lỗi phê duyệt"); }
  };

  // 👉 SỬA CHỖ NÀY: Cập nhật điều kiện lọc để tìm theo user_id.fullname
  const filtered = Array.isArray(reviews) ? reviews.filter(r => 
    (r.comment?.toLowerCase().includes(search.toLowerCase())) || 
    (r.user_id?.fullname?.toLowerCase().includes(search.toLowerCase())) || // Sửa r.user thành r.user_id
    (r.product_id?.name?.toLowerCase().includes(search.toLowerCase()))     // Sửa r.product thành r.product_id
  ) : [];

  if (loading) return <div className="p-10 text-center font-bold text-emerald-600 italic animate-pulse">ĐANG TẢI ĐÁNH GIÁ...</div>;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-amber-400">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-800 uppercase border-l-4 border-amber-400 pl-3">
          Phản hồi khách hàng ({filtered.length})
        </h3>
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 rounded-xl outline-none focus:border-amber-400 focus:bg-white transition-all text-sm"
            placeholder="Tìm theo nội dung, khách, sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4">Đánh giá</th>
              <th className="p-4">Nội dung</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {filtered.length > 0 ? filtered.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold text-gray-700">
                   {/* 👉 SỬA CHỖ NÀY: Dùng user_id.fullname để hiện tên thay vì ID */}
                  {r.user_id?.fullname || <span className="text-gray-400 font-normal italic text-xs">ID: {r.user_id?._id?.substring(0,6) || r.user_id?.substring(0,6)}...</span>}
                </td>
                <td className="p-4 text-gray-600">
                  {/* 👉 SỬA CHỖ NÀY: Dùng product_id.name */}
                  {r.product_id?.name || <span className="text-gray-400 italic text-xs">Sản phẩm đã xóa</span>}
                </td>
                <td className="p-4">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                       <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} stroke="currentColor" />
                    ))}
                  </div>
                </td>
                <td className="p-4 max-w-xs truncate text-gray-500 italic">"{r.comment}"</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status === 'approved' ? 'Đã hiện' : 'Chờ duyệt'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {r.status !== 'approved' && (
                      <button onClick={() => handleApprove(r._id)} title="Phê duyệt" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(r._id)} title="Xóa" className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400">Không tìm thấy đánh giá nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};