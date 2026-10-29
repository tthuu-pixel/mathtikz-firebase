(async function(){
  'use strict';var chu=DangNhap.laChu();
  function node(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
  (function taiKhoan(){
    var p=DangNhap.phien()||{},ten={xem:'Xem',tai:'Tải',sua:'Sửa kho'},q=document.getElementById('tk-quyen');
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
  if(!chu){document.getElementById('phan-macro').hidden=true;document.getElementById('phan-quy-tac').hidden=true;return;}
  document.getElementById('phan-quan-tri').hidden=false;
  if(location.hash==='#phan-quan-tri')setTimeout(function(){document.getElementById('phan-quan-tri').scrollIntoView();},0);
  try{document.getElementById('macro').value=API.chayThu?localStorage.getItem('mtkweb_macro')||'':(await Kho.api('docCaiDat')).macros;}catch(e){HienThi.loi(e);}
  document.getElementById('luu-macro').onclick=async function(){var b=this;b.disabled=true;try{var value=document.getElementById('macro').value;if(API.chayThu)localStorage.setItem('mtkweb_macro',value);else await Kho.api('luuCaiDat',{macros:value});GiaoDien.thongBao('Đã lưu macro. Hãy build lại hình khi macro thay đổi.');}catch(e){HienThi.loi(e);}finally{b.disabled=false;}};
  var o=document.getElementById('quy-tac'),luu=document.getElementById('luu-quy-tac');
  try{o.value=await Kho.quyTacVe();}catch(e){HienThi.loi(e);}
  document.getElementById('mac-dinh-quy-tac').onclick=function(){o.value=window.QUY_TAC_VE_MAC_DINH||'';GiaoDien.thongBao('Đã nạp lại quy tắc mặc định. Bấm Lưu quy tắc để áp dụng.');};
  luu.onclick=async function(){luu.disabled=true;try{var v=o.value.trim();await Kho.api('luuQuyTacVe',{quyTacVe:v===String(window.QUY_TAC_VE_MAC_DINH||'').trim()?'':v});GiaoDien.thongBao('Đã lưu quy tắc vẽ hình.');}catch(e){HienThi.loi(e);}finally{luu.disabled=false;}};
})();
