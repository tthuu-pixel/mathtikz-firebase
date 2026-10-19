(async function(){
  'use strict';
  var items=[],real=document.body.dataset.trang==='thuc-te',generation=0;
  var coSua=DangNhap.co('sua'),coTai=DangNhap.co('tai');
  var nhomMo=new URLSearchParams(location.search).get('nhom')||'',dangChon=false,daChon=new Set();
  function node(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
  function $id(id){return document.getElementById(id);}
  function laNhap(item){return String(item.id||'').indexOf('nhap-')===0;}
  function coTheLuu(item){return laNhap(item)||coSua;}
  function moiThem(a,b){return String(b.createdAt||b.updatedAt||'').localeCompare(String(a.createdAt||a.updatedAt||''));}

  /* ---------- Ảnh: tải khi thẻ hiện trên màn hình ---------- */
  function taiAnh(el,the,item,current){
    var ob=new IntersectionObserver(function(entries){if(!entries.some(function(x){return x.isIntersecting;}))return;ob.disconnect();
      Kho.anh(item).then(function(src){if(current!==generation)return;el.textContent='';if(src){var img=document.createElement('img');img.alt=item.title;img.src=src;el.append(img);}else el.textContent='Chưa có ảnh';}).catch(function(){el.textContent='Không tải được ảnh';});});
    ob.observe(the);
  }

  /* ---------- Thẻ một hình ---------- */
  function theHinh(item,current,hienNhom){
    var khung=node('div','mau-khung'+(daChon.has(item.id)?' da-chon':'')),card=node('a','mau');card.href='them-mau.html?id='+encodeURIComponent(item.id);if(!coTai&&!laNhap(item)){card.classList.add('chi-xem');card.title='Tài khoản của bạn chỉ có quyền xem hình';card.onclick=function(e){e.preventDefault();GiaoDien.thongBao('Bạn chỉ có quyền xem. Cần quyền Tải để mở mã hình.');};}
    var image=node('div','anh-mau','Đang tải ảnh…'),info=node('div','thong-tin');
    info.append(node('h3','',item.title),node('span','nhan',(item.kind==='real'?'Thực tế':'Toán cơ bản')+(item.grade?' · Khối '+item.grade:'')));
    if(hienNhom&&item.nhom){info.append(' ');info.append(node('span','nhan nhan-nhom','Nhóm: '+item.nhom));}
    var chiTiet=[item.topic,item.tags].filter(Boolean).join(' · ');if(chiTiet)info.append(node('p','mo',chiTiet));card.append(image,info);
    if(dangChon){
      khung.append(card,node('span','o-tich',daChon.has(item.id)?'✓':''));
      card.onclick=function(e){e.preventDefault();if(daChon.has(item.id))daChon.delete(item.id);else daChon.add(item.id);render();};
      taiAnh(image,card,item,current);return khung;
    }
    var sua=node('button','nut nho nut-sua','Edit');sua.type='button';sua.title='Sửa nhanh: copy mã, sửa mã, đổi tên, đổi nhóm';sua.setAttribute('aria-label','Sửa nhanh '+(item.title||'hình'));sua.onclick=function(e){e.preventDefault();e.stopPropagation();moSua(item);};
    var zip=node('button','nut nho nut-sua nut-zip','ZIP');zip.type='button';zip.title='Tải ZIP: file .tex và ảnh của hình này';zip.setAttribute('aria-label','Tải ZIP '+(item.title||'hình'));
    zip.onclick=async function(e){e.preventDefault();e.stopPropagation();zip.disabled=true;zip.textContent='…';try{await Kho.taiZipMot(item.id);}catch(x){HienThi.loi(x);}finally{zip.disabled=false;zip.textContent='ZIP';}};
    var xoaNut=node('button','nut nho nut-sua nut-xoa','Xóa');xoaNut.type='button';xoaNut.title='Xóa hình này khỏi kho';xoaNut.setAttribute('aria-label','Xóa '+(item.title||'hình'));
    xoaNut.onclick=async function(e){e.preventDefault();e.stopPropagation();if(!confirm('Xóa hẳn hình "'+(item.title||'')+'" khỏi kho? Không hoàn tác được.'))return;xoaNut.disabled=true;xoaNut.textContent='…';try{await Kho.xoa(item.id);items=items.filter(function(x){return x!==item;});render();GiaoDien.thongBao('Đã xóa "'+(item.title||'hình')+'".');}catch(x){HienThi.loi(x);xoaNut.disabled=false;xoaNut.textContent='Xóa';}};
    if(!coTheLuu(item))xoaNut.hidden=true;
    if(!coTai&&!laNhap(item)){zip.hidden=true;sua.hidden=true;}
    khung.append(card,xoaNut,zip,sua);taiAnh(image,card,item,current);return khung;
  }

  /* ---------- Thẻ nhóm: ảnh đại diện = hình mới thêm gần nhất ---------- */
  function theNhom(ten,thanhVien,current){
    var dai=thanhVien.slice().sort(moiThem)[0],khung=node('div','mau-khung nhom-khung'),card=node('a','mau the-nhom');
    card.href='?nhom='+encodeURIComponent(ten);card.onclick=function(e){e.preventDefault();moNhom(ten);};
    var image=node('div','anh-mau','Đang tải ảnh…'),info=node('div','thong-tin');
    info.append(node('h3','',ten),node('span','nhan nhan-nhom','Nhóm · '+thanhVien.length+' hình'));
    card.append(image,info);khung.append(card);taiAnh(image,card,dai,current);return khung;
  }

  /* ---------- Lưới ---------- */
  function render(){
    var grid=$id('luoi'),q=Tikz.chuan($id('tim').value.trim()),grade=$id('khoi').value,topic=$id('chu-de').value,current=++generation;
    var loc=items.filter(function(x){return(!real||x.kind==='real')&&(!grade||x.grade===grade)&&(!topic||x.topic===topic);});
    function khop(x){return !q||Tikz.chuan([x.title,x.topic,x.tags,x.description,x.nhom].join(' ')).indexOf(q)>=0;}
    var nhom={};loc.forEach(function(x){if(x.nhom)(nhom[x.nhom]=nhom[x.nhom]||[]).push(x);});
    var dsNhom=Object.keys(nhom).sort(function(a,b){return a.localeCompare(b,'vi');}),hinh=[],nhomHien=[];
    if(nhomMo){hinh=(nhom[nhomMo]||[]).filter(khop);}
    else if(q){hinh=loc.filter(khop);nhomHien=dsNhom.filter(function(t){return Tikz.chuan(t).indexOf(q)>=0;});}
    else{nhomHien=dsNhom;hinh=loc.filter(function(x){return !x.nhom;});}
    $id('duong-dan').hidden=!nhomMo;$id('ten-nhom').textContent=nhomMo;
    $id('ds-nhom').replaceChildren.apply($id('ds-nhom'),Array.from(new Set(items.map(function(x){return x.nhom;}).filter(Boolean))).sort().map(function(t){var o=document.createElement('option');o.value=t;return o;}));
    $id('so-mau').textContent=(nhomMo?(nhom[nhomMo]||[]).length+' hình trong nhóm':(nhomHien.length?nhomHien.length+' nhóm · ':'')+hinh.length+' hình'+(q?' khớp tìm kiếm':' lẻ'))+(dangChon?' · bấm vào hình để chọn':'');
    $id('so-chon').textContent=daChon.size;document.body.classList.toggle('dang-chon',dangChon);$id('thanh-chon').hidden=!dangChon;$id('chon-nhieu').hidden=dangChon||!coSua;
    grid.replaceChildren();
    if(!nhomHien.length&&!hinh.length){grid.innerHTML='<div class="trong" style="grid-column:1/-1"><h2>Chưa có mẫu phù hợp</h2><p>Thêm mã hình của bạn hoặc thay đổi bộ lọc.</p><a class="nut chinh" href="them-mau.html">Thêm mẫu</a></div>';return;}
    nhomHien.forEach(function(t){grid.append(theNhom(t,nhom[t],current));});
    hinh.forEach(function(x){grid.append(theHinh(x,current,!nhomMo));});
  }
  function moNhom(ten){nhomMo=ten;$id('tim').value='';history.pushState({nhom:ten},'','?nhom='+encodeURIComponent(ten));render();window.scrollTo(0,0);}
  window.addEventListener('popstate',function(){nhomMo=new URLSearchParams(location.search).get('nhom')||'';render();});
  $id('ve-tat-ca').onclick=function(){if(history.state&&history.state.nhom)history.back();else{nhomMo='';history.replaceState(null,'',location.pathname);render();}};
  $id('doi-ten-nhom').onclick=async function(){
    var moi=prompt('Tên mới cho nhóm "'+nhomMo+'" (trùng tên nhóm có sẵn thì hai nhóm gộp lại):',nhomMo);if(moi==null)return;moi=Kho.chuanNhom(moi);
    if(!moi||moi===nhomMo)return;var b=this;b.disabled=true;
    try{await Kho.doiTenNhom(nhomMo,moi);items.forEach(function(x){if(x.nhom===nhomMo)x.nhom=moi;});nhomMo=moi;history.replaceState({nhom:moi},'','?nhom='+encodeURIComponent(moi));render();GiaoDien.thongBao('Đã đổi tên nhóm.');}
    catch(e){HienThi.loi(e);}finally{b.disabled=false;}
  };
  $id('zip-nhom').onclick=async function(){var b=this,cu=b.textContent;b.disabled=true;try{var kq=await Kho.taiZipNhom(nhomMo,function(i,n){b.textContent='Đang gói '+i+'/'+n+'…';});GiaoDien.thongBao('Đã tải '+kq.soHinh+' hình của nhóm.');}catch(e){HienThi.loi(e);}finally{b.disabled=false;b.textContent=cu;}};

  /* ---------- Chọn nhiều → chuyển nhóm ---------- */
  $id('chon-nhieu').onclick=function(){dangChon=true;daChon.clear();$id('chon-nhom').value=nhomMo;render();};
  $id('huy-chon').onclick=function(){dangChon=false;daChon.clear();render();};
  $id('chon-het').onclick=function(){document.querySelectorAll('#luoi .mau-khung:not(.nhom-khung) a.mau').forEach(function(a){var id=decodeURIComponent((a.getAttribute('href')||'').split('id=')[1]||'');if(id)daChon.add(id);});render();};
  async function chuyen(ten){
    if(!daChon.size){GiaoDien.thongBao('Chưa chọn hình nào.','loi');return;}
    var ids=Array.from(daChon);ten=Kho.chuanNhom(ten);
    try{await Kho.datNhom(ids,ten);items.forEach(function(x){if(daChon.has(x.id))x.nhom=ten;});GiaoDien.thongBao(ten?'Đã chuyển '+ids.length+' hình vào nhóm "'+ten+'".':'Đã bỏ '+ids.length+' hình khỏi nhóm.');daChon.clear();dangChon=false;render();}
    catch(e){HienThi.loi(e);}
  }
  $id('chuyen-nhom').onclick=function(){var t=$id('chon-nhom').value;if(!Kho.chuanNhom(t)){GiaoDien.thongBao('Nhập tên nhóm.','loi');$id('chon-nhom').focus();return;}chuyen(t);};
  $id('bo-nhom').onclick=function(){chuyen('');};

  function chuDe(){var select=$id('chu-de'),cu=select.value;select.replaceChildren(new Option('Tất cả chủ đề',''));Array.from(new Set(items.filter(function(x){return !real||x.kind==='real';}).map(function(x){return x.topic;}).filter(Boolean))).sort().forEach(function(t){select.add(new Option(t,t));});select.value=cu;if(select.value!==cu)select.value='';}
  var huy=null;
  async function load(){var button=$id('tai-lai');button.disabled=true;HienThi.xoaLoi();try{if(huy)huy();huy=await Kho.theoDoi(function(ds){items=ds;chuDe();if(!(hop.open&&busy))render();button.disabled=false;},function(e){HienThi.loi(e);button.disabled=false;});}catch(e){HienThi.loi(e);button.disabled=false;}}

  /* ---------- Hộp sửa nhanh ---------- */
  var hop=node('dialog','hop-sua');
  hop.innerHTML='<form method="dialog"><h2>Sửa nhanh</h2>'+
    '<div class="hai-o"><label>Tên hình<input class="o-nhap" id="hs-ten" maxlength="200" autocomplete="off"></label>'+
    '<label>Nhóm<input class="o-nhap" id="hs-nhom" list="ds-nhom" maxlength="60" autocomplete="off" placeholder="Để trống nếu không thuộc nhóm"></label></div>'+
    '<label>Mã TikZ<textarea class="o-nhap" id="hs-ma" spellcheck="false"></textarea></label>'+
    '<p class="mo" id="hs-trang-thai"></p><p class="hs-loi" id="hs-loi" hidden></p>'+
    '<div class="hang-nut"><button type="button" class="nut nho" id="hs-copy">Copy mã</button><a class="nut nho" id="hs-mo">Mở trang sửa đầy đủ</a><span class="gian"></span>'+
    '<button type="button" class="nut nho" id="hs-zip">Tải ZIP</button><button type="button" class="nut nho nguy" id="hs-xoa">Xóa hình</button><button type="button" class="nut nho" id="hs-dong">Đóng</button><button type="button" class="nut nho chinh" id="hs-luu">Lưu</button></div></form>';
  document.body.append(hop);
  var $=function(id){return document.getElementById('hs-'+id);},goc=null,busy=false,luot=0;
  function baoLoi(text){$('loi').textContent=text||'';$('loi').hidden=!text;}
  function khoa(value){busy=value;var duoc=goc&&coTheLuu(goc.item);$('luu').disabled=value||!duoc;$('xoa').disabled=value||!duoc;$('dong').disabled=value;$('ten').readOnly=$('ma').readOnly=$('nhom').readOnly=value||!duoc;}
  async function moSua(item){
    if(busy)return;var lan=++luot;goc=null;baoLoi('');
    $('ten').value=item.title||'';$('nhom').value=item.nhom||'';$('ma').value='Đang tải mã…';$('mo').href='them-mau.html?id='+encodeURIComponent(item.id);$('luu').hidden=$('xoa').hidden=!coTheLuu(item);$('trang-thai').textContent='';khoa(false);$('luu').disabled=true;$('ten').readOnly=$('ma').readOnly=true;
    hop.showModal();
    try{var full=await Kho.doc(item.id);}catch(e){if(lan===luot){$('ma').value='';baoLoi('Không tải được mã: '+e.message);}return;}
    if(lan!==luot||!hop.open)return;
    goc={item:item,full:full,ten:full.title||'',ma:full.source||'',nhom:full.nhom||''};$('ten').value=goc.ten;$('nhom').value=goc.nhom;$('ma').value=goc.ma;khoa(false);
    $('trang-thai').textContent=!coTheLuu(item)?'Tài khoản của bạn không có quyền sửa kho: chỉ xem, copy và tải mã. Muốn giữ bản sửa riêng, bấm "Mở trang sửa đầy đủ" rồi lưu nháp trên máy.':laNhap(item)?'Đây là bản nháp trên máy: bấm Lưu sẽ cập nhật bản nháp.':'Sửa xong bấm Lưu. Nếu mã thay đổi, web sẽ build lại ảnh rồi mới lưu vào kho.';
  }
  $('dong').onclick=function(){if(!busy)hop.close();};
  $('zip').onclick=async function(){if(!goc||busy)return;var b=this;b.disabled=true;try{await Kho.taiZipMot(goc.item.id);}catch(e){baoLoi(e.message||String(e));}finally{b.disabled=false;}};
  $id('tai-toan-bo').onclick=async function(){var b=this,cu=b.textContent;b.disabled=true;HienThi.xoaLoi();try{var kq=await Kho.taiZipToanBo(function(i,n){b.textContent='Đang gói '+i+'/'+n+'…';});GiaoDien.thongBao('Đã tải '+kq.soHinh+' hình.');if(kq.loi.length)HienThi.loi(Error('Một số hình chưa gói được:\n'+kq.loi.join('\n')));}catch(e){HienThi.loi(e);}finally{b.disabled=false;b.textContent=cu;}};
  $('xoa').onclick=async function(){if(!goc||busy)return;if(!confirm('Xóa hẳn hình "'+(goc.item.title||'')+'" khỏi kho? Không hoàn tác được.'))return;khoa(true);try{await Kho.xoa(goc.item.id);items=items.filter(function(x){return x!==goc.item;});khoa(false);hop.close();render();GiaoDien.thongBao('Đã xóa hình.');}catch(e){khoa(false);baoLoi(e.message||String(e));}};
  hop.addEventListener('cancel',function(e){if(busy)e.preventDefault();});
  $('copy').onclick=async function(){var ma=$('ma');try{await navigator.clipboard.writeText(ma.value);}catch(e){ma.focus();ma.select();try{document.execCommand('copy');}catch(x){GiaoDien.thongBao('Hãy bôi đen mã rồi Ctrl+C.','loi');return;}}GiaoDien.thongBao('Đã copy mã.');};
  $('luu').onclick=async function(){
    if(!goc||busy||!coTheLuu(goc.item))return;var ten=$('ten').value.trim(),ma=$('ma').value,nhom=Kho.chuanNhom($('nhom').value);baoLoi('');
    if(!ten){baoLoi('Nhập tên hình trước khi lưu.');return;}
    if(ten===goc.ten&&ma===goc.ma&&nhom===goc.nhom){hop.close();return;}
    khoa(true);
    try{
      if(ten===goc.ten&&ma===goc.ma){await Kho.datNhom([goc.item.id],nhom);goc.item.nhom=nhom;khoa(false);hop.close();render();GiaoDien.thongBao(nhom?'Đã chuyển vào nhóm "'+nhom+'".':'Đã bỏ khỏi nhóm.');return;}
      Tikz.tach(ma);if(ma.indexOf('\\documentclass')>=0)throw Error('Chỉ nhập mã hình tikzpicture; macro đặt trong phần Cài đặt.');
      var moi=Object.assign({},goc.full,{title:ten,source:ma,nhom:nhom}),image='';
      if(ma===goc.ma){image=goc.full.image||'';if(!image){try{image=await Kho.anh(goc.item);}catch(e){image='';}}}
      if(!image){$('trang-thai').textContent='Đang build hình…';image=await Kho.build(ma);}
      moi.image=image;moi.imageSource=ma;moi.updatedAt=new Date().toISOString();
      $('trang-thai').textContent='Đang lưu…';
      var daLuu=laNhap(goc.item)?await Kho.nhap(moi):await Kho.luu(moi);
      goc.item.title=(daLuu&&daLuu.title)||ten;goc.item.nhom=nhom;goc.item.image=image;goc.item.imageSource=ma;
      khoa(false);hop.close();render();GiaoDien.thongBao(laNhap(goc.item)?'Đã cập nhật bản nháp.':'Đã lưu vào kho.');
    }catch(e){khoa(false);$('trang-thai').textContent='';baoLoi(e.message||String(e));}
  };

  if(!coSua)$id('doi-ten-nhom').hidden=true;if(!coTai){$id('tai-toan-bo').hidden=true;$id('zip-nhom').hidden=true;}
  /* ---------- Xuất kho cho AI (chủ kho) ---------- */
  if(DangNhap.laChu()&&window.XuatAI){
    $id('xuat-ai').hidden=false;
    if(XuatAI.ghiThangDuoc)XuatAI.layHandle().then(function(h){if(h){$id('doi-thu-muc-ai').hidden=false;$id('xuat-ai').title='Ghi kho vào thư mục "'+h.name+'" cho Codex và Claude Cowork';}});
    else $id('xuat-ai').title='Trình duyệt này không ghi thẳng vào thư mục được: web tải về kho-tikz.zip, bạn giải nén đè vào thư mục kho-tikz trong Google Drive';
    var xuat=async function(chonLai){var b=$id('xuat-ai'),cu=b.textContent;b.disabled=true;HienThi.xoaLoi();
      try{var kq=await XuatAI.chay(function(i,n){b.textContent='Đang xuất '+i+'/'+n+'…';},chonLai);
        if(!kq)return;
        if(kq.zip)GiaoDien.thongBao('Đã tải kho-tikz.zip ('+kq.soHinh+' hình). Giải nén đè vào thư mục Google Drive.');
        else{$id('doi-thu-muc-ai').hidden=false;GiaoDien.thongBao('Đã xuất '+kq.soHinh+' hình vào "'+kq.thuMuc+'": ghi mới '+kq.ghiMoi+(kq.xoa?', xóa '+kq.xoa:'')+'.');}}
      catch(e){HienThi.loi(e);}finally{b.disabled=false;b.textContent=cu;}};
    $id('xuat-ai').onclick=function(){xuat(false);};$id('doi-thu-muc-ai').onclick=function(){xuat(true);};
  }
  ['tim','khoi','chu-de'].forEach(function(id){$id(id).addEventListener('input',render);});$id('tai-lai').onclick=load;await load();
})();
