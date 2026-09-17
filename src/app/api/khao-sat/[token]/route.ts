import { NextRequest, NextResponse } from "next/server";
import { ghiKetQuaNhomPhieu, ghiKetQuaPhieu, timPhieuKhaoSatTheoToken } from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json().catch(() => null);
  const yKienKhac = typeof body?.yKienKhac === "string" ? body.yKienKhac.trim() : "";

  const found = await timPhieuKhaoSatTheoToken(token);
  if (!found) {
    return NextResponse.json(
      { loi: "Khong tim thay phieu khao sat nay." },
      { status: 404 }
    );
  }

  if (found.loai === "don") {
    const diem = body?.diem;
    if (!Array.isArray(diem) || diem.length !== 10) {
      return NextResponse.json(
        { loi: "Vui long cham du 10 tieu chi." },
        { status: 400 }
      );
    }
    const soDiem = diem.map((d) => Number(d));
    if (soDiem.some((d) => !Number.isFinite(d) || d < 1 || d > 10)) {
      return NextResponse.json(
        { loi: "Diem phai tu 1 den 10." },
        { status: 400 }
      );
    }

    const ketQua = await ghiKetQuaPhieu(found.row.MaPhieu, soDiem, yKienKhac);
    if (ketQua === "DA_NOP") {
      return NextResponse.json(
        { loi: "Phieu nay da duoc nop truoc do." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  // loai === "nhom"
  const diemTheoGVRaw = body?.diemTheoGV;
  if (!diemTheoGVRaw || typeof diemTheoGVRaw !== "object") {
    return NextResponse.json(
      { loi: "Thieu diem cham cho cac giang vien." },
      { status: 400 }
    );
  }
  const diemTheoGV: Record<string, number[]> = {};
  for (const [maGV, arr] of Object.entries(diemTheoGVRaw as Record<string, unknown>)) {
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
    diemTheoGV[maGV] = soDiem;
  }

  const ketQua = await ghiKetQuaNhomPhieu(found.danhSach, found.headers, diemTheoGV, yKienKhac);
  if (ketQua === "DA_NOP") {
    return NextResponse.json(
      { loi: "Phieu nay da duoc nop truoc do." },
      { status: 409 }
    );
  }
  if (ketQua === "THIEU_DIEM") {
    return NextResponse.json(
      { loi: "Thieu diem cham cho 1 hoac nhieu giang vien trong khoa." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
