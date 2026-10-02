/* =====================================================================
   ĐĂNG NHẬP GOOGLE · BẢO VỆ TRANG · TIỆN ÍCH GIAO DIỆN
   Nhúng sau cau-hinh.js. data-trang="dang-nhap" cho index.html (không bảo vệ).
   Chỉ email CAU_HINH.EMAIL_CHU vào được; Firestore Rules chặn lần nữa ở phía Google.
   ===================================================================== */
(function () {
  'use strict';
  var CH = window.CAU_HINH || {};
  var theScript = document.currentScript;
  var TRANG = (theScript && theScript.getAttribute('data-trang')) || '';
  var KHOA_PHIEN = 'mtk_phien';

  function doc(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function ghi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function xoa(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function dungEmail(u) { return !!u && u.emailVerified !== false && String(u.email || '').toLowerCase() === String(CH.EMAIL_CHU || '').toLowerCase(); }

  // Phiên lưu trên máy để vẽ giao diện ngay; Firebase Auth xác nhận lại ngay sau đó.
  var Phien = {
    lay: function () { var p = doc(KHOA_PHIEN); return p && p.ten ? p : null; },
    luu: function (u) { ghi(KHOA_PHIEN, { ten: u.email, hoTen: u.displayName || u.email, anh: u.photoURL || '', vaiTro: 'admin' }); },
    xoa: function () { xoa(KHOA_PHIEN); }
  };

  function veDangNhap(lyDo) { location.replace('index.html' + (lyDo ? '?' + lyDo + '=1' : '')); }
  function veThuVien() { location.replace('thu-vien.html'); }

  var DangNhap = {
    GOC: './',
    phien: function () { return Phien.lay(); },
    // Chờ Firebase và tài khoản sẵn sàng (dùng trước khi đọc/ghi dữ liệu).
    sanSang: function () {
      return window.FBSanSang.then(function (FB) { return FB.nguoiDung(); }).then(function (u) {
        if (!dungEmail(u)) throw Error('Chưa đăng nhập đúng tài khoản.');
        return u;
      });
    },
    dangNhap: function () {
      return window.FBSanSang.then(function (FB) { return FB.dangNhap(); }).then(function (u) {
        if (!dungEmail(u)) {
          return window.FB.dangXuat().then(function () { throw Error('Tài khoản ' + (u && u.email || '') + ' không có quyền vào kho này.'); });
        }
        Phien.luu(u); return u;
      });
    },
    dangXuat: function () {
      Phien.xoa();
      window.FBSanSang.then(function (FB) { return FB.dangXuat(); }).catch(function () {}).then(function () { veDangNhap('dangxuat'); });
    },
    kiemTraMayChu: function () {},
    veThuVien: veThuVien
  };

  /* ---------------- Bảo vệ trang ---------------- */
  (function baoVe() {
    if (TRANG === 'dang-nhap') {
      if (/[?&]dangxuat=1/.test(location.search)) { Phien.xoa(); return; }
      if (Phien.lay() && !/[?&]het=1/.test(location.search)) {
        DangNhap.sanSang().then(veThuVien, function () { Phien.xoa(); });
      }
      return;
    }
    if (!Phien.lay()) { veDangNhap(); return; }
    window.FBSanSang.then(function (FB) { return FB.nguoiDung(); }).then(function (u) {
      if (!dungEmail(u)) { Phien.xoa(); veDangNhap('het'); } else Phien.luu(u);
    }, function (e) {
      var el = document.getElementById('loi');
      if (el) { el.hidden = false; el.textContent = 'Không khởi động được Firebase: ' + (e && e.message || e); }
    });
  })();

  /* ---------------- Tiện ích giao diện ---------------- */
  var LOGO = '<img class="logo" src="favicon.svg" alt="">';
  var TEN_VAI_TRO = { admin: 'Chủ kho' };
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
        '<a class="thuong-hieu" href="thu-vien.html">' + LOGO +
        '<span>' + thoatHtml(tuyChon.tieuDe || CH.TEN_SAN_PHAM) + '<small>' + thoatHtml(tuyChon.phuDe || CH.KHAU_HIEU) + '</small></span></a>' +
        '<span class="gian"></span>' +
        '<span class="nguoi-dung"><span class="ten-nd"><b>' + thoatHtml(p.hoTen || '') + '</b></span>' +
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
