(async function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var items = [], theoId = {}, thanhPhan = [], veThem = [], dangBan = false;

  function node(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function baoPT(t) { $('trang-thai-pt').textContent = t || ''; }
  function baoVe(t) { $('trang-thai-ve').textContent = t || ''; }

  // Có nhiều mẫu gần giống nhau (điểm cao và sát nhau) thì mới hỏi người dùng.
  function quyetDinh(t) {
    var u = t.ungVien;
    if (!u.length) { t.chon = null; t.canChon = false; return; }
    t.chon = u[0].id;
    t.canChon = u.length > 1 && u[1].diem >= 0.6 && u[0].diem - u[1].diem < 0.15;
  }
  // Tên pic giống hệt cách Kho.ve đặt: theo thứ tự, chỉ hình thực tế thành pic; hình toán cơ bản là mã mẫu cho AI.
  function laPic(id) { return theoId[id] && theoId[id].kind === 'real'; }
  function tenPic() {
    var daDung = {}, ten = {};
    thanhPhan.forEach(function (t) { if (t.chon && laPic(t.chon) && !ten[t.chon]) ten[t.chon] = Pic.ten(theoId[t.chon].title, daDung); });
    return ten;
  }

  function oChon(item, chon, phu, onclick) {
    var b = node('button', 'o-chon' + (chon ? ' bat' : '')), anh = node('div', 'anh-nho', 'Đang tải…');
    b.type = 'button'; b.onclick = onclick;
    b.append(anh, node('strong', '', item.title), node('small', '', phu));
    Kho.anh(item).then(function (src) { anh.textContent = ''; if (src) { var img = node('img'); img.src = src; img.alt = item.title; anh.append(img); } else anh.textContent = 'Chưa có ảnh'; })
      .catch(function () { anh.textContent = 'Không tải được ảnh'; });
    return b;
  }
  function oVeMoi(chon, onclick) {
    var b = node('button', 'o-chon ve-moi' + (chon ? ' bat' : '')); b.type = 'button'; b.onclick = onclick;
    b.append(node('div', 'anh-nho', 'AI vẽ mới'), node('strong', '', 'Không dùng mẫu'), node('small', '', 'AI tự vẽ vật thể này'));
    return b;
  }

  function veDanhSach() {
    var out = $('ds-thanh-phan'), ten = tenPic(); out.replaceChildren();
    if (!thanhPhan.length) out.append(node('p', 'mo', 'Đề này không cần vật thể thực tế nào từ kho. AI sẽ vẽ hình theo đề.'));
    thanhPhan.forEach(function (t, i) {
      var khung = node('div', 'thanh-phan'), dau = node('h3', '', t.ten + ' ');
      dau.append(node('span', 'nhan', t.vaiTro === 'mau-nen' ? 'Mẫu nền' : 'Vật thể'));
      if (t.chon) { dau.append(' '); dau.append(node('span', 'nhan-pic', ten[t.chon] ? '\\pic {' + ten[t.chon] + '}' : 'mã mẫu cho AI')); }
      khung.append(dau);
      var luoi = node('div', 'luoi-chon');
      if (!t.ungVien.length) {
        khung.append(node('p', 'mo', 'Không có mẫu phù hợp trong kho · AI sẽ tự vẽ.'));
      } else if (t.canChon || t.moRong) {
        khung.append(node('p', 'mo', t.canChon ? 'Có nhiều mẫu gần giống nhau, bạn chọn một:' : 'Chọn mẫu khác:'));
        t.ungVien.forEach(function (u) {
          luoi.append(oChon(theoId[u.id], t.chon === u.id, Math.round(u.diem * 100) + '% · ' + (u.lyDo || ''), function () { t.chon = u.id; t.canChon = false; t.moRong = false; veDanhSach(); }));
        });
        luoi.append(oVeMoi(!t.chon, function () { t.chon = null; t.canChon = false; t.moRong = false; veDanhSach(); }));
        khung.append(luoi);
      } else {
        var u0 = t.ungVien.filter(function (u) { return u.id === t.chon; })[0];
        if (t.chon) luoi.append(oChon(theoId[t.chon], true, (u0 ? Math.round(u0.diem * 100) + '% · ' + (u0.lyDo || '') : 'Bạn tự thêm'), function () {}));
        else luoi.append(oVeMoi(true, function () {}));
        khung.append(luoi);
        var hang = node('div', 'hang-nut');
        if (t.ungVien.length > 1 || !t.chon) { var doi = node('button', 'nut nho', 'Đổi mẫu'); doi.type = 'button'; doi.onclick = function () { t.moRong = true; veDanhSach(); }; hang.append(doi); }
        if (t.tuThem) { var bo = node('button', 'nut nho nguy', 'Bỏ'); bo.type = 'button'; bo.onclick = function () { thanhPhan.splice(i, 1); veDanhSach(); }; hang.append(bo); }
        else if (t.chon) { var bv = node('button', 'nut nho', 'Không dùng mẫu'); bv.type = 'button'; bv.onclick = function () { t.chon = null; veDanhSach(); }; hang.append(bv); }
        khung.append(hang);
      }
      out.append(khung);
    });
    $('ve-them').textContent = veThem.length ? 'AI sẽ vẽ thêm: ' + veThem.join('; ') + '.' : '';
    var conHoi = thanhPhan.some(function (t) { return t.canChon; });
    $('ve').disabled = dangBan || conHoi;
    baoVe(conHoi ? 'Chọn mẫu ở các mục còn hỏi rồi bấm Vẽ hình.' : '');
  }

  $('phan-tich').onclick = async function () {
    var de = $('de').value.trim(), nut = this;
    if (!de) { HienThi.loi(Error('Nhập đề bài trước.')); return; }
    HienThi.xoaLoi();
    if (!items.length) { thanhPhan = []; veThem = []; baoPT('Kho chưa có hình nào, AI sẽ tự vẽ toàn bộ.'); $('khu-chon').hidden = false; veDanhSach(); return; } nut.disabled = true; baoPT('AI đang đọc đề và tìm mẫu trong kho…');
    try {
      var kq = await AIKetNoi.chonMau(de, items);
      thanhPhan = kq.thanhPhan; veThem = kq.veThem; thanhPhan.forEach(quyetDinh);
      var tu = thanhPhan.filter(function (t) { return t.chon && !t.canChon; }).length, hoi = thanhPhan.filter(function (t) { return t.canChon; }).length;
      baoPT('Xong: ' + tu + ' mẫu chọn tự động' + (hoi ? ', ' + hoi + ' chỗ cần bạn chọn' : '') + '.');
      $('khu-chon').hidden = false; veDanhSach(); $('khu-chon').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { HienThi.loi(e); baoPT(''); } finally { nut.disabled = false; }
  };

  $('tim-ten').oninput = function () {
    var q = Tikz.chuan(this.value.trim()), out = $('ket-qua-tim'); out.replaceChildren();
    if (!q) return;
    items.filter(function (x) { return Tikz.chuan([x.title, x.topic, x.tags, x.description].join(' ')).indexOf(q) >= 0; }).slice(0, 12).forEach(function (x) {
      out.append(oChon(x, false, x.kind === 'real' ? 'Thực tế' : 'Toán cơ bản', function () {
        thanhPhan.push({ ten: x.title, vaiTro: x.kind === 'real' ? 'vat-the' : 'mau-nen', ungVien: [{ id: x.id, diem: 1, lyDo: 'Bạn tự thêm' }], chon: x.id, canChon: false, tuThem: true });
        $('tim-ten').value = ''; out.replaceChildren(); veDanhSach();
      }));
    });
  };

  /* ---------- 3. Hình vẽ: build và sửa ngay trên trang ---------- */
  var kq = null, anh = '', maAnh = '', maTruocAI = null, idDaLuu = '', ban = false;
  function ma() { return $('kq-ma').value; }
  function baoKQ(t) { $('kq-trang-thai').textContent = t || ''; }
  function baoLoiBuild(t) { $('kq-loi').textContent = t || ''; $('kq-loi').hidden = !t; }
  function paint() {
    var xem = $('kq-xem'), dung = !!anh && maAnh === ma(); xem.replaceChildren();
    if (dung) { var img = node('img'); img.src = anh; img.alt = 'Hình vẽ theo đề'; xem.append(img); }
    else xem.textContent = anh ? 'Mã đã thay đổi. Bấm Build hình (F5) để xem lại.' : 'Chưa có ảnh.';
    $('kq-anh').disabled = !dung; $('kq-anh-tt').textContent = dung ? 'Ảnh của mã hiện tại' : 'Chưa build mã hiện tại';
  }
  function khoaKQ(v) {
    ban = v; ['kq-build', 'kq-ai-sua', 'kq-hoan-tac', 'kq-ve-lai', 'kq-luu'].forEach(function (id) { $(id).disabled = v; });
    $('kq-ma').readOnly = v; $('ve').disabled = v || thanhPhan.some(function (t) { return t.canChon; }); $('phan-tich').disabled = v;
  }
  function datMa(source) { $('kq-ma').value = source; paint(); }
  // AI sửa mã đôi khi làm rơi định nghĩa pic lấy từ kho: chèn lại những pic còn được gọi mà thiếu định nghĩa.
  function giuPic(source) {
    var thieu = (kq && kq.dinhNghia || []).filter(function (d) { return source.indexOf('{' + d.name + '}') >= 0 && !new RegExp(d.name + '\\s*/\\.pic').test(source); });
    return thieu.length ? Pic.chen(source, thieu.map(function (d) { return d.def; })) : source;
  }
  // Build mã hiện tại; lỗi thì (nếu tuSua) cho AI sửa theo quy tắc vẽ, tối đa 2 lần.
  async function build(tuSua) {
    var source = ma(), quyTac = await Kho.quyTacVe();
    baoLoiBuild(''); baoKQ('Đang build…'); $('kq-xem').textContent = 'Đang build hình…';
    var thu = await Kho.thuBuild(source);
    if (thu.ok) { anh = thu.image; maAnh = source; paint(); baoKQ('Build thành công'); return true; }
    var loi = thu.loi;
    if (tuSua) {
      for (var lan = 1; lan <= 2; lan++) {
        baoKQ('Build lỗi · AI đang sửa mã (lần ' + lan + '/2)…'); $('kq-xem').textContent = 'AI đang đọc lỗi và sửa mã…';
        var sua = await AIKetNoi.suaMa(source, loi, quyTac);
        if (sua.khongLoi) { anh = sua.image; maAnh = source; paint(); baoKQ('Build thành công'); return true; }
        if (maTruocAI === null) maTruocAI = source;
        source = giuPic(sua.source); datMa(source); $('kq-hoan-tac').hidden = false;
        if (source !== sua.source) { var lai = await Kho.thuBuild(source); sua = { daBuild: lai.ok, image: lai.image, loiBuild: lai.loi }; }
        if (sua.daBuild) { anh = sua.image; maAnh = source; paint(); baoKQ('AI đã sửa, build thành công'); return true; }
        loi = sua.loiBuild || loi;
      }
    }
    paint(); baoKQ('Build lỗi'); baoLoiBuild('Lỗi biên dịch:\n' + loi);
    return false;
  }
  async function veHinh() {
    var de = $('de').value.trim();
    if (!de) { HienThi.loi(Error('Nhập đề bài trước.')); return; }
    var ids = [], veMoi = [];
    thanhPhan.forEach(function (t) { if (t.chon) { if (ids.indexOf(t.chon) < 0) ids.push(t.chon); } else if (t.vaiTro === 'vat-the') veMoi.push(t.ten); });
    HienThi.xoaLoi(); dangBan = true; khoaKQ(true);
    var tin = '';
    try {
      baoVe('AI đang dựng hình' + (ids.length ? ' từ ' + ids.length + ' mẫu' : '') + '…');
      kq = await Kho.ve(de, ids, veMoi); kq.de = de; kq.ids = ids;
      anh = ''; maAnh = ''; maTruocAI = null; idDaLuu = ''; $('kq-hoan-tac').hidden = true;
      datMa(kq.source); $('kq-pic').textContent = [kq.pics.length ? 'pic: ' + kq.pics.map(function (p) { return p.name; }).join(', ') : '', kq.mauNen && kq.mauNen.length ? 'mã mẫu: ' + kq.mauNen.map(function (m) { return m.title; }).join(', ') : ''].filter(Boolean).join(' · ');
      $('kq-ten').value = de.replace(/\s+/g, ' ').slice(0, 80);
      $('khu-ket-qua').hidden = false; $('khu-ket-qua').scrollIntoView({ behavior: 'smooth', block: 'start' });
      baoVe('Đã vẽ xong, đang build…');
      var ok = await build(true);
      tin = ok ? 'Đã vẽ và build xong.' : 'Đã vẽ xong nhưng mã còn lỗi biên dịch.';
      var chuY = [];
      if (kq.thieu && kq.thieu.length) chuY.push('AI chưa đặt pic ' + kq.thieu.join(', '));
      if (kq.dinhLai && kq.dinhLai.length) chuY.push('AI tự vẽ lại ' + kq.dinhLai.join(', ') + ' thay vì dùng mẫu');
      if (kq.viPham && kq.viPham.length) chuY.push('mã còn ' + kq.viPham.join('; '));
      if (chuY.length) tin += ' Lưu ý: ' + chuY.join('; ') + '. Có thể bấm Vẽ lại.';
    } catch (e) { HienThi.loi(e); baoVe(''); baoKQ(''); paint(); }
    finally { dangBan = false; khoaKQ(false); veDanhSach(); if (tin) baoVe(tin); }
  }
  async function chay(fn) { if (ban) return; HienThi.xoaLoi(); khoaKQ(true); try { await fn(); } catch (e) { HienThi.loi(e); baoKQ(''); paint(); } finally { khoaKQ(false); } }
  $('ve').onclick = veHinh;
  $('kq-ve-lai').onclick = function () { if (!ban) veHinh(); };
  $('kq-build').onclick = function () { chay(function () { return build(false); }); };
  $('kq-ai-sua').onclick = function () { chay(function () { return build(true); }); };
  $('kq-hoan-tac').onclick = function () { if (ban || maTruocAI === null) return; datMa(maTruocAI); maTruocAI = null; this.hidden = true; baoLoiBuild(''); baoKQ('Đã khôi phục mã trước khi AI sửa'); };
  $('kq-ma').addEventListener('input', function () { paint(); baoKQ('Có thay đổi, chưa build'); });
  window.addEventListener('keydown', function (e) { if (e.key === 'F5' && !$('khu-ket-qua').hidden) { e.preventDefault(); $('kq-build').click(); } });
  $('kq-copy').onclick = async function () { try { await navigator.clipboard.writeText(ma()); GiaoDien.thongBao('Đã copy mã.'); } catch (e) { $('kq-ma').select(); GiaoDien.thongBao('Hãy bấm Ctrl+C để copy.', 'loi'); } };
  function tenTep() { return Tikz.ten($('kq-ten').value || 'hinh-theo-de', idDaLuu || String(Date.now())); }
  $('kq-tex').onclick = function () { Kho.tai(ma(), tenTep() + '.tex', 'text/plain;charset=utf-8'); };
  $('kq-anh').onclick = async function () { var blob = await (await fetch(anh)).blob(), duoi = { 'image/svg+xml': 'svg', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[blob.type] || 'png'; Kho.tai(blob, tenTep() + '.' + duoi, blob.type); };
  $('kq-luu').onclick = function () {
    chay(async function () {
      var ten = $('kq-ten').value.trim(); if (!ten) throw Error('Nhập tên hình trước khi lưu.');
      var dung = (kq && kq.ids || []).map(function (id) { return theoId[id]; }).filter(Boolean), source = ma();
      baoKQ('Đang lưu vào kho…');
      var item = Object.assign(Tikz.moi(), {
        id: idDaLuu || Tikz.moi().id, title: ten, nhom: $('kq-nhom').value, source: source, description: (kq && kq.de || '').slice(0, 1000),
        image: maAnh === source ? anh : '', imageSource: maAnh === source ? source : '',
        kind: dung.some(function (x) { return x.kind === 'real'; }) || !dung.length ? 'real' : 'basic',
        grade: (dung.filter(function (x) { return x.grade; })[0] || {}).grade || '', topic: (dung[0] || {}).topic || '',
        tags: (kq && kq.pics || []).map(function (p) { return p.name; }).join(', ')
      });
      var lanDau = !idDaLuu, daLuu = await Kho.luu(item); idDaLuu = daLuu.id;
      if (daLuu.image) { anh = daLuu.image; maAnh = source; paint(); }
      baoKQ('Đã lưu vào kho'); GiaoDien.thongBao(lanDau ? 'Đã lưu hình vào kho.' : 'Đã cập nhật hình trong kho.');
    });
  };
  if (DangNhap.co('sua')) $('kq-luu-khu').hidden = false;

  try {
    items = (await Kho.danhSach()).filter(function (x) { return String(x.id).indexOf('nhap-') !== 0; });
    items.forEach(function (x) { theoId[x.id] = x; });
    var dl = $('ds-nhom'); Array.from(new Set(items.map(function (x) { return x.nhom; }).filter(Boolean))).sort().forEach(function (t) { var o = document.createElement('option'); o.value = t; dl.append(o); });
    baoPT(items.length + ' hình trong kho sẵn sàng làm mẫu.');
  } catch (e) { HienThi.loi(e); }
})();
