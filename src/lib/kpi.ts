import type { GiangVien, PhieuKhaoSat } from "./types";

export const NGUONG_DIEM_DAT = 8;
export const NGUONG_KPI_DAT = 0.96;

export type KpiGV = {
  MaGV: string;
  HoTen: string;
  QTDT: string;
  soPhieu: number;
  soPhieuDat: number;
  tyLe: number | null;
  dat: boolean;
};

export type KpiQTDT = {
  QTDT: string;
  soPhieu: number;
  soPhieuDat: number;
  tyLe: number | null;
  dat: boolean;
};

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
  phieuDaNop: PhieuKhaoSat[]
): KpiGV[] {
  return giangViens.map((gv) => {
    const phieuCuaGV = phieuDaNop.filter((p) => p.MaGV === gv.MaGV);
    const soPhieu = phieuCuaGV.length;
    const soPhieuDat = phieuCuaGV.filter(
      (p) => parseFloat(p.DiemTB) > NGUONG_DIEM_DAT
    ).length;
    const tyLe = soPhieu > 0 ? soPhieuDat / soPhieu : null;
    return {
      MaGV: gv.MaGV,
      HoTen: gv.HoTen,
      QTDT: gv.QTDT,
      soPhieu,
      soPhieuDat,
      tyLe,
      dat: tyLe !== null && tyLe >= NGUONG_KPI_DAT,
    };
  });
}

export function tinhKpiTheoQTDT(kpiGVs: KpiGV[]): KpiQTDT[] {
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
    const tyLe = soPhieu > 0 ? soPhieuDat / soPhieu : null;
    ket.push({
      QTDT: qtdt,
      soPhieu,
      soPhieuDat,
      tyLe,
      dat: tyLe !== null && tyLe >= NGUONG_KPI_DAT,
    });
  }
  return ket;
}
