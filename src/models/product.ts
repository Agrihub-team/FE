export interface Product {
  _id: string;
  name: string;
  description: string;
  price_kg: number;
  price_bag_25kg: number;
  price_bag_50kg: number;
  stock_25kg: number;
  stock_50kg: number;
  stock_total_kg: number;
  image: string;
  category_id?: string;
}