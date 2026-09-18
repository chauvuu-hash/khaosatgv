import { NextRequest, NextResponse } from "next/server";
import {
  layDanhSachDonViMien,
  layDanhSachGiangVien,
  layDanhSachKhoa,
  taoPhieuDungChungNhieuGV,
} from "@/lib/data";
import { parseDsGV } from "@/lib/dsGVToken";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ maKhoa: string; dsGV: string }> }
) {
  const { maKhoa, dsGV } = await params;
  const danhSachGV = parseDsGV(dsGV);
  const body = await req.json().catch(() => null);
  const hoTen = typeof body?.hoTen === "string" ? body.hoTen.trim() : "";
  const donVi = typeof body?.donVi === "string" ? body.donVi.trim() : "";
  const mien = typeof body?.mien === "string" ? body.mien.trim() : "";
  const yKienKhac = typeof body?.yKienKhac === "string" ? body.yKienKhac.trim() : "";
  const diemTheoGVRaw = body?.diemTheoGV;

  if (!hoTen) {
    return NextResponse.json({ loi: "Vui long nhap ho ten." }, { status: 400 });
  }
  if (danhSachGV.length === 0) {
    return NextResponse.json({ loi: "Duong dan khong hop le." }, { status: 400 });
  }
  if (!diemTheoGVRaw || typeof diemTheoGVRaw !== "object") {
    return NextResponse.json(
      { loi: "Thieu diem cham cho cac giang vien." },
      { status: 400 }
    );
  }

  const diemTheoGV: Record<string, number[]> = {};
  for (const gv of danhSachGV) {
    const arr = (diemTheoGVRaw as Record<string, unknown>)[gv.maGV];
    if (!Array.isArray(arr) || arr.length !== 10) {
      return NextResponse.json(
        { loi: "Vui long cham du 10 tieu chi cho tung giang vien." },
        { status: 400 }
      );
    }
    const soDiem = arr.map((d) => Number(d));
    if (soDiem.some((d) => !Number.isFinite(d) || d < 1 || d > 10)) {
      return NextResponse.json({ loi: "Diem phai tu 1 den 10." }, { status: 400 });
    }
    diemTheoGV[gv.maGV] = soDiem;
  }

  const [{ rows: khoas }, { rows: giangViens }, { donVis, miens }] = await Promise.all([
    layDanhSachKhoa(),
    layDanhSachGiangVien(),
    layDanhSachDonViMien(),
  ]);
  if (!khoas.some((k) => k.MaKhoa === maKhoa)) {
    return NextResponse.json({ loi: "Khong tim thay khoa hoc." }, { status: 404 });
  }
  for (const gv of danhSachGV) {
    if (!giangViens.some((g) => g.MaGV === gv.maGV)) {
      return NextResponse.json({ loi: "Khong tim thay giang vien." }, { status: 404 });
    }
  }
  if (donVi && !donVis.includes(donVi)) {
    return NextResponse.json({ loi: "Don vi khong hop le." }, { status: 400 });
  }
  if (mien && !miens.includes(mien)) {
    return NextResponse.json({ loi: "Mien khong hop le." }, { status: 400 });
  }

  await taoPhieuDungChungNhieuGV({
    maKhoa,
    danhSachGV,
    hoTen,
    donVi,
    mien,
    diemTheoGV,
    yKienKhac,
  });

  return NextResponse.json({ ok: true });
}
