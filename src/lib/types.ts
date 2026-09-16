export type GiangVien = {
  MaGV: string;
  HoTen: string;
  QTDT: string;
};

export type Khoa = {
  MaKhoa: string;
  TenKhoa: string;
  LoaiLop: string;
};

export type HocVien = {
  MaHV: string;
  HoTen: string;
  Email: string;
  DonVi: string;
  Mien: string;
  MaKhoa: string;
};

export type TrangThaiPhieu = "Chua nop" | "Da nop";

export type PhieuKhaoSat = {
  MaPhieu: string;
  MaHV: string;
  MaKhoa: string;
  MaGV: string;
  NgayDay: string;
  NgayGui: string;
  NgayHoanThanh: string;
  Diem1: string;
  Diem2: string;
  Diem3: string;
  Diem4: string;
  Diem5: string;
  Diem6: string;
  Diem7: string;
  Diem8: string;
  Diem9: string;
  Diem10: string;
  DiemTB: string;
  TrangThai: string;
  /** Chi dung khi nop qua link dung chung (khong co MaHV vi chua co danh sach hoc vien). */
  HoTenNhap: string;
  DonViNhap: string;
};

export const CAU_HOI_KHAO_SAT: string[] = [
  "Sự chuyên nghiệp, nhiệt tình của giảng viên",
  "Cách giảng dạy (phương pháp truyền đạt)",
  "Sự chuyên sâu về kiến thức chuyên môn",
  "Nội dung trình bày rõ ràng, dễ hiểu",
  "Chất lượng tài liệu đào tạo",
  "Hướng dẫn xử lý tình huống thực tế",
  "Giải đáp thắc mắc của học viên",
  "Điều phối thời lượng buổi học hợp lý",
  "Khuyến khích trao đổi, tương tác",
  "Công cụ hỗ trợ học tập được sử dụng",
];
