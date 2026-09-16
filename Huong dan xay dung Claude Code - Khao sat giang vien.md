# Hướng dẫn xây dựng: Web Khảo sát Chất lượng Giảng viên (dùng Claude Code)

> File này dùng để đưa cho Claude Code (agent dòng lệnh) làm bối cảnh khởi tạo dự án. Đọc kèm file "Đặc tả nghiệp vụ khảo sát giảng viên.docx" để hiểu đầy đủ quy tắc nghiệp vụ trước khi code.

## 1. Mục tiêu

Thay thế quy trình hiện tại (Google Form + Google Sheet tổng hợp thủ công) bằng một module trong hệ thống Web Quản lý đào tạo, tự động:
- Gửi khảo sát đúng đối tượng, đúng thời điểm theo từng loại lớp (chuyên đề 1 buổi / ĐTV mới nhiều buổi-nhiều GV).
- Đối chiếu tỷ lệ hoàn thành khảo sát so với danh sách học viên thực tế của khóa.
- Tính KPI Giảng viên và KPI Quản trị đào tạo (QTĐT) tự động, không copy dữ liệu thủ công khi đổi mẫu phiếu.
- Xuất báo cáo theo khóa / giảng viên / QTĐT.

## 2. Tài liệu & dữ liệu tham chiếu

- Đặc tả nghiệp vụ đầy đủ: `Đặc tả nghiệp vụ khảo sát giảng viên.docx` (đi kèm).
- Mẫu khảo sát hiện hành (giữ nguyên nội dung 10 câu hỏi, thang 1–10): https://docs.google.com/forms/d/e/1FAIpQLScYqc76yhE6VpyPW-jFBo_Bm0p3J1VYgJQxqebXWmeWjuxxVg/viewform
- Dữ liệu lịch sử cần đối chiếu khi import: https://docs.google.com/spreadsheets/d/1me_Igy7THmgVDWMro2SbCUVCdPczvezdeyuYxVdb2Ag/edit?gid=543747077
- Danh sách 14 giảng viên hiện tại: Vũ Thị Huệ, Đoàn Thị Mỹ Hạnh, Hà Thị Hoàng Hạnh, Nguyễn Thị Trúc Linh, Nguyễn Lê Hoàng Lan, Võ Thị Minh Nguyệt, Đỗ Như Thụy, Võ An Thanh, Nguyễn Thị Thanh Mai, Võ Thị Minh Tâm, Phan Thị Thơ, Nguyễn Thị Hồng Phúc, Vưu Hồng Châu, Ngô Lý Thùy Nhi.
- Bảng ánh xạ GV → QTĐT phụ trách (cần nhập làm dữ liệu hệ thống, không hard-code):
  - Phúc: Huệ, Mỹ Hạnh, Hoàng Hạnh, Lan, Linh
  - Châu: Nguyệt, Thụy, Thanh, Mai, Tâm, Thơ

## 3. Ngăn xếp công nghệ đề xuất

Theo đúng hướng đã dùng cho các dự án nội bộ khác của P.NVĐT (xem tài liệu đào tạo nội bộ "Claude Code + GitHub + Vercel"): Next.js (React) + TypeScript, deploy Vercel, mã nguồn quản lý trên GitHub. Nếu module này phải nằm chung trong hệ thống Web Quản lý đào tạo hiện có (do P.CN quản trị), ưu tiên khớp stack sẵn có của hệ thống đó thay vì stack ở trên — cần xác nhận với P.CN trước khi khởi tạo.

