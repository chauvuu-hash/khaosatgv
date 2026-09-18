import { NextRequest, NextResponse } from "next/server";
import { huyPhieu } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const maPhieu = typeof body?.maPhieu === "string" ? body.maPhieu : "";
  if (!maPhieu) {
    return NextResponse.json({ loi: "Thieu ma phieu." }, { status: 400 });
  }

  try {
    const ketQua = await huyPhieu(maPhieu);
    if (ketQua === "KHONG_TIM_THAY") {
      return NextResponse.json({ loi: "Khong tim thay phieu." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
