(function () {
  'use strict';
  var nut = document.getElementById('gui'), loi = document.getElementById('loi');
  function bao(t) { loi.textContent = t; loi.hidden = !t; }
  window.FBSanSang.catch(function (e) { bao('Không khởi động được Firebase: ' + (e && e.message || e)); nut.disabled = true; });
  nut.onclick = async function () {
    nut.disabled = true; bao('');
    try { await DangNhap.dangNhap(); DangNhap.veThuVien(); }
    catch (e) {
      var ma = e && e.code || '';
      if (ma === 'auth/popup-closed-by-user' || ma === 'auth/cancelled-popup-request') bao('');
      else if (ma === 'auth/popup-blocked') bao('Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên (popup) cho trang này rồi bấm lại.');
      else if (ma === 'auth/unauthorized-domain') bao('Tên miền này chưa được thêm vào Firebase → Authentication → Settings → Authorized domains.');
      else if (ma === 'auth/operation-not-allowed') bao('Chưa bật đăng nhập Google trong Firebase → Authentication → Sign-in method.');
      else bao(e && e.message || String(e));
    } finally { nut.disabled = false; }
  };
})();
