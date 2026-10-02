/* Đồng bộ 2 chiều MATHTIKZ (Firebase) ↔ MathTikZ-Pro (Drive + Apps Script).
   Mỗi hình trong Firebase giữ hinh/{id}.dongBo = { idCu, cu, moi }:
     idCu = id bên bản cũ, cu = updatedAt bên cũ lúc đồng bộ, moi = updatedAt bên Firebase lúc đồng bộ.
   Lần sau: bên nào đổi so với mốc thì chép sang bên kia; cả hai đổi → giữ bản sửa sau cùng.
   caiDat/dongBo = { daXoa: [idCu đã xóa ở Firebase], macro: macro lúc đồng bộ, lanCuoi } */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById('db-' + id); };
  if (!$('chay')) return;
  var KHOA_TOKEN = 'mtk_token_cu', KHOA_TEN = 'mtk_ten_cu', token = '', dung = false;
  try { token = sessionStorage.getItem(KHOA_TOKEN) || ''; $('ten').value = localStorage.getItem(KHOA_TEN) || 'admin'; } catch (e) { $('ten').value = 'admin'; }

  function ghi(t) { var el = $('nhat-ky'); el.hidden = false; el.textContent += t + '\n'; el.scrollTop = el.scrollHeight; }
  function cho(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function gio(s) { var d = new Date(s); return isNaN(d) ? '' : d.toLocaleString('vi-VN'); }

  async function goiCu(hd, d) {
    var r;
    try {
      r = await fetch(CAU_HINH.API_CU, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(Object.assign({ hd: hd, token: token }, d || {})), redirect: 'follow', signal: AbortSignal.timeout(150000) });
    } catch (e) { throw Error('Không kết nối được MathTikZ-Pro: ' + (e.message || e)); }
    var kq; try { kq = await r.json(); } catch (e) { throw Error('MathTikZ-Pro trả dữ liệu lạ (HTTP ' + r.status + ').'); }
    if (kq && kq.hetPhien) { token = ''; try { sessionStorage.removeItem(KHOA_TOKEN); } catch (e) {} throw Error('Phiên MathTikZ-Pro đã hết. Nhập lại mật khẩu rồi bấm Đồng bộ.'); }
    if (!kq || !kq.ok) throw Error(kq && kq.loi || 'MathTikZ-Pro không trả dữ liệu.');
    return kq;
  }
  // Bản cũ giới hạn 10 lần lưu/phút: gặp giới hạn thì chờ 1 phút rồi thử lại.
  async function goiCuThu(hd, d) {
    for (var lan = 0; ; lan++) {
      try { return await goiCu(hd, d); }
      catch (e) {
        if (lan < 2 && /nhiều yêu cầu/i.test(e.message)) { ghi('   … MathTikZ-Pro báo quá nhiều yêu cầu, chờ 1 phút rồi thử lại'); await cho(61000); continue; }
        throw e;
      }
    }
  }
  async function dangNhapCu() {
    if (token) { try { await goiCu('kiemTra'); return; } catch (e) { token = ''; } }
    var mk = $('mk').value;
    if (!mk) throw Error('Nhập mật khẩu MathTikZ-Pro (bản cũ) để đồng bộ.');
    var ten = $('ten').value.trim();
    token = (await goiCu('dangNhap', { ten: ten, matKhau: mk })).token;
    $('mk').value = '';
    try { sessionStorage.setItem(KHOA_TOKEN, token); localStorage.setItem(KHOA_TEN, ten); } catch (e) {}
  }
  function sau(a, b) { return String(a || '') > String(b || ''); }

  async function lapKeHoach() {
    var FB = window.FB;
    var cu = (await goiCu('dsHinh')).items || [], moi = await FB.ds('hinh'), db = (await FB.get('caiDat/dongBo')) || {};
    var daXoa = {}; (db.daXoa || []).forEach(function (x) { daXoa[x] = 1; });
    var theoIdCu = {}; moi.forEach(function (m) { theoIdCu[(m.dongBo && m.dongBo.idCu) || m.id] = m; });
    var kh = { keoVe: [], dayLen: [], ganMoc: [], giong: 0, xungDot: [], boQua: 0 };
    cu.forEach(function (o) {
      var m = theoIdCu[o.id];
      if (!m) { if (daXoa[o.id]) kh.boQua++; else kh.keoVe.push({ cu: o, moi: null, ly: 'mới bên MathTikZ-Pro' }); return; }
      m._ghep = true;
      var d = m.dongBo;
      if (!d) {
        if (m.updatedAt === o.updatedAt) { kh.ganMoc.push({ cu: o, moi: m }); kh.giong++; }
        else if (sau(o.updatedAt, m.updatedAt)) kh.keoVe.push({ cu: o, moi: m, ly: 'bản MathTikZ-Pro mới hơn' });
        else kh.dayLen.push({ cu: o, moi: m, ly: 'bản Firebase mới hơn' });
        return;
      }
      var doiCu = o.updatedAt !== d.cu, doiMoi = m.updatedAt !== d.moi;
      if (!doiCu && !doiMoi) { kh.giong++; return; }
      if (doiCu && !doiMoi) kh.keoVe.push({ cu: o, moi: m, ly: 'sửa bên MathTikZ-Pro' });
      else if (!doiCu && doiMoi) kh.dayLen.push({ cu: o, moi: m, ly: 'sửa bên Firebase' });
      else {
        kh.xungDot.push(m.title);
        (sau(o.updatedAt, m.updatedAt) ? kh.keoVe : kh.dayLen).push({ cu: o, moi: m, ly: 'cả hai bên đều sửa → giữ bản sửa sau cùng' });
      }
    });
    moi.forEach(function (m) { if (!m._ghep) kh.dayLen.push({ cu: null, moi: m, ly: 'mới bên Firebase' }); });
    // Macro chung
    var mCu = (await goiCu('docCaiDat')).macros || '', c = await FB.get('caiDat/chung'), mMoi = c && c.macros || '', moc = db.macro;
    kh.macro = { cu: mCu, moi: mMoi, huong: '' };
    if (mCu !== mMoi) {
      if (typeof moc !== 'string') kh.macro.huong = !mMoi ? 'keo' : 'day';
      else if (mCu !== moc && mMoi === moc) kh.macro.huong = 'keo';
      else kh.macro.huong = 'day';
    }
    kh.db = db;
    return kh;
  }

  async function keoVe(x) {
    var FB = window.FB, it = (await goiCu('docHinh', { id: x.cu.id })).item, source = Tikz.tach(it.source);
    var image = it.image || await Kho.build(source);
    if (image.length > 900000) throw Error('ảnh quá lớn để lưu');
    var id = x.moi ? x.moi.id : x.cu.id, bay = new Date().toISOString(), grade = ['6', '7', '8', '9'].indexOf(String(it.grade)) >= 0 ? String(it.grade) : '';
    await FB.ghiNhieu([
      { path: 'hinh/' + id, data: { title: String(it.title || 'Hình').slice(0, 150), kind: it.kind === 'basic' ? 'basic' : 'real', grade: grade,
        topic: String(it.topic || '').slice(0, 100), tags: String(it.tags || '').slice(0, 500), description: String(it.description || '').slice(0, 1000),
        createdAt: (x.moi && x.moi.createdAt) || it.createdAt || bay, updatedAt: bay, dongBo: { idCu: x.cu.id, cu: x.cu.updatedAt, moi: bay } } },
      { path: 'ma/' + id, data: { source: source, v: bay } },
      { path: 'anh/' + id, data: { data: image, v: bay } }
    ]);
  }
  async function dayLen(x) {
    var m = await Kho.doc(x.moi.id);
    if (m.kind === 'basic' && !m.grade) throw Error('hình toán cơ bản chưa có khối lớp (MathTikZ-Pro bắt buộc)');
    var kq = await goiCuThu('luuHinh', { item: { id: x.cu ? x.cu.id : '', title: m.title, kind: m.kind, grade: m.grade || '', topic: m.topic || '',
      tags: m.tags || '', description: m.description || '', source: m.source, updatedAtServer: x.cu ? x.cu.updatedAt : undefined } });
    var it = kq.item;
    await window.FB.set('hinh/' + m.id, { dongBo: { idCu: it.id, cu: it.updatedAtServer || it.updatedAt, moi: x.moi.updatedAt } }, true);
  }

  async function hienLanCuoi() {
    try { await DangNhap.sanSang(); var db = await window.FB.get('caiDat/dongBo'); $('tom-tat').textContent = db && db.lanCuoi ? 'Lần đồng bộ gần nhất: ' + gio(db.lanCuoi) + (db.ketQua ? ' · ' + db.ketQua : '') : 'Chưa đồng bộ lần nào.'; } catch (e) {}
  }

  $('dung').onclick = function () { dung = true; this.disabled = true; ghi('Sẽ dừng sau hình đang xử lý…'); };
  $('chay').onclick = async function () {
    var nut = this; nut.disabled = true; dung = false; $('nhat-ky').textContent = ''; HienThi.xoaLoi();
    var ok = 0, loi = 0;
    try {
      await DangNhap.sanSang();
      ghi('Kết nối MathTikZ-Pro…'); await dangNhapCu();
      ghi('So sánh hai kho…'); var kh = await lapKeHoach();
      var mo = kh.macro.huong === 'keo' ? 'lấy macro từ MathTikZ-Pro' : kh.macro.huong === 'day' ? 'đẩy macro lên MathTikZ-Pro' : 'macro giống nhau';
      var tom = 'Lấy về: ' + kh.keoVe.length + ' hình\nĐẩy lên MathTikZ-Pro: ' + kh.dayLen.length + ' hình\nĐã giống nhau: ' + kh.giong + ' hình\nMacro: ' + mo +
        (kh.boQua ? '\nBỏ qua ' + kh.boQua + ' hình đã xóa ở Firebase (vẫn còn trên Drive)' : '') +
        (kh.xungDot.length ? '\nCả hai bên cùng sửa (giữ bản sau cùng): ' + kh.xungDot.join(', ') : '');
      ghi(tom);
      var viec = kh.keoVe.length + kh.dayLen.length + (kh.macro.huong ? 1 : 0);
      if (!viec) { ghi('Hai kho đã giống nhau, không cần làm gì.'); }
      else if (!confirm('Kế hoạch đồng bộ:\n\n' + tom + (kh.dayLen.length > 10 ? '\n\nĐẩy nhiều hình sẽ mất vài phút (MathTikZ-Pro nhận tối đa 10 lần lưu/phút).' : '') + '\n\nTiếp tục?')) { ghi('Đã hủy.'); return; }
      var FB = window.FB;
      for (var i = 0; i < kh.ganMoc.length; i++) { var g = kh.ganMoc[i]; await FB.set('hinh/' + g.moi.id, { dongBo: { idCu: g.cu.id, cu: g.cu.updatedAt, moi: g.moi.updatedAt } }, true); }
      var tong = kh.keoVe.length + kh.dayLen.length, xong = 0;
      $('tien-do').hidden = false; $('tien-do').max = Math.max(1, tong); $('tien-do').value = 0; $('dung').disabled = !tong;
      for (var a = 0; a < kh.keoVe.length && !dung; a++) {
        var x = kh.keoVe[a], ten = x.cu.title;
        try { await keoVe(x); ok++; ghi('↓ ' + ten + ' (' + x.ly + ')'); } catch (e) { loi++; ghi('✗ ' + ten + ': ' + (e.message || e)); }
        $('tien-do').value = ++xong;
      }
      for (var b = 0; b < kh.dayLen.length && !dung; b++) {
        var y = kh.dayLen[b];
        try { await dayLen(y); ok++; ghi('↑ ' + y.moi.title + ' (' + y.ly + ')'); } catch (e) { loi++; ghi('✗ ' + y.moi.title + ': ' + (e.message || e)); }
        $('tien-do').value = ++xong;
        if (b < kh.dayLen.length - 1 && !dung) await cho(6500);
      }
      var macroMoc = kh.macro.huong === 'keo' ? kh.macro.cu : kh.macro.moi;
      if (kh.macro.huong === 'keo') { await Kho.api('luuCaiDat', { macros: kh.macro.cu }); ghi('↓ Macro chung'); }
      else if (kh.macro.huong === 'day') { await goiCuThu('luuCaiDat', { macros: kh.macro.moi }); ghi('↑ Macro chung'); }
      var ketQua = ok + ' hình đã chép' + (loi ? ', ' + loi + ' lỗi' : '') + (dung ? ' (đã dừng giữa chừng)' : '');
      await FB.set('caiDat/dongBo', { macro: macroMoc, lanCuoi: new Date().toISOString(), ketQua: ketQua }, true);
      ghi(dung ? 'Đã dừng. ' + ketQua : 'Hoàn tất: ' + ketQua + '.');
      GiaoDien.thongBao('Đồng bộ: ' + ketQua + '.');
      hienLanCuoi();
    } catch (e) { HienThi.loi(e); ghi('Dừng vì lỗi: ' + (e.message || e)); }
    finally { nut.disabled = false; $('dung').disabled = true; }
  };
  hienLanCuoi();
})();
