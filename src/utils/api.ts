// src/utils/api.ts
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';

async function fetchClient<T = any>(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { 
      ...options, 
      headers 
    });

    if (response.status === 401 && !endpoint.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Chỉ redirect về login nếu đang ở trang cần auth (profile, checkout, change-password)
      const protectedPaths = ['/profile', '/checkout', '/change-password', '/admin'];
      const onProtectedPage = protectedPaths.some(p => window.location.pathname.startsWith(p));
      if (onProtectedPage) {
        window.location.href = '/login';
      }
      throw new Error('Phiên đăng nhập hết hạn');
    }

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.message || 'Lỗi từ server');
    }

    // TRẢ VỀ result.data NHƯ GỐC (để không phá các trang khác)
    return result.data || result;
  } catch (error: any) {
    console.error("API Error:", error.message);
    throw error;
  }
}

export const apiClient = {
  get: <T>(url: string) => fetchClient<T>(url, { method: 'GET' }),
  post: <T>(url: string, body: any) => fetchClient<T>(url, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  put: <T>(url: string, body: any) => fetchClient<T>(url, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  }),
  delete: <T>(url: string) => fetchClient<T>(url, { method: 'DELETE' }),
};