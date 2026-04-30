// @ts-nocheck
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './views/Home';
import { ProductDetail } from './views/ProductDetail';
import { Products } from './views/Products';
import { Cart } from './views/Cart';
import { Checkout } from './views/Checkout';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { Profile } from './views/Profile';
import { OrderSuccess } from './views/OrderSuccess';
import { PaymentError } from './views/PaymentError';
import { ChangePassword } from './views/ChangePassword';
import { NewsPage } from './views/NewsPage'
import { ContactPage } from './views/ContactPage'

// Admin Views
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./views/admin/AdminDashboard";
import { CategoryManagement } from "./views/admin/CategoryManagement";
import { ProductManagement } from "./views/admin/ProductManagement";
import ProductDiscount from "./views/admin/ProductDiscount";
import { OrderManagement } from "./views/admin/OrderManagement";
import { UserManagement } from "./views/admin/UserManagement";
import { ReviewManagement } from "./views/admin/ReviewManagement"; // Nhớ check đúng đường 
import { VoucherManagement } from "./views/admin/VoucherManagement";
export const AppRouter = () => (
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      {/* 🟢 PUBLIC ROUTES */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/order-success/:id" element={<OrderSuccess />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/payment-error" element={<PaymentError />} />
      <Route path='/change-password' element={<ChangePassword/>}/>
      <Route path="/news" element={<NewsPage />} />
      <Route path="/contact" element={<ContactPage />} />

     
      {/*  ADMIN ROUTES (Cấu trúc lồng nhau - Fix lỗi link lạ) */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Route mặc định khi vào /admin sẽ hiện Dashboard */}
        <Route index element={<AdminDashboard />} />
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="products/discount" element={<ProductDiscount />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="reviews" element={<ReviewManagement />} />
        <Route path="vouchers" element={<VoucherManagement />} />
      </Route>

      {/* Redirect nếu vào sai link admin */}
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </Router>
);