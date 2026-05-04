// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";
import { toast } from "sonner";
import { IMAGE_URL } from "../utils/config";
import { ShoppingCart } from "lucide-react";

export const Products = () => {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const categoryQuery   = searchParams.get("category");
  const searchQuery     = searchParams.get("search") || "";
  const repurchaseParam = searchParams.get("repurchase") || "";
  const typeQuery       = searchParams.get("type") || "";
  const repurchaseIds   = repurchaseParam ? repurchaseParam.split(",").filter(Boolean) : [];

  const [activeCategoryName, setActiveCategoryName] = useState(null);
  const [activePrices, setActivePrices] = useState([]);
  const [activeBrands, setActiveBrands] = useState([]);
  const [sortOrder, setSortOrder] = useState("Mặc định");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const addItem = useCartStore((s) => s.addItem);

  const getProductPrice = (p) => {
    return (
      parseFloat(p.price_bag_25kg) ||
      parseFloat(p.price_bag_50kg) ||
      parseFloat(p.price_kg) ||
      0
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catData, prodData] = await Promise.all([
          apiClient.get("/categories"),
          apiClient.get("/products"),
        ]);

        const cats = Array.isArray(catData) ? catData : catData?.data || [];
        let prods = prodData?.products || prodData || [];

        setCategories(cats);
        setAllProducts(prods);
        setFilteredProducts(prods);
      } catch (error) {
        console.error("Lỗi fetch dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (categoryQuery && categories.length > 0) {
      const targetCat = categories.find(
        (c) => c._id === categoryQuery || (c as any).id === categoryQuery,
      );
      if (targetCat) setActiveCategoryName(targetCat.name);
    }
  }, [categoryQuery, categories]);

  useEffect(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return;
    let result = [...allProducts];

    // --- LỌC DANH MỤC ---
    if (activeCategoryName) {
      const nameLower = activeCategoryName.toLowerCase();
      let targetIds = [];
      if (nameLower.includes("heo")) targetIds = ["1"];
      else if (nameLower.includes("gia cầm")) targetIds = ["2"];
      else if (nameLower.includes("gia súc")) targetIds = ["3"];
      else if (nameLower.includes("thủy sản")) targetIds = ["4"];
      else if (nameLower.includes("đặc sản")) targetIds = ["5"];
      else if (nameLower.includes("bình dân")) targetIds = ["6"];

      result = result.filter((p) => {
        const pCatId = (p.category_id || p.categoryId || "").toString();
        const catObj = categories.find((c) => c.name === activeCategoryName);
        return targetIds.includes(pCatId) || pCatId === catObj?._id;
      });
    }

    // --- LỌC GIÁ (CHỈ CHỌN 1) ---
    if (activePrices.length > 0) {
      result = result.filter((p) => {
        const price = getProductPrice(p);
        if (price === 0) return false;

        return activePrices.some((range) => {
          if (range === "Dưới 100.000đ") return price < 100000;
          if (range === "Từ 100.000đ - 200.000đ")
            return price >= 100000 && price <= 200000;
          if (range === "Từ 200.000đ - 300.000đ")
            return price >= 200000 && price <= 300000;
          if (range === "Từ 300.000đ - 500.000đ")
            return price >= 300000 && price <= 500000;
          if (range === "Từ 500.000đ - 1 triệu")
            return price >= 500000 && price <= 1000000;
          return false;
        });
      });
    }

    // --- LỌC THƯƠNG HIỆU (XỬ LÝ DỮ LIỆU .JSON BỊ THIẾU TÊN) ---
    if (activeBrands.length > 0) {
      result = result.filter((p) => {
        const brandId = (p.brand_id?._id || p.brand_id || "").toString();
        const name    = (p.name || "").toLowerCase();
        return activeBrands.some((brand) => {
          if (brand === "C.P")       return brandId === "69a029bf6b300918076f16c9" || name.includes("cp ");
          if (brand === "Cargill")   return brandId === "69f7fdc2598dbcd7925f9b6f" || name.includes("cargill");
          if (brand === "GreenFeed") return brandId === "69d36f2010126971e58bc0b3" || name.includes("greenfeed");
          if (brand === "De Heus")   return brandId === "69d36e6e10126971e58bc03d" || name.includes("de heus");
          if (brand === "Japfa")     return brandId === "69d36e8410126971e58bc045" || name.includes("japfa");
          if (brand === "NewHope")   return brandId === "69f7fe79480e72f0add01f08" || name.includes("newhope") || name.includes("new hope");
          if (brand === "Agri-Hub")  return brandId === "69f7fe79480e72f0add01f0b";
          return false;
        });
      });
    }

    // --- LỌC THEO TYPE (mới/hot) ---
    if (typeQuery) {
      result = result.filter((p) => p.type === typeQuery);
    }

    // --- LỌC TÌM KIẾM ---
    if (repurchaseIds.length > 0) {
      result = result.filter((p) => repurchaseIds.includes(p._id?.toString()));
    }

    if (searchQuery.trim()) {
      const kw = searchQuery.toLowerCase();
      result = result.filter((p) => p.name?.toLowerCase().includes(kw));
    }

    // --- SẮP XẾP ---
    if (sortOrder === "Giá tăng dần")
      result.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    else if (sortOrder === "Giá giảm dần")
      result.sort((a, b) => getProductPrice(b) - getProductPrice(a));

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [
    activeCategoryName,
    activePrices,
    activeBrands,
    sortOrder,
    allProducts,
    categories,
    searchQuery,
    repurchaseParam,
    typeQuery,
  ]);

  const safeProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
  const currentItems = safeProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(safeProducts.length / itemsPerPage);

  const handleCheckboxChange = (setState, value) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  };

  // ✅ HÀM LỌC GIÁ ĐỘC LẬP: Hoạt động như Radio button
  const handlePriceChange = (value) => {
    setActivePrices((prev) => (prev.includes(value) ? [] : [value]));
  };

  const handleAddToCart = (p) => {
    const price25 = parseFloat(p.price_bag_25kg) || parseFloat(p.price_kg) || 0;
    const price50 = parseFloat(p.price_bag_50kg) || 0;
    const priceKg = parseFloat(p.price_kg) || 0;
    addItem({
      _id: `${p._id}-${Date.now()}`,
      originalId: p._id,
      name: p.name,
      image: p.image,
      q25: 1, p25: price25,
      q50: 0, p50: price50,
      qKg: 0, pKg: priceKg,
    });
    toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`, { duration: 2500 });
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#f8f9fa] py-8 font-sans text-gray-800">
        {typeQuery && (
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                {typeQuery === "new" ? "🌱 Sản phẩm mới nhập" : "🔥 Sản phẩm bán chạy nhất"}
                <span className="text-emerald-600 font-normal">— {safeProducts.length} sản phẩm</span>
              </p>
              <Link to="/products" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 underline">Xem tất cả</Link>
            </div>
          </div>
        )}
        {repurchaseIds.length > 0 && (
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                ⚡ Đang hiển thị <span className="text-red-600">{repurchaseIds.length} sản phẩm</span> bạn đã mua trước đây
              </p>
              <Link to="/products" className="text-xs font-bold text-red-500 hover:text-red-700 underline">Xem tất cả sản phẩm</Link>
            </div>
          </div>
        )}
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-[260px] shrink-0 bg-white border border-gray-200 shadow-sm h-fit sticky top-4 rounded-lg overflow-hidden">
            <div className="bg-[#047857] text-white font-bold py-3 px-4 text-sm uppercase tracking-wide italic">
              Danh mục sản phẩm
            </div>
            <ul className="text-sm text-gray-700 max-h-[300px] overflow-y-auto">
              {categories.map((cat) => (
                <li
                  key={cat._id}
                  onClick={() =>
                    setActiveCategoryName(
                      activeCategoryName === cat.name ? null : cat.name,
                    )
                  }
                  className={`flex justify-between items-center px-4 py-3 border-b border-gray-50 cursor-pointer transition-all ${
                    activeCategoryName === cat.name
                      ? "bg-[#047857]/5 text-[#047857] font-bold border-l-4 border-l-[#047857]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span className="line-clamp-1 uppercase text-[11px] font-bold">
                    {cat.name}
                  </span>
                  <span className="text-gray-400 font-bold text-xs">
                    {activeCategoryName === cat.name ? "-" : "+"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="bg-[#047857] text-white font-bold py-3 px-4 text-sm uppercase mt-4">
              Bộ lọc sản phẩm
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 text-xs mb-3 uppercase tracking-tighter border-b pb-1">
                  Chọn mức giá
                </h3>
                <div className="space-y-2.5">
                  {[
                    "Dưới 100.000đ",
                    "Từ 100.000đ - 200.000đ",
                    "Từ 200.000đ - 300.000đ",
                    "Từ 300.000đ - 500.000đ",
                    "Từ 500.000đ - 1 triệu",
                  ].map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={activePrices.includes(p)}
                        onChange={() => handlePriceChange(p)}
                        className="w-4 h-4 accent-[#047857]"
                      />
                      <span
                        className={`text-[11px] font-bold uppercase transition-colors ${activePrices.includes(p) ? "text-[#047857]" : "text-gray-600"}`}
                      >
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-xs mb-3 uppercase tracking-tighter border-b pb-1">
                  Thương hiệu
                </h3>
                <div className="space-y-2.5">
                  {["C.P", "Cargill", "De Heus", "GreenFeed", "Japfa", "NewHope", "Agri-Hub"].map(
                    (b) => (
                      <label
                        key={b}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={activeBrands.includes(b)}
                          onChange={() =>
                            handleCheckboxChange(setActiveBrands, b)
                          }
                          className="w-4 h-4 accent-[#047857]"
                        />
                        <span
                          className={`text-[11px] font-bold uppercase transition-colors ${activeBrands.includes(b) ? "text-[#047857]" : "text-gray-600"}`}
                        >
                          {b}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {(activeCategoryName ||
                activePrices.length > 0 ||
                activeBrands.length > 0) && (
                <button
                  onClick={() => {
                    setActiveCategoryName(null);
                    setActivePrices([]);
                    setActiveBrands([]);
                  }}
                  className="w-full mt-4 bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-md text-xs font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          </aside>

          <main className="flex-1 bg-white p-6 border border-gray-200 shadow-sm border-t-4 border-t-[#047857] flex flex-col rounded-lg">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
              <h1 className="text-base font-bold text-gray-800 uppercase tracking-tight">
                {activeCategoryName || (typeQuery === "new" ? "Sản phẩm mới nhập" : typeQuery === "hot" ? "Bán chạy nhất" : "Tất cả sản phẩm")}
                <span className="text-gray-400 text-xs ml-2 font-normal">
                  ({safeProducts.length} sản phẩm)
                </span>
              </h1>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-1.5 bg-gray-50 text-xs font-bold uppercase focus:outline-none cursor-pointer"
              >
                <option>Mặc định</option>
                <option>Giá tăng dần</option>
                <option>Giá giảm dần</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-[#047857] border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-[#047857] font-bold uppercase text-[10px] tracking-widest">
                  Đang tải hàng...
                </p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-20 italic text-gray-400 bg-gray-50 rounded-xl font-bold uppercase text-xs">
                Không tìm thấy sản phẩm phù hợp.
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 flex-1 content-start pb-10">
                {currentItems.map((p) => {
                  const price = getProductPrice(p);
                  const originalPrice = parseFloat(p.price_bag_25kg) || parseFloat(p.price_bag_50kg) || parseFloat(p.price_bag) || price;
                  const hasSale = price < originalPrice && originalPrice > 0;
                  const salePct = hasSale ? Math.round((1 - price / originalPrice) * 100) : 0;
                  return (
                    <div
                      key={p._id}
                      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#047857] hover:shadow-lg transition-all flex flex-col group relative"
                    >
                      {hasSale && (
                        <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                          -{salePct}%
                        </span>
                      )}
                      <Link to={`/products/${p._id}`} className="block">
                        <div className="h-36 bg-gray-50 flex items-center justify-center overflow-hidden p-3">
                          <img
                            src={`${IMAGE_URL}/${p.image}`}
                            alt={p.name}
                            className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150"; }}
                          />
                        </div>
                      </Link>
                      <div className="p-3 flex flex-col flex-1">
                        <Link to={`/products/${p._id}`}>
                          <h3 className="text-[11px] font-bold text-gray-700 group-hover:text-[#047857] line-clamp-2 uppercase leading-tight mb-2 min-h-[2.5rem]">
                            {p.name}
                          </h3>
                        </Link>
                        <div className="mt-auto">
                          {hasSale && (
                            <p className="text-[10px] text-gray-400 line-through leading-none">
                              {originalPrice.toLocaleString()}đ
                            </p>
                          )}
                          <p className={`text-[15px] font-black leading-tight mb-2 ${hasSale ? "text-red-600" : "text-[#047857]"}`}>
                            {price.toLocaleString()}đ
                          </p>
                          <button
                            onClick={(e) => { e.preventDefault(); handleAddToCart(p); }}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#047857] hover:bg-[#fbc02d] hover:text-gray-900 text-white py-2 rounded-xl text-[11px] font-bold uppercase transition-colors active:scale-95"
                          >
                            <ShoppingCart size={13} /> Thêm vào giỏ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-auto pt-8 border-t border-gray-50">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 rounded-full hover:border-[#047857] disabled:opacity-30"
                >
                  ‹
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-black transition-all ${currentPage === i + 1 ? "bg-[#047857] text-white shadow-lg scale-110" : "bg-gray-50 text-gray-500 hover:bg-green-50"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 rounded-full hover:border-[#047857] disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
};
