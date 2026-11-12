# MATHTIKZ — bản Firebase

Kho hình TikZ cá nhân: lưu mã + ảnh, build, sửa nhanh, xếp nhóm, tải ZIP, xuất kho cho Claude local.
Chạy hoàn toàn trên trình duyệt: **GitHub Pages + Firebase** (Authentication + Firestore). Không còn Apps Script/Drive.

## Thành phần
- `chung/cau-hinh.js` — firebaseConfig, email chủ kho, địa chỉ build TikZ.
- `chung/fb.js` — kết nối Firebase duy nhất (đăng nhập Google / email + mật khẩu, Firestore có bộ nhớ đệm trên máy).
- `chung/dang-nhap.js` — phiên, quyền từng tài khoản, chặn trang khi thiếu quyền.
- `chung/kho-du-lieu.js` — đọc/ghi kho, build TikZ gọi thẳng tikz-fly, bản nháp IndexedDB.
- `cai-dat.html` + `trang/cai-dat.js` + `trang/quan-tri.js` — Cài đặt (tài khoản, macro, quy tắc vẽ) và Quản trị tài khoản (chỉ chủ kho) gộp chung một trang; `quan-tri.html` chỉ chuyển hướng sang đây.
- `chung/pic.js`, `chung/quy-tac-ve.js` — dựng `\pic` và quy tắc vẽ hình, dùng khi đồng bộ kho-tikz cho Claude local.
- `chung/xuat-ai.js` — nút "Đồng bộ kho-tikz" (chủ kho) ở Dữ liệu Hình TikZ: ghi kho vào thư mục `kho-tikz` trong Google Drive (ví dụ `G:\My Drive\kho-tikz`) gồm `index.json`, `hinh/`, `pic/`, `anh/`, `macro-chung.tex`, `HUONG-DAN.md`, `AGENTS.md`, `CLAUDE.md` cho Claude local. Chrome/Edge: chọn thư mục một lần, chọn "Cho phép mọi lần truy cập" khi trình duyệt hỏi quyền; sau đó web tự đồng bộ (chỉ ghi phần thay đổi) mỗi khi mở trang hoặc kho thay đổi. Trình duyệt khác tải `kho-tikz.zip`.
- Nút "Nhập hình từ file" (quyền Sửa kho) ở Dữ liệu Hình TikZ: nhập nhiều hình một lần từ file `.json` dạng `{ "hinh": [{ title, kind, grade, topic, tags, description, nhom, source, image }] }`; có `image` (data URL) thì lưu luôn không build lại; hình trùng tên trong cùng nhóm được bỏ qua.
- `chung/zip.js` — tạo file ZIP trong trình duyệt (tải từng hình hoặc toàn bộ kho).

## Firestore
| Đường dẫn | Nội dung |
|---|---|
| `hinh/{id}` | tên, loại, khối, chủ đề, từ khóa, mô tả, nhóm (`nhom`, một cấp), createdAt, updatedAt |
| `ma/{id}` | `source` (mã TikZ), `v` |
| `anh/{id}` | `data` (ảnh data URL), `v` = updatedAt khi build |
| `caiDat/chung` | `macros`, `quyTacVe` (ghi vào HUONG-DAN.md khi đồng bộ kho-tikz; để trống = dùng quy tắc mặc định) |
| `nguoiDung/{uid}` | email, hoTen, `quyen {xem, tai, sua}`, khoa, daXoa, taoLuc, lanCuoi |

## Tài khoản và quyền
- **Chủ kho** (`EMAIL_CHU`, đăng nhập Google): mọi quyền, Quản trị tài khoản, macro, quy tắc vẽ.
- **Thành viên** (email + mật khẩu do chủ kho tạo): quyền bật riêng từng người
  - **Xem**: xem ảnh hình trong kho · **Tải**: mở/copy mã, tải ZIP · **Sửa kho**: thêm, sửa, xóa, xếp nhóm.
  - Tải hoặc Sửa kho tự kèm Xem.
- Gói Spark không có máy chủ, nên "Xóa" chỉ gỡ quyền (`daXoa`); xóa hẳn tài khoản đăng nhập ở Firebase → Authentication → Users.

## Firestore Rules
Dán nội dung `firestore.rules` vào Firebase → Firestore → Rules → Publish.

## Cài đặt lần đầu
1. Firebase Console: tạo dự án, thêm Web app, bật Authentication → Google và Email/Password, thêm `tthuu-pixel.github.io` vào Authorized domains, tạo Firestore (asia-southeast1) và dán Rules ở trên.
2. Dán `firebaseConfig` vào `chung/cau-hinh.js`.
3. GitHub → Settings → Pages → Deploy from branch `main`, thư mục `/ (root)`.
4. Mở web, đăng nhập Google → Cài đặt: nhập macro chung nếu cần.

## Cập nhật web
Các trang nạp `chung/*.js`, `trang/*.js` kèm `?v=...`. Mỗi lần đổi mã, tăng giá trị `v` trong mọi file `.html` để trình duyệt không dùng bản cũ trong bộ nhớ đệm (GitHub Pages cho phép đệm 10 phút).
