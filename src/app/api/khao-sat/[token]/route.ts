import { NextRequest, NextResponse } from "next/server";
import { ghiKetQuaPhieu } from "@/lib/data";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json().catch(() => null);
  const diem = body?.diem;
  const yKienKhac = typeof body?.yKienKhac === "string" ? body.yKienKhac.trim() : "";

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

  const ketQua = await ghiKetQuaPhieu(token, soDiem, yKienKhac);
  if (ketQua === null) {
    return NextResponse.json(
      { loi: "Khong tim thay phieu khao sat nay." },
      { status: 404 }
    );
  }
  if (ketQua === "DA_NOP") {
    return NextResponse.json(
      { loi: "Phieu nay da duoc nop truoc do." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
