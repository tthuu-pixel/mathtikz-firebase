(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var nut = $('gui'), nutMk = $('dn-mk'), loi = $('loi'), bao = $('bao');
  function baoLoi(t) { loi.textContent = t; loi.hidden = !t; if (t) bao.hidden = true; }
  function baoTin(t) { bao.textContent = t; bao.hidden = !t; if (t) loi.hidden = true; }
  function khoa(v) { nut.disabled = nutMk.disabled = $('quen-mk').disabled = v; }
  if (/[?&]het=1/.test(location.search)) baoLoi('Tài khoản chưa được cấp quyền, đã bị khóa hoặc phiên đã hết. Hãy đăng nhập lại hoặc liên hệ chủ kho.');
  try { var cu = localStorage.getItem('mtk_email'); if (cu) $('email').value = cu; } catch (e) {}
  window.FBSanSang.catch(function (e) { baoLoi('Không khởi động được Firebase: ' + (e && e.message || e)); khoa(true); });

  function thongDiep(e) {
    var ma = e && e.code || '';
    return ({
      'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
      'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
      'auth/user-not-found': 'Email hoặc mật khẩu không đúng.',
      'auth/invalid-email': 'Email không hợp lệ.',
      'auth/user-disabled': 'Tài khoản này đã bị tắt.',
      'auth/too-many-requests': 'Thử sai quá nhiều lần. Hãy đợi vài phút hoặc bấm "Quên mật khẩu?".',
      'auth/network-request-failed': 'Không có mạng hoặc mạng chặn Firebase. Kiểm tra kết nối rồi thử lại.',
      'auth/popup-blocked': 'Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép cửa sổ bật lên (popup) cho trang này rồi bấm lại.',
      'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào Firebase → Authentication → Settings → Authorized domains.',
      'auth/operation-not-allowed': 'Chưa bật cách đăng nhập này trong Firebase → Authentication → Sign-in method.'
    })[ma] || (e && e.message || String(e));
  }

  nut.onclick = async function () {
    khoa(true); baoLoi('');
    try { await DangNhap.dangNhap(); DangNhap.veThuVien(); }
    catch (e) {
      var ma = e && e.code || '';
      if (ma === 'auth/popup-closed-by-user' || ma === 'auth/cancelled-popup-request') baoLoi('');
      else baoLoi(thongDiep(e));
    } finally { khoa(false); }
  };

  $('form-mk').onsubmit = async function (ev) {
    ev.preventDefault();
    var email = $('email').value.trim(), mk = $('mat-khau').value;
    if (!email || !mk) { baoLoi('Nhập email và mật khẩu.'); return; }
    khoa(true); baoLoi('');
    try {
      await DangNhap.dangNhapMatKhau(email, mk);
      try { localStorage.setItem('mtk_email', email); } catch (e) {}
      DangNhap.veThuVien();
    } catch (e) { baoLoi(thongDiep(e)); $('mat-khau').select(); }
    finally { khoa(false); }
  };

  $('quen-mk').onclick = async function () {
    var email = $('email').value.trim();
    if (!email) { baoLoi('Nhập email của bạn vào ô Email rồi bấm "Quên mật khẩu?".'); $('email').focus(); return; }
    khoa(true);
    try { await DangNhap.guiDatLaiMatKhau(email); baoTin('Nếu email này có tài khoản, Firebase đã gửi thư đặt lại mật khẩu tới ' + email + '. Kiểm tra cả mục Thư rác.'); }
    catch (e) { baoLoi(thongDiep(e)); }
    finally { khoa(false); }
  };

  $('hien-mk').onclick = function () { var o = $('mat-khau'); o.type = o.type === 'password' ? 'text' : 'password'; this.setAttribute('aria-label', o.type === 'password' ? 'Hiện mật khẩu' : 'Ẩn mật khẩu'); };
})();
