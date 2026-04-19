import { Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export const ProductCard = ({ p }: { p: any }) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    const price25 = parseFloat(p.price_bag_25kg) || parseFloat(p.price_bag) || 0;

    // Tạo ID duy nhất mỗi lần thêm để không gộp
    const uniqueId = `${p._id}-${Date.now()}`;

    addItem({
      _id: uniqueId,
      originalId: p._id,
      name: p.name,
      image: p.image,
      q25: 1,                    
      p25: price25,
      q50: 0,
      p50: 0,
      qKg: 0,
      pKg: 0
    });

    alert(`✅ Đã thêm ${p.name} (1 bao 25kg) vào giỏ hàng!`);
  };

  const price = parseFloat(p.price_bag_25kg) || parseFloat(p.price_bag) || 0;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 hover:border-emerald-500 hover:shadow-2xl transition-all group flex flex-col h-full">
      <Link to={`/products/${p._id}`} className="flex-1">
        <div className="h-52 flex items-center justify-center overflow-hidden rounded-2xl mb-5 bg-gray-50">
          <img 
            src={`http://localhost:3001/images/products/${p.image}`} 
            className="max-h-full object-contain group-hover:scale-110 transition-transform" 
            alt={p.name}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'; }}
          />
        </div>
        <h3 className="font-bold text-base text-gray-800 line-clamp-2 mb-3">{p.name}</h3>
        <p className="text-2xl font-black text-emerald-600">
          {price.toLocaleString()}đ
        </p>
      </Link>

      <button
        onClick={handleAddToCart}
        className="mt-6 w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl transition-all active:scale-95"
      >
        THÊM VÀO GIỎ
      </button>
    </div>
  );
};