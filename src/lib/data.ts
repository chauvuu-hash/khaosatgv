import { appendRow, appendRows, appendRowsMapped, readTab, readValues, TABS, updateRow } from "./sheets";
import type { DonViMienList, GiangVien, HocVien, Khoa, PhieuKhaoSat } from "./types";

export async function layDanhSachGiangVien() {
  return readTab<GiangVien>(TABS.GiangVien);
}

export async function layDanhSachKhoa() {
  return readTab<Khoa>(TABS.Khoa);
}

export async function layDanhSachHocVien() {
  return readTab<HocVien>(TABS.HocVien);
}

export type KetQuaUploadHocVien = {
  soDongDoc: number;
  soThemMoi: number;
  soTrung: number;
  loi: { dong: number; ly_do: string }[];
};

/**
 * Them hang loat hoc vien tu file CSV admin upload len. Tu sinh MaHV neu
 * dong khong co san (tiep theo so lon nhat hien co dang so). Bo qua dong
 * trung Email (khong phan biet hoa/thuong) voi hoc vien da co san, de tranh
 * upload trung 1 danh sach 2 lan.
 */
export async function themHocVienHangLoat(
  dongTho: { MaHV?: string; HoTen?: string; Email?: string; DonVi?: string; Mien?: string; MaKhoa?: string }[]
): Promise<KetQuaUploadHocVien> {
  const { rows: hienCo } = await layDanhSachHocVien();
  const emailDaCo = new Set(
    hienCo.map((h) => h.Email.trim().toLowerCase()).filter((e) => e)
  );
  let maxMaHVSo = 0;
  for (const h of hienCo) {
    const n = Number(h.MaHV);
    if (Number.isFinite(n) && n > maxMaHVSo) maxMaHVSo = n;
  }

  const ketQua: KetQuaUploadHocVien = { soDongDoc: dongTho.length, soThemMoi: 0, soTrung: 0, loi: [] };
  const dongMoi: HocVien[] = [];

  dongTho.forEach((d, i) => {
    const hoTen = (d.HoTen ?? "").trim();
    const maKhoa = (d.MaKhoa ?? "").trim();
    const email = (d.Email ?? "").trim();
    if (!hoTen || !maKhoa) {
      ketQua.loi.push({ dong: i + 2, ly_do: "Thieu Ho ten hoac Ma khoa" });
      return;
    }
    if (email && emailDaCo.has(email.toLowerCase())) {
      ketQua.soTrung++;
      return;
    }
    let maHV = (d.MaHV ?? "").trim();
    if (!maHV) {
      maxMaHVSo++;
      maHV = String(maxMaHVSo);
    }
    if (email) emailDaCo.add(email.toLowerCase());
    dongMoi.push({
      MaHV: maHV,
      HoTen: hoTen,
      Email: email,
      DonVi: (d.DonVi ?? "").trim(),
      Mien: (d.Mien ?? "").trim(),
      MaKhoa: maKhoa,
    });
  });

  if (dongMoi.length > 0) {
    await appendRowsMapped(TABS.HocVien, dongMoi as unknown as Record<string, string>[]);
  }
  ketQua.soThemMoi = dongMoi.length;
  return ketQua;
}

/**
 * Tab DonVi co 2 danh sach doc lap nam canh nhau: cot B = Don vi, cot C =
 * Mien (khac do dai, khong doi 1-1 theo hang) - dung cho o xo thu muc chon
 * o form khao sat dung chung, thay vi de hoc vien tu go.
 */
