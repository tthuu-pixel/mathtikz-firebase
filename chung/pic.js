/* Biến một hình trong kho thành \pic để gọi lại: \pic[scale=..] at (x,y) {ten};
   Định nghĩa pic đặt ngay đầu tikzpicture nên mã vẫn tự đủ, build như mọi hình khác. */
(function () {
  'use strict';
  // Tên pic: chữ thường không dấu + số, duy nhất trong một hình.
  // Tránh trùng tên pic có sẵn của TikZ (angle của thư viện angles...).
  var TEN_CAM = { angle: 1, code: 1, pic: 1, pics: 1, scope: 1, node: 1, coordinate: 1 };
  function ten(title, daDung) {
    var goc = Tikz.chuan(title).replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'hinh';
    if (/^[0-9]/.test(goc)) goc = 'h' + goc;
    if (TEN_CAM[goc]) goc = 'mau' + goc;
    var t = goc, i = 2;
    while (daDung && daDung[t]) t = goc + (i++);
    if (daDung) daDung[t] = 1;
    return t;
  }
  // Tách [tùy chọn] của \begin{tikzpicture} (xử lý ngoặc lồng nhau) và phần thân.
  function tach(source) {
    var pure = Tikz.tach(source), m = /^\\begin\{tikzpicture\}\s*/.exec(pure), i = m[0].length, opts = '';
    if (pure[i] === '[') {
      var sau = 1, j = i + 1;
      while (j < pure.length && sau) { if (pure[j] === '[') sau++; else if (pure[j] === ']') sau--; j++; }
      opts = pure.slice(i + 1, j - 1).trim(); i = j;
    }
    var cuoi = pure.lastIndexOf('\\end{tikzpicture}');
    return { opts: opts, than: pure.slice(i, cuoi).replace(/^\s*\n/, '').replace(/\s+$/, '') };
  }
  // \tikzset{ten/.pic={...}}; '#' (cả trong tùy chọn lẫn thân hình) phải nhân đôi vì nằm trong định nghĩa khóa.
  // name prefix: tên điểm bên trong mẫu thành ten-A, ten-B... nên không đè điểm A, B của bài toán,
  // và mã chính vẫn gọi được điểm của mẫu, ví dụ (thang-B).
  function dinhNghia(name, source) {
    var p = tach(source), opts = 'name prefix=' + name + '-' + (p.opts ? ',' + p.opts.replace(/#/g, '##') : '');
    return '\\tikzset{' + name + '/.pic={\\begin{scope}[' + opts + ']\n' + p.than.replace(/#/g, '##') + '\n\\end{scope}}}';
  }
  // Tên các điểm/node đặt tên trong mẫu (bỏ biến \foreach), để AI nối yếu tố toán học vào đúng chỗ.
  function diem(source) {
    var than = tach(source).than.replace(/(^|[^\\])%[^\n]*/g, '$1'), ra = [], m;
    var re = /(?:\\coordinate|\\node|\bcoordinate|\bnode)\s*(?:\[[^\]]*\]\s*)?\(\s*([^()\s][^()]*?)\s*\)|[,{\[]\s*by\s*=\s*\{?\s*([A-Za-z][\w']*)/g;
    while ((m = re.exec(than))) { var n = m[1] || m[2]; if (n && !/[\\$,.:!]/.test(n) && ra.indexOf(n) < 0) ra.push(n); }
    return ra.slice(0, 30);
  }
  // Khung tọa độ thô từ các điểm (x,y) dạng số, nhân theo scale của hình.
  function khung(source) {
    var p = tach(source), k = 1, s = /(?:^|,)\s*scale\s*=\s*([0-9.]+)/.exec(p.opts);
    if (s) k = parseFloat(s[1]) || 1;
    var re = /\(\s*(-?\d*\.?\d+)\s*(?:cm)?\s*,\s*(-?\d*\.?\d+)\s*(?:cm)?\s*\)/g, m, x = [], y = [];
    while ((m = re.exec(p.than))) { x.push(+m[1] * k); y.push(+m[2] * k); }
    if (!x.length) return null;
    var r = function (v) { return Math.round(v * 10) / 10; };
    return { xmin: r(Math.min.apply(null, x)), xmax: r(Math.max.apply(null, x)), ymin: r(Math.min.apply(null, y)), ymax: r(Math.max.apply(null, y)) };
  }
  // Chèn các định nghĩa pic ngay sau \begin{tikzpicture}[...] của mã AI trả về.
  function chen(source, defs) {
    var pure = Tikz.tach(source), m = /^\\begin\{tikzpicture\}\s*/.exec(pure), i = m[0].length;
    if (pure[i] === '[') { var sau = 1, j = i + 1; while (j < pure.length && sau) { if (pure[j] === '[') sau++; else if (pure[j] === ']') sau--; j++; } i = j; }
    return pure.slice(0, i).replace(/\s+$/, '') + '\n' + defs.join('\n') + '\n' + pure.slice(i).replace(/^[ \t]*\n?/, '');
  }
  window.Pic = { ten: ten, tach: tach, dinhNghia: dinhNghia, diem: diem, khung: khung, chen: chen };
})();
