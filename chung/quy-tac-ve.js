/* Quy tắc vẽ hình mặc định cho AI (rút từ skill chuan-hoa-latex-toan, mục "Vẽ hình TikZ").
   Chủ kho sửa được trong Cài đặt → lưu ở caiDat/chung.quyTacVe; để trống thì dùng bản này. */
window.QUY_TAC_VE_MAC_DINH = String.raw`QUY TẮC VẼ HÌNH TIKZ (chuẩn hóa LaTeX Toán THCS)
1. TikZ thuần: KHÔNG dùng tkz-euclide (\tkz...), KHÔNG dùng pgfplots (axis). Thư viện đã nạp: calc, angles, quotes, intersections, through, patterns, arrows.meta.
2. Khai báo chuẩn: \begin{tikzpicture}[font=\footnotesize,line join=round,line cap=round,>=stealth,declare function={r=3;}]. Mọi tham số độ dài khai báo bằng declare function hoặc \def, không gõ số trần trong \draw. KHÔNG dùng e, y làm tên biến (dùng dx, dy, y0, w, hg...). Số thập phân tối đa 2 chữ số, viết 1.5 trong mã.
3. Thứ tự 4 bước, đúng trình tự: (1) KHAI BÁO mọi điểm bằng \path ... coordinate (X); (2) VẼ các \draw; (3) CHÚ THÍCH: góc, kí hiệu đoạn bằng nhau, số đo; (4) XUẤT HIỆN ĐIỂM: \foreach chấm tròn + nhãn. Không chấm điểm trước khi vẽ (nhãn bị đường đè).
4. Dựng điểm bằng phép biến hình calc, không tự tính tọa độ (chỉ điểm gốc và đỉnh đã biết số liệu mới gõ tọa độ):
- Điểm theo góc, bán kính: \path (60:r) coordinate (A);
- Trung điểm AB: \path ($(A)!0.5!(B)$) coordinate (M);
- Đối xứng của B qua O: \path ($(B)!2!(O)$) coordinate (Q);
- Hình chiếu A lên BC: \path ($(B)!(A)!(C)$) coordinate (H);
- Đỉnh D của hình bình hành ABCD: \path ($(A)+(C)-(B)$) coordinate (D);
- Quay B quanh O góc -90: \path ($(O)!1!-90:(B)$) coordinate (Q);  TÂM QUAY LUÔN ĐỨNG TRƯỚC. Vuông góc với XY tại X: ($(X)!1!90:(Y)$). Viết ngược là sai hình mà vẫn biên dịch được.
- Trung trực AB: ($(A)!0.5!(B)$) coordinate (M) ($(M)!1!90:(B)$) coordinate (Mx), đường M--Mx.
- Tiếp tuyến tại A của (O): ($(A)!1!-90:(O)$) coordinate (B).
- Trọng tâm: (barycentric cs:A=1,B=1,C=1) coordinate (G).
- Giao HAI ĐƯỜNG THẲNG: luôn dùng (intersection of A--B and C--D) coordinate (E); không dùng thư viện intersections cho trường hợp này.
5. Giao với đường tròn: ưu tiên đối xứng qua hình chiếu tâm: \path ($(M)!(O)!(D)$) coordinate (x) ($(D)!2!(x)$) coordinate (C); (C là giao thứ hai của dây qua D, M). Nếu phải dùng name intersections thì BẮT BUỘC sort by: \path[name path=dt] (A)--(B); \path[name intersections={of=dtO and dt, by=F, sort by=dt}]; (F là giao gần A nhất; cần giao xa thì đảo chiều path). Cấm by={E,F} khi chỉ cần E, cấm biến rác.
6. Điểm ảo để kéo dài: tạo bằng hệ số >1 ($(A)!1.5!(D)$) hoặc +(góc:độ dài); đường chứa điểm ảo dùng \path[overlay], không \draw. Cắt đường tròn bán kính R: +(góc:2*R). Kéo dài đường thẳng hai phía: hệ số 1.3 đến 1.5. Tia có nhãn x, y thì \draw thật, không overlay. Điểm ảo đặt hậu tố (Ax, Bx) và không đưa vào danh sách nhãn.
7. Phân giác: cấm atan2, \pgfmathanglebetweenpoints. Lấy hai điểm cách đỉnh CÙNG 1cm trên hai cạnh: \path ($(A)!1cm!(B)$) coordinate (Ap) ($(A)!1cm!(C)$) coordinate (Aq) ($(Ap)!.5!(Aq)$) coordinate (At) (intersection of A--At and B--C) coordinate (D);
8. Ký hiệu góc, gộp các ký hiệu cùng loại vào MỘT \foreach:
- Góc thường: \foreach \x/\y/\z in {A/B/C} \path pic[draw=black,angle radius=6] {angle=\x--\y--\z};
- Góc vuông: \foreach \x/\y/\z in {B/A/C} \path pic[draw=black,angle radius=6] {right angle=\x--\y--\z};
- Góc có số đo: pic["$60^\circ$",draw,angle radius=12pt,angle eccentricity=1.9]{angle=B--A--C}.
- Cặp góc bằng nhau cùng bán kính; cặp bằng nhau khác thì đổi ký hiệu (hai cung: \foreach \r in {10,14}). Góc đề không nhắc tới thì không vẽ cung.
9. Đoạn thẳng bằng nhau: 1 gạch \foreach \x/\y in {A/B,A/C} \draw ($(\x)!0.5!(\y)!4pt!90:(\x)$)--($(\x)!0.5!(\y)!4pt!-90:(\x)$); 2 gạch thêm \foreach \tl in {.49,.51} thay 0.5.
10. Xuất hiện điểm: \foreach \d/\g in {A/90,B/210,C/-30} \path[draw=black,fill=white] (\d) circle (1pt) +(\g:9pt) node {$\d$}; \g là hướng (độ) đi ra khỏi hình. TUYỆT ĐỐI không dùng above/below/left/right cho NHÃN ĐIỂM. Nhãn tia/đường (x, y, a, b) được dùng above/below. Nhãn độ dài: node[midway,sloped,above]{$6$ cm}. Danh sách chỉ chứa điểm thật.
11. Số trong $, đơn vị ngoài $: $5$ cm, $5$ cm$^2$, $1{,}5$ m, $45^\circ$, $30\%$. Không dùng \text{} cho đơn vị.
12. Nối điểm liên tục thành chuỗi dài nhất: \draw (A)--(B)--(C)--cycle; không viết (A)--(B) (B)--(C). Các chuỗi rời nhau và đường tròn gộp vào MỘT \draw; chỉ tách \draw khi khác thuộc tính (dashed, màu, mũi tên). Đường khuất, đường phụ dùng [dashed].
13. Mã ngắn nhất có thể: gom lặp bằng \foreach, không dòng chú thích %, không dòng trống, mỗi lệnh kết thúc bằng ;. Nhãn không đè lên đường.`;
