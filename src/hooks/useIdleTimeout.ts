import { useEffect, useRef } from 'react';

const IDLE_MS = 30 * 60 * 1000; // 30 phút
const WARN_MS = 29 * 60 * 1000; // cảnh báo trước 1 phút
const STORAGE_KEY = 'agri_last_activity';

export const useIdleTimeout = (isLoggedIn: boolean, onLogout: () => void) => {
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const updateActivity = () => {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      warnedRef.current = false;
    };

    const EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    EVENTS.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    // Khởi tạo lần đầu
    if (!localStorage.getItem(STORAGE_KEY)) updateActivity();

    const interval = setInterval(() => {
      const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
      const idle = Date.now() - last;

      if (idle >= IDLE_MS) {
        clearInterval(interval);
        localStorage.removeItem(STORAGE_KEY);
        onLogout();
      } else if (idle >= WARN_MS && !warnedRef.current) {
        warnedRef.current = true;
        // Dynamic import để tránh bundle toast vào hook
        import('sonner').then(({ toast }) => {
          toast.warning('Phiên đăng nhập sắp hết hạn. Hãy thao tác để duy trì.', { duration: 10000 });
        });
      }
    }, 30_000); // check mỗi 30 giây

    return () => {
      clearInterval(interval);
      EVENTS.forEach(e => window.removeEventListener(e, updateActivity));
    };
  }, [isLoggedIn, onLogout]);
};
