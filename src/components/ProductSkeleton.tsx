// src/components/ProductSkeleton.tsx
import React from 'react';

export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-pulse">
      {/* Khung ảnh sản phẩm (Vuông) */}
      <div className="w-full aspect-square bg-gray-200"></div>
      
      {/* Khung nội dung */}
      <div className="p-4 flex flex-col gap-3 flex-grow">
        {/* Tiêu đề (2 dòng) */}
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        
        {/* Khung Giá tiền & Nút giỏ hàng */}
        <div className="mt-auto pt-4 flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};