/* Tạo file ZIP ngay trong trình duyệt, không cần thư viện ngoài.
   Kiểu "store" (không nén): ảnh PNG vốn đã nén, file .tex rất nhỏ. Tên file UTF-8. */
(function () {
  'use strict';
  var BANG = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = BANG[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  // files: [{ name: 'thu-muc/ten.tex', data: string | Uint8Array }]
  function tao(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0, d = new Date();
    var gio = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var ngay = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var ten = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, c = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, gio, true); h.setUint16(12, ngay, true); h.setUint32(14, c, true);
      h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, ten.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), ten, data);
      var g = new DataView(new ArrayBuffer(46));
      g.setUint32(0, 0x02014b50, true); g.setUint16(4, 20, true); g.setUint16(6, 20, true); g.setUint16(8, 0x0800, true); g.setUint16(10, 0, true);
      g.setUint16(12, gio, true); g.setUint16(14, ngay, true); g.setUint32(16, c, true);
      g.setUint32(20, data.length, true); g.setUint32(24, data.length, true); g.setUint16(28, ten.length, true);
      g.setUint32(38, 0, true); g.setUint32(42, off, true);
      central.push(new Uint8Array(g.buffer), ten);
      off += 30 + ten.length + data.length;
    });
    var co = central.reduce(function (s, x) { return s + x.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, co, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  }

  // data:image/png;base64,... → { bytes, duoi }
  function tuDataUrl(url) {
    var m = /^data:([^;,]+)(;base64)?,(.*)$/.exec(String(url || ''));
    if (!m) return null;
    var bytes;
    if (m[2]) { var s = atob(m[3]); bytes = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i); }
    else bytes = new TextEncoder().encode(decodeURIComponent(m[3]));
    var duoi = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/webp': 'webp' }[m[1]] || 'png';
    return { bytes: bytes, duoi: duoi };
  }

  window.Zip = { tao: tao, tuDataUrl: tuDataUrl };
})();
