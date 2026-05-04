export interface District {
  name: string;
  km: number;
  wards: string[];
}
export interface Province {
  name: string;
  districts: District[];
}

// ── BẢNG PHÍ SHIP (gốc: Quận 12, TP.HCM) ─────────────────────────────────
export const SHIP_TIERS = [
  { maxKm: 30,  freeKg: 200,  flatFee: 50_000, perKg: 0,    minKg: 0   },
  { maxKm: 80,  freeKg: 500,  flatFee: null,   perKg: 800,  minKg: 50  },
  { maxKm: 150, freeKg: 1000, flatFee: null,   perKg: 1200, minKg: 100 },
  { maxKm: 300, freeKg: 2000, flatFee: null,   perKg: 1800, minKg: 200 },
] as const;

export const FAST_MAX_KG = 500;

export const getShipTier = (km: number) =>
  SHIP_TIERS.find(t => km <= t.maxKm) ?? null;

/**
 * Tính phí ship.
 * -1 = ngoài vùng giao hàng (>300km)
 * -2 = chưa đủ kg tối thiểu
 *  0 = freeship
 *  n = phí (đồng)
 */
export const calcShipping = (km: number, weightKg: number, isFast: boolean): number => {
  const tier = getShipTier(km);
  if (!tier) return -1;
  if (km > 30 && weightKg < tier.minKg) return -2;

  // Freeship chỉ cho tiêu chuẩn
  if (!isFast && weightKg >= tier.freeKg) return 0;

  if (tier.flatFee !== null) {
    // Zone 0: <200kg → flat fee; ≥200kg hỏa tốc → 750đ/kg
    if (isFast && weightKg >= tier.freeKg) return Math.round(weightKg * 750);
    return isFast ? Math.round(tier.flatFee * 1.5) : tier.flatFee;
  }

  const base = Math.round(weightKg * tier.perKg);
  return isFast ? Math.round(base * 1.5) : base;
};

export const isFastAvailable = (km: number, weightKg: number) =>
  km <= 80 && weightKg <= FAST_MAX_KG;

