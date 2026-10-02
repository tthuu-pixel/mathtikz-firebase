# MATHTIKZ — bản Firebase (dùng cá nhân)

Kho hình TikZ cá nhân: lưu mã + ảnh, build, sửa nhanh, AI sửa mã, vẽ theo đề, quét hình thực tế.
Chạy hoàn toàn trên trình duyệt: **GitHub Pages + Firebase** (Authentication + Firestore). Không còn Apps Script/Drive.

## Thành phần
- `chung/cau-hinh.js` — firebaseConfig, email chủ kho, địa chỉ build TikZ.
- `chung/fb.js` — kết nối Firebase duy nhất (đăng nhập Google, Firestore có bộ nhớ đệm trên máy).
- `chung/kho-du-lieu.js` — đọc/ghi kho, build TikZ gọi thẳng tikz-fly, bản nháp IndexedDB.
- `chung/ai.js` — gọi thẳng Gemini / OpenAI / Claude / DeepSeek; key lưu ở Firestore `caiDat/ai`.
- `chuyen-du-lieu.html` — chép một lần toàn bộ hình + macro từ bản MathTikZ Pro cũ.

## Firestore
| Đường dẫn | Nội dung |
|---|---|
| `hinh/{id}` | tên, loại, khối, chủ đề, từ khóa, mô tả, createdAt, updatedAt |
| `ma/{id}` | `source` (mã TikZ), `v` |
| `anh/{id}` | `data` (ảnh data URL), `v` = updatedAt khi build |
| `caiDat/chung` | `macros` |
| `caiDat/ai` | hãng đang dùng, Base URL, model, API key |

## Firestore Rules (chỉ chủ kho đọc/ghi)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email == 'truongtronghuu1990@gmail.com'
        && request.auth.token.email_verified == true;
    }
  }
}
```

## Cài đặt lần đầu
1. Firebase Console: tạo dự án, thêm Web app, bật Authentication → Google, thêm `tthuu-pixel.github.io` vào Authorized domains, tạo Firestore (asia-southeast1) và dán Rules ở trên.
2. Dán `firebaseConfig` vào `chung/cau-hinh.js`.
3. GitHub → Settings → Pages → Deploy from branch `main`, thư mục `/ (root)`.
4. Mở web, đăng nhập Google → Cài đặt: nhập API key AI → Chuyển dữ liệu từ bản cũ (nếu cần).
