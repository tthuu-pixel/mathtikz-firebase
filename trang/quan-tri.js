/* Quản trị tài khoản (chỉ chủ kho). Mỗi tài khoản: Firebase Auth (email + mật khẩu)
   + hồ sơ nguoiDung/{uid} = { email, hoTen, quyen:{xem,tai,sua}, khoa, daXoa, taoLuc, lanCuoi }. */
(async function () {
  'use strict';
  if (!DangNhap.laChu()) return;
  var $ = function (id) { return document.getElementById(id); };
  var Q = ['xem', 'tai', 'sua'], ds = [], FB;
  function node(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function gio(s) { var d = new Date(s); return !s || isNaN(d) ? 'Chưa vào lần nào' : d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
  function chuanQuyen(q, doi) {
    q = Object.assign({ xem: false, tai: false, sua: false }, q); delete q.ai;
    if (doi && !q[doi] && doi === 'xem') { q.tai = false; q.sua = false; }   // bỏ Xem thì bỏ luôn Tải, Sửa kho
    if (q.tai || q.sua) q.xem = true;                                         // Tải / Sửa kho cần Xem
    return q;
  }
  function matKhau() {
    var a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', so = new Uint32Array(10), s = '';
    crypto.getRandomValues(so); so.forEach(function (n) { s += a[n % a.length]; }); return s;
  }
  function moTa(e) {
    var ma = e && e.code || '';
    return ({
      'auth/email-already-in-use': 'Email này đã có tài khoản đăng nhập.',
      'auth/invalid-email': 'Email không hợp lệ.',
      'auth/weak-password': 'Mật khẩu quá yếu (cần ít nhất 8 ký tự).',
      'auth/operation-not-allowed': 'Chưa bật đăng nhập Email/Password: vào Firebase → Authentication → Sign-in method → Email/Password → Enable.',
      'auth/too-many-requests': 'Firebase tạm chặn vì thao tác quá nhiều. Đợi vài phút rồi thử lại.',
      'permission-denied': 'Firestore từ chối ghi. Hãy dán bộ Firestore Rules mới (trong README) rồi thử lại.'
    })[ma] || (e && e.message || String(e));
  }

  $('email-chu').textContent = CAU_HINH.EMAIL_CHU;
  $('tao-mk').value = matKhau();
  $('tao-ngau-nhien').onclick = function () { $('tao-mk').value = matKhau(); };
  // Ô quyền khi tạo: Tải / Sửa kho tự bật Xem; tắt Xem tự tắt Tải, Sửa kho.
  function oTao(q) { return document.querySelector('#tao [data-q="' + q + '"]'); }
  Q.forEach(function (q) {
    oTao(q).onchange = function () {
      var v = {}; Q.forEach(function (k) { v[k] = oTao(k).checked; });
      v = chuanQuyen(v, q); Q.forEach(function (k) { oTao(k).checked = v[k]; });
    };
  });

  /* ---------- Tạo tài khoản ---------- */
  $('tao').onsubmit = async function (ev) {
    ev.preventDefault(); HienThi.xoaLoi();
    var email = $('tao-email').value.trim().toLowerCase(), ten = $('tao-ten').value.trim(), mk = $('tao-mk').value, b = $('tao-gui');
    var quyen = {}; Q.forEach(function (k) { quyen[k] = oTao(k).checked; }); quyen = chuanQuyen(quyen);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { HienThi.loi(Error('Nhập email hợp lệ.')); return; }
    if (email === String(CAU_HINH.EMAIL_CHU).toLowerCase()) { HienThi.loi(Error('Đây là email chủ kho, đã có mọi quyền.')); return; }
    if (mk.length < 8) { HienThi.loi(Error('Mật khẩu ban đầu cần ít nhất 8 ký tự.')); return; }
    var cu = ds.filter(function (x) { return String(x.email).toLowerCase() === email; })[0];
    if (cu && !cu.daXoa) { HienThi.loi(Error('Email này đã có trong danh sách. Sửa quyền ngay trong bảng bên dưới.')); return; }
    b.disabled = true; b.textContent = 'Đang tạo…';
    try {
      var uid, khoiPhuc = false, giuMk = false;
      try { uid = await FB.taoTaiKhoan(email, mk); }
      catch (e) {
        if (!(e && e.code === 'auth/email-already-in-use')) throw e;
        if (cu) { uid = cu.id; khoiPhuc = true; giuMk = true; }
        else {
          // Có tài khoản đăng nhập nhưng chưa có hồ sơ: thử đúng mật khẩu vừa nhập để lấy uid.
          try { uid = await FB.uidTuMatKhau(email, mk); khoiPhuc = true; }
          catch (x) { throw Error('Email này đã có tài khoản đăng nhập trong Firebase nhưng chưa có trong kho. Nhập đúng mật khẩu hiện tại của tài khoản đó, hoặc xóa nó ở Firebase → Authentication → Users rồi tạo lại.'); }
        }
      }
      var hoSo = { email: email, hoTen: ten || (cu && cu.hoTen) || '', quyen: quyen, khoa: false, daXoa: false };
      if (!khoiPhuc || !cu) hoSo.taoLuc = new Date().toISOString();
      await FB.set('nguoiDung/' + uid, hoSo, true);
      var nd = 'Trang: ' + location.href.replace(/[^\/]*$/, '') + '\nEmail: ' + email + '\n' +
        (giuMk ? 'Mật khẩu: giữ mật khẩu cũ (tài khoản được khôi phục). Nếu quên, bấm "Đặt lại MK" trong bảng.' : 'Mật khẩu: ' + mk) +
        '\nQuyền: ' + Q.filter(function (k) { return quyen[k]; }).map(function (k) { return { xem: 'Xem', tai: 'Tải', sua: 'Sửa kho' }[k]; }).join(', ');
      $('xong-nd').textContent = nd; $('xong').hidden = false;
      $('tao-email').value = ''; $('tao-ten').value = ''; $('tao-mk').value = matKhau();
      GiaoDien.thongBao(khoiPhuc ? 'Đã khôi phục tài khoản ' + email + '.' : 'Đã tạo tài khoản ' + email + '.');
    } catch (e) { HienThi.loi(Error(moTa(e))); }
    finally { b.disabled = false; b.textContent = 'Tạo tài khoản'; }
  };
  $('xong-copy').onclick = async function () { try { await navigator.clipboard.writeText($('xong-nd').textContent); GiaoDien.thongBao('Đã copy.'); } catch (e) { GiaoDien.thongBao('Hãy bôi đen rồi Ctrl+C.', 'loi'); } };
  $('xong-dong').onclick = function () { $('xong').hidden = true; $('xong-nd').textContent = ''; };

  /* ---------- Bảng tài khoản ---------- */
  async function ghi(x, data, tin) {
    try { await FB.set('nguoiDung/' + x.id, data, true); Object.assign(x, data); if (tin) GiaoDien.thongBao(tin); }
    catch (e) { HienThi.loi(Error(moTa(e))); }
    ve();
  }
  function hang(x) {
    var tr = node('tr', x.khoa ? 'bi-khoa' : ''), q = chuanQuyen(x.quyen);
    var td = node('td', 'ten-tk'); td.append(node('b', '', x.hoTen || '(chưa đặt tên)'), node('small', '', x.email || x.id)); tr.append(td);
    Q.forEach(function (k) {
      var c = node('td', 'q'), o = document.createElement('input'); o.type = 'checkbox'; o.checked = !!q[k];
      o.setAttribute('aria-label', k + ' cho ' + (x.email || ''));
      o.onchange = function () { var moi = Object.assign({}, q); moi[k] = o.checked; ghi(x, { quyen: chuanQuyen(moi, k) }, 'Đã cập nhật quyền của ' + (x.hoTen || x.email) + '.'); };
      c.append(o); tr.append(c);
    });
    var tt = node('td'); tt.append(node('span', 'tt ' + (x.khoa ? 'khoa-tk' : 'mo-tk'), x.khoa ? 'Đã khóa' : 'Đang dùng')); tr.append(tt);
    tr.append(node('td', 'mo', gio(x.lanCuoi)));
    var tac = node('td'), hop = node('div', 'thao-tac');
    function nut(chu, cls, fn, tieuDe) { var b = node('button', 'nut nho' + (cls ? ' ' + cls : ''), chu); b.type = 'button'; if (tieuDe) b.title = tieuDe; b.onclick = fn; hop.append(b); return b; }
    nut('Đổi tên', '', function () { var t = prompt('Họ tên hiển thị:', x.hoTen || ''); if (t == null) return; ghi(x, { hoTen: t.trim().slice(0, 80) }, 'Đã đổi tên.'); });
    nut(x.khoa ? 'Mở khóa' : 'Khóa', '', function () { ghi(x, { khoa: !x.khoa }, x.khoa ? 'Đã mở khóa.' : 'Đã khóa: người này không vào kho được nữa.'); }, x.khoa ? 'Cho phép đăng nhập lại' : 'Tạm chặn, giữ nguyên quyền');
    nut('Đặt lại MK', '', async function () {
      if (!x.email || !confirm('Gửi email đặt lại mật khẩu tới ' + x.email + '?')) return;
      try { await FB.guiDatLaiMatKhau(x.email); GiaoDien.thongBao('Đã gửi email đặt lại mật khẩu tới ' + x.email + '.'); } catch (e) { HienThi.loi(Error(moTa(e))); }
    }, 'Firebase gửi thư có đường dẫn để người dùng tự đặt mật khẩu mới');
    nut('Xóa', 'nguy', function () { if (!confirm('Gỡ tài khoản ' + (x.email || '') + ' khỏi kho? Người này sẽ không đăng nhập vào kho được nữa.')) return; ghi(x, { daXoa: true, khoa: true }, 'Đã gỡ tài khoản khỏi kho.'); });
    tac.append(hop); tr.append(tac);
    return tr;
  }
  function ve() {
    var tim = $('tim').value.trim().toLowerCase(), con = ds.filter(function (x) { return !x.daXoa; }), body = $('ds');
    $('so-tk').textContent = con.length;
    var hien = con.filter(function (x) { return !tim || (String(x.email) + ' ' + String(x.hoTen || '')).toLowerCase().indexOf(tim) >= 0; })
      .sort(function (a, b) { return String(a.hoTen || a.email).localeCompare(String(b.hoTen || b.email), 'vi'); });
    body.replaceChildren();
    if (!hien.length) { var tr = node('tr'), td = node('td', 'trong-bang', con.length ? 'Không có tài khoản khớp tìm kiếm.' : 'Chưa có tài khoản nào. Tạo tài khoản đầu tiên ở khung phía trên.'); td.colSpan = 7; tr.append(td); body.append(tr); return; }
    hien.forEach(function (x) { body.append(hang(x)); });
  }
  $('tim').addEventListener('input', ve);

  try {
    await DangNhap.sanSang(); FB = window.FB;
    FB.theoDoi('nguoiDung', function (moi) { ds = moi; ve(); }, function (e) { HienThi.loi(Error('Không đọc được danh sách tài khoản: ' + moTa(e))); });
  } catch (e) { HienThi.loi(e); }
})();
