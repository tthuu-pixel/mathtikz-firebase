(async function(){
  'use strict';
  var items=[],real=document.body.dataset.trang==='thuc-te',generation=0;
  var phien=DangNhap.phien()||{},laAdmin=phien.vaiTro==='admin',laHocSinh=phien.vaiTro==='hocsinh';
  function node(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
  function laNhap(item){return String(item.id||'').indexOf('nhap-')===0;}
  function coTheLuu(item){return !laHocSinh&&(laNhap(item)||laAdmin||API.chayThu);}

  /* ---------- Lưới hình ---------- */
  function render(){var grid=document.getElementById('luoi'),q=Tikz.chuan(document.getElementById('tim').value),grade=document.getElementById('khoi').value,topic=document.getElementById('chu-de').value;var filtered=items.filter(function(x){return(!real||x.kind==='real')&&(!grade||x.grade===grade)&&(!topic||x.topic===topic)&&Tikz.chuan([x.title,x.topic,x.tags,x.description].join(' ')).indexOf(q)>=0;});document.getElementById('so-mau').textContent=filtered.length+' mẫu'+(real?' hình thực tế':'');grid.replaceChildren();var current=++generation;if(!filtered.length){grid.innerHTML='<div class="trong" style="grid-column:1/-1"><h2>Chưa có mẫu phù hợp</h2><p>Thêm mã hình của bạn hoặc thay đổi bộ lọc.</p><a class="nut chinh" href="them-mau.html">Thêm mẫu</a></div>';return;}
    filtered.forEach(function(item){
      var khung=node('div','mau-khung'),card=node('a','mau');card.href='them-mau.html?id='+encodeURIComponent(item.id);
      var image=node('div','anh-mau','Đang tải ảnh…'),info=node('div','thong-tin'),title=node('h3','',item.title),tag=node('span','nhan',(item.kind==='real'?'Thực tế':'Toán cơ bản')+(item.grade?' · Khối '+item.grade:''));
      info.append(title,tag);var chiTiet=[item.topic,item.tags].filter(Boolean).join(' · ');if(chiTiet)info.append(node('p','mo',chiTiet));card.append(image,info);
      var sua=node('button','nut nho nut-sua','Edit');sua.type='button';sua.title='Sửa nhanh: copy mã, sửa mã, đổi tên';sua.setAttribute('aria-label','Sửa nhanh '+(item.title||'hình'));sua.onclick=function(e){e.preventDefault();e.stopPropagation();moSua(item);};
      var zip=node('button','nut nho nut-sua nut-zip','ZIP');zip.type='button';zip.title='Tải ZIP: file .tex và ảnh của hình này';zip.setAttribute('aria-label','Tải ZIP '+(item.title||'hình'));
      zip.onclick=async function(e){e.preventDefault();e.stopPropagation();zip.disabled=true;zip.textContent='…';try{await Kho.taiZipMot(item.id);}catch(x){HienThi.loi(x);}finally{zip.disabled=false;zip.textContent='ZIP';}};
      khung.append(card,zip,sua);grid.append(khung);
      var observer=new IntersectionObserver(function(entries){if(!entries.some(function(x){return x.isIntersecting;}))return;observer.disconnect();Kho.anh(item).then(function(src){if(current!==generation)return;image.textContent='';if(src){var img=document.createElement('img');img.alt=item.title;img.src=src;image.append(img);}else image.textContent='Chưa có ảnh';}).catch(function(){image.textContent='Không tải được ảnh';});});observer.observe(card);
    });
  }
  function chuDe(){var select=document.getElementById('chu-de'),cu=select.value;select.replaceChildren(new Option('Tất cả chủ đề',''));Array.from(new Set(items.filter(function(x){return !real||x.kind==='real';}).map(function(x){return x.topic;}).filter(Boolean))).sort().forEach(function(t){select.add(new Option(t,t));});select.value=cu;if(select.value!==cu)select.value='';}
  var huy=null;
  async function load(){var button=document.getElementById('tai-lai');button.disabled=true;HienThi.xoaLoi();try{if(huy)huy();huy=await Kho.theoDoi(function(ds){items=ds;chuDe();if(!(hop.open&&busy))render();button.disabled=false;},function(e){HienThi.loi(e);button.disabled=false;});}catch(e){HienThi.loi(e);button.disabled=false;}}

  /* ---------- Hộp sửa nhanh ---------- */
  var hop=node('dialog','hop-sua');
  hop.innerHTML='<form method="dialog"><h2>Sửa nhanh</h2>'+
    '<label>Tên hình<input class="o-nhap" id="hs-ten" maxlength="200" autocomplete="off"></label>'+
    '<label>Mã TikZ<textarea class="o-nhap" id="hs-ma" spellcheck="false"></textarea></label>'+
    '<p class="mo" id="hs-trang-thai"></p><p class="hs-loi" id="hs-loi" hidden></p>'+
    '<div class="hang-nut"><button type="button" class="nut nho" id="hs-copy">Copy mã</button><a class="nut nho" id="hs-mo">Mở trang sửa đầy đủ</a><span class="gian"></span>'+
    '<button type="button" class="nut nho" id="hs-zip">Tải ZIP</button><button type="button" class="nut nho nguy" id="hs-xoa">Xóa hình</button><button type="button" class="nut nho" id="hs-dong">Đóng</button><button type="button" class="nut nho chinh" id="hs-luu">Lưu</button></div></form>';
  document.body.append(hop);
  var $=function(id){return document.getElementById('hs-'+id);},goc=null,busy=false,luot=0;
  function baoLoi(text){$('loi').textContent=text||'';$('loi').hidden=!text;}
  function khoa(value){busy=value;var duoc=goc&&coTheLuu(goc.item);$('luu').disabled=value||!duoc;$('xoa').disabled=value||!duoc;$('dong').disabled=value;$('ten').readOnly=$('ma').readOnly=value||!duoc;}
  async function moSua(item){
    if(busy)return;var lan=++luot;goc=null;baoLoi('');
    $('ten').value=item.title||'';$('ma').value='Đang tải mã…';$('mo').href='them-mau.html?id='+encodeURIComponent(item.id);$('luu').hidden=$('xoa').hidden=!coTheLuu(item);$('trang-thai').textContent='';khoa(false);$('luu').disabled=true;$('ten').readOnly=$('ma').readOnly=true;
    hop.showModal();
    try{var full=await Kho.doc(item.id);}catch(e){if(lan===luot){$('ma').value='';baoLoi('Không tải được mã: '+e.message);}return;}
    if(lan!==luot||!hop.open)return;
    goc={item:item,full:full,ten:full.title||'',ma:full.source||''};$('ten').value=goc.ten;$('ma').value=goc.ma;khoa(false);
    $('trang-thai').textContent=!coTheLuu(item)?'Bạn chỉ có quyền xem và copy mã. Muốn lưu bản sửa, bấm "Mở trang sửa đầy đủ" để lưu nháp.':laNhap(item)?'Đây là bản nháp trên máy: bấm Lưu sẽ cập nhật bản nháp.':'Sửa xong bấm Lưu. Nếu mã thay đổi, web sẽ build lại ảnh rồi mới lưu vào kho.';
  }
  $('dong').onclick=function(){if(!busy)hop.close();};
  $('zip').onclick=async function(){if(!goc||busy)return;var b=this;b.disabled=true;try{await Kho.taiZipMot(goc.item.id);}catch(e){baoLoi(e.message||String(e));}finally{b.disabled=false;}};
  document.getElementById('tai-toan-bo').onclick=async function(){var b=this,cu=b.textContent;b.disabled=true;HienThi.xoaLoi();try{var kq=await Kho.taiZipToanBo(function(i,n){b.textContent='Đang gói '+i+'/'+n+'…';});GiaoDien.thongBao('Đã tải '+kq.soHinh+' hình.');if(kq.loi.length)HienThi.loi(Error('Một số hình chưa gói được:\n'+kq.loi.join('\n')));}catch(e){HienThi.loi(e);}finally{b.disabled=false;b.textContent=cu;}};
  $('xoa').onclick=async function(){if(!goc||busy)return;if(!confirm('Xóa hẳn hình "'+(goc.item.title||'')+'" khỏi kho? Không hoàn tác được.'))return;khoa(true);try{await Kho.xoa(goc.item.id);items=items.filter(function(x){return x!==goc.item;});khoa(false);hop.close();render();GiaoDien.thongBao('Đã xóa hình.');}catch(e){khoa(false);baoLoi(e.message||String(e));}};
  hop.addEventListener('cancel',function(e){if(busy)e.preventDefault();});
  $('copy').onclick=async function(){var ma=$('ma');try{await navigator.clipboard.writeText(ma.value);}catch(e){ma.focus();ma.select();try{document.execCommand('copy');}catch(x){GiaoDien.thongBao('Hãy bôi đen mã rồi Ctrl+C.','loi');return;}}GiaoDien.thongBao('Đã copy mã.');};
  $('luu').onclick=async function(){
    if(!goc||busy||!coTheLuu(goc.item))return;var ten=$('ten').value.trim(),ma=$('ma').value;baoLoi('');
    if(!ten){baoLoi('Nhập tên hình trước khi lưu.');return;}
    if(ten===goc.ten&&ma===goc.ma){hop.close();return;}
    khoa(true);
    try{
      Tikz.tach(ma);if(ma.indexOf('\\documentclass')>=0)throw Error('Chỉ nhập mã hình tikzpicture; macro đặt trong phần Cài đặt.');
      var moi=Object.assign({},goc.full,{title:ten,source:ma}),image='';
      if(ma===goc.ma){image=goc.full.image||'';if(!image){try{image=await Kho.anh(goc.item);}catch(e){image='';}}}
      if(!image){$('trang-thai').textContent='Đang build hình…';image=await Kho.build(ma);}
      moi.image=image;moi.imageSource=ma;moi.updatedAt=new Date().toISOString();
      $('trang-thai').textContent='Đang lưu…';
      var daLuu=laNhap(goc.item)?await Kho.nhap(moi):await Kho.luu(moi);
      goc.item.title=(daLuu&&daLuu.title)||ten;goc.item.image=image;goc.item.imageSource=ma;
      khoa(false);hop.close();render();GiaoDien.thongBao(laNhap(goc.item)?'Đã cập nhật bản nháp.':'Đã lưu vào kho.');
    }catch(e){khoa(false);$('trang-thai').textContent='';baoLoi(e.message||String(e));}
  };

  ['tim','khoi','chu-de'].forEach(function(id){document.getElementById(id).addEventListener('input',render);});document.getElementById('tai-lai').onclick=load;await load();
})();
