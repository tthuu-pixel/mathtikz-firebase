(async function(){
  'use strict';var admin=DangNhap.co('ai'),chu=DangNhap.laChu(),config,el=document.getElementById('ai-cards');
  function node(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
  function field(label,control){var e=node('label','',label);e.append(control);return e;}
  function input(type,value){var e=node('input','o-nhap');e.type=type;e.value=value||'';return e;}
  function paint(){
    el.replaceChildren();document.getElementById('ai-active').value=config.active;
    Object.keys(AIUI.catalog).forEach(function(id){
      var info=AIUI.catalog[id],saved=config.providers[id],form=node('form','the-trang ai-card'),title=node('h2','',info.name),state=node('p','ai-state',saved.hasKey?'Đã lưu API key':'Chưa có API key');
      var base=input('url',saved.base),model=node('select','o-nhap'),custom=input('text',saved.model),key=input('password'),clear=input('checkbox');base.required=true;custom.maxLength=160;key.autocomplete='off';key.placeholder=saved.hasKey?'Để trống để giữ key đã lưu':'Nhập API key';key.disabled=!admin||API.chayThu;clear.disabled=!admin||API.chayThu;
      var list=Array.from(new Set(info.models.concat([saved.model])));list.forEach(function(name){var option=node('option','',name+(id==='deepseek'&&name.indexOf('deepseek-v4-flash')===0?' (alias)':''));option.value=name;model.append(option);});var other=node('option','','Nhập model khác…');other.value='__custom';model.append(other);model.value=saved.model;
      var customLabel=field('Model tùy chọn',custom);customLabel.hidden=true;model.onchange=function(){customLabel.hidden=model.value!=='__custom';};
      var toggle=node('button','nut nho','Hiện key');toggle.type='button';toggle.disabled=key.disabled;toggle.onclick=function(){key.type=key.type==='password'?'text':'password';toggle.textContent=key.type==='password'?'Hiện key':'Ẩn key';};
      var keyRow=node('div','api-key-row');keyRow.append(key,toggle);var keyLabel=node('label','','API key');keyLabel.append(keyRow);
      var clearLabel=node('label','check-line');clearLabel.append(clear,document.createTextNode('Xóa key đã lưu khi bấm Lưu'));
      var actions=node('div','hang-nut'),save=node('button','nut chinh','Lưu '+info.name),test=node('button','nut','Kiểm tra kết nối'),models=node('button','nut','Lấy model từ API');test.type=models.type='button';save.disabled=!admin;test.disabled=models.disabled=!admin||API.chayThu;
      [base,model,custom].forEach(function(e){e.disabled=!admin;});actions.append(save,test,models);
      var docs=node('a','','Danh sách model chính thức ↗');docs.href=info.docs;docs.target='_blank';docs.rel='noopener';var note=node('p','mo',info.note);
      form.append(title,state,field('Base URL',base),field('Model',model),customLabel,keyLabel,clearLabel,actions,note,docs);
      var busy=false;
      async function run(fn){if(busy)return;busy=true;[save,test,models].forEach(function(b){b.disabled=true;});HienThi.xoaLoi();try{await fn();}catch(e){HienThi.loi(e);}finally{busy=false;save.disabled=!admin;test.disabled=models.disabled=!admin||API.chayThu;}}
      form.onsubmit=function(e){e.preventDefault();run(async function(){config=await AIUI.save({provider:id,base:base.value.trim(),model:model.value==='__custom'?custom.value.trim():model.value,key:key.value,clearKey:clear.checked});key.value='';clear.checked=false;state.textContent=config.providers[id].hasKey?'Đã lưu API key':'Đã lưu Base URL và model · chưa có key';GiaoDien.thongBao('Đã lưu '+info.name+(API.chayThu?' (cấu hình xem thử)':''));});};
      test.onclick=function(){run(async function(){await Kho.api('thuAI',{provider:id});GiaoDien.thongBao('Kết nối '+info.name+' thành công với cấu hình đã lưu.');});};
      models.onclick=function(){run(async function(){var result=await Kho.api('dsModelAI',{provider:id});result.models.forEach(function(name){if(!Array.from(model.options).some(function(o){return o.value===name;})){var o=node('option','',name);o.value=name;model.insertBefore(o,other);}});state.textContent='Đã lấy '+result.models.length+' model từ API. Chọn rồi bấm Lưu.';});};
      el.append(form);
    });document.getElementById('luu-ai-active').disabled=!admin;
  }
  document.getElementById('ai-active').disabled=!admin;
  document.getElementById('luu-ai-active').onclick=async function(){var b=this;b.disabled=true;try{config=await AIUI.save({active:document.getElementById('ai-active').value});GiaoDien.thongBao('Đã chọn AI dùng cho quét và vẽ theo đề.');}catch(e){HienThi.loi(e);}finally{b.disabled=!admin;}};
  (function taiKhoan(){
    var p=DangNhap.phien()||{},ten={xem:'Xem',tai:'Tải',ai:'AI',sua:'Sửa kho'},q=document.getElementById('tk-quyen');
    document.getElementById('tk-thong-tin').textContent=(p.hoTen&&p.hoTen!==p.ten?p.hoTen+' · ':'')+(p.ten||'')+' · '+(chu?'Chủ kho (đăng nhập Google, có mọi quyền)':'Thành viên');
    Object.keys(ten).forEach(function(k){q.append(node('span','nhan '+(DangNhap.co(k)?'co-quyen':'khong-quyen'),(DangNhap.co(k)?'✓ ':'✗ ')+ten[k]));});
    if(chu)return;var f=document.getElementById('doi-mk');f.hidden=false;document.getElementById('mk-ten').value=p.ten||'';
    f.onsubmit=async function(e){e.preventDefault();var b=document.getElementById('mk-luu'),cu=document.getElementById('mk-cu').value,moi=document.getElementById('mk-moi').value;HienThi.xoaLoi();
      if(moi!==document.getElementById('mk-lai').value){HienThi.loi(Error('Hai lần nhập mật khẩu mới chưa khớp.'));return;}
      if(moi.length<8){HienThi.loi(Error('Mật khẩu mới cần ít nhất 8 ký tự.'));return;}
      b.disabled=true;try{await (await window.FBSanSang).doiMatKhau(cu,moi);f.reset();document.getElementById('mk-ten').value=p.ten||'';GiaoDien.thongBao('Đã đổi mật khẩu.');}
      catch(x){var m=x&&x.code||'';HienThi.loi(Error(m==='auth/invalid-credential'||m==='auth/wrong-password'?'Mật khẩu hiện tại không đúng.':m==='auth/weak-password'?'Mật khẩu mới quá yếu.':m==='auth/too-many-requests'?'Thử sai quá nhiều lần, hãy đợi vài phút.':(x.message||String(x))));}
      finally{b.disabled=false;}};
  })();
  if(!chu){document.getElementById('phan-macro').hidden=true;document.getElementById('ai-ghi-chu').textContent='Đây là key riêng của bạn: lưu trong Firestore, chỉ tài khoản của bạn đọc được (kể cả chủ kho cũng không xem được); trình duyệt gọi thẳng hãng AI.';}
  if(!admin){document.getElementById('phan-ai').hidden=true;}
  else{try{config=await AIUI.read();paint();}catch(e){HienThi.loi(e);}}
  if(chu)try{document.getElementById('macro').value=API.chayThu?localStorage.getItem('mtkweb_macro')||'':(await Kho.api('docCaiDat')).macros;}catch(e){HienThi.loi(e);}
  document.getElementById('luu-macro').disabled=!chu;document.getElementById('macro').readOnly=!chu;
  document.getElementById('luu-macro').onclick=async function(){var b=this;b.disabled=true;try{var value=document.getElementById('macro').value;if(API.chayThu)localStorage.setItem('mtkweb_macro',value);else await Kho.api('luuCaiDat',{macros:value});GiaoDien.thongBao('Đã lưu macro. Hãy build lại hình khi macro thay đổi.');}catch(e){HienThi.loi(e);}finally{b.disabled=!chu;}};
})();
