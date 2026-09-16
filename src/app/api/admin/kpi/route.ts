import { NextRequest, NextResponse } from "next/server";
import { layDanhSachGiangVien, layDanhSachPhieu } from "@/lib/data";
import {
  locPhieuDaNopTrongKy,
  nguongKpiTheoThang,
  tinhKpiTheoGV,
  tinhKpiTheoQTDT,
  tinhKpiTongHop,
} from "@/lib/kpi";

export async function GET(req: NextRequest) {
  const thang = req.nextUrl.searchParams.get("thang");
  try {
    const [{ rows: giangViens }, { rows: phieus }] = await Promise.all([
      layDanhSachGiangVien(),
      layDanhSachPhieu(),
    ]);
    const daNop = locPhieuDaNopTrongKy(phieus, thang);
    const kpiGV = tinhKpiTheoGV(giangViens, daNop, thang);
    const kpiQTDT = tinhKpiTheoQTDT(kpiGV, thang);
    const kpiTongHop = tinhKpiTongHop(kpiGV, thang);
    return NextResponse.json({
      kpiGV,
      kpiQTDT,
      kpiTongHop,
      nguongApDung: nguongKpiTheoThang(thang),
    });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
