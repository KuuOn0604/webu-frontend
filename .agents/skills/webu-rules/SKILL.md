# Quy chuẩn Coding (Coding Rules & Conventions) - Dự án WEBU (Frontend)

Tài liệu này tổng hợp toàn bộ các quy chuẩn phát triển phần mềm cho Frontend. Mọi thành viên và trợ lý AI khi làm việc trên repository này đều phải tuân thủ nghiêm ngặt các quy tắc dưới đây.

---

## 0. Tech Context (Bắt buộc đọc trước)

### Frontend Stack

- React 18 + TypeScript 5.6
- Build: Vite 5, port 5173
- Styling: Tailwind CSS v4 (utility-first) + CSS Variables trong `index.css`
- Routing: React Router DOM v6 (tập trung tại `App.tsx`)
- HTTP: Axios, base URL = `VITE_API_BASE_URL`
- Auth: JWT lưu tại localStorage key `auth_token`
- Editor: Monaco Editor
- Hiện KHÔNG có global state manager (`store/` folder rỗng)

### Cấu trúc Feature-based (đang hình thành)

- `src/features/<feature-name>/` ← logic theo tính năng
  ├── `components/` ← UI components của feature
  ├── `api/` ← API calls của feature
  ├── `hooks/` ← custom hooks của feature
  └── `index.ts` ← public API của feature
- `src/pages/` ← trang, chỉ compose components, không chứa logic
- `src/components/` ← shared components dùng nhiều nơi
- `src/api/` ← shared API services

---

## I. QUY CHUẨN FRONTEND

### 1. Format & Layout UI

- Kích thước trang chuẩn: `1440 x 1024` và `1440 x 1024++`.
- **Padding** phải chia hết cho **4**.
- **Margin** biên mặc định: `120px`.
- Sử dụng Grid mặc định: `12 x Auto`.

### 2. Design Foundation (Nguồn đơn lẻ về style)

- **Typography:** Font mặc định được định nghĩa trong `src/index.css` hoặc theo design Figma.
  - Khi chưa có Figma spec, dùng: font-family `Inter`, scale 12/14/16/20/24/32px.
- **Color Tokens:** Toàn bộ màu sắc phải khai báo trong `src/index.css` dưới `:root`:
  ```css
  :root {
    --color-primary: #...;
    --color-bg: #...;
  }
  ```
- **Không hardcode** giá trị màu sắc (HEX/RGB) trực tiếp trong component, Tailwind class, hay inline style.
  - Sai: `className="text-[#4A90E2]"`
  - Đúng: `className="text-primary"` (nếu đã config Tailwind) hoặc `style={{ color: 'var(--color-primary)' }}`

### 3. Đặt tên file & thư mục

- **Component & Thư mục chứa Component:** Dùng **PascalCase** (Ví dụ: `Button.tsx`, `UserProfile.tsx`).
- **Non-component (.ts):** Dùng **camelCase** (Ví dụ: `useAuth.ts`, `formatDate.ts`).
- **Folder:** Dùng **kebab-case** (Ví dụ: `src/user-profile/`, `src/api-services/`).
- **CSS đi kèm:** Tên giống với component (Ví dụ: `Button.tsx` + `Button.css`).
- File đại diện cho thư mục: `index.ts` hoặc `index.tsx`.

### 4. Quy tắc React & TypeScript

- **Rules of Hooks:** Chỉ gọi hook ở top-level của component hoặc custom hook. Không đặt trong if/else/loop.
- **useEffect Dependency:** Luôn khai báo đầy đủ các dependencies mà hook sử dụng.
- **Key trong List:** Bắt buộc dùng **ID unique**, không dùng index của mảng làm key.
- **Button Type — Quy tắc chi tiết:**
  - `type="button"`: cho MỌI button không nằm trong `<form>`, hoặc button nằm trong form nhưng không trigger submit.
  - `type="submit"`: CHỈ dùng cho button submit của `<form>` thực sự (vd: nút "Đăng nhập", "Đăng ký").
  - `type="reset"`: Không khuyến khích dùng, phải có comment giải thích.
- **Semantic HTML:** Sử dụng các thẻ HTML5 có ý nghĩa (`<main>`, `<header>`, `<nav>`, `<button>`) thay vì lạm dụng thẻ `<div>`.

### 5. Styling (CSS) — Quy tắc Ưu tiên

**Nguyên tắc chung: Tailwind-first, BEM khi Tailwind không đủ.**

- Sử dụng **Tailwind CSS utility classes** cho layout, spacing, typography, màu sắc tiêu chuẩn.
- Viết **CSS custom (BEM)** (`.block__element--modifier`) chỉ khi:
  - Component có animation/transition phức tạp không thể diễn đạt bằng Tailwind.
  - Cần override style của thư viện bên ngoài (Monaco Editor, React Quill).
  - Runtime dynamic styles (vd: `width: ${progress}%` → viết inline hoặc CSS module).
- CSS custom đặt trong file `.css` cùng tên component, KHÔNG được viết vào `index.css` ngoại trừ `:root` variables.
- **Tuyệt đối không** mix utility class và BEM class trên cùng một element.

### 6. Import & Export

- **Alias `@/`:** Luôn dùng alias `@/` cho absolute import (Ví dụ: `import Button from '@/components/ui/Button'`).
- **Thứ tự Import:**
  1.  Thư viện ngoài (React, axios, third-party packages).
  2.  Absolute import (`@/...`).
  3.  Relative import (`./...`, `../...`).
  4.  Tệp CSS (`import './Style.css'`).
- **Style Export:**
  - Component: `export default`.
  - Hook, util, type, constant: **named export** (`export const ...`).

---

## II. QUY TRÌNH GIT & CHECKLIST TRƯỚC KHI PUSH (Frontend Repository)

### 1. Conventional Commits

Bắt buộc viết commit theo format: `<type>: <description>` bằng tiếng Anh.

- `feat`: Thêm tính năng mới.
- `fix`: Sửa lỗi.
- `chore`: Cấu hình, cài đặt thư viện.
- `docs`: Cập nhật tài liệu.
- `style`: Sửa format code.
- `refactor`: Cơ cấu lại code (không đổi logic).
  _Ví dụ chuẩn:_ `feat: add login page`, `fix: correct button hover on chrome`.

### 2. Đặt tên Branch

Sử dụng kebab-case kèm prefix: `feat/login-page`, `fix/button-bug`, `chore/update-deps`.

### 3. Checklist trước khi Push

- [ ] Code đã chạy tốt ở local (`yarn dev`).
- [ ] Không còn tồn tại lệnh `console.log()` dư thừa.
- [ ] Đã chạy check và pass kiểm tra cú pháp (`yarn lint`).
- [ ] Đã chạy thử build và thành công (`yarn build`).
- [ ] Giao diện đã được test tương thích thiết bị (Responsive).
- [ ] Tên branch và commit message đúng quy chuẩn.
