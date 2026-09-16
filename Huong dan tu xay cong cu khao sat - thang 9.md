# Hướng dẫn P.NVĐT tự xây công cụ khảo sát giảng viên (bản tạm, dùng trong tháng 9 — chờ P.CN xây hệ thống chính thức)

> Mục tiêu: một trang web nhỏ, tự làm bằng Claude Code, giải quyết 4 việc chị đang làm thủ công: sửa form khảo sát, gửi khảo sát qua email tự động, thống kê tỷ lệ nộp phiếu, tính KPI GV/QTĐT — KHÔNG phải hệ thống chính thức (việc đó P.CN làm, theo file "Đặc tả nghiệp vụ khảo sát giảng viên.docx"). Bản này chỉ cần chạy được, không cần hoàn hảo.

## Nguyên tắc thu gọn phạm vi so với đặc tả gửi P.CN

Để làm kịp trong tháng 9, bản tạm này **bỏ bớt** phần tự động phát hiện "GV vừa dạy xong buổi nào" (cần có lịch phân công buổi đầy đủ trong hệ thống — việc lớn, để P.CN làm). Thay vào đó: **QTĐT tự bấm nút "Gửi khảo sát" ngay sau khi 1 GV dạy xong 1 buổi** — vẫn đúng người, đúng lúc, chỉ khác là do người bấm thay vì hệ thống tự phát hiện. Đây là cách đơn giản nhất để giải quyết đúng vấn đề gốc (học viên quên nội dung vì gửi quá trễ) mà không phải xây phần lịch phân công phức tạp.

---

## Chuẩn bị trước khi bắt tay vào code (làm trong 1 buổi, ngày 17/9)

1. **Chốt các số liệu nghiệp vụ** — cần có trước, không thì code sai:
   - "Điểm >8" tính trên điểm **trung bình 10 câu** của 1 phiếu (giả định trong đặc tả) hay tổng điểm? → chốt với chị Nguyễn Thanh Hằng.
   - Danh sách 14 giảng viên + bảng ánh xạ GV → QTĐT phụ trách (Phúc: Huệ, Mỹ Hạnh, Hoàng Hạnh, Lan, Linh; Châu: Nguyệt, Thụy, Thanh, Mai, Tâm, Thơ) — gõ sẵn ra 1 file Excel để nhập vào hệ thống.
   - Danh mục khóa học đang mở trong tháng 9 (tên khóa, mã khóa tạm đặt nếu chưa có mã chính thức).

2. **Tạo 1 Google Sheet mới** làm "cơ sở dữ liệu" tạm (khác với sheet "2026 KQ Phiếu khảo sát" cũ — sheet cũ giữ nguyên để đối chiếu, không sửa). Tạo các tab:
   - `GiangVien` (Mã GV, Họ tên, QTĐT phụ trách)
   - `Khoa` (Mã khóa, Tên khóa, Loại lớp)
   - `HocVien` (Mã HV, Họ tên, Email, Đơn vị, Miền, Mã khóa)
   - `PhieuKhaoSat` (sẽ để trống, hệ thống tự ghi vào đây khi có người nộp phiếu)

3. Chuẩn bị tài khoản: GitHub (nếu chưa có), Vercel (đăng ký free bằng tài khoản GitHub), Resend.com (free, dùng để gửi email — đăng ký free bằng email công việc).

---

## Bước 1 — Khởi tạo dự án với Claude Code (17-18/9)

