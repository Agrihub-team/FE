export interface OrderItem {
  product: string;
  name: string;
  image: string;
  q25: number; p25: number;
  q50: number; p50: number;
  qKg: number; pKg: number;
}

export interface Order {
  _id: string;
  orderCode: string;
  items: OrderItem[];
  subTotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: 'COD' | 'VNPAY';
  paymentStatus: string;
  status: string;
  shippingAddress: {
    receiver_name: string;
    phone: string;
    street: string;
    ward: string;
    district: string;
    province: string;
  };
  createdAt: string;
}