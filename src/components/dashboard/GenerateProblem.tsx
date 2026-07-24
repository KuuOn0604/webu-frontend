import React, {
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  forwardRef,
} from 'react';
import { Button } from '@/components/ui/Button';

/** Handle được expose ra ngoài qua ref để trang cha có thể gọi reset */
export interface GenerateProblemHandle {
  reset: () => void;
}

interface GenerateProblemProps {
  /** Callback trả ra text prompt và file ảnh để trang cha gọi API */
  onGenerate?: (prompt: string, imageFile: File | null) => void;
  isProcessing?: boolean;
}

export const GenerateProblem = forwardRef<
  GenerateProblemHandle,
  GenerateProblemProps
>(function GenerateProblem({ onGenerate, isProcessing = false }, ref) {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleReset = () => {
    setPrompt('');
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useImperativeHandle(ref, () => ({ reset: handleReset }));

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  const handleImageIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = () => {
    if (!prompt.trim() && !selectedImage) return;

    if (onGenerate) {
      onGenerate(prompt, selectedImage);
    } else {
      console.log('Dữ liệu gửi đi:', { prompt, selectedImage });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (imagePreview) URL.revokeObjectURL(imagePreview);
          setSelectedImage(file);
          setImagePreview(URL.createObjectURL(file));
          break;
        }
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full bg-[#111827] rounded-[16px] p-4 flex flex-col gap-3 border transition-all duration-200 ${
          isDragOver
            ? 'border-secondary-a70 bg-secondary-a70/10 scale-[1.01] shadow-lg'
            : 'border-white/5 hover:border-white/10'
        }`}
      >
        {/* Preview image INSIDE the box at the top if selected */}
        {imagePreview && (
          <div className="relative w-12 h-12 rounded-lg border border-white/10 bg-neutral-a900 shadow-sm flex-shrink-0 group">
            <div
              onClick={() => setIsModalOpen(true)}
              className="w-full h-full rounded-lg overflow-hidden cursor-pointer relative"
              title="Click to view full image"
            >
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-1.5 -right-1.5 bg-[#ef4444] text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md cursor-pointer text-[10px] font-bold"
              title="Remove image"
            >
              &times;
            </button>
          </div>
        )}

        {/* Text area for prompt */}
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onPaste={handlePaste}
          disabled={isProcessing}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
              e.preventDefault();
              handleCreate();
            }
          }}
          placeholder="Describe your programming problem or drag/paste an image here..."
          className="w-full bg-transparent text-white placeholder-neutral-a400 focus:outline-none resize-none min-h-[48px] max-h-[200px] overflow-y-auto font-sans p7 leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
          rows={2}
          style={{ height: 'auto' }}
        />

        {/* Bottom bar inside the box */}
        <div className="flex items-center justify-between mt-1">
          {/* Upload image button - bị disable khi đang xử lý */}
          <button
            type="button"
            onClick={handleImageIconClick}
            disabled={isProcessing}
            className={`transition-colors p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed ${
              selectedImage
                ? 'text-secondary-a70'
                : 'text-neutral-a400 hover:text-neutral-a200'
            } ${isProcessing ? '' : 'cursor-pointer'}`}
            title="Upload image"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Create button với inline Spinner khi đang xử lý */}
          <Button
            type="button"
            isProcessing={isProcessing}
            disabled={isProcessing}
            className="w-auto px-6 py-2 rounded-full h7 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 50 50"
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                >
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="90 150"
                    strokeDashoffset="-35"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              'Create'
            )}
          </Button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isModalOpen && imagePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-lg bg-[#0d131f] p-2 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-105 transition-all duration-200 cursor-pointer text-xl font-bold"
            >
              &times;
            </button>
            <img
              src={imagePreview}
              alt="Full Preview"
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
            <div className="p-3 text-center text-sm text-neutral-a300 bg-[#0d131f]/90 border-t border-white/5">
              {selectedImage?.name} (
              {selectedImage ? (selectedImage.size / 1024).toFixed(1) : 0} KB)
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

GenerateProblem.displayName = 'GenerateProblem';

export default GenerateProblem;
