import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const NewsPage = () => {
  const newsList = [
    { id: 1, title: "Công dụng của gạo lứt tím hữu cơ và cách nấu gạo lứt tím", date: "Thứ Bảy, 20/04/2024", img: "image1.png", desc: "Gạo lứt tím là một loại gạo được chế biến từ các hạt gạo nguyên cám có màu tím đặc trưng..." },
    { id: 2, title: "Hướng dẫn cách làm salad dưa chuột thanh mát, bổ dưỡng cho ngày hè", date: "Thứ Bảy, 20/04/2024", img: "image2.png", desc: "Salad dưa chuột là món ăn rất được yêu thích vào ngày hè vì có tính thanh mát, bổ dưỡng..." },
    { id: 3, title: "Công dụng của tỏi ngâm mật ong?", date: "Thứ Bảy, 20/04/2024", img: "image3.png", desc: "Tỏi và mật ong đều là những gia vị phổ biến có trong mọi căn bếp. Thế nhưng, ít ai..." },
    { id: 4, title: "10 Công dụng của khoai tây bạn nhất định phải biết", date: "Thứ Bảy, 20/04/2024", img: "image4.png", desc: "Khoai tây là thực phẩm được sử dụng rộng rãi để chế biến các món ăn từ Á sang Âu..." },
    { id: 5, title: "Ăn ớt chuông có tác dụng gì cho sức khỏe?", date: "Thứ Bảy, 20/04/2024", img: "image5.png", desc: "Ớt chuông đỏ là loại rau quả rất được yêu thích vì tác dụng tuyệt vời mà nó đem lại..." },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 w-full pt-4 pb-12">
        {/* Breadcrumb */}
        <nav className="text-gray-500 text-sm mb-6">
          <Link to="/">Trang chủ</Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-orange-500">Tin tức</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-8">
          {/* CỘT TRÁI: DANH SÁCH BÀI VIẾT */}
          <div className="flex-1">
            <div className="space-y-8">
              {newsList.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-5">
                  {/* Ảnh bài viết */}
                  <div className="w-full sm:w-64 h-44 shrink-0 overflow-hidden">
                    <Link to={`/news/${item.id}`}>
                      <img 
                        src={`/images/newpage/${item.img}`} 
                        className="w-full h-full object-cover" 
                        alt={item.title} 
                      />
                    </Link>
                  </div>

                  {/* Nội dung bài viết */}
                  <div className="flex flex-col">
                    <Link to={`/news/${item.id}`}>
                      {/* Tiêu đề: Gạch chân cố định, màu đen, không đổi màu khi hover */}
                      <h2 className="text-[15px] font-bold text-black underline decoration-1 underline-offset-2 leading-snug mb-1">
                        {item.title}
                      </h2>
                    </Link>
                    <p className="text-gray-400 text-[12px] mb-2">{item.date}</p>
                    <p className="text-[#666] text-[13px] line-clamp-2 leading-relaxed mb-1">
                      {item.desc}
                    </p>
                    <Link to={`/news/${item.id}`} className="text-[13px] font-bold text-black underline decoration-1 underline-offset-2">
                      Đọc tiếp
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Phân trang chuẩn hình mẫu */}
            <div className="flex justify-center gap-2 mt-12">
              <button className="w-8 h-8 flex items-center justify-center bg-[#008848] text-white text-xs rounded-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center bg-[#f1f1f1] text-gray-600 text-xs rounded-sm">2</button>
            </div>
          </div>

          {/* CỘT PHẢI: SIDEBAR */}
          <div className="w-full md:w-72 space-y-8">
            {/* Search */}
            <div className="flex">
              <input type="text" placeholder="Tìm kiếm bài viết..." className="flex-grow border border-gray-300 p-2 text-sm outline-none" />
              <button className="bg-[#008848] text-white px-3 flex items-center justify-center">🔍</button>
            </div>

            {/* Bài viết mới */}
            <div className="border border-gray-200">
              <div className="bg-[#008848] p-2">
                <h3 className="text-white font-bold text-sm uppercase">Bài viết mới</h3>
              </div>
              <div className="p-3 space-y-4">
                {newsList.slice(0, 3).map(n => (
                  <div key={n.id} className="flex gap-3 border-b border-dashed border-gray-200 pb-3 last:border-0">
                    <img src={`/images/newpage/${n.img}`} className="w-16 h-12 object-cover shrink-0" alt="thumb" />
                    <p className="text-[12px] font-medium leading-tight text-black line-clamp-2">
                      {n.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags chuẩn hình mẫu mới nhất */}
            <div className="border border-gray-200">
              <div className="bg-[#008848] p-2">
                <h3 className="text-white font-bold text-sm uppercase">TAGS</h3>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {["Măng tây", "salad", "Sức khỏe", "Công dụng của khoai tây"].map((tag) => (
                  <span key={tag} className="border border-gray-300 px-3 py-1 text-[13px] text-black font-bold rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};