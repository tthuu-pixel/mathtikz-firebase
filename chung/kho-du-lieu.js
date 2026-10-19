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
  // Mỗi bản nháp gắn uid người tạo, để nhiều tài khoản dùng chung một máy không thấy nháp của nhau.
  function toi() { var p = DangNhap.phien(); return p ? p.uid : ''; }
  function cuaToi(x) { return !!x && (x.cuaAi ? x.cuaAi === toi() : DangNhap.laChu()); }
  function read(id) { return db().then(function (d) { return new Promise(function (ok, no) { var r = d.transaction('samples').objectStore('samples')[id ? 'get' : 'getAll'](id); r.onsuccess = function () { var kq = r.result; ok(id ? (cuaToi(kq) ? kq : undefined) : (kq || []).filter(cuaToi)); }; r.onerror = function () { no(r.error); }; }); }); }
  function put(item) { item = Object.assign({}, item, { cuaAi: toi() }); return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('samples', 'readwrite'); t.objectStore('samples').put(item); t.oncomplete = function () { ok(item); }; t.onerror = function () { no(t.error); }; t.onabort = function () { no(t.error || Error('Không lưu được bản nháp.')); }; }); }); }
  function xoaNhap(id) { return db().then(function (d) { return new Promise(function (ok) { var t = d.transaction('samples', 'readwrite'); t.objectStore('samples').delete(id); t.oncomplete = function () { ok(); }; t.onerror = function () { ok(); }; }); }); }
  function chuanNhom(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 60); }
  function laNhap(id) { return String(id || '').indexOf('nhap-') === 0; }
  function moiTruoc(a, b) { return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')); }

  async function san() { await DangNhap.sanSang(); return window.FB; }

  /* ---------- Macro chung ---------- */
  var chungCache = null;
  async function chung() { if (chungCache) return chungCache; var FB = await san(); return (chungCache = (await FB.get('caiDat/chung')) || {}); }
  async function macro() { return (await chung()).macros || ''; }
  // Quy tắc vẽ hình gửi cho AI (Vẽ theo đề): chủ kho sửa trong Cài đặt, để trống thì dùng mặc định.
  async function quyTacVe() { var q = (await chung()).quyTacVe; return q && q.trim() ? q : window.QUY_TAC_VE_MAC_DINH || ''; }

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
    meta.nhom = chuanNhom(item.nhom);
    if (cu && cu.dongBo) meta.dongBo = cu.dongBo;
    await FB.ghiNhieu([{ path: 'hinh/' + id, data: meta }, { path: 'ma/' + id, data: { source: source, v: bay } }, { path: 'anh/' + id, data: { data: image, v: bay } }]);
    xoaNhap('nhap-' + id);
    if (laNhap(item.id)) xoaNhap(item.id);
    return Object.assign({ id: id }, meta, { source: source, image: image, imageSource: source, updatedAtServer: bay });
  }
  async function xoa(id) {
    if (laNhap(id)) return xoaNhap(id);
    var FB = await san(), cu = await FB.get('hinh/' + id), ds = [{ path: 'hinh/' + id, xoa: true }, { path: 'ma/' + id, xoa: true }, { path: 'anh/' + id, xoa: true }];
    if (cu && cu.dongBo && cu.dongBo.idCu) {
      var db = (await FB.get('caiDat/dongBo')) || {}, daXoa = (db.daXoa || []).filter(function (x) { return x !== cu.dongBo.idCu; });
      daXoa.push(cu.dongBo.idCu);
      ds.push({ path: 'caiDat/dongBo', data: Object.assign({}, db, { daXoa: daXoa }) });
    }
    await FB.ghiNhieu(ds);
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
        var FB = await san(); await FB.set('caiDat/chung', { macros: data.macros }, true); (await chung()).macros = data.macros; return { ok: true };
      }
      case 'luuQuyTacVe': {
        if (typeof data.quyTacVe !== 'string' || data.quyTacVe.length > 20000) throw Error('Quy tắc vẽ quá dài (tối đa 20.000 ký tự).');
        var FB2 = await san(); await FB2.set('caiDat/chung', { quyTacVe: data.quyTacVe }, true); (await chung()).quyTacVe = data.quyTacVe; return { ok: true };
      }
    }
    throw Error('Hành động không hợp lệ: ' + action);
  }

  /* ---------- Tải ZIP ---------- */
  function tepCuaHinh(x, thuMuc) {
    var ten = Tikz.ten(x.title || 'hinh', String(x.id).replace(/^nhap-/, '')), ds = [{ name: thuMuc + ten + '.tex', data: x.source || '' }];
    var a = x.image && Zip.tuDataUrl(x.image);
    if (a) ds.push({ name: thuMuc + ten + '.' + a.duoi, data: a.bytes });
    return { ten: ten, tep: ds };
  }
  async function taiZipMot(id) {
    var x = await doc(id);
    if (!x.image && x.source) { try { x.image = await build(x.source); } catch (e) {} }
    var g = tepCuaHinh(x, '');
    taiBlob(Zip.tao(g.tep), g.ten + '.zip');
  }
  async function taiZipToanBo(tienDo, chiNhom) {
    var FB = await san(), ds = (await FB.ds('hinh')).sort(moiTruoc), tep = [], danhMuc = [], loi = [];
    if (chiNhom) ds = ds.filter(function (x) { return x.nhom === chiNhom; });
    for (var i = 0; i < ds.length; i++) {
      if (tienDo) tienDo(i, ds.length);
      try {
        var x = await doc(ds[i].id), g = tepCuaHinh(x, chiNhom ? '' : 'hinh/' + (x.nhom ? thuMucNhom(x.nhom) + '/' : ''));
        tep = tep.concat(g.tep);
        danhMuc.push({ id: x.id, ten: g.ten, title: x.title, nhom: x.nhom || '', kind: x.kind, grade: x.grade, topic: x.topic, tags: x.tags, description: x.description, createdAt: x.createdAt, updatedAt: x.updatedAt, coAnh: g.tep.length > 1 });
      } catch (e) { loi.push(ds[i].title + ': ' + (e.message || e)); }
    }
    if (tienDo) tienDo(ds.length, ds.length);
    tep.push({ name: 'danh-muc.json', data: JSON.stringify({ xuatLuc: new Date().toISOString(), soHinh: danhMuc.length, hinh: danhMuc }, null, 2) });
    tep.push({ name: 'macro-chung.tex', data: await macro() });
    var ngay = new Date().toISOString().slice(0, 10);
    taiBlob(Zip.tao(tep), chiNhom ? 'mathtikz-' + thuMucNhom(chiNhom) + '-' + ngay + '.zip' : 'mathtikz-kho-' + ngay + '.zip');
    return { soHinh: danhMuc.length, loi: loi };
  }
  function thuMucNhom(n) { return Tikz.chuan(n).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'nhom'; }
  /* ---------- Nhóm hình (một cấp): hinh/{id}.nhom; không đổi updatedAt để đồng bộ không coi là sửa hình ---------- */
  async function datNhom(ids, ten) {
    ten = chuanNhom(ten);
    var nhap = ids.filter(laNhap), xa = ids.filter(function (id) { return !laNhap(id); });
    for (var i = 0; i < nhap.length; i++) { var d = await read(nhap[i]); if (d) { d.nhom = ten; await put(d); } }
    if (xa.length) { var FB = await san(); for (var k = 0; k < xa.length; k += 400) await FB.ghiNhieu(xa.slice(k, k + 400).map(function (id) { return { path: 'hinh/' + id, data: { nhom: ten }, gop: true }; })); }
    return ten;
  }
  async function doiTenNhom(cu, moi) {
    var FB = await san(), ds = (await FB.ds('hinh')).concat(await read()).filter(function (x) { return x.nhom === cu; });
    return datNhom(ds.map(function (x) { return x.id; }), moi);
  }
  function taiBlob(blob, ten) { var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = ten; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 5000); }

  window.Kho = {
    taiZipMot: taiZipMot, taiZipToanBo: taiZipToanBo, taiZipNhom: function (ten, tienDo) { return taiZipToanBo(tienDo, ten); },
    chuanNhom: chuanNhom, datNhom: datNhom, doiTenNhom: doiTenNhom,
    api: api, danhSach: danhSach, theoDoi: theoDoi, doc: doc, anh: anh, build: build, thuBuild: thuBuild, macro: macro, quyTacVe: quyTacVe,
    luu: luu, xoa: xoa, nhap: put, docNhap: read,
    // Dựng hình theo đề: các hình được chọn (ids) thành pic, AI chỉ đặt pic và vẽ yếu tố toán học.
    ve: async function (de, ids, veMoi) {
      var daDung = {}, pics = await Promise.all((ids || []).map(async function (id) {
        var x = await doc(id);
        return { id: id, name: Pic.ten(x.title, daDung), title: x.title, kind: x.kind, source: x.source, khung: Pic.khung(x.source) };
      }));
      var kq = await AIKetNoi.veTheoDe(de, pics, veMoi || []);
      kq.pics = pics.map(function (p) { return { id: p.id, name: p.name, title: p.title }; });
      kq.dinhNghia = pics.map(function (p) { return { name: p.name, def: Pic.dinhNghia(p.name, p.source) }; });
      return kq;
    },
    suaMa: function (source, loi, quyTac) { return AIKetNoi.suaMa(source, loi, quyTac); },
    tai: function (content, name, type) { var url = URL.createObjectURL(new Blob([content], { type: type })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 3000); }
  };
})();
