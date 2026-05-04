// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const VoucherManagement = () => {
    const [vouchers, setVouchers] = useState([]);
    const [products, setProducts] = useState([]); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State cho Modal hiển thị danh sách sản phẩm chi tiết
    const [viewDetailModal, setViewDetailModal] = useState(false);
    const [selectedVoucherDetails, setSelectedVoucherDetails] = useState(null);

    const [newVoucher, setNewVoucher] = useState({
        code: '',
        discount: 0,
        minAmount: 0,
        type: 'percentage',
        description: '',
        startDate: '',
        endDate: '',
        quantity: 0,
        applicableProducts: [] 
    });

    const token = localStorage.getItem('token');

    const fetchData = async () => {
        try {
            const [vRes, pRes] = await Promise.all([
                fetch(import.meta.env.VITE_API_URL + '/vouchers' || 'http://localhost:3001/api/vouchers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/products`) 
            ]);
            
            const vData = await vRes.json();
            const pData = await pRes.json();

            if (vData.success) setVouchers(vData.data);
            if (pData.success) {
                const prodList = pData.data.products || pData.data;
                setProducts(prodList);
            }
        } catch (error) {
            toast.error("Lỗi kết nối Server hoặc Token hết hạn");
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSelectProduct = (productId) => {
        const current = newVoucher.applicableProducts;
        const updated = current.includes(productId)
            ? current.filter(id => id !== productId)
            : [...current, productId];
        setNewVoucher({ ...newVoucher, applicableProducts: updated });
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Bạn có chắc chắn muốn xóa voucher này không?")) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/vouchers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Đã xóa voucher thành công!");
                fetchData();
            } else {
                toast.error(result.message || "Không thể xóa");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống khi xóa!");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (newVoucher.discount <= 0 || newVoucher.quantity <= 0) {
            toast.error("Vui lòng nhập giá trị và số lượng lớn hơn 0");
            return;
        }

        try {
            const res = await fetch(import.meta.env.VITE_API_URL + '/vouchers' || 'http://localhost:3001/api/vouchers', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...newVoucher,
                    discount: Number(newVoucher.discount),
                    quantity: Number(newVoucher.quantity),
                    minAmount: Number(newVoucher.minAmount)
                })
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Tạo mã giảm giá thành công!");
                setIsModalOpen(false);
                setNewVoucher({
                    code: '', discount: 0, minAmount: 0, type: 'percentage',
                    description: '', startDate: '', endDate: '', quantity: 0, applicableProducts: []
                });
                fetchData();
            } else {
                toast.error(result.message || "Lỗi khi tạo voucher");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống!");
        }
    };

    // Hàm mở modal xem chi tiết sản phẩm áp dụng
    const openViewDetails = (voucher) => {
        setSelectedVoucherDetails(voucher);
        setViewDetailModal(true);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-emerald-800 uppercase italic">Hệ thống Voucher Agrihub</h2>
                    <p className="text-xs text-gray-400 font-bold">Quản lý mã giảm giá và chương trình khuyến mãi</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase hover:bg-emerald-700 transition-all shadow-lg hover:scale-105 active:scale-95"
                > + Tạo mã mới </button>
            </div>

            <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-emerald-900 text-[10px] font-black uppercase text-emerald-100">
                        <tr>
                            <th className="p-6">Mã Code</th>
                            <th>Loại</th>
                            <th>Giảm giá</th>
                            <th>Phạm vi</th>
                            <th>Còn lại</th>
                            <th>Thời hạn</th>
                            <th className="text-right p-6">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {vouchers.length > 0 ? vouchers.map((v) => (
                            <tr key={v._id} className="hover:bg-emerald-50/50 transition-colors">
                                <td className="p-6 font-black text-emerald-700">{v.code}</td>
                                <td className="text-[10px] font-black uppercase">
                                    <span className={`px-2 py-1 rounded-md ${v.type === 'percentage' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {v.type === 'percentage' ? 'Phần trăm' : 'Tiền mặt'}
                                    </span>
                                </td>
                                <td className="font-black text-gray-800">
                                    {v.discount?.toLocaleString()}{v.type === 'percentage' ? '%' : 'đ'}
                                </td>
                                <td>
                                    {/* PHẦN HIỂN THỊ PHẠM VI ÁP DỤNG */}
                                    {!v.applicableProducts || v.applicableProducts.length === 0 ? (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase italic">Toàn ngành hàng</span>
                                    ) : (
                                        <button 
                                            onClick={() => openViewDetails(v)}
                                            className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100 border border-emerald-200 transition-all"
                                        >
                                            {v.applicableProducts.length} SẢN PHẨM
                                        </button>
                                    )}
                                </td>
                                <td className="font-bold text-blue-600 text-[11px]">{v.quantity || 0} lượt</td>
                                <td className="text-[10px] font-bold text-gray-500 italic">
                                    {v.startDate ? new Date(v.startDate).toLocaleDateString('vi-VN') : 'N/A'} 
                                    <span className="mx-1 text-emerald-300">➜</span>
                                    {v.endDate ? new Date(v.endDate).toLocaleDateString('vi-VN') : 'N/A'}
                                </td>
                                <td className="p-6 text-right">
                                    <button 
                                        onClick={() => handleDelete(v._id)}
                                        className="text-red-500 font-black text-[10px] uppercase hover:underline"
                                    >Xóa vĩnh viễn</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="p-10 text-center text-gray-400 font-bold italic">Chưa có voucher nào được tạo.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL TẠO MỚI (CŨ CỦA BẠN) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <form onSubmit={handleSave} className="bg-white w-full max-w-2xl rounded-[40px] p-10 shadow-2xl overflow-y-auto max-h-[90vh] border border-white">
                        <div className="flex justify-between items-start mb-8">
                            <h3 className="text-2xl font-black text-emerald-900 uppercase italic">Thiết lập ưu đãi mới</h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-600 font-black">✕</button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Mã định danh (Code)</label>
                                <input className="w-full bg-gray-50 rounded-2xl p-4 font-black border-2 border-transparent focus:border-emerald-500 outline-none transition-all" placeholder="VÍ DỤ: KHUYENMAI2024" onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Giá trị giảm</label>
                                <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 font-black border-none outline-none" placeholder="0" onChange={(e) => setNewVoucher({...newVoucher, discount: e.target.value})} required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Số lượng lượt dùng</label>
                                <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 font-black border-none outline-none" placeholder="100" onChange={(e) => setNewVoucher({...newVoucher, quantity: e.target.value})} required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Loại hình voucher</label>
                                <select className="w-full bg-gray-50 rounded-2xl p-4 font-black border-none outline-none appearance-none" onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})}>
                                    <option value="percentage">Chiết khấu theo %</option>
                                    <option value="fixed">Trừ tiền trực tiếp (VNĐ)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Đơn tối thiểu (VNĐ)</label>
                                <input type="number" className="w-full bg-gray-50 rounded-2xl p-4 font-black border-none outline-none" placeholder="200000" onChange={(e) => setNewVoucher({...newVoucher, minAmount: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Ngày bắt đầu</label>
                                <input type="datetime-local" className="w-full bg-gray-50 rounded-2xl p-4 font-bold border-none outline-none text-[11px]" onChange={(e) => setNewVoucher({...newVoucher, startDate: e.target.value})} required />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Ngày kết thúc</label>
                                <input type="datetime-local" className="w-full bg-gray-50 rounded-2xl p-4 font-bold border-none outline-none text-[11px]" onChange={(e) => setNewVoucher({...newVoucher, endDate: e.target.value})} required />
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-emerald-50 rounded-[30px] border border-emerald-100">
                            <label className="block text-[11px] font-black uppercase text-emerald-700 mb-4 flex justify-between items-center">
                                <span>Phạm vi áp dụng</span>
                                <span className="text-[9px] bg-white px-3 py-1 rounded-full text-emerald-600">Nếu không chọn = Áp dụng toàn sàn</span>
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {products.map(p => (
                                    <label key={p._id} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${newVoucher.applicableProducts.includes(p._id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-transparent hover:border-emerald-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={newVoucher.applicableProducts.includes(p._id)}
                                                onChange={() => handleSelectProduct(p._id)}
                                            />
                                            <span className="text-[11px] font-black uppercase leading-none">{p.name}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button type="submit" className="flex-1 bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-800 transition-all">Xác nhận và Lưu</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-black text-gray-400 text-xs uppercase hover:text-gray-600">Hủy bỏ</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL MỚI: XEM CHI TIẾT SẢN PHẨM ĐƯỢC ÁP DỤNG */}
            {viewDetailModal && selectedVoucherDetails && (
                <div className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl border-b-[10px] border-emerald-600">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-emerald-900 uppercase italic">Sản phẩm áp dụng</h3>
                            <button onClick={() => setViewDetailModal(false)} className="text-gray-400 hover:text-gray-600 font-black">✕</button>
                        </div>
                        
                        <div className="mb-4 text-center bg-emerald-50 py-3 rounded-2xl border border-emerald-100">
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Mã Voucher: </span>
                            <span className="text-lg font-black text-emerald-900 uppercase italic">{selectedVoucherDetails.code}</span>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar mb-6">
                            {selectedVoucherDetails.applicableProducts.map((prodId) => {
                                // Tìm tên sản phẩm dựa vào ID
                                const product = products.find(p => p._id === prodId || p.id === prodId);
                                return (
                                    <div key={prodId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">
                                            {product ? product.name : `ID: ${prodId}`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <button 
                            onClick={() => setViewDetailModal(false)}
                            className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-emerald-800 transition-all shadow-lg"
                        > Đóng danh sách </button>
                    </div>
                </div>
            )}
        </div>
    );
};