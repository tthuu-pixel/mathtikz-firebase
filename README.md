# MATHTIKZ — bản Firebase

Kho hình TikZ cá nhân: lưu mã + ảnh, build, sửa nhanh, AI sửa mã, vẽ theo đề, quét hình thực tế.
Chạy hoàn toàn trên trình duyệt: **GitHub Pages + Firebase** (Authentication + Firestore). Không còn Apps Script/Drive.

## Thành phần
- `chung/cau-hinh.js` — firebaseConfig, email chủ kho, địa chỉ build TikZ.
- `chung/fb.js` — kết nối Firebase duy nhất (đăng nhập Google / email + mật khẩu, Firestore có bộ nhớ đệm trên máy).
- `chung/dang-nhap.js` — phiên, quyền từng tài khoản, chặn trang khi thiếu quyền.
- `quan-tri.html` + `trang/quan-tri.js` — chủ kho tạo tài khoản, bật/tắt quyền, khóa, đặt lại mật khẩu.
- `chung/kho-du-lieu.js` — đọc/ghi kho, build TikZ gọi thẳng tikz-fly, bản nháp IndexedDB.
- `chung/ai.js` — gọi thẳng Gemini / OpenAI / Claude / DeepSeek; key của chủ kho ở `caiDat/ai`, key riêng của thành viên ở `aiRieng/{uid}`.
- `trang/dong-bo.js` — Cài đặt → Đồng bộ 2 chiều với MathTikZ-Pro (Drive + Apps Script).
- `chung/pic.js` — biến hình trong kho thành `\pic` (Vẽ theo đề: AI chọn mẫu, đặt pic, vẽ thêm yếu tố toán học, build và sửa ngay trên trang).
- `chung/quy-tac-ve.js` — quy tắc vẽ hình mặc định cho AI (theo chuẩn hóa LaTeX Toán: TikZ thuần, dựng điểm bằng phép biến hình, nhãn theo góc). Chủ kho sửa trong Cài đặt.
- `chung/xuat-ai.js` — nút "Xuất kho cho AI" (chủ kho) ở Dữ liệu Hình TikZ: ghi kho ra thư mục `kho-tikz` (Google Drive) gồm `index.json`, `hinh/`, `pic/`, `anh/`, `macro-chung.tex`, `HUONG-DAN.md`, `AGENTS.md`, `CLAUDE.md` cho Codex và Claude Cowork. Chrome/Edge ghi thẳng, chỉ ghi phần thay đổi; Firefox tải `kho-tikz.zip`.
- `chung/zip.js` — tạo file ZIP trong trình duyệt (tải từng hình hoặc toàn bộ kho).

## Firestore
| Đường dẫn | Nội dung |
|---|---|
| `hinh/{id}` | tên, loại, khối, chủ đề, từ khóa, mô tả, nhóm (`nhom`, một cấp), createdAt, updatedAt |
| `ma/{id}` | `source` (mã TikZ), `v` |
| `anh/{id}` | `data` (ảnh data URL), `v` = updatedAt khi build |
| `caiDat/chung` | `macros`, `quyTacVe` (để trống = dùng quy tắc mặc định) |
| `caiDat/ai` | hãng đang dùng, Base URL, model, API key |
| `caiDat/dongBo` | mốc đồng bộ với MathTikZ-Pro: macro, hình đã xóa, lần cuối |
| `nguoiDung/{uid}` | email, hoTen, `quyen {xem, tai, ai, sua}`, khoa, daXoa, taoLuc, lanCuoi |
| `aiRieng/{uid}` | cấu hình AI + key riêng của thành viên |

`hinh/{id}.dongBo = { idCu, cu, moi }` ghi id bên MathTikZ-Pro và thời điểm sửa hai bên ở lần đồng bộ trước.

## Tài khoản và quyền
- **Chủ kho** (`EMAIL_CHU`, đăng nhập Google): mọi quyền, trang Quản trị, macro, đồng bộ.
- **Thành viên** (email + mật khẩu do chủ kho tạo): quyền bật riêng từng người
  - **Xem**: xem ảnh hình trong kho · **Tải**: mở/copy mã, tải ZIP · **AI**: AI sửa mã, vẽ theo đề (tự nhập key) · **Sửa kho**: thêm, sửa, xóa, xếp nhóm.
  - Tải hoặc Sửa kho tự kèm Xem. Vẽ theo đề cần AI + Tải; Quét hình cần AI + Sửa kho.
- Gói Spark không có máy chủ, nên "Xóa" chỉ gỡ quyền (`daXoa`); xóa hẳn tài khoản đăng nhập ở Firebase → Authentication → Users.

## Firestore Rules
Dán nội dung `firestore.rules` vào Firebase → Firestore → Rules → Publish.

## Cài đặt lần đầu
1. Firebase Console: tạo dự án, thêm Web app, bật Authentication → Google và Email/Password, thêm `tthuu-pixel.github.io` vào Authorized domains, tạo Firestore (asia-southeast1) và dán Rules ở trên.
2. Dán `firebaseConfig` vào `chung/cau-hinh.js`.
3. GitHub → Settings → Pages → Deploy from branch `main`, thư mục `/ (root)`.
4. Mở web, đăng nhập Google → Cài đặt: nhập API key AI → Đồng bộ với MathTikZ-Pro (nếu cần).

## Cập nhật web
Các trang nạp `chung/*.js`, `trang/*.js` kèm `?v=...`. Mỗi lần đổi mã, tăng giá trị `v` trong mọi file `.html` để trình duyệt không dùng bản cũ trong bộ nhớ đệm (GitHub Pages cho phép đệm 10 phút).