1. Mở Claude Code trên máy (đúng công cụ nhóm đã dùng cho dự án tài liệu đào tạo VNPT Heart trước đó).
2. Tạo 1 thư mục mới, ví dụ `khao-sat-giang-vien`, mở terminal tại đó, gõ `claude` để bắt đầu phiên làm việc.
3. Đưa cho Claude Code 3 thứ làm bối cảnh: file `Đặc tả nghiệp vụ khảo sát giảng viên.docx`, file `Huong dan xay dung Claude Code...md` (bản đầy đủ gửi kèm P.CN), và file hướng dẫn này — nói rõ với Claude Code: **"Xây bản MVP theo đúng phạm vi rút gọn trong file hướng dẫn tháng 9 này, không làm phần lịch phân công buổi tự động."**
4. Yêu cầu Claude Code khởi tạo dự án Next.js, kết nối GitHub, chuẩn bị deploy Vercel. Giao diện dùng màu VNPT Heart (xanh #0056A9, đỏ #CF1A21, nền trắng/#F0F8FE) cho đồng bộ.

## Bước 2 — Kết nối Google Sheet làm nơi lưu dữ liệu (18-19/9)

Không dùng database mới cho bản tạm — tận dụng Google Sheet đã tạo ở bước Chuẩn bị, đỡ tốn thời gian học công cụ mới.

1. Nhờ Claude Code hướng dẫn tạo 1 "Google Service Account" (tài khoản kỹ thuật để phần mềm đọc/ghi được Google Sheet) — đây là bước kỹ thuật, Claude Code sẽ chỉ từng cú click.
2. Chia sẻ quyền chỉnh sửa Google Sheet vừa tạo cho email của service account đó.
3. Yêu cầu Claude Code viết phần code đọc danh sách `GiangVien`, `Khoa`, `HocVien` và ghi dữ liệu mới vào `PhieuKhaoSat` mỗi khi có người nộp phiếu.

## Bước 3 — Sửa form khảo sát (19-20/9)

Yêu cầu Claude Code làm 1 trang khảo sát mới, giữ nguyên 10 câu hỏi/thang điểm hiện tại, nhưng sửa đúng 3 lỗi đã chỉ ra:
- Không cho nhập tay "Họ tên" và "Khoá học" — hệ thống tự nhận diện học viên và khóa qua đường link cá nhân hóa (mỗi học viên 1 link riêng, xem Bước 4).
- Mỗi khảo sát chỉ đánh giá **1 giảng viên/1 buổi cụ thể**, không hỏi gộp nhiều GV trong 1 phiếu.
- Sau khi nộp, ghi thẳng vào tab `PhieuKhaoSat` (không cần thao tác tổng hợp thủ công).

## Bước 4 — Trang gửi khảo sát qua email (22-23/9)

Trang nội bộ, chỉ QTĐT dùng (đặt mật khẩu đơn giản để tránh người ngoài vào), cho phép:
1. Chọn khóa học, chọn GV vừa dạy xong, chọn danh sách học viên (lấy từ tab `HocVien` theo khóa đó).
2. Bấm **"Gửi khảo sát"** → hệ thống tự tạo 1 link riêng cho từng học viên (gắn sẵn mã học viên + mã khóa + mã GV) và gửi email qua Resend.

Đây chính là bước thay thế việc "GV tự gửi link" — chuyển từ 1 lần duy nhất cuối khóa sang gửi ngay sau mỗi buổi, QTĐT chủ động bấm nút thay vì hệ thống tự động phát hiện lịch.

## Bước 5 — Trang thống kê tỷ lệ nộp phiếu (24-25/9)

Với mỗi lần đã "Gửi khảo sát" ở Bước 4, hiển thị:
- Số học viên đã nộp phiếu / tổng số học viên trong danh sách.
- Danh sách tên học viên **chưa nộp**, để QTĐT chủ động nhắc (nút "Gửi nhắc lại" dùng lại cơ chế Bước 4).

## Bước 6 — Trang tính KPI tự động (26-27/9)

Theo đúng công thức đã chốt ở phần Chuẩn bị:
```
KPI GV = (số phiếu của GV có điểm > 8) / (tổng số phiếu của GV trong kỳ) — đạt khi ≥ 96%
KPI QTĐT = gộp theo bảng ánh xạ GV → QTĐT, tính cùng công thức trên
```
Cho phép lọc theo tháng, hiển thị bảng theo từng GV và theo từng QTĐT.

## Bước 7 — Chạy thử & đối chiếu (29-30/9)

- Dùng công cụ thật với 1-2 lớp đang diễn ra cuối tháng 9.
- **Đối chiếu song song** với cách tính thủ công trên Google Sheet cũ trong ít nhất 1 đợt, để kiểm tra số liệu khớp trước khi tin tưởng dùng chính thức.
- Nếu lệch số, khả năng cao nằm ở công thức "điểm >8" — quay lại kiểm tra giả định ở phần Chuẩn bị.

## Sau tháng 9 — bàn giao khi P.CN xây xong hệ thống chính thức

Giữ nguyên cấu trúc dữ liệu (tên các trường trong Google Sheet: Mã HV, Mã khóa, Mã GV, Điểm...) khớp với mô hình dữ liệu trong file đặc tả gửi P.CN, để khi hệ thống chính thức ra đời (dự kiến 30/11–31/12/2026) có thể **import thẳng dữ liệu đã tích lũy**, không mất công nhập lại.

---

## Lịch tóm tắt

| Ngày | Việc chính |
|---|---|
| 17/9 | Chốt số liệu nghiệp vụ + tạo Google Sheet dữ liệu |
| 17-18/9 | Khởi tạo dự án với Claude Code |
| 18-19/9 | Kết nối Google Sheet |
| 19-20/9 | Sửa form khảo sát |
| 22-23/9 | Trang gửi khảo sát qua email |
| 24-25/9 | Trang thống kê tỷ lệ nộp phiếu |
| 26-27/9 | Trang tính KPI tự động |
| 29-30/9 | Chạy thử, đối chiếu số liệu với cách làm cũ |
