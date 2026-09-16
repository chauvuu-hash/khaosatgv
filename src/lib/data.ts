import { appendRow, appendRows, readTab, TABS, updateRow } from "./sheets";
import type { GiangVien, HocVien, Khoa, PhieuKhaoSat } from "./types";

export async function layDanhSachGiangVien() {
  return readTab<GiangVien>(TABS.GiangVien);
}

export async function layDanhSachKhoa() {
  return readTab<Khoa>(TABS.Khoa);
}

export async function layDanhSachHocVien() {
  return readTab<HocVien>(TABS.HocVien);
}

export async function layDanhSachPhieu() {
  return readTab<PhieuKhaoSat>(TABS.PhieuKhaoSat);
}

export async function timPhieuTheoMa(maPhieu: string) {
  const { headers, rows, rowNumbers } = await layDanhSachPhieu();
  const idx = rows.findIndex((r) => r.MaPhieu === maPhieu);
  if (idx === -1) return null;
  return { headers, row: rows[idx], rowNumber: rowNumbers[idx] };
}

export async function taoDotGuiKhaoSat(params: {
  maKhoa: string;
  maGV: string;
  ngayDay: string;
  hocViens: HocVien[];
}): Promise<PhieuKhaoSat[]> {
  const now = new Date().toISOString();
  const phieus: PhieuKhaoSat[] = params.hocViens.map((hv) => ({
    MaPhieu: `PS${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
    MaHV: hv.MaHV,
    MaKhoa: params.maKhoa,
    MaGV: params.maGV,
    NgayDay: params.ngayDay,
    NgayGui: now,
    NgayHoanThanh: "",
    Diem1: "",
    Diem2: "",
    Diem3: "",
    Diem4: "",
    Diem5: "",
    Diem6: "",
    Diem7: "",
    Diem8: "",
    Diem9: "",
    Diem10: "",
    DiemTB: "",
    TrangThai: "Chua nop",
    HoTenNhap: "",
    DonViNhap: "",
  }));
  await appendRows(TABS.PhieuKhaoSat, phieus as unknown as Record<string, string>[]);
  return phieus;
}

/**
 * Nop 1 phieu qua "link dung chung" (chua co danh sach hoc vien/email, QTDT
 * gui link qua Zalo/Telegram). Hoc vien tu go Ho ten + Don vi. Khac voi luong
 * ca nhan hoa: phieu duoc tao va hoan thanh ngay trong 1 buoc (khong co giai
 * doan "Chua nop"), va link co the dung lai nhieu lan (moi lan nop tao 1 dong moi).
 */
export async function taoPhieuDungChung(params: {
  maKhoa: string;
  maGV: string;
  ngayDay: string;
  hoTen: string;
  donVi: string;
  diem: number[];
}): Promise<PhieuKhaoSat> {
  const now = new Date().toISOString();
  const diemTB = params.diem.reduce((a, b) => a + b, 0) / params.diem.length;
  const phieu: PhieuKhaoSat = {
    MaPhieu: `PC${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
    MaHV: "",
    MaKhoa: params.maKhoa,
    MaGV: params.maGV,
    NgayDay: params.ngayDay,
    NgayGui: params.ngayDay,
    NgayHoanThanh: now,
    Diem1: String(params.diem[0]),
    Diem2: String(params.diem[1]),
    Diem3: String(params.diem[2]),
    Diem4: String(params.diem[3]),
    Diem5: String(params.diem[4]),
    Diem6: String(params.diem[5]),
    Diem7: String(params.diem[6]),
    Diem8: String(params.diem[7]),
    Diem9: String(params.diem[8]),
    Diem10: String(params.diem[9]),
    DiemTB: diemTB.toFixed(2),
    TrangThai: "Da nop",
    HoTenNhap: params.hoTen,
    DonViNhap: params.donVi,
  };
  await appendRow(TABS.PhieuKhaoSat, phieu as unknown as Record<string, string>);
  return phieu;
}

export async function ghiKetQuaPhieu(
  maPhieu: string,
  diem: number[]
): Promise<PhieuKhaoSat | null | "DA_NOP"> {
  const found = await timPhieuTheoMa(maPhieu);
  if (!found) return null;
  if (found.row.TrangThai === "Da nop") return "DA_NOP";
  const diemTB = diem.reduce((a, b) => a + b, 0) / diem.length;
  const updated: PhieuKhaoSat = {
    ...found.row,
    Diem1: String(diem[0]),
    Diem2: String(diem[1]),
    Diem3: String(diem[2]),
    Diem4: String(diem[3]),
    Diem5: String(diem[4]),
    Diem6: String(diem[5]),
    Diem7: String(diem[6]),
    Diem8: String(diem[7]),
    Diem9: String(diem[8]),
    Diem10: String(diem[9]),
    DiemTB: diemTB.toFixed(2),
    NgayHoanThanh: new Date().toISOString(),
    TrangThai: "Da nop",
  };
  await updateRow(
    TABS.PhieuKhaoSat,
    found.rowNumber,
    found.headers,
    updated as unknown as Record<string, string>
  );
  return updated;
}
