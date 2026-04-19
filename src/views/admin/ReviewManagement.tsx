import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Review } from '../../models/review';
import { reviewService } from '../../controllers/reviewService';

export const ReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    // Nếu chưa có API lấy tất cả review, bạn có thể mock data
    // Hoặc thêm endpoint vào backend
    setReviews([]);
  };

  const handleApprove = async (id: string) => {
    try {
      await reviewService.approve(id);
      alert('Phê duyệt thành công!');
      fetchReviews();
    } catch (error) {
      alert('Lỗi khi phê duyệt');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Quản lý đánh giá</h1>

        {reviews.length === 0 ? (
          <p className="text-gray-600">Chưa có đánh giá nào</p>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Sản phẩm</th>
                  <th className="px-6 py-3 text-left">Rating</th>
                  <th className="px-6 py-3 text-left">Bình luận</th>
                  <th className="px-6 py-3 text-left">Trạng thái</th>
                  <th className="px-6 py-3 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">⭐ {review.rating}/5</td>
                    <td className="px-6 py-4 truncate">{review.comment}</td>
                    <td className="px-6 py-4">{review.status}</td>
                    <td className="px-6 py-4">
                      {review.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(review._id)}
                          className="text-green-600 hover:underline"
                        >
                          Phê duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};