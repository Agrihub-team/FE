// @ts-nocheck
import { useEffect, useState } from "react";
import { Search, Landmark } from "lucide-react";
import { apiClient } from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import { IMAGE_URL } from '../../utils/config';


const DiscountProductPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const [discounts, setDiscounts] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const [prodRes, catRes, supRes] = await Promise.all([
        apiClient.get("/products"),
        apiClient.get("/categories"),
        apiClient.get("/suppliers"),
      ]);

      setProducts(prodRes?.products || []);
      setCategories(catRes?.data || []);
      setSuppliers(supRes?.data || []);
    };

    loadData();
  }, []);

const handleSaveDiscount = async (id) => {
  try {
    const data = discounts[id] || {};

    if (data.percent === undefined) {
      toast.warning("Vui lòng nhập % giảm giá");
      return;
    }

    if (!data.start || !data.end) {
      toast.warning("Vui lòng chọn ngày bắt đầu và kết thúc");
      return;
    }

    await apiClient.put(`/products/${id}/discount`, {
      percent: data.percent,
      start: data.start.toISOString(),
      end: data.end.toISOString(),
    });

    toast.success("Lưu discount thành công!");

    const res = await apiClient.get("/products");
    setProducts(res?.products || []);

    setDiscounts((prev) => ({
      ...prev,
      [id]: {}
    }));

  } catch (err) {
    console.log(err);
    toast.error("Lỗi khi lưu discount");
  }
};

const filteredProducts = products.filter((p) => {
  const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());

  const pCat = String(p.category_id?._id || p.category_id || "");
  const matchCat = categoryFilter === "all" || pCat === categoryFilter;

  const pSup = String(p.brand_id?._id || p.brand_id || "");
  const matchSup = supplierFilter === "all" || pSup === supplierFilter;

  // ✅ THÊM DÒNG NÀY
  const matchType = p.type === "discount";

  return matchSearch && matchCat && matchSup && matchType;
});

  return (
    <div className="min-h-screen bg-[#F8FAFC] w-full font-sans pb-12">
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        
        {/* HEADER */}
        <h1 className="text-3xl font-black text-[#047857] uppercase italic border-b-4 border-[#A3E635] w-fit pb-2 mb-8">
          Sản Phẩm Giảm Giá
        </h1>

        {/* FILTER (giống trang chính, bỏ status) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-t-4 border-t-[#047857] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[#047857] focus:bg-white transition-all font-semibold text-sm"
                placeholder="Tìm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 focus:border-[#047857]"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">📁 Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 focus:border-[#047857]"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="all">🏢 Tất cả nhãn hàng</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <th className="p-4 w-[260px]">Sản phẩm</th>
                    <th className="p-4 w-[180px]">Nhãn & Loại</th>
                    <th className="p-4 text-center w-[180px]">Giá gốc</th>
                    <th className="p-4 text-center w-[120px]">Loại</th>
                    <th className="p-4 text-center w-[100px]">% giảm</th>
                    <th className="p-4 text-center w-[240px]">Giá sau giảm</th> 
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const cat = categories.find(
                    (c) =>
                        String(c._id) ===
                        String(
                        p.category_id?._id ||
                        p.category_id ||
                        p.categoryId ||
                        ""
                        )
                    );

                  const sup = suppliers.find(
                        (s) =>
                            String(s._id) ===
                            String(
                            p.brand_id?._id ||
                            p.brand_id ||
                            p.supplier_id?._id ||
                            p.supplier_id ||
                            ""
                            )
                        );

                  const percent = discounts[p._id]?.percent ?? p.discount_percent ?? 0;
                  const finalPrice_kg = (p.price_kg || 0) - ((p.price_kg || 0) * percent) / 100;
                const finalPrice_25 = (p.price_bag_25kg || 0) - ((p.price_bag_25kg || 0) * percent) / 100;
                const finalPrice_50 = (p.price_bag_50kg || 0) - ((p.price_bag_50kg || 0) * percent) / 100;

                  return (
                    <tr key={p._id} className="hover:bg-emerald-50/30 transition-colors">
                      
                      {/* PRODUCT */}
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg border border-gray-100 bg-white p-1 shadow-sm">
                            <img
                              src={`${IMAGE_URL}/${p.image}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                              Mã: {p._id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* BRAND + CATEGORY */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                            <Landmark size={12} className="text-amber-500" />
                            {sup?.name || "Hàng Agri-Hub"}
                            </span>

                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit uppercase">
                            {cat?.name || "Chưa phân loại"}
                            </span>
                        </div>
                      </td>

                      {/* PRICE */}
<td className="p-4 text-center">
  <div className="flex flex-col items-center gap-1 text-xs font-bold text-[#047857]">
    {[p.price_kg, p.price_bag_25kg, p.price_bag_50kg].map((price, i) => (
      <span key={i} className="bg-emerald-50 px-2 py-1 rounded w-24 text-center">
        {(price || 0).toLocaleString()}đ
      </span>
    ))}
  </div>
</td>

                      {/* TYPE */}
<td className="p-4 text-center align-middle">
  <span
    className={`inline-block px-3 py-1 text-xs font-bold rounded-lg whitespace-nowrap
    ${
      p.type === "discount"
        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
        : p.type === "new"
        ? "bg-blue-50 text-blue-600 border border-blue-200"
        : "bg-gray-100 text-gray-600"
    }`}
  >
    {p.type === "discount"
      ? "SP Giảm giá"
      : p.type === "new"
      ? "Hàng mới"
      : "Thường"}
  </span>
</td>

                      {/* INPUT */}
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={percent}
                          onChange={(e) =>
                            setDiscounts({
                                ...discounts,
                                [p._id]: {
                                    ...discounts[p._id],
                                    percent: Number(e.target.value),
                                },
                                })
                          }
                          className="w-20 text-center border border-rose-300 rounded-lg p-1 font-bold text-rose-600"
                        />
                      </td>

{/* RESULT */}
<td className="p-4 text-center">
  <div className="flex items-center justify-center gap-3">

    {/* GIÁ */}
<div className="flex flex-col items-center gap-1 text-xs font-bold text-rose-600">
  {[finalPrice_kg, finalPrice_25, finalPrice_50].map((price, i) => (
    <span
      key={i}
      className="bg-rose-50 px-2 py-1 rounded w-24 text-center"
    >
      {(price || 0).toLocaleString()}đ
    </span>
  ))}
</div>
<div className="flex flex-col gap-1 w-[120px]">

  {/* START DATE */}
  <DatePicker
    selected={
      discounts[p._id]?.start
        ? new Date(discounts[p._id].start)
        : null
    }
    onChange={(date) =>
      setDiscounts({
        ...discounts,
        [p._id]: {
          ...discounts[p._id],
          start: date,
        },
      })
    }
    dateFormat="dd/MM/yyyy"
    placeholderText="Từ ngày"
    className="w-full border border-gray-300 rounded h-[32px] px-2 text-[11px]"
  />

  {/* END DATE */}
  <DatePicker
    selected={
      discounts[p._id]?.end
        ? new Date(discounts[p._id].end)
        : null
    }
    onChange={(date) =>
      setDiscounts({
        ...discounts,
        [p._id]: {
          ...discounts[p._id],
          end: date,
        },
      })
    }
    dateFormat="dd/MM/yyyy"
    placeholderText="Đến ngày"
    className="w-full border border-gray-300 rounded h-[32px] px-2 text-[11px]"
  />

  {/* BUTTON */}
  <button
    onClick={() => handleSaveDiscount(p._id)}
    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-[32px] rounded"
  >
    Lưu
  </button>

</div>
  </div>
</td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default DiscountProductPage;