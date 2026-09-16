import { NextResponse } from "next/server";
import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  layDanhSachPhieu,
} from "@/lib/data";

export async function GET() {
  try {
    const [{ rows: phieus }, { rows: khoas }, { rows: giangViens }, { rows: hocViens }] =
      await Promise.all([
        layDanhSachPhieu(),
        layDanhSachKhoa(),
        layDanhSachGiangVien(),
        layDanhSachHocVien(),
      ]);

    const nhom = new Map<string, typeof phieus>();
    for (const p of phieus) {
      const key = `${p.MaKhoa}__${p.MaGV}__${p.NgayGui}`;
      const list = nhom.get(key) ?? [];
      list.push(p);
      nhom.set(key, list);
    }

    const dot = Array.from(nhom.entries())
      .map(([key, list]) => {
        const [maKhoa, maGV, ngayGui] = key.split("__");
        const daNop = list.filter((p) => p.TrangThai === "Da nop");
        const chuaNop = list.filter((p) => p.TrangThai !== "Da nop");
        const coDanhSach = list.some((p) => !!p.MaHV);
        return {
          key,
          maKhoa,
          maGV,
          ngayGui,
          ngayDay: list[0]?.NgayDay ?? "",
          coDanhSach,
          tenKhoa: khoas.find((k) => k.MaKhoa === maKhoa)?.TenKhoa ?? maKhoa,
          tenGV: giangViens.find((g) => g.MaGV === maGV)?.HoTen ?? maGV,
          tongSo: list.length,
          soDaNop: daNop.length,
          hocVienChuaNop: chuaNop.map((p) => {
            const hv = hocViens.find((h) => h.MaHV === p.MaHV);
            return {
              maPhieu: p.MaPhieu,
              maHV: p.MaHV,
              hoTen: hv?.HoTen ?? p.MaHV,
              email: hv?.Email ?? "",
            };
          }),
          dsHoTenDaNopQuaLinkChung: coDanhSach
            ? []
            : daNop.map((p) => p.HoTenNhap || "(khong ro ten)"),
        };
      })
      .sort((a, b) => (a.ngayGui < b.ngayGui ? 1 : -1));

    return NextResponse.json({ dot });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
