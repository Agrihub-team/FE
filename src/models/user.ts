export interface User {
  _id: string;
  fullname: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  phone?: string;
  is_active: boolean;
}