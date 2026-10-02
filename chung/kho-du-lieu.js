/* Kho dữ liệu: Firestore (đồng bộ mọi máy) + bản nháp IndexedDB (chỉ máy này).
   Firestore:  hinh/{id}  thông tin hình (nhẹ, dùng cho danh sách)
               ma/{id}    { source, v }      mã TikZ
               anh/{id}   { data, v }        ảnh data URL; v = updatedAt để biết ảnh còn mới
               caiDat/chung { macros }       caiDat/ai (xem chung/ai.js)            */
(function () {
  'use strict';
  /* ---------- Bản nháp trên máy (IndexedDB) ---------- */
  var promise;
  function db() { if (!promise) promise = new Promise(function (ok, no) { var r = indexedDB.open('mathtikz-static', 1); r.onupgradeneeded = function () { r.result.createObjectStore('samples', { keyPath: 'id' }); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); return promise; }
  function read(id) { return db().then(function (d) { return new Promise(function (ok, no) { var r = d.transaction('samples').objectStore('samples')[id ? 'get' : 'getAll'](id); r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); }); }
  function put(item) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('samples', 'readwrite'); t.objectStore('samples').put(item); t.oncomplete = function () { ok(item); }; t.onerror = function () { no(t.error); }; t.onabort = function () { no(t.error || Error('Không lưu được bản nháp.')); }; }); }); }
  function xoaNhap(id) { return db().then(function (d) { return new Promise(function (ok) { var t = d.transaction('samples', 'readwrite'); t.objectStore('samples').delete(id); t.oncomplete = function () { ok(); }; t.onerror = function () { ok(); }; }); }); }
  function laNhap(id) { return String(id || '').indexOf('nhap-') === 0; }
  function moiTruoc(a, b) { return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')); }

  async function san() { await DangNhap.sanSang(); return window.FB; }

  /* ---------- Macro chung ---------- */
  var macroCache = null;
  async function macro() { if (macroCache !== null) return macroCache; var FB = await san(); var d = await FB.get('caiDat/chung'); return (macroCache = (d && d.macros) || ''); }

  /* ---------- Build TikZ (trình duyệt gọi thẳng dịch vụ) ---------- */
  async function thuBuild(source) {
    var pure = Tikz.tach(source);
    if (source.indexOf('\\documentclass') >= 0) throw Error('Chỉ nhập mã hình; đặt macro trong phần Cài đặt.');
    var r, text;
    try {
      r = await fetch(CAU_HINH.BUILD_TIKZ_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: Tikz.boc(pure, await macro()) }), signal: AbortSignal.timeout(95000) });
    } catch (e) { throw Error('Không gọi được dịch vụ build TikZ: ' + (e.message || e)); }
    var type = r.headers.get('content-type') || '';
    if (type.indexOf('json') >= 0 || !r.ok) {
      text = await r.text();
      if (!r.ok) return { ok: false, loi: Tikz.loiBuild(text) };
      var d; try { d = JSON.parse(text); } catch (e) { return { ok: false, loi: Tikz.loiBuild(text) }; }
      var b = d.image_base64 || d.base64 || d.image || d.png || d.png_base64 || d.result && d.result.base64 || d.output && d.output.base64;
      if (!b || typeof b !== 'string') return { ok: false, loi: Tikz.loiBuild(text) };
      return { ok: true, image: b.indexOf('data:image/') === 0 ? b : 'data:image/png;base64,' + b };
    }
    var blob = await r.blob();
    if (blob.type.indexOf('image/') !== 0) return { ok: false, loi: 'Dịch vụ build không trả ảnh hợp lệ.' };
    var url = await new Promise(function (ok, no) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = no; f.readAsDataURL(blob); });
    return { ok: true, image: url };
  }
  async function build(source) { var kq = await thuBuild(source); if (!kq.ok) throw Error('Build lỗi:\n' + kq.loi); return kq.image; }

  /* ---------- Đọc kho ---------- */
  async function danhSach() {
    var FB = await san(), remote = (await FB.ds('hinh')).sort(moiTruoc), drafts = await read();
    return drafts.concat(remote);
  }
  // Theo dõi kho: gọi cb ngay với dữ liệu đệm trên máy, rồi gọi lại khi có thay đổi.
  async function theoDoi(cb, loi) {
    var FB = await san(), drafts = await read();
    return FB.theoDoi('hinh', function (ds) { cb(drafts.concat(ds.sort(moiTruoc))); }, loi);
  }
  async function anh(item) {
    if (item.image) return item.image;
    if (laNhap(item.id)) return '';
    var FB = await san(), c = await FB.getCache('anh/' + item.id);
    if (c && c.v === item.updatedAt) return c.data || '';
    var d = await FB.get('anh/' + item.id);
    return d && d.data || '';
  }
  async function doc(id) {
    if (laNhap(id)) { var local = await read(id); if (!local) throw Error('Không tìm thấy bản nháp trên máy.'); return local; }
    var FB = await san(), kq = await Promise.all([FB.get('hinh/' + id), FB.get('ma/' + id), FB.get('anh/' + id)]);
    if (!kq[0]) throw Error('Không tìm thấy hình trong kho.');
    var source = kq[1] && kq[1].source || '', a = kq[2] || {};
    return Object.assign({ id: id }, kq[0], { source: source, image: a.data || '', imageSource: a.data && a.v === kq[0].updatedAt ? source : '', updatedAtServer: kq[0].updatedAt });
  }

  /* ---------- Ghi kho ---------- */
  async function luu(item) {
    var title = String(item.title || '').trim();
    if (!title || title.length > 150) throw Error('Tên hình không hợp lệ (1–150 ký tự).');
    if (['real', 'basic'].indexOf(item.kind) < 0) throw Error('Loại hình không hợp lệ.');
    var grade = String(item.grade || '');
    if (grade && ['6', '7', '8', '9'].indexOf(grade) < 0 || item.kind === 'basic' && !grade) throw Error('Hình toán cơ bản cần chọn khối lớp.');
    var source = Tikz.tach(item.source);
    var image = item.image && item.imageSource === item.source ? item.image : await build(source);
    if (image.length > 900000) throw Error('Ảnh quá lớn để lưu (tối đa ~650 KB). Hãy thu nhỏ hình.');
    var id = item.driveId || String(item.id || '').replace(/^nhap-/, '') || (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36));
    var FB = await san(), cu = await FB.get('hinh/' + id), bay = new Date().toISOString();
    var meta = { title: title, kind: item.kind, grade: grade, topic: String(item.topic || '').slice(0, 100), tags: String(item.tags || '').slice(0, 500),
      description: String(item.description || '').slice(0, 1000), createdAt: cu && cu.createdAt || bay, updatedAt: bay };
    await FB.ghiNhieu([{ path: 'hinh/' + id, data: meta }, { path: 'ma/' + id, data: { source: source, v: bay } }, { path: 'anh/' + id, data: { data: image, v: bay } }]);
    xoaNhap('nhap-' + id);
    if (laNhap(item.id)) xoaNhap(item.id);
    return Object.assign({ id: id }, meta, { source: source, image: image, imageSource: source, updatedAtServer: bay });
  }
  async function xoa(id) {
    if (laNhap(id)) return xoaNhap(id);
    var FB = await san();
    await FB.ghiNhieu([{ path: 'hinh/' + id, xoa: true }, { path: 'ma/' + id, xoa: true }, { path: 'anh/' + id, xoa: true }]);
  }

  /* ---------- Các lệnh trước đây gửi lên Apps Script, nay chạy ngay trên máy ---------- */
  async function api(action, data) {
    data = data || {};
    switch (action) {
      case 'docAI': return { ok: true, ai: await AIKetNoi.doc() };
      case 'luuAI': return { ok: true, ai: await AIKetNoi.luu(data) };
      case 'thuAI': await AIKetNoi.thu(data.provider); return { ok: true };
      case 'dsModelAI': return { ok: true, models: await AIKetNoi.dsModel(data.provider) };
      case 'quetHinh': return { ok: true, result: await AIKetNoi.quetHinh(data) };
      case 'docCaiDat': return { ok: true, macros: await macro() };
      case 'luuCaiDat': {
        if (typeof data.macros !== 'string' || data.macros.length > 10000) throw Error('Macro quá dài (tối đa 10.000 ký tự).');
        var FB = await san(); await FB.set('caiDat/chung', { macros: data.macros }, true); macroCache = data.macros; return { ok: true };
      }
    }
    throw Error('Hành động không hợp lệ: ' + action);
  }

  window.Kho = {
    api: api, danhSach: danhSach, theoDoi: theoDoi, doc: doc, anh: anh, build: build, thuBuild: thuBuild, macro: macro,
    luu: luu, xoa: xoa, nhap: put, docNhap: read,
    ve: async function (prompt, ids) {
      var mau = await Promise.all((ids || []).map(async function (id) { var x = await doc(id); return { title: x.title, source: x.source }; }));
      return AIKetNoi.veTheoDe(prompt, mau);
    },
    suaMa: function (source, loi) { return AIKetNoi.suaMa(source, loi); },
    tai: function (content, name, type) { var url = URL.createObjectURL(new Blob([content], { type: type })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 3000); }
  };
})();