// ── DỮ LIỆU ĐỊA PHƯƠNG MIỀN NAM ──────────────────────────────────────────
export const AGRI_LOCATIONS: Province[] = [
  {
    name: "Hồ Chí Minh",
    districts: [
      { name: "Quận 1", km: 16, wards: ["Phường Bến Nghé","Phường Bến Thành","Phường Cầu Kho","Phường Cầu Ông Lãnh","Phường Cô Giang","Phường Đa Kao","Phường Nguyễn Cư Trinh","Phường Nguyễn Thái Bình","Phường Phạm Ngũ Lão","Phường Tân Định"] },
      { name: "Quận 3", km: 14, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường Võ Thị Sáu"] },
      { name: "Quận 4", km: 18, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 12","Phường 13","Phường 14","Phường 15","Phường 16","Phường 18"] },
      { name: "Quận 5", km: 14, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15"] },
      { name: "Quận 6", km: 13, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14"] },
      { name: "Quận 7", km: 22, wards: ["Phường Bình Thuận","Phường Phú Mỹ","Phường Phú Thuận","Phường Tân Hưng","Phường Tân Kiểng","Phường Tân Phong","Phường Tân Phú","Phường Tân Quy","Phường Tân Thuận Đông","Phường Tân Thuận Tây"] },
      { name: "Quận 8", km: 17, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15","Phường 16"] },
      { name: "Quận 10", km: 11, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15"] },
      { name: "Quận 11", km: 10, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15","Phường 16"] },
      { name: "Quận 12", km: 0, wards: ["Phường An Phú Đông","Phường Đông Hưng Thuận","Phường Hiệp Thành","Phường Tân Chánh Hiệp","Phường Tân Hưng Thuận","Phường Tân Thới Hiệp","Phường Tân Thới Nhất","Phường Thạnh Lộc","Phường Thạnh Xuân","Phường Thới An","Phường Trung Mỹ Tây"] },
      { name: "Quận Bình Thạnh", km: 12, wards: ["Phường 1","Phường 2","Phường 3","Phường 5","Phường 6","Phường 7","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15","Phường 17","Phường 19","Phường 21","Phường 22","Phường 24","Phường 25","Phường 26","Phường 27","Phường 28"] },
      { name: "Quận Bình Tân", km: 12, wards: ["Phường An Lạc","Phường An Lạc A","Phường Bình Hưng Hòa","Phường Bình Hưng Hòa A","Phường Bình Hưng Hòa B","Phường Bình Trị Đông","Phường Bình Trị Đông A","Phường Bình Trị Đông B","Phường Tân Tạo","Phường Tân Tạo A"] },
      { name: "Quận Gò Vấp", km: 5, wards: ["Phường 1","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15","Phường 16","Phường 17"] },
      { name: "Quận Phú Nhuận", km: 14, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15","Phường 17"] },
      { name: "Quận Tân Bình", km: 8, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường 13","Phường 14","Phường 15"] },
      { name: "Quận Tân Phú", km: 8, wards: ["Phường Hiệp Tân","Phường Hòa Thạnh","Phường Phú Thạnh","Phường Phú Thọ Hòa","Phường Phú Trung","Phường Sơn Kỳ","Phường Tân Quý","Phường Tân Sơn Nhì","Phường Tân Thành","Phường Tân Thới Hòa","Phường Tây Thạnh"] },
      { name: "Thành phố Thủ Đức", km: 20, wards: ["Phường An Khánh","Phường An Phú","Phường Bình Chiểu","Phường Bình Thọ","Phường Bình Trưng Đông","Phường Bình Trưng Tây","Phường Cát Lái","Phường Hiệp Bình Chánh","Phường Hiệp Bình Phước","Phường Hiệp Phú","Phường Linh Chiểu","Phường Linh Đông","Phường Linh Tây","Phường Linh Trung","Phường Linh Xuân","Phường Long Bình","Phường Long Phước","Phường Long Thạnh Mỹ","Phường Long Trường","Phường Phú Hữu","Phường Phước Bình","Phường Phước Long A","Phường Phước Long B","Phường Tam Bình","Phường Tam Phú","Phường Tăng Nhơn Phú A","Phường Tăng Nhơn Phú B","Phường Tân Phú","Phường Thảo Điền","Phường Thủ Thiêm","Phường Trường Thạnh","Phường Trường Thọ"] },
      { name: "Huyện Bình Chánh", km: 22, wards: ["Thị trấn Tân Túc","Xã An Phú Tây","Xã Bình Chánh","Xã Bình Hưng","Xã Bình Lợi","Xã Đa Phước","Xã Hưng Long","Xã Lê Minh Xuân","Xã Phạm Văn Hai","Xã Phong Phú","Xã Quy Đức","Xã Tân Kiên","Xã Tân Nhựt","Xã Tân Quý Tây","Xã Vĩnh Lộc A","Xã Vĩnh Lộc B"] },
      { name: "Huyện Củ Chi", km: 40, wards: ["Thị trấn Củ Chi","Xã An Nhơn Tây","Xã An Phú","Xã Bình Mỹ","Xã Hòa Phú","Xã Nhuận Đức","Xã Phạm Văn Cội","Xã Phú Hòa Đông","Xã Phú Mỹ Hưng","Xã Phước Hiệp","Xã Phước Thạnh","Xã Phước Vĩnh An","Xã Tân An Hội","Xã Tân Phú Trung","Xã Tân Thạnh Đông","Xã Tân Thạnh Tây","Xã Thái Mỹ","Xã Trung An","Xã Trung Lập Hạ","Xã Trung Lập Thượng"] },
      { name: "Huyện Hóc Môn", km: 15, wards: ["Thị trấn Hóc Môn","Xã Bà Điểm","Xã Đông Thạnh","Xã Nhị Bình","Xã Tân Hiệp","Xã Tân Thới Nhì","Xã Tân Xuân","Xã Thới Tam Thôn","Xã Trung Chánh","Xã Xuân Thới Đông","Xã Xuân Thới Sơn","Xã Xuân Thới Thượng"] },
      { name: "Huyện Nhà Bè", km: 25, wards: ["Thị trấn Nhà Bè","Xã Hiệp Phước","Xã Long Thới","Xã Nhơn Đức","Xã Phú Xuân","Xã Phước Kiển","Xã Phước Lộc"] },
      { name: "Huyện Cần Giờ", km: 60, wards: ["Thị trấn Cần Thạnh","Xã An Thới Đông","Xã Bình Khánh","Xã Long Hòa","Xã Lý Nhơn","Xã Tam Thôn Hiệp","Xã Thạnh An"] },
    ],
  },
  {
    name: "Bình Dương",
    districts: [
      { name: "Thành phố Dĩ An", km: 25, wards: ["Phường Bình An","Phường Bình Thắng","Phường Dĩ An","Phường Đông Hòa","Phường Tân Bình","Phường Tân Đông Hiệp"] },
      { name: "Thành phố Thuận An", km: 30, wards: ["Phường An Phú","Phường An Thạnh","Phường Bình Chuẩn","Phường Bình Hòa","Phường Bình Nhâm","Phường Hưng Định","Phường Lái Thiêu","Phường Thuận Giao","Phường Vĩnh Phú"] },
      { name: "Thành phố Thủ Dầu Một", km: 35, wards: ["Phường Chánh Mỹ","Phường Chánh Nghĩa","Phường Định Hòa","Phường Hiệp An","Phường Hiệp Thành","Phường Hòa Phú","Phường Phú Cường","Phường Phú Hòa","Phường Phú Lợi","Phường Phú Mỹ","Phường Phú Thọ","Phường Tân An","Phường Tương Bình Hiệp"] },
      { name: "Thành phố Tân Uyên", km: 45, wards: ["Phường Bạch Đằng","Phường Hội Nghĩa","Phường Khánh Bình","Phường Phú Chánh","Phường Tân Hiệp","Phường Tân Phước Khánh","Phường Tân Vĩnh Hiệp","Phường Thái Hòa","Phường Thạnh Phước","Phường Uyên Hưng","Phường Vĩnh Tân"] },
      { name: "Thành phố Bến Cát", km: 50, wards: ["Phường An Điền","Phường An Tây","Phường Chánh Phú Hòa","Phường Hòa Lợi","Phường Mỹ Phước","Phường Phú An","Phường Thới Hòa","Phường Tân Định"] },
      { name: "Huyện Bàu Bàng", km: 65, wards: ["Xã Cây Trường II","Xã Hưng Hòa","Xã Lai Hưng","Xã Lai Uyên","Xã Long Nguyên","Xã Tân Hưng","Xã Trừ Văn Thố"] },
      { name: "Huyện Phú Giáo", km: 70, wards: ["Thị trấn Phước Vĩnh","Xã An Bình","Xã An Linh","Xã An Long","Xã An Thái","Xã Phước Hòa","Xã Tam Lập","Xã Tân Hiệp","Xã Tân Long","Xã Vĩnh Hòa"] },
      { name: "Huyện Dầu Tiếng", km: 80, wards: ["Thị trấn Dầu Tiếng","Xã An Lập","Xã Định An","Xã Định Hiệp","Xã Định Thành","Xã Long Hòa","Xã Long Tân","Xã Minh Hòa","Xã Minh Tân","Xã Minh Thạnh","Xã Thanh An","Xã Thanh Tuyền"] },
    ],
  },
  {
    name: "Đồng Nai",
    districts: [
      { name: "Thành phố Biên Hòa", km: 32, wards: ["Phường An Bình","Phường Bình Đa","Phường Bửu Hòa","Phường Bửu Long","Phường Hiệp Hòa","Phường Hóa An","Phường Long Bình","Phường Long Bình Tân","Phường Long Hưng","Phường Phước Tân","Phường Quyết Thắng","Phường Tam Hòa","Phường Tam Hiệp","Phường Tân Biên","Phường Tân Hiệp","Phường Tân Hòa","Phường Tân Mai","Phường Tân Phong","Phường Tân Tiến","Phường Tân Vạn","Phường Thống Nhất","Phường Trảng Dài","Phường Trung Dũng"] },
      { name: "Huyện Nhơn Trạch", km: 42, wards: ["Xã Đại Phước","Xã Hiệp Phước","Xã Long Tân","Xã Long Thọ","Xã Phú Đông","Xã Phú Hội","Xã Phú Thạnh","Xã Phú Xuân","Xã Phước An","Xã Phước Khánh","Xã Phước Thiền","Xã Vĩnh Thanh"] },
      { name: "Huyện Trảng Bom", km: 45, wards: ["Thị trấn Trảng Bom","Xã An Viễn","Xã Bắc Sơn","Xã Bình Minh","Xã Cây Gáo","Xã Đông Hòa","Xã Đồi 61","Xã Giang Điền","Xã Hố Nai 3","Xã Hưng Thịnh","Xã Quảng Tiến","Xã Sông Trầu","Xã Tây Hòa","Xã Thanh Bình"] },
      { name: "Huyện Long Thành", km: 50, wards: ["Thị trấn Long Thành","Xã An Phước","Xã Bàu Cạn","Xã Bình An","Xã Bình Sơn","Xã Long An","Xã Long Đức","Xã Long Phước","Xã Phú Hội","Xã Phước Bình","Xã Phước Thái","Xã Suối Trầu","Xã Tam An","Xã Tân Hiệp"] },
      { name: "Huyện Vĩnh Cửu", km: 50, wards: ["Thị trấn Vĩnh An","Xã Bình Lợi","Xã Hiếu Liêm","Xã Mã Đà","Xã Phú Lý","Xã Tân An","Xã Tân Bình","Xã Thiện Tân","Xã Trị An","Xã Vĩnh Tân"] },
      { name: "Huyện Thống Nhất", km: 55, wards: ["Thị trấn Dầu Giây","Xã Bàu Hàm 2","Xã Gia Kiệm","Xã Gia Tân 1","Xã Gia Tân 2","Xã Gia Tân 3","Xã Hưng Lộc","Xã Lộ 25","Xã Quang Trung","Xã Xuân Thiện"] },
      { name: "Thành phố Long Khánh", km: 80, wards: ["Phường Bảo Quang","Phường Bảo Vinh","Phường Bình Lộc","Phường Phú Bình","Phường Phú Tân","Phường Suối Tre","Phường Thanh Bình","Phường Xuân An","Phường Xuân Bình","Phường Xuân Hiệp","Phường Xuân Hòa","Phường Xuân Lập","Phường Xuân Tân"] },
      { name: "Huyện Cẩm Mỹ", km: 90, wards: ["Xã Bảo Bình","Xã Cẩm Đường","Xã Cẩm Mỹ","Xã Lâm San","Xã Long Giao","Xã Nhân Nghĩa","Xã Sông Nhạn","Xã Sông Ray","Xã Thừa Đức","Xã Xuân Bảo","Xã Xuân Đông","Xã Xuân Mỹ","Xã Xuân Quế","Xã Xuân Tây"] },
      { name: "Huyện Xuân Lộc", km: 100, wards: ["Thị trấn Gia Ray","Xã Bảo Hòa","Xã Lang Minh","Xã Lâm San","Xã Suối Cao","Xã Suối Cát","Xã Xuân Bắc","Xã Xuân Hiệp","Xã Xuân Hòa","Xã Xuân Hưng","Xã Xuân Phú","Xã Xuân Tâm","Xã Xuân Thành","Xã Xuân Thọ","Xã Xuân Trường","Xã Xuân Vinh"] },
      { name: "Huyện Định Quán", km: 115, wards: ["Thị trấn Định Quán","Xã La Ngà","Xã Ngọc Định","Xã Phú Cường","Xã Phú Lợi","Xã Phú Ngọc","Xã Phú Tân","Xã Phú Túc","Xã Phú Vinh","Xã Suối Nho","Xã Thanh Sơn","Xã Túc Trưng"] },
      { name: "Huyện Tân Phú", km: 130, wards: ["Thị trấn Tân Phú","Xã Dak Lua","Xã Nam Cát Tiên","Xã Núi Tượng","Xã Phú An","Xã Phú Bình","Xã Phú Điền","Xã Phú Lập","Xã Phú Lộc","Xã Phú Sơn","Xã Phú Thanh","Xã Phú Thịnh","Xã Phú Trung","Xã Phú Xuân","Xã Tà Lài","Xã Trà Cổ"] },
    ],
  },
  {
    name: "Long An",
    districts: [
      { name: "Huyện Cần Giuộc", km: 30, wards: ["Thị trấn Cần Giuộc","Xã Long An","Xã Long Hậu","Xã Long Phụng","Xã Long Thượng","Xã Mỹ Lộc","Xã Phước Hậu","Xã Phước Lâm","Xã Phước Lý","Xã Tân Kim","Xã Tân Lân","Xã Trường Bình"] },
      { name: "Huyện Bến Lức", km: 38, wards: ["Thị trấn Bến Lức","Xã An Thạnh","Xã Bình Đức","Xã Long Hiệp","Xã Lương Bình","Xã Lương Hòa","Xã Mỹ Yên","Xã Nhựt Chánh","Xã Phước Lợi","Xã Tân Hòa","Xã Thạnh Hòa","Xã Thạnh Lợi","Xã Thuận Thành"] },
      { name: "Huyện Cần Đước", km: 40, wards: ["Thị trấn Cần Đước","Xã Long Cang","Xã Long Định","Xã Long Hòa","Xã Long Hựu Đông","Xã Long Hựu Tây","Xã Long Khê","Xã Long Sơn","Xã Long Trạch","Xã Mỹ Lệ","Xã Phước Đông","Xã Phước Tuy","Xã Tân Ân","Xã Tân Trạch"] },
      { name: "Huyện Đức Hòa", km: 45, wards: ["Thị trấn Đức Hòa","Xã An Ninh Đông","Xã An Ninh Tây","Xã Đức Hòa Đông","Xã Đức Hòa Hạ","Xã Đức Hòa Thượng","Xã Đức Lập Hạ","Xã Đức Lập Thượng","Xã Hiệp Hòa","Xã Hòa Khánh Đông","Xã Hòa Khánh Nam","Xã Hòa Khánh Tây","Xã Hựu Thạnh","Xã Lộc Giang","Xã Mỹ Hạnh Bắc","Xã Mỹ Hạnh Nam","Xã Tân Mỹ"] },
      { name: "Thành phố Tân An", km: 52, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Xã An Vĩnh Ngãi","Xã Bình Tâm","Xã Hướng Thọ Phú","Xã Khánh Hậu","Xã Lợi Bình Nhơn","Xã Nhơn Thạnh Trung","Xã Tân Khánh"] },
      { name: "Huyện Châu Thành", km: 60, wards: ["Thị trấn Tầm Vu","Xã An Lục Long","Xã Bình Quới","Xã Dương Xuân Hội","Xã Hiệp Thạnh","Xã Hòa Phú","Xã Long Trì","Xã Phú Ngãi Trị","Xã Phước Tân Hưng","Xã Thanh Phú Long","Xã Thuận Mỹ","Xã Vĩnh Công"] },
      { name: "Huyện Thủ Thừa", km: 65, wards: ["Thị trấn Thủ Thừa","Xã Bình An","Xã Bình Thạnh","Xã Long Thạnh","Xã Long Thuận","Xã Mỹ An","Xã Mỹ Lạc","Xã Mỹ Phú","Xã Nhị Thành","Xã Tân Long","Xã Tân Thành"] },
      { name: "Huyện Đức Huệ", km: 75, wards: ["Thị trấn Đông Thành","Xã Bình Hòa Bắc","Xã Bình Hòa Hưng","Xã Bình Hòa Nam","Xã Bình Thành","Xã Mỹ Bình","Xã Mỹ Quý Đông","Xã Mỹ Quý Tây","Xã Mỹ Thạnh Bắc","Xã Mỹ Thạnh Đông","Xã Mỹ Thạnh Tây"] },
      { name: "Huyện Thạnh Hóa", km: 100, wards: ["Thị trấn Thạnh Hóa","Xã Tân Đông","Xã Tân Hiệp","Xã Thạnh An","Xã Thạnh Phước","Xã Thạnh Phú","Xã Thuận Bình","Xã Thuận Nghĩa Hòa","Xã Tuyên Thạnh"] },
      { name: "Huyện Tân Thạnh", km: 120, wards: ["Thị trấn Tân Thạnh","Xã Bắc Hòa","Xã Hậu Thạnh Đông","Xã Hậu Thạnh Tây","Xã Kiến Bình","Xã Nhơn Hòa","Xã Nhơn Hòa Lập","Xã Tân Bình","Xã Tân Hiệp","Xã Tân Lập"] },
      { name: "Huyện Mộc Hóa", km: 135, wards: ["Thị trấn Bình Phong Thạnh","Xã Bình Hòa Đông","Xã Bình Hòa Tây","Xã Bình Hòa Trung","Xã Tân Lập","Xã Tuyên Thạnh"] },
      { name: "Thị xã Kiến Tường", km: 140, wards: ["Phường 1","Phường 2","Xã Thạnh Hưng","Xã Tuyên Thạnh"] },
      { name: "Huyện Vĩnh Hưng", km: 150, wards: ["Thị trấn Vĩnh Hưng","Xã Hưng Điền","Xã Hưng Điền B","Xã Khánh Hưng","Xã Thái Bình Trung","Xã Thái Trị","Xã Tuyên Bình","Xã Tuyên Bình Tây"] },
      { name: "Huyện Tân Hưng", km: 155, wards: ["Thị trấn Tân Hưng","Xã Hưng Hà","Xã Hưng Thạnh","Xã Thạnh Hưng","Xã Vĩnh Bửu","Xã Vĩnh Châu A","Xã Vĩnh Châu B","Xã Vĩnh Đại","Xã Vĩnh Lợi","Xã Vĩnh Thạnh","Xã Vĩnh Thuận"] },
    ],
  },
  {
    name: "Tây Ninh",
    districts: [
      { name: "Thị xã Trảng Bàng", km: 45, wards: ["Phường An Hòa","Phường An Tịnh","Phường Gia Bình","Phường Lộc Hưng","Phường Trảng Bàng","Xã Bình Thạnh","Xã Đôn Thuận","Xã Hưng Thuận","Xã Phước Bình","Xã Phước Chỉ"] },
      { name: "Huyện Gò Dầu", km: 55, wards: ["Thị trấn Gò Dầu","Xã Bàu Đồn","Xã Cẩm Giang","Xã Hiệp Thạnh","Xã Phước Thạnh","Xã Phước Trạch","Xã Tam Hiệp","Xã Thạnh Đức"] },
      { name: "Huyện Bến Cầu", km: 70, wards: ["Thị trấn Bến Cầu","Xã An Thạnh","Xã Long Chữ","Xã Long Giang","Xã Long Khánh","Xã Long Phước","Xã Long Thuận","Xã Lợi Thuận","Xã Tiên Thuận"] },
      { name: "Huyện Châu Thành", km: 80, wards: ["Thị trấn Châu Thành","Xã An Bình","Xã An Cơ","Xã Đồng Khởi","Xã Hòa Hội","Xã Hòa Thạnh","Xã Long Vĩnh","Xã Ninh Điền","Xã Phước Vinh","Xã Thái Bình","Xã Thanh Điền","Xã Trí Bình"] },
      { name: "Huyện Hòa Thành", km: 88, wards: ["Thị trấn Hòa Thành","Xã Hiệp Tân","Xã Long Thành Bắc","Xã Long Thành Nam","Xã Long Thành Trung","Xã Trường Hòa","Xã Trường Tây"] },
      { name: "Thành phố Tây Ninh", km: 97, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường Hiệp Ninh","Phường Ninh Sơn","Phường Ninh Thạnh","Xã Bình Minh","Xã Tân Bình","Xã Thạnh Tân"] },
      { name: "Huyện Dương Minh Châu", km: 108, wards: ["Thị trấn Dương Minh Châu","Xã Bàu Năng","Xã Bến Củi","Xã Chà Là","Xã Cầu Khởi","Xã Lộc Ninh","Xã Phan","Xã Suối Đá","Xã Truông Mít"] },
      { name: "Huyện Tân Biên", km: 130, wards: ["Thị trấn Tân Biên","Xã Hòa Hiệp","Xã Mỏ Công","Xã Tân Bình","Xã Tân Lập","Xã Tân Phong","Xã Thạnh Bình","Xã Thạnh Bình","Xã Trà Vong"] },
      { name: "Huyện Tân Châu", km: 145, wards: ["Thị trấn Tân Châu","Xã Tân Đông","Xã Tân Hà","Xã Tân Hội","Xã Tân Hòa","Xã Tân Phú","Xã Tân Thành","Xã Thạnh Đông","Xã Tân Hiệp"] },
    ],
  },
  {
    name: "Bà Rịa - Vũng Tàu",
    districts: [
      { name: "Thị xã Phú Mỹ", km: 68, wards: ["Phường Hắc Dịch","Phường Mỹ Xuân","Phường Phú Mỹ","Phường Tân Hòa","Phường Tân Phước","Xã Châu Pha","Xã Sông Xoài","Xã Tóc Tiên"] },
      { name: "Thành phố Bà Rịa", km: 90, wards: ["Phường Kim Dinh","Phường Long Hương","Phường Long Tâm","Phường Long Toàn","Phường Phước Hiệp","Phường Phước Hưng","Phường Phước Nguyên","Phường Phước Trung","Phường Tân Hưng","Xã Hòa Long","Xã Long Phước","Xã Tân Hưng"] },
      { name: "Huyện Châu Đức", km: 100, wards: ["Thị trấn Ngãi Giao","Xã Bàu Chinh","Xã Bình Ba","Xã Bình Giã","Xã Bình Trung","Xã Đá Bạc","Xã Kim Long","Xã Láng Lớn","Xã Nghĩa Thành","Xã Quảng Thành","Xã Suối Nghệ","Xã Suối Rao","Xã Xà Bang","Xã Xuân Sơn"] },
      { name: "Huyện Long Điền", km: 110, wards: ["Thị trấn Long Điền","Thị trấn Long Hải","Xã An Ngãi","Xã An Nhứt","Xã Phước Hưng","Xã Tam Phước"] },
      { name: "Huyện Đất Đỏ", km: 115, wards: ["Thị trấn Đất Đỏ","Thị trấn Phước Hải","Xã Lang Biang","Xã Long Mỹ","Xã Lộc An","Xã Phước Long Thọ","Xã Phước Thể"] },
      { name: "Thành phố Vũng Tàu", km: 120, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 7","Phường 8","Phường 9","Phường 10","Phường 11","Phường 12","Phường Nguyễn An Ninh","Phường Rạch Dừa","Phường Thắng Nhất","Phường Thắng Nhì","Phường Thắng Tam","Xã Long Sơn"] },
      { name: "Huyện Xuyên Mộc", km: 130, wards: ["Thị trấn Phước Bửu","Xã Bàu Lâm","Xã Bình Châu","Xã Bông Trang","Xã Hòa Bình","Xã Hòa Hội","Xã Hòa Hiệp","Xã Phước Thuận","Xã Phước Tân","Xã Tân Lâm","Xã Xuyên Mộc"] },
    ],
  },
  {
    name: "Bình Phước",
    districts: [
      { name: "Thị xã Chơn Thành", km: 88, wards: ["Phường Hưng Long","Phường Minh Hưng","Phường Minh Thành","Phường Thành Tâm","Xã Minh Long","Xã Minh Thắng","Xã Nha Bích","Xã Quang Minh"] },
      { name: "Thành phố Đồng Xoài", km: 110, wards: ["Phường Tân Bình","Phường Tân Đồng","Phường Tân Phú","Phường Tân Thiện","Phường Tân Xuân","Phường Tiến Thành","Xã Tân Thành","Xã Tiến Hưng"] },
      { name: "Huyện Đồng Phú", km: 120, wards: ["Thị trấn Tân Phú","Xã An Phú","Xã Bình Sơn","Xã Đồng Tâm","Xã Giang Điền","Xã Tân Hưng","Xã Tân Lợi","Xã Tân Phước","Xã Thuận Lợi","Xã Thuận Phú"] },
      { name: "Huyện Hớn Quản", km: 130, wards: ["Thị trấn Tân Khai","Xã An Khương","Xã An Phú","Xã Đồng Nơ","Xã Minh Đức","Xã Minh Tâm","Xã Phước An","Xã Tân Hiệp","Xã Tân Lợi","Xã Thanh An","Xã Thanh Bình"] },
      { name: "Thị xã Bình Long", km: 145, wards: ["Phường An Lộc","Phường Hưng Chiến","Phường Phú Đức","Phường Phú Thịnh","Xã Thanh Lương","Xã Thanh Phú"] },
      { name: "Huyện Lộc Ninh", km: 165, wards: ["Thị trấn Lộc Ninh","Xã An Khương","Xã Lộc An","Xã Lộc Điền","Xã Lộc Hòa","Xã Lộc Hưng","Xã Lộc Khánh","Xã Lộc Phú","Xã Lộc Tấn","Xã Lộc Thái","Xã Lộc Thiện","Xã Lộc Thịnh","Xã Lộc Thuận"] },
      { name: "Thị xã Phước Long", km: 170, wards: ["Phường Long Phước","Phường Long Thủy","Phường Phước Bình","Phường Sơn Giang","Phường Thác Mơ","Xã Long Giang","Xã Phước Tín"] },
      { name: "Huyện Bù Đăng", km: 185, wards: ["Thị trấn Đức Phong","Xã Bom Bo","Xã Bình Minh","Xã Đa Kia","Xã Đăng Hà","Xã Đoàn Kết","Xã Minh Hưng","Xã Nghĩa Bình","Xã Nghĩa Trung","Xã Phú Sơn","Xã Phước Sơn","Xã Thọ Sơn","Xã Thống Nhất"] },
      { name: "Huyện Bù Đốp", km: 195, wards: ["Thị trấn Thanh Bình","Xã Tân Tiến","Xã Hưng Phước","Xã Phước Thiện","Xã Thiện Hưng","Xã Thanh Hòa","Xã Tân Thành"] },
      { name: "Huyện Bù Gia Mập", km: 210, wards: ["Thị trấn Đức Phong","Xã Bình Thắng","Xã Bù Gia Mập","Xã Đa Kia","Xã Đắk Ơ","Xã Long Bình","Xã Phú Nghĩa","Xã Phú Văn"] },
    ],
  },
  {
    name: "Tiền Giang",
    districts: [
      { name: "Huyện Châu Thành", km: 60, wards: ["Thị trấn Tân Hiệp","Xã An Hữu","Xã Bình Trưng","Xã Điềm Hy","Xã Đông Hòa","Xã Kim Sơn","Xã Long An","Xã Long Định","Xã Nhị Bình","Xã Phú Phong","Xã Song Thuận","Xã Tam Hiệp","Xã Tân Hương","Xã Thân Cửu Nghĩa","Xã Thạnh Phú","Xã Vĩnh Kim"] },
      { name: "Thành phố Mỹ Tho", km: 70, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Phường 9","Phường 10","Xã Đạo Thạnh","Xã Mỹ Phong","Xã Phước Thạnh","Xã Tân Long","Xã Thới Sơn","Xã Trung An"] },
      { name: "Huyện Gò Công Tây", km: 72, wards: ["Thị trấn Vĩnh Bình","Xã Bình Nhì","Xã Bình Phú","Xã Bình Tân","Xã Đồng Sơn","Xã Đồng Thạnh","Xã Long Bình","Xã Long Vĩnh","Xã Thạnh Nhựt","Xã Thạnh Trị","Xã Vĩnh Hựu","Xã Yên Luông"] },
      { name: "Huyện Chợ Gạo", km: 78, wards: ["Thị trấn Chợ Gạo","Xã An Thạnh Thủy","Xã Bình Ninh","Xã Bình Phục Nhứt","Xã Đăng Hưng Phước","Xã Hòa Định","Xã Lương Hòa Lạc","Xã Mỹ Tịnh An","Xã Phú Kiết","Xã Quơn Long","Xã Song Bình","Xã Tân Bình Thạnh","Xã Tân Thuận Bình","Xã Thanh Bình","Xã Trung Hòa","Xã Xuân Đông"] },
      { name: "Thị xã Gò Công", km: 82, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Xã Bình Đông","Xã Bình Xuân","Xã Long Hưng","Xã Tân Trung"] },
      { name: "Huyện Gò Công Đông", km: 88, wards: ["Thị trấn Tân Hòa","Xã Bình Ân","Xã Bình Nghị","Xã Kiểng Phước","Xã Phước Trung","Xã Tân Điền","Xã Tân Đông","Xã Tân Phước","Xã Tân Tây","Xã Tân Thành","Xã Vàm Láng"] },
      { name: "Thị xã Cai Lậy", km: 85, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Xã Long Khánh","Xã Mỹ Phước Tây","Xã Nhị Mỹ","Xã Tân Bình","Xã Tân Hội"] },
      { name: "Huyện Cai Lậy", km: 88, wards: ["Thị trấn Cai Lậy","Xã Bình Phú","Xã Cẩm Sơn","Xã Hiệp Đức","Xã Mỹ Long","Xã Mỹ Thành Bắc","Xã Mỹ Thành Nam","Xã Nhị Quý","Xã Phú Cường","Xã Phú Quý","Xã Tam Bình","Xã Tân Bình","Xã Tân Hội","Xã Thanh Hòa"] },
      { name: "Huyện Tân Phước", km: 110, wards: ["Thị trấn Mỹ Phước","Xã Hưng Thạnh","Xã Mỹ Phước","Xã Phú Mỹ","Xã Tân Hòa Đông","Xã Tân Hòa Tây","Xã Tân Hòa Thành","Xã Tân Lập 1","Xã Tân Lập 2","Xã Thạnh Hòa","Xã Thạnh Mỹ"] },
      { name: "Huyện Cái Bè", km: 102, wards: ["Thị trấn Cái Bè","Xã An Cư","Xã An Hữu","Xã An Thái Đông","Xã An Thái Trung","Xã Đông Hòa Hiệp","Xã Hậu Mỹ Bắc A","Xã Hậu Mỹ Bắc B","Xã Hậu Mỹ Nam","Xã Hậu Mỹ Phú","Xã Hòa Hưng","Xã Hòa Khánh","Xã Mỹ Đức Đông","Xã Mỹ Đức Tây","Xã Mỹ Lợi A","Xã Mỹ Lợi B","Xã Mỹ Trung","Xã Tân Hưng","Xã Tân Thanh","Xã Thiện Trung"] },
    ],
  },
  {
    name: "Bến Tre",
    districts: [
      { name: "Huyện Châu Thành", km: 80, wards: ["Thị trấn Châu Thành","Xã An Hóa","Xã An Khánh","Xã An Phước","Xã Giao Long","Xã Hữu Định","Xã Phú Đức","Xã Phú Túc","Xã Phước Thạnh","Xã Quới Sơn","Xã Sơn Hòa","Xã Tam Phước","Xã Tân Phú","Xã Tân Thạch","Xã Tiên Long","Xã Tiên Thủy","Xã Tường Đa"] },
      { name: "Thành phố Bến Tre", km: 90, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 6","Phường 7","Phường 8","Xã Bình Phú","Xã Mỹ Thạnh An","Xã Nhơn Thạnh","Xã Phú Hưng","Xã Phú Nhuận","Xã Sơn Đông"] },
      { name: "Huyện Giồng Trôm", km: 100, wards: ["Thị trấn Giồng Trôm","Xã Bình Hoà","Xã Bình Thành","Xã Châu Bình","Xã Châu Hòa","Xã Hưng Lễ","Xã Hưng Nhượng","Xã Lương Hòa","Xã Lương Phú","Xã Mỹ Thạnh","Xã Phong Nẫm","Xã Phước Long","Xã Tân Hào","Xã Tân Lợi Thạnh","Xã Thạnh Phú Đông","Xã Thuận Điền"] },
      { name: "Huyện Bình Đại", km: 112, wards: ["Thị trấn Bình Đại","Xã Bình Thắng","Xã Châu Hưng","Xã Định Trung","Xã Đại Hòa Lộc","Xã Lộc Thuận","Xã Long Định","Xã Long Hòa","Xã Phú Long","Xã Phú Thuận","Xã Tam Hiệp","Xã Thạnh Phước","Xã Thạnh Trị","Xã Thới Lai","Xã Vang Quới Đông","Xã Vang Quới Tây"] },
      { name: "Huyện Mỏ Cày Bắc", km: 115, wards: ["Xã Hòa Lộc","Xã Hưng Khánh Trung A","Xã Khánh Thạnh Tân","Xã Nhuận Phú Tân","Xã Phú Mỹ","Xã Tân Bình Thạnh","Xã Tân Thanh Tây","Xã Thanh Tân","Xã Thạnh Ngãi"] },
      { name: "Huyện Mỏ Cày Nam", km: 120, wards: ["Thị trấn Mỏ Cày","Xã An Định","Xã An Thạnh","Xã An Thới","Xã Bình Khánh Đông","Xã Bình Khánh Tây","Xã Cẩm Sơn","Xã Đa Phước Hội","Xã Hương Mỹ","Xã Minh Đức","Xã Ngãi Đăng","Xã Phước Hiệp","Xã Tân Hội","Xã Tân Trung"] },
      { name: "Huyện Chợ Lách", km: 128, wards: ["Thị trấn Chợ Lách","Xã Hòa Nghĩa","Xã Hưng Khánh Trung B","Xã Long Thới","Xã Phú Phụng","Xã Phú Sơn","Xã Sơn Định","Xã Tân Thiềng","Xã Vĩnh Bình","Xã Vĩnh Hòa"] },
      { name: "Huyện Ba Tri", km: 130, wards: ["Thị trấn Ba Tri","Xã An Bình Tây","Xã An Đức","Xã An Hiệp","Xã An Hòa Tây","Xã An Ngãi Tây","Xã An Ngãi Trung","Xã An Phú Trung","Xã Bảo Thạnh","Xã Bảo Thuận","Xã Mỹ Chánh","Xã Mỹ Hòa","Xã Mỹ Nhơn","Xã Mỹ Thạnh","Xã Phú Lễ","Xã Phú Ngãi","Xã Tân Hưng","Xã Tân Mỹ","Xã Tân Thủy","Xã Tiên Thủy","Xã Vĩnh An","Xã Vĩnh Hòa"] },
      { name: "Huyện Thạnh Phú", km: 145, wards: ["Thị trấn Thạnh Phú","Xã An Điền","Xã An Nhơn","Xã An Qui","Xã An Thạnh","Xã Bình Thạnh","Xã Đại Điền","Xã Giao Thạnh","Xã Hòa Lợi","Xã Mỹ An","Xã Mỹ Hưng","Xã Phú Khánh","Xã Quới Điền","Xã Tân Phong","Xã Thạnh Hải","Xã Thạnh Phong","Xã Trường Khánh"] },
    ],
  },
  {
    name: "Vĩnh Long",
    districts: [
      { name: "Huyện Long Hồ", km: 120, wards: ["Thị trấn Long Hồ","Xã An Bình","Xã Bình Hòa Phước","Xã Đồng Phú","Xã Hòa Ninh","Xã Hòa Phú","Xã Lộc Hòa","Xã Long An","Xã Phú Đức","Xã Phú Quới","Xã Phước Hậu","Xã Tân Hạnh","Xã Thanh Đức"] },
      { name: "Thành phố Vĩnh Long", km: 128, wards: ["Phường 1","Phường 2","Phường 3","Phường 4","Phường 5","Phường 8","Phường 9","Xã Tân Hạnh","Xã Tân Ngãi","Xã Trường An"] },
      { name: "Huyện Mang Thít", km: 135, wards: ["Thị trấn Cái Nhum","Xã An Phước","Xã Bình Phước","Xã Chánh An","Xã Hòa Tịnh","Xã Long Mỹ","Xã Mỹ An","Xã Mỹ Phước","Xã Nhơn Phú","Xã Tân An Hội","Xã Tân Long Hội"] },
      { name: "Thị xã Bình Minh", km: 145, wards: ["Phường Cái Vồn","Phường Đông Thuận","Phường Đông Bình","Xã Mỹ Hòa","Xã Thuận An"] },
      { name: "Huyện Vũng Liêm", km: 150, wards: ["Thị trấn Vũng Liêm","Xã Hiếu Nhơn","Xã Hiếu Phụng","Xã Hiếu Thành","Xã Hiếu Thuận","Xã Quới An","Xã Quới Thiện","Xã Tân An Luông","Xã Tân Quới Trung","Xã Thanh Bình","Xã Trung An","Xã Trung Chánh","Xã Trung Hiếu","Xã Trung Hiệp","Xã Trung Nghĩa","Xã Trung Thành","Xã Trung Thành Đông","Xã Trung Thành Tây"] },
      { name: "Huyện Tam Bình", km: 152, wards: ["Thị trấn Tam Bình","Xã Bình Ninh","Xã Hậu Lộc","Xã Hòa Hiệp","Xã Hòa Lộc","Xã Hòa Thạnh","Xã Long Phú","Xã Loan Mỹ","Xã Mỹ Lộc","Xã Mỹ Thạnh Trung","Xã Ngãi Tứ","Xã Phú Lộc","Xã Song Phú","Xã Tân Lộc","Xã Tân Phú","Xã Tường Lộc"] },
      { name: "Huyện Bình Tân", km: 158, wards: ["Thị trấn Tân Quới","Xã Mỹ Thuận","Xã Nguyễn Văn Thảnh","Xã Tân An Thạnh","Xã Tân Bình","Xã Tân Hưng","Xã Tân Lược","Xã Tân Thành Bình","Xã Tân Thành Trung","Xã Thành Đông","Xã Thành Lợi","Xã Thành Trung"] },
      { name: "Huyện Trà Ôn", km: 162, wards: ["Thị trấn Trà Ôn","Xã Hòa Bình","Xã Lục Sĩ Thành","Xã Nhơn Bình","Xã Phú Thành","Xã Tân Mỹ","Xã Thiện Mỹ","Xã Thới Hòa","Xã Thuận Thới","Xã Trà Côn","Xã Vĩnh Xuân"] },
    ],
  },
];
