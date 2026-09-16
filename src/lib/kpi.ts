import type { GiangVien, PhieuKhaoSat } from "./types";

export const NGUONG_DIEM_DAT = 8;

/**
 * Nguong KPI thay doi theo thoi gian (quy dinh moi):
 * - Thang 1-7/2026: >= 90%
 * - Tu thang 8/2026: >= 96%
 * Khi khong loc theo 1 thang cu the (thang = null, xem "toan bo"), dung nguong
 * hien hanh (96%) lam mac dinh.
 */
export function nguongKpiTheoThang(thang: string | null): number {
  if (!thang) return 0.96;
  return thang < "2026-08" ? 0.9 : 0.96;
}

type KetQuaKpi = { soPhieu: number; soPhieuDat: number; tyLe: number | null; dat: boolean };

/**
 * GV/QTDT/CV QTHT khong day (khong co phieu) trong 1 thang cu the thi tinh
 * thang do la 100% (khong bi tru KPI). Chi ap dung khi xem theo 1 thang cu
 * the (thang != null) - xem "toan bo" ma chua co phieu nao thi van la
 * "chua co du lieu" (tyLe = null), khong tu dong tinh dat.
 */
function tinhKetQua(soPhieu: number, soPhieuDat: number, thang: string | null): KetQuaKpi {
  const nguong = nguongKpiTheoThang(thang);
  if (soPhieu === 0) {
    if (thang) return { soPhieu, soPhieuDat, tyLe: 1, dat: true };
    return { soPhieu, soPhieuDat, tyLe: null, dat: false };
  }
  const tyLe = soPhieuDat / soPhieu;
  return { soPhieu, soPhieuDat, tyLe, dat: tyLe >= nguong };
}

export type KpiGV = { MaGV: string; HoTen: string; QTDT: string } & KetQuaKpi;
export type KpiQTDT = { QTDT: string } & KetQuaKpi;
export type KpiTongHop = { ten: string; vaiTro: string } & KetQuaKpi;

/** Loc phieu da nop, trong 1 thang cu the (YYYY-MM), theo NgayHoanThanh. thang=null nghia la tat ca. */
export function locPhieuDaNopTrongKy(
  phieus: PhieuKhaoSat[],
  thang: string | null
): PhieuKhaoSat[] {
  return phieus.filter((p) => {
    if (p.TrangThai !== "Da nop" || !p.NgayHoanThanh) return false;
    if (!thang) return true;
    return p.NgayHoanThanh.slice(0, 7) === thang;
  });
}

export function tinhKpiTheoGV(
  giangViens: GiangVien[],
  phieuDaNop: PhieuKhaoSat[],
  thang: string | null
): KpiGV[] {
  return giangViens.map((gv) => {
    const phieuCuaGV = phieuDaNop.filter((p) => p.MaGV === gv.MaGV);
    const soPhieu = phieuCuaGV.length;
    const soPhieuDat = phieuCuaGV.filter(
      (p) => parseFloat(p.DiemTB) > NGUONG_DIEM_DAT
    ).length;
    return { MaGV: gv.MaGV, HoTen: gv.HoTen, QTDT: gv.QTDT, ...tinhKetQua(soPhieu, soPhieuDat, thang) };
  });
}

export function tinhKpiTheoQTDT(kpiGVs: KpiGV[], thang: string | null): KpiQTDT[] {
  const nhom = new Map<string, KpiGV[]>();
  for (const k of kpiGVs) {
    if (!k.QTDT) continue;
    const list = nhom.get(k.QTDT) ?? [];
    list.push(k);
    nhom.set(k.QTDT, list);
  }
  const ket: KpiQTDT[] = [];
  for (const [qtdt, list] of nhom) {
    const soPhieu = list.reduce((s, k) => s + k.soPhieu, 0);
    const soPhieuDat = list.reduce((s, k) => s + k.soPhieuDat, 0);
    ket.push({ QTDT: qtdt, ...tinhKetQua(soPhieu, soPhieuDat, thang) });
  }
  return ket;
}

/** KPI tong hop toan bo giang vien - dung cho vai tro CV Quan tri he thong (CV QTHT). */
export function tinhKpiTongHop(
  kpiGVs: KpiGV[],
  thang: string | null,
  ten = "Ngô Lý Thùy Nhi"
): KpiTongHop {
  const soPhieu = kpiGVs.reduce((s, k) => s + k.soPhieu, 0);
  const soPhieuDat = kpiGVs.reduce((s, k) => s + k.soPhieuDat, 0);
  return { ten, vaiTro: "CV QTHT", ...tinhKetQua(soPhieu, soPhieuDat, thang) };
}