Giao diện: theo bộ nhận diện VNPT Heart (xanh dương #0056A9, đỏ nhấn #CF1A21, nền trắng/#F0F8FE) để đồng bộ với các tài liệu/công cụ nội bộ khác đang xây dựng.

## 4. Mô hình dữ liệu đề xuất

| Bảng | Trường chính | Ghi chú |
|---|---|---|
| `HocVien` | Mã HV, Họ tên, Email, Đơn vị, Miền | Do các Đài gửi lên trước khai giảng |
| `Khoa` | Mã khóa, Tên khóa, Loại lớp (Chuyên đề / ĐTV mới), Ngày bắt đầu, Ngày kết thúc | Thay cho trường "Khoá học" nhập tay |
| `BuoiHoc` | Mã buổi, Mã khóa, Ngày dạy, Mã GV phụ trách, Ca học (sáng/chiều/nguyên ngày) | Cần lịch phân công GV theo từng buổi — điều kiện tiên quyết để tự động trigger gửi khảo sát |
| `DanhSachHocVien_Khoa` | Mã khóa, Mã HV | Danh sách học viên từng khóa, dùng để đối chiếu tỷ lệ hoàn thành |
| `GiangVien` | Mã GV, Họ tên, Mã QTĐT phụ trách | Bảng ánh xạ GV → QTĐT, cho phép P.NVĐT cập nhật khi đổi phân công |
| `MauKhaoSat` | Phiên bản, Ngày áp dụng từ, Danh sách câu hỏi | Versioning — giải quyết vấn đề đổi mẫu tháng 6/2026 |
| `PhieuKhaoSat` | Mã phiếu, Mã HV, Mã khóa, Mã buổi, Mã GV được đánh giá, Ngày gửi, Ngày hoàn thành, 10 điểm chi tiết, Điểm trung bình, Phiên bản mẫu | 1 dòng = 1 phiếu trả lời, thay thế toàn bộ các tab Google Sheet rời rạc |

## 5. Luồng nghiệp vụ chính cần code

### 5.1 Gửi khảo sát tự động
- Lớp chuyên đề (1 buổi, 1 GV): trigger gửi email ngay khi buổi học kết thúc, tới toàn bộ học viên trong `DanhSachHocVien_Khoa`.
- Lớp ĐTV mới (nhiều buổi, nhiều GV): trigger gửi riêng theo từng buổi, ngay sau khi GV phụ trách buổi đó hoàn thành (không đợi hết khóa) — theo `BuoiHoc.NgayDay`.
- Mỗi lần gửi tạo một `PhieuKhaoSat` (chưa hoàn thành) gắn Mã khóa + Mã buổi + Mã GV cụ thể.

### 5.2 Đối chiếu tỷ lệ hoàn thành
- Tính: số `PhieuKhaoSat` đã hoàn thành / tổng số dòng trong `DanhSachHocVien_Khoa` tương ứng buổi/khóa.
- Cảnh báo nếu chưa đạt 100% sau X ngày (mặc định đề xuất 3–5 ngày — cần P.NVĐT chốt), cho phép gửi nhắc lại.

### 5.3 Tính KPI tự động
```
KPI_GV = (số phiếu của GV có Điểm_trung_bình > 8) / (tổng số phiếu của GV trong kỳ)
→ Đạt KPI nếu KPI_GV >= 96%

KPI_QTDT = (tổng số phiếu điểm >8 của mọi GV có Mã_QTĐT_phụ_trách = QTĐT đó)
           / (tổng số phiếu của các GV đó trong kỳ)
```
Lưu ý: "điểm >8" hiện giả định là điểm trung bình 10 câu hỏi của 1 phiếu — **cần P.NVĐT xác nhận lại trước khi code phần này**, vì đây là điểm ảnh hưởng trực tiếp đến công thức.

Lọc theo kỳ báo cáo (tháng/quý/năm) và theo `Phiên bản mẫu` để khi mẫu khảo sát đổi (như tháng 6/2026), số liệu lịch sử không bị sai lệch và không cần copy tay.

### 5.4 Ẩn danh
- Giao diện xem báo cáo (GV, QTĐT) không hiển thị Họ tên/Email học viên gắn với từng phiếu — chỉ hiển thị điểm tổng hợp.
- Chỉ vai trò Admin (P.NVĐT) truy cập được dữ liệu chi tiết từng phiếu, phục vụ đối chiếu tỷ lệ hoàn thành.

### 5.5 Báo cáo đầu ra
- Theo khóa: điểm trung bình từng GV đã dạy khóa đó + tỷ lệ hoàn thành khảo sát.
- Theo giảng viên: xu hướng điểm theo tháng/quý (thay thế các tab "T1...T12" thủ công).
- Theo QTĐT: KPI tổng hợp nhóm GV phụ trách.

## 6. Gợi ý triển khai theo giai đoạn (khớp mốc RACI)

1. **Giai đoạn 1 (trong 30/9):** dựng schema dữ liệu (mục 4) + màn hình nhập danh sách học viên/khóa/lịch phân công GV theo buổi.
2. **Giai đoạn 2 (đến 30/11):** module gửi khảo sát tự động (5.1) + form khảo sát (giữ nguyên 10 câu hỏi) + đối chiếu tỷ lệ hoàn thành (5.2).
3. **Giai đoạn 3 (đến 15/12):** module tính KPI tự động (5.3) + ẩn danh (5.4) + chạy song song đối chiếu với cách tính thủ công hiện tại để kiểm tra sai số trước khi thay thế hoàn toàn.
4. **Giai đoạn 4 (đến 31/12):** nghiệm thu — 100% khóa học khảo sát trên hệ thống, loại bỏ hoàn toàn thao tác thủ công trên Google Sheet.

## 7. Câu hỏi Claude Code nên hỏi lại nếu thiếu thông tin khi bắt đầu code

- "Điểm >8" tính trên điểm trung bình phiếu hay tổng điểm 10 câu?
- Học viên xác thực bằng email cá nhân hay email do Đài cấp? Ai chịu trách nhiệm cập nhật danh sách học viên/lịch phân công GV theo buổi lên hệ thống?
- Module này build độc lập rồi tích hợp, hay phải code trực tiếp trong codebase hiện có của Web Quản lý đào tạo (do P.CN quản trị)? Nếu là codebase có sẵn, cần lấy stack/coding convention hiện tại trước khi khởi tạo.
- Số ngày tối đa trước khi hệ thống tự động nhắc học viên chưa hoàn thành khảo sát?
