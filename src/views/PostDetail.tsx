import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { productService } from "../controllers/productService";
import { useCartStore } from "../store/cartStore";
import { toast } from "sonner";
import { IMAGE_URL } from '../utils/config';

export const ProductDetail = () => {
  const { id } = useParams();
  const [p, setP] = useState<any>(null);
  const [unit, setUnit] = useState<'bag' | 'kg'>('bag');
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (id) {
      productService.getById(id).then(setP).catch(console.error);
    }
  }, [id]);

  if (!p) return <div className="min-h-screen flex items-center justify-center font-black text-[#047857] animate-pulse uppercase tracking-widest">Đang tải chi tiết sản phẩm...</div>;

  const currentPrice = unit === 'bag' ? (parseFloat(p.price_bag) || 0) : (parseFloat(p.price_kg) || 0);

  return (
    <>
      <Header />
      <main className="max-w-[1200px] mx-auto px-10 py-16 flex flex-col md:flex-row gap-16">
        <div className="md:w-1/2 border-4 border-dashed border-[#047857]/10 rounded-[50px] p-12 flex justify-center bg-gray-50 overflow-hidden relative group">
          <div className="absolute top-8 left-8 bg-[#facc15] text-gray-900 font-black px-4 py-2 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg z-10">Sản phẩm uy tín</div>
          <img 
            src={`${IMAGE_URL}/${p.image}`} 
            className="max-h-[450px] object-contain group-hover:scale-110 transition duration-700" 
            alt={p.name} 
          />
        </div>

        <div className="md:w-1/2 flex flex-col justify-center">
          <h1 className="text-5xl font-black text-gray-800 mb-6 uppercase tracking-tighter italic leading-none">{p.name}</h1>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em] mb-10">Danh mục: <span className="text-[#047857]">{p.categoryId?.name || "Nông sản"}</span></p>
          
          <div className="flex gap-4 mb-10">
            <button onClick={() => setUnit('bag')} className={`flex-1 py-4 border-2 rounded-[25px] font-black uppercase text-xs tracking-widest transition-all ${unit === 'bag' ? 'bg-[#047857] text-white border-[#047857] shadow-xl scale-105' : 'text-gray-400 border-gray-100 hover:border-[#047857]'}`}>MUA THEO BAO</button>
            <button onClick={() => setUnit('kg')} className={`flex-1 py-4 border-2 rounded-[25px] font-black uppercase text-xs tracking-widest transition-all ${unit === 'kg' ? 'bg-[#047857] text-white border-[#047857] shadow-xl scale-105' : 'text-gray-400 border-gray-100 hover:border-[#047857]'}`}>MUA LẺ THEO KÝ</button>
          </div>

          <div className="bg-gray-50 p-8 rounded-[40px] mb-10 border border-gray-100 shadow-inner">
             <p className="text-7xl font-black text-red-600 tracking-tighter leading-none">{currentPrice.toLocaleString()}đ</p>
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-4 italic">* Đã bao gồm thuế và phí vận chuyển nội tỉnh</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex border-4 border-gray-100 rounded-full overflow-hidden h-16 bg-white shadow-sm">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-8 font-black text-xl hover:bg-gray-50 transition"> - </button>
              <span className="flex items-center font-black text-2xl px-4 min-w-[60px] justify-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-8 font-black text-xl hover:bg-gray-50 transition"> + </button>
            </div>
            
            <button 
              onClick={() => {
                addItem({ ...p, price: currentPrice, quantity: qty, unit, _id: `${p._id}-${unit}` });
                toast.success(`Đã thêm "${p.name}" vào giỏ hàng!`, { duration: 2500 });
              }} 
              className="flex-1 bg-[#047857] text-white py-5 rounded-full font-black text-xl uppercase shadow-2xl hover:bg-black transition-all transform active:scale-95"
            >
              Thêm vào giỏ 🛒
            </button>
          </div>
        </div>
      </main>
      
      <section className="max-w-[1200px] mx-auto px-10 pb-24">
         <h2 className="text-2xl font-black text-gray-800 uppercase italic mb-8 border-b-4 border-[#facc15] w-fit pb-2">Mô tả sản phẩm</h2>
         <div className="bg-gray-50 p-10 rounded-[40px] text-gray-600 leading-loose font-medium border border-gray-100">
            {p.description || "Đang cập nhật thông tin chi tiết cho sản phẩm này..."}
         </div>
      </section>
      <Footer />
    </>
  );
};