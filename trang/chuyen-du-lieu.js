(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); }, dung = false, token = '';
  function ghiLog(t) { var el = $('nhat-ky'); el.textContent += t + '\n'; el.scrollTop = el.scrollHeight; }
  async function goiCu(hd, d) {
    var r = await fetch(CAU_HINH.API_CU, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(Object.assign({ hd: hd, token: token }, d || {})), redirect: 'follow', signal: AbortSignal.timeout(120000) });
    var kq = await r.json();
    if (!kq || !kq.ok) throw Error(kq && kq.loi || 'Máy chủ cũ không trả dữ liệu.');
    return kq;
  }
  async function chepMot(meta, ghiDe) {
    var id = meta.id;
    if (!ghiDe && await FB.get('hinh/' + id)) return 'bỏ qua (đã có)';
    var x = (await goiCu('docHinh', { id: id })).item, source = Tikz.tach(x.source), image = x.image || '';
    if (!image) image = await Kho.build(source);
    if (image.length > 900000) throw Error('ảnh quá lớn');
    var v = x.updatedAt || new Date().toISOString();
    await FB.ghiNhieu([
      { path: 'hinh/' + id, data: { title: String(x.title || 'Hình').slice(0, 150), kind: x.kind === 'basic' ? 'basic' : 'real', grade: String(x.grade || ''), topic: String(x.topic || ''), tags: String(x.tags || ''), description: String(x.description || ''), createdAt: x.createdAt || v, updatedAt: v } },
      { path: 'ma/' + id, data: { source: source, v: v } },
      { path: 'anh/' + id, data: { data: image, v: v } }
    ]);
    return 'đã chép' + (x.image ? '' : ' (build lại ảnh)');
  }
  $('dung').onclick = function () { dung = true; this.disabled = true; };
  $('bat-dau').onclick = async function () {
    var nut = this, ghiDe = $('ghi-de').checked, ok = 0, boQua = 0, loi = 0;
    if (!$('form-cu').reportValidity()) return;
    nut.disabled = true; $('dung').disabled = false; dung = false; $('nhat-ky').textContent = ''; HienThi.xoaLoi();
    try {
      await DangNhap.sanSang();
      ghiLog('Đăng nhập bản cũ…');
      token = (await goiCu('dangNhap', { ten: $('ten-cu').value.trim(), matKhau: $('mk-cu').value })).token;
      $('mk-cu').value = '';
      var macros = (await goiCu('docCaiDat')).macros || '';
      if (macros) { await Kho.api('luuCaiDat', { macros: macros }); ghiLog('Đã chép macro chung (' + macros.length + ' ký tự).'); }
      var ds = (await goiCu('dsHinh')).items || [];
      ghiLog('Bản cũ có ' + ds.length + ' hình.'); $('tien-do').max = Math.max(1, ds.length);
      for (var i = 0; i < ds.length && !dung; i++) {
        try { var kq = await chepMot(ds[i], ghiDe); if (/bỏ qua/.test(kq)) boQua++; else ok++; ghiLog((i + 1) + '/' + ds.length + ' · ' + ds[i].title + ': ' + kq); }
        catch (e) { loi++; ghiLog((i + 1) + '/' + ds.length + ' · ' + ds[i].title + ': LỖI ' + (e.message || e)); }
        $('tien-do').value = i + 1;
        $('tom-tat').textContent = 'Đã chép ' + ok + ' · bỏ qua ' + boQua + ' · lỗi ' + loi + ' / ' + ds.length;
      }
      ghiLog(dung ? 'Đã dừng theo yêu cầu.' : 'Hoàn tất.');
      try { await goiCu('dangXuat'); } catch (e) {}
      GiaoDien.thongBao('Chuyển dữ liệu: ' + ok + ' hình mới, ' + loi + ' lỗi.');
    } catch (e) { HienThi.loi(e); ghiLog('Dừng vì lỗi: ' + (e.message || e)); }
    finally { nut.disabled = false; $('dung').disabled = true; token = ''; }
  };
})();