export async function layDanhSachDonViMien(): Promise<DonViMienList> {
  const values = await readValues(`${TABS.DonVi}!B2:C1000`);
  const donVis: string[] = [];
  const miens: string[] = [];
  for (const row of values) {
    if (row[0]) donVis.push(row[0]);
    if (row[1]) miens.push(row[1]);
  }
  return { donVis, miens };
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

export type KetQuaTimPhieuTheoToken =
  | { loai: "don"; headers: string[]; row: PhieuKhaoSat; rowNumber: number }
  | { loai: "nhom"; headers: string[]; danhSach: { row: PhieuKhaoSat; rowNumber: number }[] };

/**
 * Tim phieu theo token trong URL - token co the la 1 MaPhieu don (luong cu,
 * 1 GV) hoac 1 MaNhom (luong "khoa nhieu GV", 1 link gom nhieu phieu cua
 * cung 1 hoc vien). Neu tim thay 1 MaPhieu ma no thuoc 1 nhom (MaNhom khac
 * rong), tra ve ca nhom - de link nhac-lai gui theo tung MaPhieu rieng van
 * mo dung ca nhom day du.
 */
export async function timPhieuKhaoSatTheoToken(
  token: string
): Promise<KetQuaTimPhieuTheoToken | null> {
  const { headers, rows, rowNumbers } = await layDanhSachPhieu();
  const idx = rows.findIndex((r) => r.MaPhieu === token);
  if (idx !== -1) {
    const row = rows[idx];
    if (row.MaNhom) {
      const danhSach = rows
        .map((r, i) => ({ row: r, rowNumber: rowNumbers[i] }))
        .filter((x) => x.row.MaNhom === row.MaNhom);
      return { loai: "nhom", headers, danhSach };
    }
    return { loai: "don", headers, row, rowNumber: rowNumbers[idx] };
  }
  if (!token) return null;
  const danhSach = rows
    .map((r, i) => ({ row: r, rowNumber: rowNumbers[i] }))
    .filter((x) => x.row.MaNhom === token);
  if (danhSach.length > 0) return { loai: "nhom", headers, danhSach };
  return null;
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
    MienNhap: "",
    YKienKhac: "",
    MaNhom: "",
  }));
  await appendRows(TABS.PhieuKhaoSat, phieus as unknown as Record<string, string>[]);
  return phieus;
}

/**
 * Gui khao sat cho 1 khoa co NHIEU giang vien cung luc (vd khoa keo dai
 * nhieu buoi, moi buoi 1 GV khac nhau day). Moi hoc vien nhan 1 link/email
 * DUY NHAT (dung MaNhom lam token) de danh gia lan luot tung GV trong 1 lan,
 * thay vi phai nhan tung email rieng cho moi GV. Ben trong van tao 1 dong
 * PhieuKhaoSat rieng cho moi cap (hoc vien, GV) nhu cu - KPI/thong ke tinh
 * theo GV khong doi gi ca, MaNhom chi dung de gom link.
 */
export async function taoDotGuiKhaoSatNhieuGV(params: {
  maKhoa: string;
  danhSachGV: { maGV: string; ngayDay: string }[];
  hocViens: HocVien[];
}): Promise<PhieuKhaoSat[]> {
  const now = new Date().toISOString();
  const phieus: PhieuKhaoSat[] = [];
  for (const hv of params.hocViens) {
    const maNhom = `PN${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    for (const gv of params.danhSachGV) {
      phieus.push({
        MaPhieu: `PS${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
        MaHV: hv.MaHV,
        MaKhoa: params.maKhoa,
        MaGV: gv.maGV,
        NgayDay: gv.ngayDay,
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
        MienNhap: "",
        YKienKhac: "",
        MaNhom: maNhom,
      });
    }
  }
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
  mien: string;
  diem: number[];
  yKienKhac: string;
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
    MienNhap: params.mien,
    YKienKhac: params.yKienKhac,
    MaNhom: "",
  };
  await appendRow(TABS.PhieuKhaoSat, phieu as unknown as Record<string, string>);
  return phieu;
}

export async function ghiKetQuaPhieu(
  maPhieu: string,
  diem: number[],
  yKienKhac: string
): Promise<PhieuKhaoSat | null | "DA_NOP" | "DA_HUY"> {
  const found = await timPhieuTheoMa(maPhieu);
  if (!found) return null;
  if (found.row.TrangThai === "Da nop") return "DA_NOP";
  if (found.row.TrangThai === "Da huy") return "DA_HUY";
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
    YKienKhac: yKienKhac,
  };
  await updateRow(
    TABS.PhieuKhaoSat,
    found.rowNumber,
    found.headers,
    updated as unknown as Record<string, string>
  );
  return updated;
}

/**
 * Ghi ket qua cho ca 1 nhom phieu (luong "khoa nhieu GV") - 1 lan nop ghi
 * diem cho tat ca cac GV trong nhom cung luc. diemTheoGV khoa boi MaGV.
 */
