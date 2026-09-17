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

/** Danh sach Don vi / Mien de xo thu muc chon (tab DonVi), thay vi ho tu go. */
export type DonViMienList = {
  donVis: string[];
  miens: string[];
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
  MienNhap: string;
  /** Cau 11 - y kien dong gop tu do, khong bat buoc, ap dung ca 2 luong (ca nhan hoa + dung chung). */
  YKienKhac: string;
  /**
   * Ma nhom - cac phieu cung 1 hoc vien, cung 1 dot gui "khoa nhieu giang
   * vien" se chia se cung 1 MaNhom, de gui chung 1 link/email danh gia het
   * cac GV trong 1 lan. Rong neu la phieu don (1 GV, nhu truoc gio).
   */
  MaNhom: string;
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

/** Cau 11 - rieng, khong cham diem 1-10 nhu 10 cau tren ma la o nhap tu do. */
export const CAU_Y_KIEN_KHAC = "Ý kiến đóng góp khác";
