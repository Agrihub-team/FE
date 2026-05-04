// @ts-nocheck
import { useEffect, useState } from "react";
import { Pencil, Eye, EyeOff, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../utils/api";
import { Category } from "../../models/category";
import { Product } from "../../models/product";
import { IMAGE_CAT_URL } from '../../utils/config';


export const CategoryManagement = () => {
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        apiClient.get("/categories"),
        apiClient.get("/products")
      ]);

      const categoriesData = catRes || [];
      const productsData = prodRes?.products || prodRes || [];

      setCats(categoriesData);
      setProducts(productsData);
    } catch (error: any) {
      toast.error(error.message || "Lỗi tải dữ liệu từ máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = (cats || []).filter((item) => {
    const matchName = item.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;
    return matchName && matchStatus;
  });

  const resetForm = () => {
    setForm({ name: "", description: "", image: "" });
    setEditing(null);
    setShowModal(false);
  };

  const handleAddCategory = async () => {
    try {
      if (!form.name.trim()) return toast.warning("Vui lòng nhập tên danh mục");

      const created: any = await apiClient.post("/categories", {
        ...form,
        status: "active",
      });

      setCats((prev) => [created, ...prev]);
      toast.success("Thêm danh mục thành công");
      resetForm();
      loadData(); 
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi thêm danh mục");
    }
  };

  const handleUpdateCategory = async () => {
    try {
      if (!editing) return;
      const updated: any = await apiClient.put(`/categories/${editing._id}`, {
        ...form,
        status: editing.status,
      });

      setCats((prev) =>
        prev.map((item) => (item._id === editing._id ? updated : item))
      );
      toast.success("Cập nhật thành công");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi cập nhật danh mục");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const newStatus = category.status === "active" ? "inactive" : "active";
      await apiClient.put(`/categories/${category._id}`, {
        ...category,
        status: newStatus,
      });

      setCats((prev) =>
        prev.map((item) =>
          item._id === category._id ? { ...item, status: newStatus } : item
        )
      );
      toast.success(`Đã đổi trạng thái sang ${newStatus === 'active' ? 'Hoạt động' : 'Ẩn'}`);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi đổi trạng thái");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await apiClient.delete(`/categories/${id}`);
      setCats((prev) => prev.filter((item) => item._id !== id));
      toast.success("Đã xóa danh mục");
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xóa danh mục");
    }
  };

  // LOGIC ĐẾM SẢN PHẨM: Xử lý ngoại lệ do DB lưu ID danh mục dạng chuỗi cứng (1, 2, 3...)
  const getProductCount = (category: Category, allProducts: any[]) => {
    const catNameLower = category.name.toLowerCase();
    let targetId = "";
    
    if (catNameLower.includes('heo')) targetId = "1";
    else if (catNameLower.includes('gia cầm')) targetId = "2";
    else if (catNameLower.includes('gia súc')) targetId = "3";
    else if (catNameLower.includes('thủy sản')) targetId = "4";
    else if (catNameLower.includes('đặc sản')) targetId = "5";
    else if (catNameLower.includes('bình dân')) targetId = "6";

    return allProducts.filter((p: any) => {
      const pCatId = String(p.category_id?._id || p.category_id || p.categoryId || "");
      if (targetId && pCatId === targetId) return true;
      return pCatId === String(category._id);
    }).length;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#047857] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#047857] font-bold text-sm uppercase tracking-widest">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] w-full font-sans pb-12">
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        
        {/* HEADER TƯƠNG TỰ DASHBOARD */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-[#047857] uppercase italic border-b-4 border-[#A3E635] w-fit pb-2">
            Quản Lý Danh Mục
          </h1>
          <button
            className="bg-[#047857] text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-sm font-bold flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            Thêm danh mục
          </button>
        </div>

        {/* CONTAINER CHÍNH */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-[#047857]">
          
          {/* TOOLBAR TÌM KIẾM & LỌC */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase border-l-4 border-[#047857] pl-3">
              Tất cả danh mục ({filtered.length})
            </h3>
            
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl shadow-sm outline-none focus:border-[#047857] focus:bg-white transition-all font-semibold text-gray-700 text-sm"
                  placeholder="Tìm theo tên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="border border-gray-200 bg-gray-50 px-4 py-2.5 rounded-xl shadow-sm outline-none focus:border-[#047857] focus:bg-white transition-all font-semibold text-gray-700 text-sm cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Đã ẩn</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  <th className="p-4">Danh mục</th>
                  <th className="p-4">Mô tả</th>
                  <th className="p-4 text-center">Số lượng</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-700 divide-y divide-gray-100">
                {filtered.length > 0 ? (
                  filtered.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-200 shrink-0 shadow-sm p-1">
                            <img
                              src={`${IMAGE_CAT_URL}/${encodeURIComponent(c.image)}`}
                              alt={c.name}
                              className="w-full h-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50?text=No+Img'; }}
                            />
                          </div>
                          <span className="font-bold text-gray-800 text-sm">{c.name}</span>
                        </div>
                      </td>
                      
                      <td className="p-4 text-xs text-gray-500 italic max-w-xs truncate">
                        {c.description || "Chưa có mô tả..."}
                      </td>

                      <td className="p-4 text-center">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-md text-xs font-bold">
                          {getProductCount(c, products)} sp
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                            c.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {c.status === "active" ? "Hoạt động" : "Đã ẩn"}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            title="Chỉnh sửa"
                            className="p-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-emerald-50 hover:text-[#047857] text-gray-500 transition-colors"
                            onClick={() => {
                              setEditing(c);
                              setForm({
                                name: c.name,
                                description: c.description || "",
                                image: c.image,
                              });
                              setShowModal(true);
                            }}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            title={c.status === "active" ? "Ẩn danh mục" : "Hiện danh mục"}
                            className="p-2 bg-gray-50 border border-gray-100 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-gray-500 transition-colors"
                            onClick={() => handleToggleStatus(c)}
                          >
                            {c.status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400 italic">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-3xl mb-2">🗂️</span>
                        <p className="text-sm font-semibold uppercase">Không tìm thấy danh mục nào</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL THÊM / SỬA */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity"
            onClick={resetForm}
          >
            <div
              className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-[#047857] mb-6 uppercase border-l-4 border-[#A3E635] pl-3">
                {editing ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Tên danh mục <span className="text-red-500">*</span></label>
                  <input
                    className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 rounded-xl outline-none focus:border-[#047857] focus:bg-white transition-all font-semibold text-gray-700"
                    placeholder="VD: Thức ăn cho Heo"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Mô tả ngắn</label>
                  <textarea
                    className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 rounded-xl outline-none focus:border-[#047857] focus:bg-white transition-all font-semibold text-gray-700 h-24 resize-none"
                    placeholder="Nhập mô tả..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5 block">Tên File Ảnh</label>
                  <input
                    className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 rounded-xl outline-none focus:border-[#047857] focus:bg-white transition-all font-semibold text-gray-700"
                    placeholder="VD: thuc-an-heo.jpg"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 italic font-medium">* Lưu ý: Đảm bảo file ảnh đã tồn tại trong thư mục BE (public/images/categories)</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                {editing ? (
                  <button
                    className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors font-bold text-sm"
                    onClick={() => handleDeleteCategory(editing._id)}
                  >
                    Xóa bỏ
                  </button>
                ) : <div></div>}

                <div className="flex gap-3">
                  <button
                    className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm"
                    onClick={resetForm}
                  >
                    Hủy thao tác
                  </button>

                  <button
                    className="bg-[#047857] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-sm transition-colors text-sm"
                    onClick={editing ? handleUpdateCategory : handleAddCategory}
                  >
                    {editing ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};