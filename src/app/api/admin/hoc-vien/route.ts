import { NextRequest, NextResponse } from "next/server";
import { layDanhSachHocVien, themHocVienHangLoat } from "@/lib/data";

export async function GET(req: NextRequest) {
  const maKhoa = req.nextUrl.searchParams.get("maKhoa");
  try {
    const { rows } = await layDanhSachHocVien();
    const ds = maKhoa ? rows.filter((h) => h.MaKhoa === maKhoa) : rows;
    return NextResponse.json({ hocViens: ds });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}

/** Upload hang loat hoc vien tu file CSV (da duoc parse phia client thanh JSON). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const dong = body?.dong;
  if (!Array.isArray(dong) || dong.length === 0) {
    return NextResponse.json({ loi: "Khong co du lieu de tai len." }, { status: 400 });
  }
  if (dong.length > 5000) {
    return NextResponse.json({ loi: "File qua lon (toi da 5000 dong/lan)." }, { status: 400 });
  }
  try {
    const ketQua = await themHocVienHangLoat(dong);
    return NextResponse.json(ketQua);
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
