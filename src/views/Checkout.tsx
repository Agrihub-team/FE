// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Truck,
  Zap,
  CreditCard,
  Wallet,
  MapPin,
  ChevronRight,
  Loader2,
  Trash2,
  Tag,
  Info,
} from "lucide-react";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useCartStore } from "../store/cartStore";
import { apiClient } from "../utils/api";

import { AGRI_LOCATIONS, calcShipping, isFastAvailable, SHIP_TIERS, getShipTier } from "../utils/locations";
import { IMAGE_URL } from '../utils/config';

export const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getSelectedTotal, clearCart, clearSelectedItems } = useCartStore();
  const selectedItems = items.filter((i) => i.selected);

  const [formData, setFormData] = useState({
    receiver_name: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    street: "",
    note: "",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [shippingMethod, setShippingMethod] = useState("STANDARD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(location.state?.voucher || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSelectedAddressId("");

    if (name === "province")
      setFormData((prev) => ({ ...prev, district: "", ward: "" }));
    if (name === "district") setFormData((prev) => ({ ...prev, ward: "" }));
  };

  const handleSelectSavedAddress = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (!id)
      return setFormData({
        receiver_name: "",
        phone: "",
        province: "",
        district: "",
        ward: "",
        street: "",
        note: "",
      });

    const addr = savedAddresses.find((a) => a._id === id);
    if (addr) setFormData({ ...addr, note: "" });
  };

  const handleDeleteAddress = async () => {
    if (!selectedAddressId) return;
    if (!window.confirm("Xóa địa chỉ này?")) return;
    try {
      await apiClient.delete(`/addresses/${selectedAddressId}`);
      toast.success("Đã xóa địa chỉ!");
      setSavedAddresses((prev) =>
        prev.filter((a) => a._id !== selectedAddressId),
      );
      setSelectedAddressId("");
      setFormData({
        receiver_name: "",
        phone: "",
        province: "",
        district: "",
        ward: "",
        street: "",
        note: "",
      });
    } catch (err) {
      toast.error("Xóa địa chỉ thất bại!");
    }
  };

  useEffect(() => {
    if (selectedItems.length === 0) return navigate("/cart");
    window.scrollTo(0, 0);

    const loadUserData = async () => {
      try {
        const rawUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userStored = rawUser.user ? rawUser.user : rawUser;

        const [addrRes, voucherRes] = await Promise.all([
          apiClient.get("/addresses").catch(() => []),
          apiClient.get("/vouchers").catch(() => []),
        ]);
        const listAddr = Array.isArray(addrRes) ? addrRes : addrRes?.data || [];
        setSavedAddresses(listAddr);
        const allVouchers = Array.isArray(voucherRes) ? voucherRes : voucherRes?.data || [];
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        setVouchers(allVouchers.filter((v: any) =>
          (!v.applicableProducts || v.applicableProducts.length === 0) &&
          (v.quantity == null || v.quantity > 0) &&
          (!v.startDate || new Date(v.startDate) < tomorrow) &&
          (!v.endDate || new Date(v.endDate) >= today)
        ));

        const defaultAddr =
          listAddr.find((a: any) => a.is_default) || listAddr[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
          setFormData({ ...defaultAddr, note: "" });
        } else if (userStored) {
          setFormData((prev) => ({
            ...prev,
            receiver_name: userStored.fullname || "",
            phone: userStored.phone || "",
          }));
        }
      } catch (err) {
        console.error("Lỗi tải thông tin:", err);
      }
    };
    loadUserData();
  }, [navigate, selectedItems.length]);

  const availableDistricts = useMemo(() => {
    const prov = AGRI_LOCATIONS.find((p) => p.name === formData.province);
    return prov ? prov.districts.map((d) => d.name) : [];
  }, [formData.province]);

  const availableWards = useMemo(() => {
    const prov = AGRI_LOCATIONS.find((p) => p.name === formData.province);
    if (prov && formData.district) {
      const dist = prov.districts.find((d) => d.name === formData.district);
      return dist ? dist.wards : [];
    }
    return [];
  }, [formData.province, formData.district]);

  const selectedDistrict = useMemo(() => {
    const prov = AGRI_LOCATIONS.find((p) => p.name === formData.province);
    if (prov && formData.district) {
      return prov.districts.find((d) => d.name === formData.district) ?? null;
    }
    return null;
  }, [formData.province, formData.district]);

  const distanceKm = selectedDistrict?.km ?? -1;

  const subTotal = getSelectedTotal();
  const totalWeight = selectedItems.reduce(
    (acc, i) => acc + Number(i.q25) * 25 + Number(i.q50) * 50 + Number(i.qKg),
    0,
  );

  const shipFeeStd =
    formData.district && distanceKm >= 0
      ? calcShipping(distanceKm, totalWeight, false)
      : null;
  const shipFeeFast =
    formData.district && distanceKm >= 0
      ? calcShipping(distanceKm, totalWeight, true)
      : null;

  const shippingFee =
    shippingMethod === "FAST"
      ? shipFeeFast !== null && shipFeeFast >= 0
        ? shipFeeFast
        : 0
      : shipFeeStd !== null && shipFeeStd >= 0
      ? shipFeeStd
      : 0;

  const shipError: string | null = !formData.district
    ? null
    : shipFeeStd === -1
    ? "Địa chỉ giao hàng ngoài vùng phục vụ"
    : shipFeeStd === -2
    ? `Đơn hàng tối thiểu ${getShipTier(distanceKm)?.minKg ?? ""}kg để giao đến khu vực này`
    : null;

  const fastOK = formData.district
    ? isFastAvailable(distanceKm, totalWeight)
    : false;

  const shippingDetail: string | null = (() => {
    if (!formData.district || distanceKm < 0 || shipError) return null;
    const tier = getShipTier(distanceKm);
    if (!tier) return null;
    const isFast = shippingMethod === "FAST";
    const fee = isFast ? shipFeeFast : shipFeeStd;
    const zoneLabel = distanceKm === 0 ? "Quận 12" : `${distanceKm}km`;

    if (fee === 0) {
      return `${zoneLabel} · ${totalWeight}kg · Miễn phí (≥${tier.freeKg.toLocaleString()}kg)`;
    }
    if (tier.flatFee !== null) {
      if (isFast && totalWeight >= tier.freeKg) {
        return `Hỏa tốc · ${zoneLabel} · ${totalWeight}kg · 750đ/kg`;
      }
      const rateStr = isFast
        ? `${tier.flatFee.toLocaleString()}đ × 1.5`
        : `${tier.flatFee.toLocaleString()}đ cố định`;
      return `${isFast ? "Hỏa tốc · " : ""}${zoneLabel} · ${totalWeight}kg · ${rateStr}`;
    }
    const perKg = tier.perKg as number;
    if (isFast) {
      return `Hỏa tốc · ${zoneLabel} · ${totalWeight}kg · ${perKg.toLocaleString()}đ/kg × 1.5`;
    }
    return `${zoneLabel} · ${totalWeight}kg · ${perKg.toLocaleString()}đ/kg`;
  })();

  const voucherDiscount = selectedVoucher && subTotal >= selectedVoucher.minAmount
    ? (selectedVoucher.type === 'percentage'
        ? Math.round(subTotal * Math.min(100, Number(selectedVoucher.discount)) / 100)
        : Number(selectedVoucher.discount) || 0)
    : 0;

  const finalTotal = subTotal + shippingFee - voucherDiscount;

  useEffect(() => {
    if (!fastOK && shippingMethod === "FAST") setShippingMethod("STANDARD");
  }, [fastOK, shippingMethod]);

  const onPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // ===== DEBUG LOG =====
    console.log("=== BẮT ĐẦU ĐẶT HÀNG ===");
    console.log("Payment method:", paymentMethod);
    // =====================

    if (!formData.receiver_name)
      return toast.error("Vui lòng nhập họ tên người nhận!");
    if (!formData.phone) return toast.error("Vui lòng nhập số điện thoại!");
    if (!formData.province) return toast.error("Vui lòng chọn Tỉnh/Thành phố!");
    if (!formData.district) return toast.error("Vui lòng chọn Quận/Huyện!");
    if (!formData.ward) return toast.error("Vui lòng chọn Phường/Xã!");
    if (!formData.street) return toast.error("Vui lòng nhập địa chỉ cụ thể!");
    console.log("=== FORM DATA ===", formData);

    setIsSubmitting(true);
    try {
      if (!selectedAddressId)
        await apiClient
          .post("/addresses", { ...formData, is_default: true })
          .catch(() => {});

      const cleanItems = selectedItems.map((i: any) => {
        let productId = i.originalId || i.product?._id || i._id || "";
        if (typeof productId === "string" && productId.includes("-"))
          productId = productId.split("-")[0];

        return {
          product: productId,
          q25: Number(i.q25) || 0,
          q50: Number(i.q50) || 0,
          qKg: Number(i.qKg) || 0,
          itemVoucher: i.itemVoucher || null,
        };
      });

      const voucherCode = selectedVoucher?.code || undefined;

      const response = await apiClient.post("/orders", {
        items: cleanItems,
        addressData: { ...formData },
        paymentMethod,
        shippingMethod,
        shippingFee,
        voucherCode,
        orderNotes: formData.note || "",
      });

      // ===== DEBUG LOG =====
      console.log("=== RESPONSE ===", response);
      const result = response?.data || response;
      console.log("=== RESULT ===", result);
      console.log("=== vnpUrl ===", result?.vnpUrl);
      // =====================

      if (paymentMethod === "VNPAY" && result?.vnpUrl) {
        toast.success("Đang chuyển đến trang thanh toán VNPay...");
        window.location.href = result.vnpUrl;
      } else {
        await clearSelectedItems();
        toast.success("Đặt hàng thành công!");
        navigate(`/order-success/${result?.order?._id}`);
      }
    } catch (err: any) {
      console.error("=== LỖI ĐẶT HÀNG ===", err);
      toast.error(err.message || "Lỗi khi đặt hàng!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800">
        <form
          onSubmit={onPlaceOrder}
          className="max-w-[1200px] mx-auto px-4 md:px-6"
        >
          <div className="py-6 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
            <Link to="/cart" className="hover:text-[#047857]">
              Giỏ hàng
            </Link>{" "}
            <ChevronRight size={14} />{" "}
            <span className="text-[#047857]">Thanh toán</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-200">
                <h3 className="text-[15px] font-bold uppercase mb-5 flex items-center gap-2 border-b pb-3">
                  <MapPin size={18} className="text-[#047857]" /> Thông tin nhận
                  hàng
                </h3>

                {savedAddresses.length > 0 && (
                  <div className="mb-5 bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex gap-2 min-w-0 overflow-hidden">
                    <select
                      value={selectedAddressId}
                      onChange={handleSelectSavedAddress}
                      className="flex-1 min-w-0 w-0 px-3 py-2 bg-white rounded-md border border-emerald-200 outline-none text-sm font-semibold text-slate-700 cursor-pointer focus:border-[#047857]"
                    >
                      <option value="">+ Nhập địa chỉ mới bên dưới</option>
                      {savedAddresses.map((addr) => {
                        const fullStr = `${addr.receiver_name} - ${addr.phone} - ${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`;
                        const displayStr =
                          fullStr.length > 60
                            ? fullStr.substring(0, 60) + "..."
                            : fullStr;
                        return (
                          <option key={addr._id} value={addr._id}>
                            {displayStr}
                          </option>
                        );
                      })}
                    </select>
                    {selectedAddressId && (
                      <button
                        type="button"
                        onClick={handleDeleteAddress}
                        className="px-3 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0 overflow-hidden">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">
                      Họ tên người nhận *
                    </label>
                    <input
                      name="receiver_name"
                      value={formData.receiver_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">
                      Số điện thoại *
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full min-w-0 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-xs font-semibold overflow-hidden text-ellipsis"
                    >
                      <option value="">Tỉnh/Thành</option>
                      {AGRI_LOCATIONS.map((p, idx) => (
                        <option key={`prov-${idx}`} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      disabled={!formData.province}
                      className="w-full min-w-0 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-xs font-semibold disabled:opacity-50 overflow-hidden text-ellipsis"
                    >
                      <option value="">Quận/Huyện</option>
                      {availableDistricts.map((d, idx) => (
                        <option key={`dist-${idx}`} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <select
                      name="ward"
                      value={formData.ward}
                      onChange={handleChange}
                      disabled={!formData.district}
                      className="w-full min-w-0 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-xs font-semibold disabled:opacity-50 overflow-hidden text-ellipsis"
                    >
                      <option value="">Phường/Xã</option>
                      {availableWards.map((w, idx) => (
                        <option key={`ward-${idx}`} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">
                      Địa chỉ chi tiết *
                    </label>
                    <input
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Số nhà, tên đường..."
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">
                      Ghi chú giao hàng
                    </label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:border-[#047857] outline-none text-sm font-semibold resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-5 border-b border-slate-50 pb-3">
                  <h3 className="text-[15px] font-bold uppercase">
                    Sản phẩm thanh toán ({selectedItems.length})
                  </h3>
                  <Link
                    to="/cart"
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-[#047857] transition-colors"
                  >
                    <ChevronRight size={13} className="rotate-180" /> Sửa giỏ hàng
                  </Link>
                </div>
                <div className="space-y-4">
                  {selectedItems.map((item) => {
                    const rawPrice =
                      item.q25 * item.p25 +
                      item.q50 * item.p50 +
                      item.qKg * item.pKg;
                    const discount = item.itemVoucher?.discount || 0;
                    const finalPrice = Math.max(0, rawPrice - discount);

                    return (
                      <div
                        key={item._id}
                        className="flex flex-col border-b border-slate-50 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-lg p-2 border border-slate-100 shrink-0">
                            <img
                              src={`${IMAGE_URL}/${item.image}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-800 uppercase line-clamp-1">
                              {item.name}
                            </h4>
                            <div className="text-[10px] text-slate-500 mt-1 space-x-2">
                              {item.q25 > 0 && <span>25kg: x{item.q25}</span>}
                              {item.q50 > 0 && <span>50kg: x{item.q50}</span>}
                              {item.qKg > 0 && <span>Lẻ: {item.qKg}kg</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            {discount > 0 && (
                              <p className="text-[10px] text-slate-400 line-through mb-0.5">
                                {rawPrice.toLocaleString()}đ
                              </p>
                            )}
                            <p className="text-sm font-bold text-[#047857]">
                              {finalPrice.toLocaleString()}đ
                            </p>
                          </div>
                        </div>

                        {discount > 0 && item.itemVoucher && (
                          <div className="mt-2 ml-20 flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 w-fit">
                            <Tag size={12} className="text-yellow-600" />
                            <span className="text-[10px] text-yellow-700 font-semibold">
                              Mã{" "}
                              <b className="uppercase">
                                {item.itemVoucher.code}
                              </b>
                              : Giảm {discount.toLocaleString()}đ
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 sticky top-6">
              <div className="bg-white rounded-xl p-5 md:p-6 shadow-md border-t-4 border-[#047857]">
                <h3 className="text-sm font-bold uppercase text-center mb-5 border-b pb-3">
                  TỔNG KẾT ĐƠN
                </h3>

                {/* Voucher đổi lần cuối */}
                {vouchers.length > 0 && (
                  <div className="mb-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Tag size={11} className="text-yellow-600" /> Mã giảm giá
                    </p>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-emerald-600 [&::-webkit-scrollbar-thumb]:rounded">
                      {vouchers.map((v: any) => {
                        const active = selectedVoucher?._id === v._id;
                        const canUse = subTotal >= (v.minAmount || 0);
                        return (
                          <button
                            key={v._id}
                            type="button"
                            disabled={!canUse}
                            onClick={() => setSelectedVoucher(active ? null : v)}
                            className={`w-full text-left px-3 py-2 rounded-lg border text-[10px] transition-all flex justify-between items-center ${active ? "bg-yellow-50 border-yellow-400 text-yellow-800 font-bold" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-yellow-400"} ${!canUse ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <span className="font-bold uppercase">{active && "✓ "}{v.code}</span>
                            <span>
                              -{v.type === 'percentage'
                                ? `${Number(v.discount)}%`
                                : `${Number(v.discount).toLocaleString()}đ`}
                              {' · từ '}{Number(v.minAmount).toLocaleString()}đ
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Chính sách phí ship */}
                <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700 flex items-center gap-1">
                    <Info size={11} /> Chính sách vận chuyển
                  </p>
                  {SHIP_TIERS.map((t, i) => (
                    <p key={i}>
                      {i === 0
                        ? `Nội thành HCM: cố định 50,000đ · Từ ${t.freeKg}kg: Miễn phí`
                        : `≤${t.maxKm}km: tối thiểu ${t.minKg}kg · ${(t.perKg as number).toLocaleString()}đ/kg · Từ ${t.freeKg.toLocaleString()}kg: Miễn phí`}
                    </p>
                  ))}
                  <p className="text-orange-600 font-semibold">⚡ Hỏa tốc (≤80km, ≤500kg): phí × 1.5</p>
                </div>

                {shipError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    {shipError}
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <div
                    onClick={() => setShippingMethod("STANDARD")}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${shippingMethod === "STANDARD" ? "border-[#047857] bg-emerald-50" : "bg-slate-50"}`}
                  >
                    <Truck
                      size={18}
                      className={
                        shippingMethod === "STANDARD"
                          ? "text-[#047857]"
                          : "text-slate-400"
                      }
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase">
                        Tiêu chuẩn
                      </span>
                      <span className={`text-[10px] font-bold ${shipFeeStd === 0 ? "text-emerald-600" : shipFeeStd !== null && shipFeeStd < 0 ? "text-red-500" : "text-[#047857]"}`}>
                        {shipFeeStd === null
                          ? "—"
                          : shipFeeStd === 0
                          ? "Miễn phí"
                          : shipFeeStd < 0
                          ? "Không giao được"
                          : `${shipFeeStd.toLocaleString()}đ`}
                      </span>
                    </div>
                  </div>
                  {fastOK && (
                    <div
                      onClick={() => setShippingMethod("FAST")}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${shippingMethod === "FAST" ? "border-orange-500 bg-orange-50" : "bg-slate-50"}`}
                    >
                      <Zap
                        size={18}
                        className={
                          shippingMethod === "FAST"
                            ? "text-orange-600"
                            : "text-slate-400"
                        }
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-orange-600">
                          Hỏa tốc
                        </span>
                        <span className="text-[10px] font-bold text-orange-600">
                          {shipFeeFast === null
                            ? "—"
                            : `${shipFeeFast.toLocaleString()}đ`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div
                    onClick={() => setPaymentMethod("COD")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === "COD" ? "border-[#047857] bg-[#047857] text-white" : "bg-slate-50 text-slate-500"}`}
                  >
                    <Wallet size={16} />
                    <span className="text-[10px] font-bold uppercase">
                      Tiền mặt
                    </span>
                  </div>
                  <div
                    onClick={() => setPaymentMethod("VNPAY")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === "VNPAY" ? "border-[#047857] bg-[#047857] text-white" : "bg-slate-50 text-slate-500"}`}
                  >
                    <CreditCard size={16} />
                    <span className="text-[10px] font-bold uppercase">
                      VNPay
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 border-t pt-4 border-dashed text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span className="font-semibold">Tiền hàng:</span>
                    <span className="text-slate-800 font-bold">
                      {subTotal.toLocaleString()}đ
                    </span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold flex items-center gap-1">
                        <Tag size={13} className="text-yellow-600" />
                        Mã <b className="text-yellow-700 uppercase">{selectedVoucher?.code}</b>:
                      </span>
                      <span className="font-bold text-red-500">
                        -{voucherDiscount.toLocaleString()}đ
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-semibold flex items-center gap-1.5">
                        Phí vận chuyển:
                        {shippingMethod === "FAST" && (
                          <span className="inline-flex items-center gap-0.5 bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                            <Zap size={9} /> Hỏa tốc
                          </span>
                        )}
                      </span>
                      <span className={`font-bold ${shipError ? "text-red-500" : shippingFee === 0 && formData.district ? "text-emerald-600" : "text-slate-800"}`}>
                        {!formData.district
                          ? "Chưa chọn địa chỉ"
                          : shipError
                          ? "Lỗi địa chỉ"
                          : shippingFee === 0
                          ? "Miễn phí"
                          : `+${shippingFee.toLocaleString()}đ`}
                      </span>
                    </div>
                    {shippingDetail && (
                      <p className="text-[10px] text-slate-400 font-medium text-right">
                        {shippingDetail}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-bold uppercase">
                      Tổng thanh toán:
                    </span>
                    <span className="text-2xl font-black text-[#047857]">
                      {finalTotal.toLocaleString()}đ
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !!shipError}
                  className={`w-full py-4 rounded-lg font-bold uppercase transition-all flex items-center justify-center gap-2 ${isSubmitting || shipError ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-[#047857] text-white hover:bg-[#035b42]"}`}
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin" size={18} />
                  )}
                  {isSubmitting ? "ĐANG LƯU ĐƠN..." : "XÁC NHẬN ĐẶT HÀNG"}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 opacity-40 italic">
                  <Info size={12} />
                  <span className="text-[10px] font-bold">
                    Thanh toán an toàn cùng Agri-Hub
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
};
