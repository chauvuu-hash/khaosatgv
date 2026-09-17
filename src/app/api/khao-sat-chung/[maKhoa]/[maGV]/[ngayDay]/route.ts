import { NextRequest, NextResponse } from "next/server";
import {
  layDanhSachDonViMien,
  layDanhSachGiangVien,
  layDanhSachKhoa,
  taoPhieuDungChung,
} from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ maKhoa: string; maGV: string; ngayDay: string }> }
) {
  const { maKhoa, maGV, ngayDay } = await params;
  const body = await req.json().catch(() => null);
  const hoTen = typeof body?.hoTen === "string" ? body.hoTen.trim() : "";
  const donVi = typeof body?.donVi === "string" ? body.donVi.trim() : "";
  const mien = typeof body?.mien === "string" ? body.mien.trim() : "";
  const yKienKhac = typeof body?.yKienKhac === "string" ? body.yKienKhac.trim() : "";
  const diem = body?.diem;

  if (!hoTen) {
    return NextResponse.json({ loi: "Vui long nhap ho ten." }, { status: 400 });
  }
  if (!Array.isArray(diem) || diem.length !== 10) {
    return NextResponse.json(
      { loi: "Vui long cham du 10 tieu chi." },
      { status: 400 }
    );
  }
  const soDiem = diem.map((d) => Number(d));
  if (soDiem.some((d) => !Number.isFinite(d) || d < 1 || d > 10)) {
    return NextResponse.json({ loi: "Diem phai tu 1 den 10." }, { status: 400 });
  }

  const [{ rows: khoas }, { rows: giangViens }, { donVis, miens }] = await Promise.all([
    layDanhSachKhoa(),
    layDanhSachGiangVien(),
    layDanhSachDonViMien(),
  ]);
  if (!khoas.some((k) => k.MaKhoa === maKhoa)) {
    return NextResponse.json({ loi: "Khong tim thay khoa hoc." }, { status: 404 });
  }
  if (!giangViens.some((g) => g.MaGV === maGV)) {
    return NextResponse.json({ loi: "Khong tim thay giang vien." }, { status: 404 });
  }
  if (donVi && !donVis.includes(donVi)) {
    return NextResponse.json({ loi: "Don vi khong hop le." }, { status: 400 });
  }
  if (mien && !miens.includes(mien)) {
    return NextResponse.json({ loi: "Mien khong hop le." }, { status: 400 });
  }

  await taoPhieuDungChung({
    maKhoa,
    maGV,
    ngayDay,
    hoTen,
    donVi,
    mien,
    diem: soDiem,
    yKienKhac,
  });

  return NextResponse.json({ ok: true });
}
