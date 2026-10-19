/* =====================================================================
   ĐĂNG NHẬP · PHÂN QUYỀN · BẢO VỆ TRANG · TIỆN ÍCH GIAO DIỆN
   Chủ kho (CAU_HINH.EMAIL_CHU) đăng nhập bằng Google, có mọi quyền.
   Tài khoản khác: email + mật khẩu do chủ kho tạo; quyền đọc ở nguoiDung/{uid}.quyen
   = { xem, tai, ai, sua }. Firestore Rules kiểm tra lại các quyền này phía Google.
   ===================================================================== */
(function () {
  'use strict';
  var CH = window.CAU_HINH || {};
  var theScript = document.currentScript;
  var TRANG = (theScript && theScript.getAttribute('data-trang')) || '';
  var KHOA_PHIEN = 'mtk_phien';
  var DU_QUYEN = { xem: true, tai: true, ai: true, sua: true };
  // Trang nào cần quyền gì (theo body[data-trang]).
  var CAN = { kho: ['xem'], ve: ['ai', 'tai'], quet: ['ai', 'sua'], 'quan-tri': ['chu'] };

  function doc(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function ghi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function xoa(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function laChu(u) { return !!u && u.emailVerified !== false && String(u.email || '').toLowerCase() === String(CH.EMAIL_CHU || '').toLowerCase(); }

  var Phien = {
    lay: function () { var p = doc(KHOA_PHIEN); return p && p.ten ? p : null; },
    luu: function (p) { ghi(KHOA_PHIEN, p); },
    xoa: function () { xoa(KHOA_PHIEN); }
  };

  // Hồ sơ + quyền của tài khoản đang đăng nhập; null nếu chưa được cấp quyền hoặc bị khóa.
  async function hoSo(u) {
    if (!u) return null;
    if (laChu(u)) return { uid: u.uid, ten: u.email, hoTen: u.displayName || u.email, anh: u.photoURL || '', vaiTro: 'admin', quyen: DU_QUYEN };
    var d = null;
    try { d = await window.FB.get('nguoiDung/' + u.uid); } catch (e) { d = null; }
    if (!d || d.khoa || d.daXoa) return null;
    var q = d.quyen || {};
    return { uid: u.uid, ten: u.email, hoTen: d.hoTen || u.email, anh: '', vaiTro: 'nguoidung',
      quyen: { xem: !!(q.xem || q.tai || q.sua), tai: !!q.tai, ai: !!q.ai, sua: !!q.sua } };
  }
  function trangDau(p) { return p && p.quyen && p.quyen.xem ? 'thu-vien.html' : 'them-mau.html'; }
  function veDangNhap(lyDo) { location.replace('index.html' + (lyDo ? '?' + lyDo + '=1' : '')); }
  function veThuVien() { location.replace(trangDau(Phien.lay())); }
  function ghiLanCuoi(p) { if (p && p.vaiTro !== 'admin') window.FB.set('nguoiDung/' + p.uid, { lanCuoi: new Date().toISOString() }, true).catch(function () {}); }

  var DangNhap = {
    GOC: './',
    phien: function () { return Phien.lay(); },
    co: function (q) { var p = Phien.lay(); return !!(p && (p.vaiTro === 'admin' || (p.quyen && p.quyen[q]))); },
    laChu: function () { var p = Phien.lay(); return !!(p && p.vaiTro === 'admin'); },
    // Chờ Firebase và tài khoản sẵn sàng (dùng trước khi đọc/ghi dữ liệu).
    sanSang: function () {
      return window.FBSanSang.then(function (FB) { return FB.nguoiDung(); }).then(async function (u) {
        var p = await hoSo(u);
        if (!p) throw Error('Chưa đăng nhập hoặc tài khoản chưa được cấp quyền.');
        Phien.luu(p); return u;
      });
    },
    dangNhap: async function () {
      var FB = await window.FBSanSang, u = await FB.dangNhap(), p = await hoSo(u);
      if (!p) { await FB.dangXuat(); throw Error('Tài khoản Google ' + (u && u.email || '') + ' chưa được cấp quyền vào kho này.'); }
      Phien.luu(p); ghiLanCuoi(p); return u;
    },
    dangNhapMatKhau: async function (email, mk) {
      var FB = await window.FBSanSang, u = await FB.dangNhapMatKhau(String(email || '').trim(), mk), p = await hoSo(u);
      if (!p) { await FB.dangXuat(); throw Error('Tài khoản này chưa được cấp quyền hoặc đang bị khóa. Hãy liên hệ chủ kho.'); }
      Phien.luu(p); ghiLanCuoi(p); return u;
    },
    guiDatLaiMatKhau: async function (email) { var FB = await window.FBSanSang; return FB.guiDatLaiMatKhau(String(email || '').trim()); },
    dangXuat: function () {
      Phien.xoa();
      window.FBSanSang.then(function (FB) { return FB.dangXuat(); }).catch(function () {}).then(function () { veDangNhap('dangxuat'); });
    },
    kiemTraMayChu: function () {},
    veThuVien: veThuVien
  };

  /* ---------------- Bảo vệ trang ---------------- */
  function thieuQuyen(p) {
    var can = CAN[document.body && document.body.dataset.trang] || [];
    return can.filter(function (q) { return q === 'chu' ? p.vaiTro !== 'admin' : !(p.vaiTro === 'admin' || p.quyen[q]); });
  }
  function chanTrang(thieu) {
    var ten = { xem: 'Xem', tai: 'Tải', ai: 'AI', sua: 'Sửa kho', chu: 'Chủ kho' };
    var main = document.querySelector('main.noi-dung');
    if (main) main.innerHTML = '<div class="trong"><h2>Bạn chưa có quyền dùng trang này</h2><p>Cần quyền: ' + thieu.map(function (q) { return ten[q]; }).join(', ') + '. Hãy liên hệ chủ kho để được cấp.</p><a class="nut chinh" href="' + trangDau(Phien.lay()) + '">Về trang chính</a></div>';
  }
  (function baoVe() {
    if (TRANG === 'dang-nhap') {
      if (/[?&]dangxuat=1/.test(location.search)) { Phien.xoa(); return; }
      if (Phien.lay() && !/[?&]het=1/.test(location.search)) DangNhap.sanSang().then(veThuVien, function () { Phien.xoa(); });
      return;
    }
    if (!Phien.lay()) { veDangNhap(); return; }
    var p0 = Phien.lay();
    document.addEventListener('DOMContentLoaded', function () { var t = thieuQuyen(p0); if (t.length) chanTrang(t); });
    DangNhap.sanSang().then(function () {
      var p = Phien.lay(), t = thieuQuyen(p);
      if (JSON.stringify(p.quyen) !== JSON.stringify(p0.quyen) && document.readyState !== 'loading') location.reload();
      else if (t.length) chanTrang(t);
    }, function (e) {
      if (/cấp quyền|Chưa đăng nhập/.test(e.message)) { Phien.xoa(); veDangNhap('het'); return; }
      var el = document.getElementById('loi');
      if (el) { el.hidden = false; el.textContent = 'Không khởi động được Firebase: ' + (e && e.message || e); }
    });
  })();

  /* ---------------- Tiện ích giao diện ---------------- */
  var LOGO = '<img class="logo" src="favicon.svg" alt="">';
  var TEN_VAI_TRO = { admin: 'Chủ kho', nguoidung: 'Thành viên' };
  function thoatHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var GiaoDien = {
    LOGO: LOGO,
    TEN_VAI_TRO: TEN_VAI_TRO,
    thoat: thoatHtml,
    thanhTren: function (tuyChon) {
      tuyChon = tuyChon || {};
      var el = document.getElementById('thanh-tren'); if (!el) return;
      var p = Phien.lay() || {};
      el.className = 'thanh-tren';
      el.innerHTML =
        '<a class="thuong-hieu" href="' + trangDau(p) + '">' + LOGO +
        '<span>' + thoatHtml(tuyChon.tieuDe || CH.TEN_SAN_PHAM) + '<small>' + thoatHtml(tuyChon.phuDe || CH.KHAU_HIEU) + '</small></span></a>' +
        '<span class="gian"></span>' +
        '<span class="nguoi-dung"><span class="ten-nd"><b>' + thoatHtml(p.hoTen || '') + '</b></span>' +
        '<span class="huy-hieu">' + thoatHtml(TEN_VAI_TRO[p.vaiTro] || '') + '</span>' +
        '<button class="nut nho" id="nut-dang-xuat">Đăng xuất</button></span>';
      document.getElementById('nut-dang-xuat').onclick = DangNhap.dangXuat;
    },
    thongBao: function (noiDung, kieu) {
      var el = document.getElementById('thong-bao');
      if (!el) { el = document.createElement('div'); el.id = 'thong-bao'; document.body.appendChild(el); }
      el.textContent = noiDung; el.className = 'hien ' + (kieu || '');
      clearTimeout(el._t); el._t = setTimeout(function () { el.className = ''; }, 2600);
    }
  };

  window.API = { chayThu: false };
  window.DangNhap = DangNhap;
  window.GiaoDien = GiaoDien;
})();
