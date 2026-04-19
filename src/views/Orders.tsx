import { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { orderService } from '../controllers/orderService';
import { Order } from '../models/order';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuthStore } from '../store/authStore';

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Lấy thông tin user từ store
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderService.getAll();
        setOrders(data);
      } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };

    // ✅ Chỉ gọi API xuống MongoDB khi đã chắc chắn có user
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Đơn hàng của bạn</h1>
          {orders.length === 0 ? (
            <p className="text-gray-600">Bạn chưa có đơn hàng nào</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Mã đơn: {order.orderCode || order._id}</h3>
                      <p className="text-gray-600 text-sm">
                        Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded text-white font-semibold ${
                      order.status === 'delivered' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {order.status === 'delivered' ? 'Đã giao' : order.status === 'shipping' ? 'Đang giao' : 'Đang xử lý'}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-bold text-right text-lg text-[#047857]">
                      Tổng tiền: {(order.totalAmount || 0).toLocaleString()}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};