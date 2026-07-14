/**
 * OverlayLoader
 *
 * Component overlay khóa màn hình khi thực hiện các tác vụ nặng (AI generation,
 * API call kéo dài). Sử dụng backdrop-blur để giữ ngữ cảnh trang nhưng ngăn
 * người dùng tương tác nhầm trong khi chờ đợi.
 *
 * Usage:
 *   import OverlayLoader from '@/components/ui/OverlayLoader';
 *
 *   <OverlayLoader isOpen={isProcessing} message="Đang tạo testcase bằng AI..." />
 */

interface OverlayLoaderProps {
  /** Hiển thị overlay khi true, ẩn hoàn toàn khi false */
  isOpen: boolean;
  /** Thông điệp hiển thị phía dưới spinner. Mặc định: "Đang xử lý..." */
  message?: string;
}

const OverlayLoader = ({
  isOpen,
  message = 'Đang xử lý...',
}: OverlayLoaderProps): JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/60 backdrop-blur-sm"
    >
      {/* SVG Spinner - sử dụng color token từ Design System */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 50 50"
        className="h-14 w-14 animate-spin"
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="var(--color-secondary-a70)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="90 150"
          strokeDashoffset="-35"
        />
      </svg>

      {/* Message - sử dụng Typography token h6 */}
      <p className="h6 max-w-sm text-center text-neutral-a50">{message}</p>
    </div>
  );
};

export default OverlayLoader;
