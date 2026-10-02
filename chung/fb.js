/* Lớp kết nối Firebase duy nhất của web. Các tệp khác chỉ dùng window.FB.
   Firestore bật bộ nhớ đệm trên máy: dữ liệu đã tải hiện ngay, đồng bộ ngầm. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, browserLocalPersistence, setPersistence }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getDocFromCache, setDoc,
  collection, getDocs, onSnapshot, writeBatch }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

try {
  var cfg = (window.CAU_HINH || {}).FIREBASE || {};
  if (!cfg.apiKey || !cfg.projectId) throw Error('Chưa dán firebaseConfig vào chung/cau-hinh.js.');
  var app = initializeApp(cfg);
  var auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(function () {});
  var db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

  var daBiet = false, nguoiDungHienTai = null, choDoi = [];
  onAuthStateChanged(auth, function (u) {
    nguoiDungHienTai = u; daBiet = true;
    var ds = choDoi; choDoi = []; ds.forEach(function (f) { f(u); });
  });

  function ref(path) { return doc.apply(null, [db].concat(String(path).split('/'))); }
  function coId(snap) { return Object.assign({ id: snap.id }, snap.data()); }

  window.FB = {
    nguoiDung: function () { return daBiet ? Promise.resolve(nguoiDungHienTai) : new Promise(function (ok) { choDoi.push(ok); }); },
    dangNhap: function () {
      var p = new GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account', login_hint: (window.CAU_HINH || {}).EMAIL_CHU || '' });
      return signInWithPopup(auth, p).then(function (r) { return r.user; });
    },
    dangXuat: function () { return signOut(auth); },
    // Đọc một tài liệu: ưu tiên máy chủ, mất mạng thì lấy bản đệm. Không có → null.
    get: async function (path) {
      try { var s = await getDoc(ref(path)); return s.exists() ? s.data() : null; }
      catch (e) { try { var c = await getDocFromCache(ref(path)); return c.exists() ? c.data() : null; } catch (x) { throw e; } }
    },
    // Chỉ đọc bản đệm trên máy. Chưa có trong đệm → undefined.
    getCache: async function (path) {
      try { var c = await getDocFromCache(ref(path)); return c.exists() ? c.data() : null; } catch (e) { return undefined; }
    },
    set: function (path, data, gop) { return setDoc(ref(path), data, gop ? { merge: true } : undefined); },
    // Ghi nhiều tài liệu một lần (tất cả hoặc không gì cả). Mỗi mục {path, data} hoặc {path, xoa:true}.
    ghiNhieu: function (ds) {
      var b = writeBatch(db);
      ds.forEach(function (x) { if (x.xoa) b.delete(ref(x.path)); else b.set(ref(x.path), x.data); });
      return b.commit();
    },
    ds: async function (ten) { var s = await getDocs(collection(db, ten)); return s.docs.map(coId); },
    // Theo dõi cả bộ sưu tập: gọi ngay với dữ liệu đệm, rồi gọi lại mỗi khi có thay đổi.
    theoDoi: function (ten, cb, loi) {
      return onSnapshot(collection(db, ten), function (s) { cb(s.docs.map(coId), s.metadata.fromCache); }, loi);
    }
  };
  window.__fbXong(window.FB);
} catch (e) {
  window.__fbLoi(e);
}
