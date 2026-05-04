// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import { Pencil, Eye, EyeOff, Plus, X, Search, Info, Package, Landmark, CheckCircle2, AlertTriangle, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../utils/api";
import { useSearchParams } from "react-router-dom";
import { IMAGE_URL } from '../../utils/config';



export const ProductManagement = () => {

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const highlightRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // States Giao diện
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editing, setEditing] = useState(null);

  // Bộ lọc bảng chính
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // State hỗ trợ dropdown tìm kiếm nhập kho
  const [importSearchTerm, setImportSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);
  const [openTypeDropdown, setOpenTypeDropdown] = useState(null);


  // State Form Thêm/Sửa
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    brand_id: "",
    description: "",
    image: "",
    type: "normal",              
    discount_percent: 0,         
    min_stock_kg: 100,  
    min_stock_25kg: 5,  
    min_stock_50kg: 5,  
    stock_kg: "", price_kg: "",
    stock_25kg: "", price_25kg: "",
    stock_50kg: "", price_50kg: ""
  });

  // State Form Nhập kho
  const [importForm, setImportForm] = useState({
    product_id: "",
    add_kg: "",
    add_25kg: "",
    add_50kg: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, supRes] = await Promise.all([
        apiClient.get("/products?status=all"),
        apiClient.get("/categories"),
        apiClient.get("/suppliers")
      ]);

      setProducts(prodRes?.products || prodRes?.data || prodRes || []);
      setCategories(catRes?.data || catRes || []);
      setSuppliers(supRes?.data || supRes || []);
    } catch (error: any) {
      toast.error("Lỗi tải dữ liệu hệ thống");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

useEffect(() => {
  if (highlightId) {
    setTimeout(() => {
      const el = document.getElementById(`product-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300); // delay nhẹ cho DOM render xong
  }
}, [highlightId, products]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target) &&
      typeDropdownRef.current &&
      !typeDropdownRef.current.contains(event.target)
    ) {
      setIsDropdownOpen(false);
      setOpenTypeDropdown(null);
    }
  };

  document.addEventListener("click", handleClickOutside); // ✅ đổi ở đây
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

  // --- LOGIC FORM THÊM/SỬA ---
  const resetForm = () => {
    setForm({
    name: "",
    category_id: "",
    brand_id: "",
    description: "",
    image: "",
    type: "normal",
    discount_percent: 0,
    min_stock_kg: 100,
    min_stock_25kg: 5,
    min_stock_50kg: 5,
    stock_kg: "",
    price_kg: "",
    stock_25kg: "",
    price_25kg: "",
    stock_50kg: "",
    price_50kg: ""
  });
    setEditing(null);
    setShowModal(false);
  };

  const handleSave = async () => {
    try {
      if (!form.name.trim()) return toast.warning("Vui lòng nhập tên sản phẩm");
      
      const payload: any = {
        name: form.name,
        category_id: form.category_id,
        brand_id: form.brand_id,
        description: form.description,
        image: form.image,
        status: editing ? editing.status : "active",
        min_stock_kg: Number(form.min_stock_kg) || 0,
        min_stock_25kg: Number(form.min_stock_25kg) || 0,
        min_stock_50kg: Number(form.min_stock_50kg) || 0,
        price_kg: Number(form.price_kg) || 0,
        price_bag_25kg: Number(form.price_25kg) || 0,
        price_bag_50kg: Number(form.price_50kg) || 0,
        type: form.type || "normal",
        discount_percent: Number(form.discount_percent) || 0,
      };

      if (!editing) {
        payload.stock_total_kg = Number(form.stock_kg) || 0;
        payload.stock_25kg = Number(form.stock_25kg) || 0;
        payload.stock_50kg = Number(form.stock_50kg) || 0;
      }

      if (editing) {
        await apiClient.put(`/products/${editing._id}`, payload);
        toast.success("Cập nhật thông tin thành công");
      } else {
        await apiClient.post("/products", payload);
        toast.success("Thêm sản phẩm thành công");
      }
      loadData();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Lỗi lưu dữ liệu");
    }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      category_id: String(p.category_id?._id || p.category_id || ""),
      brand_id: String(p.brand_id?._id || p.brand_id || p.supplier_id || ""),
      description: p.description || "",
      image: p.image || "",
      min_stock_kg: p.min_stock_kg !== undefined ? p.min_stock_kg : 100,
      min_stock_25kg: p.min_stock_25kg !== undefined ? p.min_stock_25kg : 5,
      min_stock_50kg: p.min_stock_50kg !== undefined ? p.min_stock_50kg : 5,
      stock_kg: p.stock_total_kg || 0,
      price_kg: p.price_kg || "",
      stock_25kg: p.stock_25kg || 0,
      price_25kg: p.price_bag_25kg || "",
      stock_50kg: p.stock_50kg || 0,
      price_50kg: p.price_bag_50kg || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Bác có chắc chắn muốn xóa vĩnh viễn sản phẩm này không? Hành động này không thể hoàn tác!")) return;
    try {
      await apiClient.delete(`/products/${id}`);
      toast.success("Đã xóa sản phẩm thành công!");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi xóa sản phẩm");
    }
  };
  //-------SET SP----------
const handleSetType = async (id, type) => {
  try {
    await apiClient.put(`/products/${id}`, { type });
    toast.success("Đã cập nhật loại sản phẩm");
    loadData();
  } catch (err) {
    toast.error("Lỗi cập nhật loại");
  }
};
  // --- LOGIC NHẬP KHO ---
  const selectProductForImport = (p) => {
    setImportForm({...importForm, product_id: p._id});
    setImportSearchTerm(p.name);
    setIsDropdownOpen(false);
  };

  const handleQuickImport = (p) => {
    setImportForm({ product_id: p._id, add_kg: "", add_25kg: "", add_50kg: "" });
    setImportSearchTerm(p.name);
    setIsDropdownOpen(false);
    setShowImportModal(true);
  };

  const handleImportStock = async () => {
    try {
      if (!importForm.product_id) return toast.warning("Vui lòng chọn sản phẩm cần nhập!");
      
      const rowsToImport = [];
      // if (Number(importForm.add_kg) > 0) rowsToImport.push({ type: "kg", quantity: importForm.add_kg });
      if (Number(importForm.add_25kg) > 0) rowsToImport.push({ type: "bao25kg", quantity: importForm.add_25kg });
      if (Number(importForm.add_50kg) > 0) rowsToImport.push({ type: "bao50kg", quantity: importForm.add_50kg });

      if (rowsToImport.length === 0) return toast.warning("Vui lòng nhập số lượng vào ít nhất 1 loại quy cách!");

      await apiClient.post("/products/import", {
        product_id: importForm.product_id,
        rows: rowsToImport
      });
      
      toast.success("Đã cập nhật số lượng tồn kho!");
      setShowImportModal(false);
      setImportForm({ product_id: "", add_kg: "", add_25kg: "", add_50kg: "" });
      setImportSearchTerm("");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi nhập kho");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiClient.put(`/products/${id}/toggle`);
      toast.success("Đã thay đổi trạng thái");
      loadData();
    } catch (error) { toast.error("Lỗi thao tác"); }
  };

  // Lọc dữ liệu
  const filteredProducts = products.filter((p) => {
    const searchContent = `${p.name} ${p.description || ""} ${p._id}`.toLowerCase();
    const nameMatch = searchContent.includes(search.toLowerCase());

    const pCatId = String(p.category_id?._id || p.category_id || p.categoryId || "");
    let categoryMatch = categoryFilter === "all" || pCatId === categoryFilter;
    
    if (categoryFilter !== "all" && !categoryMatch) {
        const selectedCat = categories.find(c => String(c._id) === categoryFilter);
        if (selectedCat) {
           const name = selectedCat.name.toLowerCase();
           let code = "";
           if (name.includes('heo')) code = "1";
           else if (name.includes('gia cầm')) code = "2";
           else if (name.includes('gia súc')) code = "3";
           else if (name.includes('thủy sản')) code = "4";
           else if (name.includes('đặc sản')) code = "5";
           else if (name.includes('bình dân')) code = "6";
           else if (name.includes('nguyên liệu')) code = "7";
           if (pCatId === code) categoryMatch = true;
        }
    }

    const pSupId = String(p.brand_id?._id || p.brand_id || p.supplier_id?._id || p.supplier_id || "");
    const supplierMatch = supplierFilter === "all" || pSupId === supplierFilter;
    
    let statusMatch = true;
    if (statusFilter === "active") statusMatch = p.status === "active";
    else if (statusFilter === "inactive") statusMatch = p.status === "inactive";
    else if (statusFilter === "low_stock") {
      const minKg = p.min_stock_kg ?? 100;
      const min25 = p.min_stock_25kg ?? 5;
      const min50 = p.min_stock_50kg ?? 5;

      const isLow =
        (p.stock_total_kg || 0) <= minKg ||
        (p.stock_25kg || 0) <= min25 ||
        (p.stock_50kg || 0) <= min50;

      statusMatch = p.status === "active" && isLow;
    }

    return nameMatch && categoryMatch && supplierMatch && statusMatch;
  });

  const importFilteredProducts = products.filter((p) => 
    p.name.toLowerCase().includes(importSearchTerm.toLowerCase()) || 
    p._id.toLowerCase().includes(importSearchTerm.toLowerCase())
  );

  const selectedImportProductDetails = products.find(p => p._id === importForm.product_id);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
      <div className="w-10 h-10 border-4 border-[#047857] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[#047857] font-black text-sm uppercase tracking-widest">Agri-Hub đang chuẩn bị dữ liệu...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] w-full font-sans pb-12">
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        
        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-black text-[#047857] uppercase italic border-b-4 border-[#A3E635] w-fit pb-2">
            Hệ Thống Sản Phẩm
          </h1>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(true)} className="bg-[#047857] text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-md font-bold flex items-center gap-2">
              <Plus size={18} /> Thêm sản phẩm
            </button>
            <button onClick={() => { setShowImportModal(true); setImportForm({ product_id: "", add_kg: "", add_25kg: "", add_50kg: "" }); setImportSearchTerm(""); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md font-bold flex items-center gap-2">
              <Package size={18} /> Mở kho nhập
            </button>
          </div>
        </div>

        {/* BỘ LỌC */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-[#047857] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                className="w-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#047857] focus:bg-white transition-all font-semibold text-sm" 
                placeholder="Tìm tên, mô tả, mã..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            
            <select className="border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-xl outline-none text-sm font-bold text-gray-600 focus:border-[#047857]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">📁 Tất cả danh mục</option>
              {categories.map(c => <option key={c._id} value={String(c._id)}>{c.name}</option>)}
            </select>

            <select className="border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-xl outline-none text-sm font-bold text-gray-600 focus:border-[#047857]" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
              <option value="all">🏢 Tất cả nhãn hàng</option>
              {suppliers.map(s => <option key={s._id} value={String(s._id)}>{s.name}</option>)}
            </select>

            <select className="border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-xl outline-none text-sm font-bold text-gray-600 focus:border-[#047857]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">✨ Trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã ẩn</option>
              <option value="low_stock">⚠️ Sắp hết hàng</option>
            </select>
          </div>
        </div>

        {/* BẢNG SẢN PHẨM CHÍNH */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <th className="p-4">Sản phẩm</th>
                  <th className="p-4">Nhãn & Loại</th>
                  <th className="p-4 text-center">Giá (KG)</th>
                  <th className="p-4 text-center">Tồn kho & Nhập hàng</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const cat = categories.find(c => String(c._id) === String(p.category_id?._id || p.category_id));
                  const sup = suppliers.find(s => String(s._id) === String(p.brand_id?._id || p.brand_id || p.supplier_id));
                  
                  const minKg = p.min_stock_kg !== undefined ? p.min_stock_kg : 100;
                  const min25 = p.min_stock_25kg !== undefined ? p.min_stock_25kg : 5;
                  const min50 = p.min_stock_50kg !== undefined ? p.min_stock_50kg : 5;

                  const isKgLow = false;
                  const is25Low = (p.stock_25kg || 0) <= min25;
                  const is50Low = (p.stock_50kg || 0) <= min50;

                  return (
                    <tr
                        key={p._id}
                        id={`product-${p._id}`}
                        className={`transition-all duration-500 ${
                          p._id === highlightId
                            ? "bg-yellow-100 ring-2 ring-yellow-400 animate-pulse"
                            : "hover:bg-emerald-50/30"
                        }`}
                      >
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg border border-gray-100 bg-white p-1 overflow-hidden shrink-0 shadow-sm">
                            <img src={`${IMAGE_URL}/${p.image}`} className="w-full h-full object-contain" onError={e => e.target.src='https://via.placeholder.com/50'} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm cursor-pointer hover:text-[#047857]" onClick={() => { setSelectedProduct(p); setShowDetail(true); }}>{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Mã: {p._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                            <Landmark size={12} className="text-amber-500" /> {sup?.name || "Hàng Agri-Hub"}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit uppercase">
                            {cat?.name || "Chưa phân loại"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-black text-[#047857] text-sm italic">{(p.price_kg || 0).toLocaleString()}đ</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="inline-flex flex-col text-[10px] font-black w-32">
                            <div className={`flex justify-between px-2 py-1 rounded mb-1 border ${isKgLow ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500'}`} title={`Mức báo động: <= ${minKg} kg`}>
                              <span>Ký lẻ:</span> <span>{p.stock_total_kg || 0}</span>
                            </div>
                            <div className={`flex justify-between px-2 py-1 rounded mb-1 border ${is25Low ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500'}`} title={`Mức báo động: <= ${min25} bao`}>
                              <span>25kg:</span> <span>{p.stock_25kg || 0}</span>
                            </div>
                            <div className={`flex justify-between px-2 py-1 rounded border ${is50Low ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500'}`} title={`Mức báo động: <= ${min50} bao`}>
                              <span>50kg:</span> <span>{p.stock_50kg || 0}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleQuickImport(p)} 
                            title="Nhập thêm hàng cho SP này"
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex flex-col items-center justify-center border border-blue-100"
                          >
                            <PackagePlus size={18} />
                            <span className="text-[8px] uppercase mt-1 font-black">Nhập</span>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* NÚT PHÂN LOẠI */}
<div ref={typeDropdownRef} className="relative text-[10px] font-bold mt-1">
  
  {/* BUTTON */}
<button
  onClick={() =>
    setOpenTypeDropdown(openTypeDropdown === p._id ? null : p._id)
  }
  className={`px-3 py-1 rounded-lg text-xs font-bold border shadow-sm transition-all min-w-[120px] text-center
  ${
    p.type === "hot"
      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white"
      : p.type === "new"
      ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white"
      : p.type === "discount"
      ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-600 hover:text-white"
      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-600 hover:text-white"
  }`}
>
  {p.type === "hot" && "SP Bán chạy"}
  {p.type === "new" && "SP Mới"}
  {p.type === "discount" && "SP Giảm giá"}
  {(!p.type || p.type === "normal") && "Bình thường"}
</button>

  {/* DROPDOWN */}
  {openTypeDropdown === p._id && (
    <div className="absolute left-1/2 -translate-x-1/2 mt-2 min-w-[130px]
    bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">

      {/* NORMAL */}
      <div
        onClick={() => {
          handleSetType(p._id, "normal");
          setOpenTypeDropdown(null);
        }}
        className={`px-2 py-1.5 text-xs flex justify-between items-center cursor-pointer transition
        ${p.type === "normal" ? "bg-gray-100 font-bold" : "hover:bg-gray-100"}`}
      >
        <span>Bình thường</span>
        {p.type === "normal" && "✔"}
      </div>

      {/* HOT */}
      <div
        onClick={() => {
          handleSetType(p._id, "hot");
          setOpenTypeDropdown(null);
        }}
        className={`px-2 py-1.5 text-xs flex justify-between items-center cursor-pointer transition
        ${p.type === "hot" ? "bg-red-50 text-red-600 font-bold" : "text-red-600 hover:bg-red-50"}`}
      >
        <span>SP Bán chạy</span>
        {p.type === "hot" && "✔"}
      </div>

      {/* NEW */}
      <div
        onClick={() => {
          handleSetType(p._id, "new");
          setOpenTypeDropdown(null);
        }}
        className={`px-2 py-1.5 text-xs flex justify-between items-center cursor-pointer transition
        ${p.type === "new" ? "bg-blue-50 text-blue-600 font-bold" : "text-blue-600 hover:bg-blue-50"}`}
      >
        <span>SP Mới</span>
        {p.type === "new" && "✔"}
      </div>

      {/* DISCOUNT */}
      <div
        onClick={() => {
          handleSetType(p._id, "discount");
          setOpenTypeDropdown(null);
        }}
        className={`px-2 py-1.5 text-xs flex justify-between items-center cursor-pointer transition
        ${p.type === "discount" ? "bg-green-50 text-green-600 font-bold" : "text-green-600 hover:bg-green-50"}`}
      >
        <span>SP Giảm giá</span>
        {p.type === "discount" && "✔"}
      </div>

    </div>
  )}
</div>  
                          <button title="Sửa thông tin" onClick={() => handleEdit(p)} className="p-2 bg-emerald-50 rounded-lg text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100">
                            <Pencil size={16} />
                          </button>
                          <button title={p.status === "active" ? "Đang hiện" : "Đang ẩn"} onClick={() => handleToggleStatus(p._id)} className={`p-2 rounded-lg transition-all shadow-sm border ${p.status === 'active' ? 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-600 hover:text-white' : 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white'}`}>
                            {p.status === "active" ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button title="Xóa vĩnh viễn" onClick={() => handleDelete(p._id)} className="p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL THÊM / SỬA SẢN PHẨM */}
        {/* ========================================================= */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-black text-[#047857] uppercase tracking-wide flex items-center gap-2">
                  {editing ? "✏️ Hiệu Chỉnh Cấu Hình Sản Phẩm" : "🚀 Khởi Tạo Sản Phẩm Mới"}
                </h3>
                <button onClick={resetForm} className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><X size={20}/></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">
                {editing && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg text-blue-800 text-sm font-medium flex items-center gap-3 shadow-sm">
                    <Info size={18} className="shrink-0"/> 
                    <span>Chế độ sửa: Ô <b>Tồn kho</b> bị khóa để đảm bảo minh bạch luồng hàng. Vui lòng dùng chức năng <b>Nhập kho</b> ở màn hình chính nếu muốn thay đổi số lượng.</span>
                  </div>
                )}

                {/* THÔNG TIN CƠ BẢN */}
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 uppercase border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                    <span className="bg-[#047857] w-2 h-4 rounded-full"></span> Thông Tin Cơ Bản
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Tên sản phẩm <span className="text-rose-500">*</span></label>
                      <input className="w-full border border-gray-300 p-2.5 rounded-md focus:border-[#047857] outline-none text-sm bg-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nhập tên sản phẩm..." />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Danh mục</label>
                      <select className="w-full border border-gray-300 p-2.5 rounded-md focus:border-[#047857] outline-none text-sm bg-white" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                        <option value="">-- Chọn --</option>
                        {categories.map(c => <option key={c._id} value={String(c._id)}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Nhãn hàng</label>
                      <select className="w-full border border-gray-300 p-2.5 rounded-md focus:border-[#047857] outline-none text-sm bg-white" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                        <option value="">-- Chọn --</option>
                        {suppliers.map(s => <option key={s._id} value={String(s._id)}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">
                        Loại sản phẩm
                      </label>
                      <select
                        className="w-full border border-gray-300 p-2.5 rounded-md"
                        value={form.type || "normal"}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        <option value="normal">Bình thường</option>
                        <option value="hot">Bán chạy</option>
                        <option value="new">Sản phẩm mới</option>
                        <option value="discount">Giảm giá</option>
                      </select>
                    </div>
                    {form.type === "discount" && (
                      <div className="col-span-1 space-y-1">
                        <label className="text-xs font-bold text-rose-600 uppercase">
                          % Giảm giá
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full border border-rose-300 p-2.5 rounded-md text-rose-600 font-bold"
                          value={form.discount_percent || 0}
                          onChange={(e) =>
                            setForm({ ...form, discount_percent: e.target.value })
                          }
                        />
                      </div>
                    )}
                    <div className="col-span-1 md:col-span-4 space-y-1">
                      <label className="text-xs font-bold text-gray-600 uppercase">Tên file ảnh (Local)</label>
                      <input className="w-full border border-gray-300 p-2.5 rounded-md focus:border-[#047857] outline-none text-sm bg-white" value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="VD: sanpham1.jpg" />
                    </div>
                  </div>
                </div>

                {/* BẢNG QUY CÁCH VÀ GIÁ */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                      <span className="bg-[#047857] w-2 h-4 rounded-full"></span> Bảng Giá & Quy Cách Tồn Kho
                    </h4>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-emerald-50/50">
                        <tr>
                          <th className="p-3 border-b border-r border-gray-200 text-xs font-bold text-gray-700 uppercase w-48 text-center bg-gray-100/50">Loại Quy Cách</th>
                          <th className="p-3 border-b border-r border-gray-200 text-xs font-bold text-gray-700 uppercase text-center">Đơn Giá Bán (VNĐ)</th>
                          <th className="p-3 border-b border-r border-gray-200 text-xs font-bold text-gray-700 uppercase text-center">Tồn Kho Khởi Tạo</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-rose-600 uppercase text-center">Mức Cảnh Báo (≤)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
<tr>
  <td className="p-3 border-r font-bold text-emerald-700 bg-gray-50">
    ⚖️ Bán Ký Lẻ (Kg)
  </td>

  {/* GIÁ */}
  <td className="p-3 border-r">
    <input
      type="number"
      className="w-full border p-2 rounded text-right font-bold"
      value={form.price_kg}
      onChange={e => setForm({...form, price_kg: e.target.value})}
    />
  </td>

{/* TỒN KHO */}
<td className="p-3 border-r">
  <input
    type="number"
    className="w-full border p-2 rounded text-right"
    value={form.stock_kg}
    onChange={e => setForm({...form, stock_kg: e.target.value})}
  />
</td>

{/* CẢNH BÁO */}
<td className="p-3">
  <input
    type="number"
    className="w-full border border-rose-300 p-2 rounded text-right"
    value={form.min_stock_kg}
    onChange={e => setForm({...form, min_stock_kg: e.target.value})}
  />
</td>
</tr>
<tr>
  <td className="p-3 border-r font-bold text-blue-700 bg-gray-50">
    📦 Nguyên Bao 25 Kg
  </td>

  <td className="p-3 border-r">
    <input
      type="number"
      className="w-full border p-2 rounded text-right font-bold"
      value={form.price_25kg}
      onChange={e => setForm({...form, price_25kg: e.target.value})}
    />
  </td>

{/* TỒN KHO */}
<td className="p-3 border-r">
  <input
    type="number"
    className="w-full border p-2 rounded text-right"
    value={form.stock_25kg}
    onChange={e => setForm({...form, stock_25kg: e.target.value})}
  />
</td>

{/* CẢNH BÁO */}
<td className="p-3">
  <div className="flex items-center gap-2">
    <input
      type="number"
      className="w-full border border-rose-300 p-2 rounded text-right"
      value={form.min_stock_25kg}
      onChange={e => setForm({...form, min_stock_25kg: e.target.value})}
    />
    <span className="text-xs text-rose-400">Bao</span>
  </div>
</td>
</tr>
<tr>
  <td className="p-3 border-r font-bold text-amber-700 bg-gray-50">
    📦 Nguyên Bao 50 Kg
  </td>

  {/* GIÁ */}
  <td className="p-3 border-r">
    <input
      type="number"
      className="w-full border p-2 rounded text-right font-bold"
      value={form.price_50kg}
      onChange={e => setForm({...form, price_50kg: e.target.value})}
    />
  </td>

  {/* TỒN KHO */}
  <td className="p-3 border-r">
    <input
      type="number"
      disabled={!!editing}
      className="w-full border p-2 rounded text-right"
      value={form.stock_50kg}
      onChange={e => setForm({...form, stock_50kg: e.target.value})}
    />
  </td>

  {/* CẢNH BÁO */}
  <td className="p-3">
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="w-full border border-rose-300 p-2 rounded text-right"
        value={form.min_stock_50kg}
        onChange={e => setForm({...form, min_stock_50kg: e.target.value})}
      />
      <span className="text-xs text-rose-400">Bao</span>
    </div>
  </td>
</tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MÔ TẢ */}
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 uppercase border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                    <span className="bg-[#047857] w-2 h-4 rounded-full"></span> Ghi Chú / Mô Tả Chi Tiết
                  </h4>
                  <textarea className="w-full border border-gray-300 p-3 rounded-md h-24 resize-none focus:border-[#047857] outline-none text-sm" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Nhập mô tả sản phẩm..." />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button onClick={resetForm} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-100 shadow-sm">Hủy Bỏ</button>
                <button onClick={handleSave} className="bg-[#047857] text-white px-8 py-2.5 rounded-lg font-bold text-sm uppercase hover:bg-emerald-700 shadow-sm flex items-center gap-2">
                  <CheckCircle2 size={18}/> {editing ? "Lưu Cập Nhật" : "Xác Nhận Thêm Mới"}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL NHẬP KHO (ĐÃ RE-DESIGN ĐỒNG BỘ DẠNG BẢNG) */}
        {/* ========================================================= */}
        {showImportModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[105] p-4">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
              
              {/* HEADER */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-black text-blue-700 uppercase tracking-wide flex items-center gap-2">
                  <PackagePlus size={20} /> Phiếu Nhập Kho Sản Phẩm
                </h3>
                <button onClick={() => { setShowImportModal(false); setImportForm({ product_id: "", add_kg: "", add_25kg: "", add_50kg: "" }); setImportSearchTerm(""); setIsDropdownOpen(false); }} className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><X size={20}/></button>
              </div>
              
              <div className="p-6 bg-gray-50/50 space-y-6">
                
                {/* 1. KHU VỰC TÌM KIẾM SẢN PHẨM */}
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm" ref={dropdownRef}>
                  <label className="text-xs font-bold text-gray-700 uppercase border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                    <span className="bg-blue-600 w-2 h-4 rounded-full"></span> 1. Định Danh Hàng Hóa
                  </label>
                  
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      className="w-full border border-gray-300 bg-white pl-10 pr-4 py-2.5 rounded-md text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Quét mã vạch hoặc gõ tên sản phẩm cần nhập..."
                      value={importSearchTerm}
                      onChange={(e) => { setImportSearchTerm(e.target.value); setIsDropdownOpen(true); setImportForm({...importForm, product_id: ""}); }}
                      onFocus={() => { if (!importForm.product_id) setIsDropdownOpen(true); }}
                    />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full max-w-3xl mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                      {importFilteredProducts.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                          {importFilteredProducts.map(p => (
                            <li key={p._id} className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between" onClick={() => selectProductForImport(p)}>
                              <div className="font-bold text-gray-800 text-sm">{p.name}</div>
                              <div className="flex gap-2 text-[10px] font-bold text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">Lẻ: {p.stock_total_kg || 0}kg</span>
                                <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">25KG: {p.stock_25kg || 0}bao</span>
                                <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">50KG: {p.stock_50kg || 0}bao</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-sm font-semibold text-rose-500">Không tìm thấy sản phẩm khớp với từ khóa!</div>
                      )}
                    </div>
                  )}

                  {importForm.product_id && (
                     <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-xs font-bold border border-blue-200">
                        <CheckCircle2 size={16}/> Đã xác nhận mục tiêu nhập kho
                     </div>
                  )}
                </div>

                {/* 2. BẢNG NHẬP SỐ LƯỢNG (ĐỒNG BỘ CSS) */}
                <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-opacity duration-300 ${!importForm.product_id ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                      <span className="bg-blue-600 w-2 h-4 rounded-full"></span> 2. Bảng Kê Khai Khối Lượng Nhập
                    </h4>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-blue-50/50">
                        <tr>
                          <th className="p-3 border-b border-r border-gray-200 text-xs font-bold text-gray-700 uppercase w-48 text-center bg-gray-100/50">Loại Quy Cách</th>
                          <th className="p-3 border-b border-r border-gray-200 text-xs font-bold text-gray-700 uppercase text-center w-40">Tồn Hiện Tại</th>
                          <th className="p-3 border-b border-r border-gray-200 text-xs font-bold text-blue-700 uppercase text-center">Số Lượng Cộng Thêm</th>
                          <th className="p-3 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase text-center w-24">Đơn Vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        
                        {/* Nhập Ký lẻ */}
                        {/* <tr className="hover:bg-blue-50/20 transition-colors">
                          <td className="p-3 border-r border-gray-200 font-bold text-emerald-700 bg-gray-50/50">⚖️ Bán Ký Lẻ (Kg)</td>
                          <td className="p-3 border-r border-gray-200 text-center font-bold text-gray-500 bg-gray-50/30">
                            {selectedImportProductDetails?.stock_total_kg || 0}
                          </td>
                          <td className="p-3 border-r border-gray-200 bg-blue-50/20">
                            <input type="number" min="0" className="w-full border border-blue-300 bg-white p-2 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-black text-blue-700 text-right placeholder-blue-200" placeholder="0" value={importForm.add_kg} onChange={e => setImportForm({...importForm, add_kg: e.target.value})} />
                          </td>
                          <td className="p-3 text-center text-xs font-bold text-gray-400">Kg</td>
                        </tr> */}

                        {/* Nhập 25kg */}
                        <tr className="hover:bg-blue-50/20 transition-colors">
                          <td className="p-3 border-r border-gray-200 font-bold text-blue-700 bg-gray-50/50">📦 Nguyên Bao 25 Kg</td>
                          <td className="p-3 border-r border-gray-200 text-center font-bold text-gray-500 bg-gray-50/30">
                            {selectedImportProductDetails?.stock_25kg || 0}
                          </td>
                          <td className="p-3 border-r border-gray-200 bg-blue-50/20">
                            <input type="number" min="0" className="w-full border border-blue-300 bg-white p-2 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-black text-blue-700 text-right placeholder-blue-200" placeholder="0" value={importForm.add_25kg} onChange={e => setImportForm({...importForm, add_25kg: e.target.value})} />
                          </td>
                          <td className="p-3 text-center text-xs font-bold text-gray-400">Bao</td>
                        </tr>

                        {/* Nhập 50kg */}
                        <tr className="hover:bg-blue-50/20 transition-colors">
                          <td className="p-3 border-r border-gray-200 font-bold text-amber-700 bg-gray-50/50">📦 Nguyên Bao 50 Kg</td>
                          <td className="p-3 border-r border-gray-200 text-center font-bold text-gray-500 bg-gray-50/30">
                            {selectedImportProductDetails?.stock_50kg || 0}
                          </td>
                          <td className="p-3 border-r border-gray-200 bg-blue-50/20">
                            <input type="number" min="0" className="w-full border border-blue-300 bg-white p-2 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm font-black text-blue-700 text-right placeholder-blue-200" placeholder="0" value={importForm.add_50kg} onChange={e => setImportForm({...importForm, add_50kg: e.target.value})} />
                          </td>
                          <td className="p-3 text-center text-xs font-bold text-gray-400">Bao</td>
                        </tr>

                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* FOOTER */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                 <button onClick={() => { setShowImportModal(false); setImportForm({ product_id: "", add_kg: "", add_25kg: "", add_50kg: "" }); setImportSearchTerm(""); setIsDropdownOpen(false); }} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-100 shadow-sm">Hủy Bỏ</button>
                 <button onClick={handleImportStock} disabled={!importForm.product_id} className={`px-8 py-2.5 rounded-lg font-bold text-sm uppercase shadow-sm flex items-center gap-2 ${importForm.product_id ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                   <CheckCircle2 size={18}/> Ghi Nhận Phiếu Nhập
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL CHI TIẾT SẢN PHẨM */}
        {showDetail && selectedProduct && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[110] p-4">
             <div className="bg-white w-full max-w-5xl rounded-3xl p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                <button onClick={() => setShowDetail(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={24}/></button>
                <div className="bg-gray-50 rounded-2xl flex items-center justify-center p-12 border border-gray-100">
                   <img src={`${IMAGE_URL}/${selectedProduct.image}`} className="w-full max-h-[400px] object-contain drop-shadow-2xl" onError={e => e.target.src='https://via.placeholder.com/400'} />
                </div>
                <div className="flex flex-col justify-center py-4">
                   <h2 className="text-4xl font-black text-gray-800 uppercase leading-tight mb-4 italic">{selectedProduct.name}</h2>
                   <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 mb-8">
                      <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Info size={14}/> Phân tích chi tiết</h4>
                      <p className="text-gray-600 text-sm italic leading-relaxed">{selectedProduct.description || "Dữ liệu đang được cập nhật."}</p>
                   </div>
                   <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-white border p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kho Ký lẻ</p>
                        <p className="font-black text-emerald-600 text-xl">{selectedProduct.stock_total_kg || 0} <span className="text-xs opacity-50">kg</span></p>
                      </div>
                      <div className="bg-white border p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kho 25kg</p>
                        <p className="font-black text-blue-600 text-xl">{selectedProduct.stock_25kg || 0} <span className="text-xs opacity-50">bao</span></p>
                      </div>
                      <div className="bg-white border p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Kho 50kg</p>
                        <p className="font-black text-amber-600 text-xl">{selectedProduct.stock_50kg || 0} <span className="text-xs opacity-50">bao</span></p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};