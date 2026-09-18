import { NextResponse } from "next/server";
import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  timPhieuTheoMa,
} from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ maPhieu: string }> }
) {
  const { maPhieu } = await params;
  try {
    const found = await timPhieuTheoMa(maPhieu);
    if (!found) {
      return NextResponse.json({ loi: "Khong tim thay phieu." }, { status: 404 });
    }
    const [{ rows: khoas }, { rows: giangViens }, { rows: hocViens }] = await Promise.all([
      layDanhSachKhoa(),
      layDanhSachGiangVien(),
      layDanhSachHocVien(),
    ]);
    const p = found.row;
    const hv = hocViens.find((h) => h.MaHV === p.MaHV);

    return NextResponse.json({
      maPhieu: p.MaPhieu,
      hoTenHocVien: hv?.HoTen || p.HoTenNhap || "(khong ro ten)",
      email: hv?.Email ?? "",
      tenKhoa: khoas.find((k) => k.MaKhoa === p.MaKhoa)?.TenKhoa ?? p.MaKhoa,
      tenGV: giangViens.find((g) => g.MaGV === p.MaGV)?.HoTen ?? p.MaGV,
      ngayDay: p.NgayDay,
      trangThai: p.TrangThai,
      ngayHoanThanh: p.NgayHoanThanh,
      diem: [
        p.Diem1,
        p.Diem2,
        p.Diem3,
        p.Diem4,
        p.Diem5,
        p.Diem6,
        p.Diem7,
        p.Diem8,
        p.Diem9,
        p.Diem10,
      ],
      diemTB: p.DiemTB,
      yKienKhac: p.YKienKhac,
    });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