export async function ghiKetQuaNhomPhieu(
  danhSach: { row: PhieuKhaoSat; rowNumber: number }[],
  headers: string[],
  diemTheoGV: Record<string, number[]>,
  yKienKhac: string
): Promise<"OK" | "DA_NOP" | "DA_HUY" | "THIEU_DIEM"> {
  if (danhSach.some((d) => d.row.TrangThai === "Da nop")) return "DA_NOP";
  if (danhSach.some((d) => d.row.TrangThai === "Da huy")) return "DA_HUY";
  if (danhSach.some((d) => !diemTheoGV[d.row.MaGV] || diemTheoGV[d.row.MaGV].length !== 10)) {
    return "THIEU_DIEM";
  }
  const now = new Date().toISOString();
  for (const { row, rowNumber } of danhSach) {
    const diem = diemTheoGV[row.MaGV];
    const diemTB = diem.reduce((a, b) => a + b, 0) / diem.length;
    const updated: PhieuKhaoSat = {
      ...row,
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
      NgayHoanThanh: now,
      TrangThai: "Da nop",
      YKienKhac: yKienKhac,
    };
    await updateRow(
      TABS.PhieuKhaoSat,
      rowNumber,
      headers,
      updated as unknown as Record<string, string>
    );
  }
  return "OK";
}

/**
 * Huy 1 phieu (vd giang vien/QTDT gui nham email, hoc vien nghi giua chung
 * khong hoc buoi nao). Neu phieu thuoc 1 MaNhom (luong "khoa nhieu GV" - 1
 * email/link duy nhat gom nhieu GV), huy ca nhom luon vi ca nhom dung chung
 * 1 dia chi email - huy rieng 1 dong se de link/email cu van dung duoc cho
 * cac GV con lai. Phieu da huy bi loai khoi moi thong ke (xem thong-ke/route.ts)
 * va khong nop lai duoc (xem ghiKetQuaPhieu/ghiKetQuaNhomPhieu).
 */
export async function huyPhieu(maPhieu: string): Promise<"OK" | "KHONG_TIM_THAY"> {
  const { headers, rows, rowNumbers } = await layDanhSachPhieu();
  const idx = rows.findIndex((r) => r.MaPhieu === maPhieu);
  if (idx === -1) return "KHONG_TIM_THAY";
  const maNhom = rows[idx].MaNhom;
  const doiTuong = maNhom
    ? rows
        .map((r, i) => ({ row: r, rowNumber: rowNumbers[i] }))
        .filter((x) => x.row.MaNhom === maNhom)
    : [{ row: rows[idx], rowNumber: rowNumbers[idx] }];
  for (const { row, rowNumber } of doiTuong) {
    await updateRow(
      TABS.PhieuKhaoSat,
      rowNumber,
      headers,
      { ...row, TrangThai: "Da huy" } as unknown as Record<string, string>
    );
  }
  return "OK";
}

/**
 * Gui khao sat qua "link dung chung" cho khoa co NHIEU giang vien (khong co
 * danh sach hoc vien/email). Giong taoPhieuDungChung nhung cham diem het cac
 * GV trong 1 lan nop, tao 1 dong PhieuKhaoSat rieng cho moi GV, deu "Da nop"
 * ngay (khong co giai doan "Chua nop").
 */
export async function taoPhieuDungChungNhieuGV(params: {
  maKhoa: string;
  danhSachGV: { maGV: string; ngayDay: string }[];
  hoTen: string;
  donVi: string;
  mien: string;
  diemTheoGV: Record<string, number[]>;
  yKienKhac: string;
}): Promise<PhieuKhaoSat[]> {
  const now = new Date().toISOString();
  const phieus: PhieuKhaoSat[] = params.danhSachGV.map((gv) => {
    const diem = params.diemTheoGV[gv.maGV];
    const diemTB = diem.reduce((a, b) => a + b, 0) / diem.length;
    return {
      MaPhieu: `PC${Date.now()}${Math.random().toString(36).slice(2, 10)}`,
      MaHV: "",
      MaKhoa: params.maKhoa,
      MaGV: gv.maGV,
      NgayDay: gv.ngayDay,
      NgayGui: gv.ngayDay,
      NgayHoanThanh: now,
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
      TrangThai: "Da nop",
      HoTenNhap: params.hoTen,
      DonViNhap: params.donVi,
      MienNhap: params.mien,
      YKienKhac: params.yKienKhac,
      MaNhom: "",
    };
  });
  await appendRows(TABS.PhieuKhaoSat, phieus as unknown as Record<string, string>[]);
  return phieus;
}
