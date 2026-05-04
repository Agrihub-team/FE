import { Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { toast } from "sonner";
import { IMAGE_URL } from '../utils/config';

export const ProductCard = ({ p, product, onAdd }: { p?: any; product?: any; onAdd?: (item: any) => void }) => {
  const item = p || product;
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAdd) { onAdd(item); return; }
    const price25 = parseFloat(item.price_bag_25kg) || parseFloat(item.price_bag) || 0;
    addItem({
      _id: `${item._id}-${Date.now()}`,
      originalId: item._id,
      name: item.name,
      image: item.image,
      q25: 1, p25: price25,
      q50: 0, p50: 0,
      qKg: 0, pKg: 0,
    });
    toast.success(`Đã thêm "${item.name}" vào giỏ hàng!`, { duration: 2500 });
  };

  const price = parseFloat(item.price_bag_25kg) || parseFloat(item.price_bag) || 0;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 hover:border-emerald-500 hover:shadow-2xl transition-all group flex flex-col h-full">
      <Link to={`/products/${item._id}`} className="flex-1">
        <div className="h-52 w-full flex items-center justify-center overflow-hidden rounded-2xl mb-5 bg-gray-50">
          <img
            src={`${IMAGE_URL}/${item.image}`}
            className="h-full w-full object-contain group-hover:scale-110 transition-transform"
            alt={item.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/150?text=No+Image";
            }}
          />
        </div>
        <h3 className="font-bold text-base text-gray-800 line-clamp-2 mb-3">
          {item.name}
        </h3>
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
