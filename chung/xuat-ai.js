/* Xuất kho cho AI (Codex, Claude Cowork) ra một thư mục trên máy, thường đặt trong Google Drive
   để hai laptop tự đồng bộ. Chrome/Edge ghi thẳng vào thư mục (chỉ ghi phần thay đổi);
   trình duyệt khác (Firefox) tải về kho-tikz.zip để giải nén đè vào thư mục.
   Cấu trúc: index.json, hinh/<nhóm>/<tên>.tex, pic/<tenPic>.tex, anh/<nhóm>/<tên>.png,
   macro-chung.tex, HUONG-DAN.md, AGENTS.md, CLAUDE.md */
(function () {
  'use strict';
  var PHIEN_BAN = 1;

  function slug(s) { return Tikz.chuan(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50); }
  function boMa(s) { return String(s || '').replace(/\r/g, ''); }

  /* ---------- Thư mục đã chọn (lưu handle trong IndexedDB, chỉ Chrome/Edge) ---------- */
  function db() {
    return new Promise(function (ok, no) {
      var r = indexedDB.open('mathtikz-xuat-ai', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); };
    });
  }
  async function layHandle() { try { var d = await db(); return await new Promise(function (ok) { var r = d.transaction('kv').objectStore('kv').get('thuMuc'); r.onsuccess = function () { ok(r.result || null); }; r.onerror = function () { ok(null); }; }); } catch (e) { return null; } }
  async function luuHandle(h) { try { var d = await db(); d.transaction('kv', 'readwrite').objectStore('kv').put(h, 'thuMuc'); } catch (e) {} }

  /* ---------- Nội dung hướng dẫn cho AI ---------- */
  function huongDan(quyTac, macro) {
    return '# Kho hình TikZ của Hữu (xuất từ MATHTIKZ)\n\n' +
      'Thư mục này CHỈ ĐỌC. Mỗi lần Hữu bấm "Xuất kho cho AI" trên web, toàn bộ nội dung được ghi đè. Không sửa, không thêm file ở đây; hình vẽ mới đặt ở thư mục làm việc của Hữu.\n\n' +
      '## Thành phần\n\n' +
      '- `index.json`: danh mục mọi hình. Mỗi mục có `id`, `ten`, `nhom`, `loai` (`thuc-te` hoặc `toan-co-ban`), `khoi`, `chuDe`, `tuKhoa`, `moTa`, `tenPic`, `khung` (vùng tọa độ của hình khi scale=1: xmin, xmax, ymin, ymax), `ma` (file mã gốc), `pic` (file định nghĩa pic dựng sẵn), `anh` (ảnh PNG, có thể trống), `capNhat`.\n' +
      '- `hinh/<nhóm>/<tên>.tex`: mã gốc của từng hình (một khối tikzpicture).\n' +
      '- `pic/<tenPic>.tex`: định nghĩa `\\tikzset{tenPic/.pic={...}}` dựng sẵn từ mã gốc, dán thẳng vào hình là dùng được.\n' +
      '- `anh/...png`: ảnh đã build của hình, dùng để nhìn kiểm tra khi phân vân giữa nhiều hình.\n' +
      '- `macro-chung.tex`: macro Hữu dùng khi build.\n\n' +
      '## Khi được yêu cầu vẽ hình\n\n' +
      '1. Đọc đề, liệt kê các VẬT THỂ/CẢNH THỰC TẾ cần vẽ (người, cây, cột cờ, thang, tòa nhà, hải đăng, thuyền, diều, xe, cầu...).\n' +
      '2. Tra `index.json` cho từng vật thể: so khớp `ten`, `nhom`, `tuKhoa`, `moTa`, `chuDe`, chấp nhận đồng nghĩa và không dấu. Ưu tiên `loai` = `thuc-te`. Nhiều hình gần giống nhau thì xem ảnh trong `anh/` để chọn; vẫn không chắc thì hỏi Hữu.\n' +
      '3. Vật thể CÓ trong kho thì BẮT BUỘC dùng hình trong kho, KHÔNG tự vẽ lại. Chỉ vẽ mới (đơn giản, gọn) khi kho không có.\n' +
      '4. Cách dùng: chép nguyên nội dung file `pic/<tenPic>.tex` vào ngay sau dòng `\\begin{tikzpicture}[...]`, rồi gọi `\\pic[scale=k] at (x,y) {tenPic};` (được thêm `xscale=-1` để lật, `rotate=...`). Dùng `khung` để chọn `scale` và vị trí cho cân đối và đúng quan hệ theo đề (cùng mặt đất, đúng bên trái/phải, đúng tỉ lệ tương đối). Không sửa bên trong định nghĩa pic trừ khi Hữu yêu cầu.\n' +
      '5. Vẽ thêm các yếu tố toán học theo đề (điểm, đoạn, góc, số đo, kích thước) theo đúng bộ quy tắc ở cuối file. Chỉ vẽ những gì đề cho hoặc hỏi.\n' +
      '6. Vẽ xong, rút gọn mã hết mức có thể (gom bằng `\\foreach`, bỏ dòng thừa), rồi biên dịch thử nếu có công cụ.\n\n' +
      '## Preamble khi biên dịch thử\n\n```latex\n' + Tikz.boc('%HINH%', macro).replace('\n%HINH%\n', '\n% (dán hình vào đây)\n') + '\n```\n\n' +
      '## Quy tắc vẽ phần hình học\n\n' + quyTac + '\n';
  }
  function agents() {
    return '# Kho hình TikZ của Hữu\n\nThư mục này là kho hình TikZ (chỉ đọc), xuất từ web MATHTIKZ. Khi vẽ hình TikZ cho Hữu, nhất là hình có vật thể thực tế, đọc `HUONG-DAN.md` trong thư mục này trước và làm đúng theo đó: tra `index.json`, vật thể có trong kho thì dùng `pic/<tenPic>.tex` thay vì tự vẽ lại, phần hình học vẽ theo quy tắc trong `HUONG-DAN.md`.\n';
  }

  /* ---------- Gom dữ liệu ---------- */
  async function chuanBi() {
    await DangNhap.sanSang();
    var FB = window.FB, ds = await FB.ds('hinh'), ma = {}, daDung = {}, daDungTep = {};
    (await FB.ds('ma')).forEach(function (x) { ma[x.id] = x.source || ''; });
    ds.sort(function (a, b) { return String(a.createdAt || a.updatedAt || '').localeCompare(String(b.createdAt || b.updatedAt || '')) || String(a.id).localeCompare(String(b.id)); });
    var muc = [];
    ds.forEach(function (x) {
      var source = boMa(ma[x.id]); if (!source) return;
      var thuMuc = x.nhom ? slug(x.nhom) || 'nhom' : 'chua-nhom', goc = (slug(x.title) || 'hinh') + '-' + String(x.id).slice(0, 8), tenPic = Pic.ten(x.title || 'hinh', daDung), def = '', khung = null;
      while (daDungTep[thuMuc + '/' + goc]) goc += 'x'; daDungTep[thuMuc + '/' + goc] = 1;
      try { def = Pic.dinhNghia(tenPic, source); khung = Pic.khung(source); } catch (e) { def = ''; }
      muc.push({
        id: x.id, ten: x.title || '', nhom: x.nhom || '', loai: x.kind === 'real' ? 'thuc-te' : 'toan-co-ban', khoi: x.grade || '', chuDe: x.topic || '',
        tuKhoa: x.tags || '', moTa: x.description || '', tenPic: def ? tenPic : '', khung: khung,
        ma: 'hinh/' + thuMuc + '/' + goc + '.tex', pic: def ? 'pic/' + tenPic + '.tex' : '', anh: 'anh/' + thuMuc + '/' + goc + '.png',
        capNhat: x.updatedAt || '', _source: source, _def: def
      });
    });
    return { muc: muc, macro: await Kho.macro(), quyTac: await Kho.quyTacVe() };
  }
  function indexJson(muc, coAnh) {
    return JSON.stringify({ phienBan: PHIEN_BAN, xuatLuc: new Date().toISOString(), soHinh: muc.length, hinh: muc.map(function (m) {
      var o = {}; Object.keys(m).forEach(function (k) { if (k[0] !== '_') o[k] = m[k]; }); if (!coAnh[m.id]) o.anh = ''; return o;
    }) }, null, 1);
  }
  async function anhCua(id) { var d = await window.FB.get('anh/' + id); return d && d.data ? Zip.tuDataUrl(d.data) : null; }
  function tepChung(g) {
    return [{ path: 'HUONG-DAN.md', data: huongDan(g.quyTac, g.macro) }, { path: 'AGENTS.md', data: agents() }, { path: 'CLAUDE.md', data: agents() }, { path: 'macro-chung.tex', data: g.macro || '' }];
  }

  /* ---------- Ghi thẳng vào thư mục (Chrome/Edge) ---------- */
  async function thuMucCon(goc, phan, tao) { var d = goc; for (var i = 0; i < phan.length; i++) d = await d.getDirectoryHandle(phan[i], { create: tao }); return d; }
  async function ghi(goc, path, data) {
    var p = path.split('/'), d = await thuMucCon(goc, p.slice(0, -1), true), f = await d.getFileHandle(p[p.length - 1], { create: true }), w = await f.createWritable();
    await w.write(data); await w.close();
  }
  async function xoaTep(goc, path) { try { var p = path.split('/'), d = await thuMucCon(goc, p.slice(0, -1), false); await d.removeEntry(p[p.length - 1]); } catch (e) {} }
  async function docCu(goc) { try { var f = await (await goc.getFileHandle('index.json')).getFile(); return JSON.parse(await f.text()); } catch (e) { return null; } }

  async function vaoThuMuc(goc, tienDo) {
    var g = await chuanBi(), cu = await docCu(goc), theoId = {}, coAnh = {}, ghiMoi = 0, xoa = 0;
    ((cu && cu.hinh) || []).forEach(function (m) { theoId[m.id] = m; });
    for (var i = 0; i < g.muc.length; i++) {
      var m = g.muc[i], c = theoId[m.id];
      tienDo(i + 1, g.muc.length);
      var giuNguyen = c && c.ma === m.ma && c.pic === m.pic && c.capNhat === m.capNhat;
      if (giuNguyen) { if (c.anh) coAnh[m.id] = 1; delete theoId[m.id]; continue; }
      if (c) { [c.ma, c.pic, c.anh].forEach(function (p) { if (p && p !== m.ma && p !== m.pic && p !== m.anh) xoaTep(goc, p); }); delete theoId[m.id]; }
      await ghi(goc, m.ma, m._source + '\n');
      if (m.pic) await ghi(goc, m.pic, m._def + '\n');
      var a = await anhCua(m.id);
      if (a && a.duoi === 'png') { await ghi(goc, m.anh, a.bytes); coAnh[m.id] = 1; } else await xoaTep(goc, m.anh);
      ghiMoi++;
    }
    // Hình đã xóa khỏi kho: xóa file tương ứng.
    var conLai = Object.keys(theoId);
    for (var k = 0; k < conLai.length; k++) { var o = theoId[conLai[k]]; for (var p of [o.ma, o.pic, o.anh]) if (p) await xoaTep(goc, p); xoa++; }
    for (var t of tepChung(g)) await ghi(goc, t.path, t.data);
    await ghi(goc, 'index.json', indexJson(g.muc, coAnh));
    return { soHinh: g.muc.length, ghiMoi: ghiMoi, xoa: xoa, thuMuc: goc.name };
  }

  /* ---------- Tải ZIP (trình duyệt không ghi được thư mục) ---------- */
  async function vaoZip(tienDo) {
    var g = await chuanBi(), tep = [], coAnh = {};
    for (var i = 0; i < g.muc.length; i++) {
      var m = g.muc[i]; tienDo(i + 1, g.muc.length);
      tep.push({ name: 'kho-tikz/' + m.ma, data: m._source + '\n' });
      if (m.pic) tep.push({ name: 'kho-tikz/' + m.pic, data: m._def + '\n' });
      var a = await anhCua(m.id); if (a && a.duoi === 'png') { tep.push({ name: 'kho-tikz/' + m.anh, data: a.bytes }); coAnh[m.id] = 1; }
    }
    tepChung(g).forEach(function (t) { tep.push({ name: 'kho-tikz/' + t.path, data: t.data }); });
    tep.push({ name: 'kho-tikz/index.json', data: indexJson(g.muc, coAnh) });
    var blob = Zip.tao(tep), url = URL.createObjectURL(blob), el = document.createElement('a');
    el.href = url; el.download = 'kho-tikz.zip'; document.body.appendChild(el); el.click(); el.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    return { soHinh: g.muc.length, zip: true };
  }

  // Gọi trong sự kiện bấm nút (cần cử chỉ người dùng để hỏi quyền thư mục).
  async function chay(tienDo, chonLai) {
    if (!window.showDirectoryPicker) return vaoZip(tienDo);
    var goc = chonLai ? null : await layHandle();
    if (goc) {
      var q = await goc.queryPermission({ mode: 'readwrite' });
      if (q !== 'granted') q = await goc.requestPermission({ mode: 'readwrite' });
      if (q !== 'granted') goc = null;
    }
    if (!goc) {
      try { goc = await window.showDirectoryPicker({ id: 'kho-tikz', mode: 'readwrite', startIn: 'documents' }); }
      catch (e) { if (e && e.name === 'AbortError') return null; throw e; }
      await luuHandle(goc);
    }
    return vaoThuMuc(goc, tienDo);
  }

  window.XuatAI = { chay: chay, ghiThangDuoc: !!window.showDirectoryPicker, layHandle: layHandle, _chuanBi: chuanBi, _huongDan: huongDan };
})();
