(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded',function(){
    GiaoDien.thanhTren();DangNhap.kiemTraMayChu();
    var page=document.body.dataset.trang,nav=document.getElementById('menu');
    var co=DangNhap.co,links=[];
    if(co('xem'))links.push(['thu-vien.html','Dữ liệu Hình TikZ','kho']);
    links.push(['them-mau.html','Thêm mẫu','sua']);
    if(co('ai')&&co('tai'))links.push(['ve-theo-de.html','Vẽ theo đề bài','ve']);
    if(co('ai')&&co('sua'))links.push(['quet-hinh.html','Quét hình thực tế','quet']);
    links.push(['cai-dat.html','Cài đặt','cai-dat']);
    if(DangNhap.laChu())links.push(['quan-tri.html','Quản trị tài khoản','quan-tri']);
    if(nav)nav.innerHTML=links.map(function(x){return '<a class="'+(page===x[2]?'bat':'')+'" href="'+x[0]+'">'+x[1]+'</a>';}).join('');
    var note=document.getElementById('trang-thai-kho');if(note)note.textContent='Firebase · đồng bộ mọi máy';
  });
  window.HienThi={loi:function(e){var el=document.getElementById('loi');if(el){el.hidden=false;el.textContent=e.message||e;}else GiaoDien.thongBao(e.message||e,'loi');},xoaLoi:function(){var el=document.getElementById('loi');if(el)el.hidden=true;}};
})();
