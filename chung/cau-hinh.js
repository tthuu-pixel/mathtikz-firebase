/* Cấu hình MATHTIKZ (bản Firebase, dùng cá nhân). */
window.CAU_HINH = {
  TEN_SAN_PHAM: 'MATHTIKZ',
  KHAU_HIEU: 'Dữ liệu Hình TikZ · Vẽ theo đề bài',
  // Chỉ email này được đăng nhập. Firestore Rules chặn mọi email khác ở phía Google.
  EMAIL_CHU: 'truongtronghuu1990@gmail.com',
  BUILD_TIKZ_URL: 'https://tikz-fly.fly.dev/compile',
  // Dán đoạn firebaseConfig lấy ở Firebase Console → Project settings → Your apps.
  FIREBASE: {
    apiKey: 'AIzaSyB-gwYkvNnyPfOCFfGcHWumdxZ4Zrq4DTw',
    authDomain: 'mathtikz.firebaseapp.com',
    projectId: 'mathtikz',
    storageBucket: 'mathtikz.firebasestorage.app',
    messagingSenderId: '655334175187',
    appId: '1:655334175187:web:7187e0e18675c2aba87f26'
  },
  // Máy chủ Apps Script của MathTikZ-Pro (bản cũ) — dùng cho Đồng bộ trong Cài đặt.
  API_CU: 'https://script.google.com/macros/s/AKfycbwq05LCZrGJ6Rh5oeHE2z9fS0LYK8uqosRyObMOd_PxUILD0U-QL-tlArQFcvLVDdVV/exec'
};
/* Lời hứa "Firebase đã sẵn sàng" — chung/fb.js gọi __fbXong khi khởi tạo xong. */
window.FBSanSang = new Promise(function (ok, no) { window.__fbXong = ok; window.__fbLoi = no; });
