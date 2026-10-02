(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded',function(){
    GiaoDien.thanhTren({anQuanTri:document.body.dataset.trang==='quan-tri'});DangNhap.kiemTraMayChu();
    var page=document.body.dataset.trang,nav=document.getElementById('menu');
    var links=[['thu-vien.html','Dữ liệu Hình TikZ','kho'],['them-mau.html','Thêm mẫu','sua'],['ve-theo-de.html','Vẽ theo đề bài','ve'],['cai-dat.html','Cài đặt','cai-dat']];
    if((DangNhap.phien()||{}).vaiTro==='admin'){links.splice(3,0,['quet-hinh.html','Quét hình thực tế','quet']);}
    if(nav)nav.innerHTML=links.map(function(x){return '<a class="'+(page===x[2]?'bat':'')+'" href="'+x[0]+'">'+x[1]+'</a>';}).join('');
    var note=document.getElementById('trang-thai-kho');if(note)note.textContent='Firebase · đồng bộ mọi máy';
  });
  window.HienThi={loi:function(e){var el=document.getElementById('loi');if(el){el.hidden=false;el.textContent=e.message||e;}else GiaoDien.thongBao(e.message||e,'loi');},xoaLoi:function(){var el=document.getElementById('loi');if(el)el.hidden=true;}};
})();
