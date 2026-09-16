import { NextRequest, NextResponse } from "next/server";
import { layDanhSachHocVien } from "@/lib/data";

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
