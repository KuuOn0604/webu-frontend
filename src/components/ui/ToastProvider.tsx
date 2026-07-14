/**
 * ToastProvider
 *
 * Bọc <Toaster /> của react-hot-toast với style tuân thủ Design System của WEBU.
 * Đặt component này một lần duy nhất tại App.tsx để kích hoạt toast toàn cục.
 *
 * Các thành viên trong nhóm dùng toast như sau:
 *
 *   import toast from 'react-hot-toast';
 *
 *   toast.success('Bài tập đã được lưu!');
 *   toast.error('Không thể kết nối máy chủ.');
 *   toast('Đang tải dữ liệu...');  // toast thông thường (info)
 */

import { Toaster } from 'react-hot-toast';

const ToastProvider = (): JSX.Element => (
  <Toaster
    position="top-right"
    reverseOrder={false}
    gutter={8}
    containerStyle={{ top: 20, right: 20 }}
    toastOptions={{
      // ── Thời gian hiển thị mặc định ──────────────────────────────────
      duration: 4000,

      // ── Style base chung (áp dụng cho tất cả loại toast) ─────────────
      style: {
        // Nền theo tonal palette, không hardcode HEX
        background: 'var(--color-tonal-a20)',
        color: 'var(--color-neutral-a50)',
        border: '1px solid var(--color-tonal-a30)',
        borderRadius: '8px',
        padding: '12px 16px',
        // Typography p7 (16px, UTM Neo Sans Intel)
        fontFamily: 'UTM Neo Sans Intel, sans-serif',
        fontSize: '16px',
        fontWeight: '400',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        maxWidth: '420px',
      },

      // ── Success toast ─────────────────────────────────────────────────
      success: {
        duration: 3000,
        iconTheme: {
          primary: 'var(--color-success-a0)',
          secondary: 'var(--color-tonal-a20)',
        },
        style: {
          background: 'var(--color-tonal-a20)',
          color: 'var(--color-neutral-a50)',
          borderLeft: '4px solid var(--color-success-a0)',
        },
      },

      // ── Error toast ───────────────────────────────────────────────────
      error: {
        duration: 5000,
        iconTheme: {
          primary: 'var(--color-danger-a0)',
          secondary: 'var(--color-tonal-a20)',
        },
        style: {
          background: 'var(--color-tonal-a20)',
          color: 'var(--color-neutral-a50)',
          borderLeft: '4px solid var(--color-danger-a0)',
        },
      },
    }}
  />
);

export default ToastProvider;
