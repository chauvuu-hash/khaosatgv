import { NextResponse } from "next/server";
import { layDanhSachGiangVien, layDanhSachKhoa } from "@/lib/data";

/**
 * API cong khai (khong yeu cau dang nhap /admin) - chi tra ve danh sach
 * Khoa + GiangVien (khong co thong tin nhay cam) de giang vien tu lay
 * link "khao sat dung chung" ngay sau khi day xong, khong can nho QTDT.
 */
export async function GET() {
  try {
    const [{ rows: khoas }, { rows: giangViens }] = await Promise.all([
      layDanhSachKhoa(),
      layDanhSachGiangVien(),
    ]);
    return NextResponse.json({ khoas, giangViens });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
