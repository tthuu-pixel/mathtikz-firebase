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
  // Tên pic giống hệt cách Kho.ve đặt (theo thứ tự, mỗi hình một pic).
  function tenPic() {
    var daDung = {}, ten = {};
    thanhPhan.forEach(function (t) { if (t.chon && !ten[t.chon]) ten[t.chon] = Pic.ten(theoId[t.chon].title, daDung); });
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
      if (t.chon) { dau.append(' '); dau.append(node('span', 'nhan-pic', '\\pic {' + ten[t.chon] + '}')); }
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
    if (!items.length) { HienThi.loi(Error('Kho chưa có hình nào để chọn mẫu.')); return; }
    HienThi.xoaLoi(); nut.disabled = true; baoPT('AI đang đọc đề và tìm mẫu trong kho…');
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

  $('ve').onclick = async function () {
    var de = $('de').value.trim(), nut = this;
    if (!de) { HienThi.loi(Error('Nhập đề bài trước.')); return; }
    var ids = [], veMoi = [];
    thanhPhan.forEach(function (t) { if (t.chon) { if (ids.indexOf(t.chon) < 0) ids.push(t.chon); } else if (t.vaiTro === 'vat-the') veMoi.push(t.ten); });
    HienThi.xoaLoi(); dangBan = true; nut.disabled = true; $('phan-tich').disabled = true;
    try {
      baoVe('AI đang dựng hình từ ' + ids.length + ' mẫu…');
      var kq = await Kho.ve(de, ids, veMoi), source = kq.source, image = '', imageSource = '';
      baoVe('Đang build thử…');
      var thu = await Kho.thuBuild(source);
      if (thu.ok) { image = thu.image; imageSource = source; }
      else {
        baoVe('Build lỗi, AI đang sửa mã…');
        try { var sua = await AIKetNoi.suaMa(source, thu.loi); source = sua.source; if (sua.daBuild || sua.khongLoi) { image = sua.image; imageSource = source; } } catch (e) {}
      }
      var dung = ids.map(function (id) { return theoId[id]; });
      var draft = Object.assign(Tikz.moi(), {
        source: source, image: image, imageSource: imageSource, title: de.replace(/\s+/g, ' ').slice(0, 80), description: de,
        kind: dung.some(function (x) { return x.kind === 'real'; }) || !dung.length ? 'real' : 'basic',
        grade: (dung.filter(function (x) { return x.grade; })[0] || {}).grade || '', topic: (dung[0] || {}).topic || '',
        tags: kq.pics.map(function (p) { return p.name; }).join(', ')
      });
      draft.id = 'nhap-' + draft.id;
      await Kho.nhap(draft);
      location.href = 'them-mau.html?tao=' + encodeURIComponent(draft.id);
    } catch (e) { HienThi.loi(e); baoVe(''); }
    finally { dangBan = false; $('phan-tich').disabled = false; veDanhSach(); }
  };

  try {
    items = (await Kho.danhSach()).filter(function (x) { return String(x.id).indexOf('nhap-') !== 0; });
    items.forEach(function (x) { theoId[x.id] = x; });
    baoPT(items.length + ' hình trong kho sẵn sàng làm mẫu.');
  } catch (e) { HienThi.loi(e); }
})();
