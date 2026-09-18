import { NextResponse } from "next/server";
import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  layDanhSachPhieu,
} from "@/lib/data";
import type { PhieuKhaoSat } from "@/lib/types";

export async function GET() {
  try {
    const [{ rows: phieus }, { rows: khoas }, { rows: giangViens }, { rows: hocViens }] =
      await Promise.all([
        layDanhSachPhieu(),
        layDanhSachKhoa(),
        layDanhSachGiangVien(),
        layDanhSachHocVien(),
      ]);

    // Phieu da huy (vd gui nham email) khong tinh vao bat ky thong ke nao.
    const phieusHopLe = phieus.filter((p) => p.TrangThai !== "Da huy");

    // Tach rieng phieu thuoc luong "khoa nhieu GV" (co MaNhom) - gop thanh 1
    // bang ma tran Hoc vien x GV thay vi 1 the rieng cho tung GV, de khong
    // ngop khi nhieu khoa/nhieu thang cung dung 1 khoa nhieu GV.
    const phieuNhomGV = phieusHopLe.filter((p) => p.MaNhom);
    const phieuDon = phieusHopLe.filter((p) => !p.MaNhom);

    const theoDot = new Map<string, PhieuKhaoSat[]>();
    for (const p of phieuNhomGV) {
      const key = `${p.MaKhoa}__${p.NgayGui}`;
      const list = theoDot.get(key) ?? [];
      list.push(p);
      theoDot.set(key, list);
    }
    const dotNhieuGV = Array.from(theoDot.entries())
      .map(([key, list]) => {
        const [maKhoa, ngayGui] = key.split("__");

        const gvXuatHien = new Map<string, string>();
        for (const p of list) {
          if (!gvXuatHien.has(p.MaGV)) gvXuatHien.set(p.MaGV, p.NgayDay);
        }
        const danhSachGV = Array.from(gvXuatHien.entries()).map(([maGV, ngayDay]) => ({
          maGV,
          ngayDay,
          tenGV: giangViens.find((g) => g.MaGV === maGV)?.HoTen ?? maGV,
        }));

        const theoNhom = new Map<string, PhieuKhaoSat[]>();
        for (const p of list) {
          const arr = theoNhom.get(p.MaNhom) ?? [];
          arr.push(p);
          theoNhom.set(p.MaNhom, arr);
        }
        const hocViensBang = Array.from(theoNhom.entries())
          .map(([maNhom, ds]) => {
            const hv = hocViens.find((h) => h.MaHV === ds[0].MaHV);
            const trangThaiTheoGV: Record<string, { daNop: boolean; maPhieu: string }> = {};
            for (const p of ds) {
              trangThaiTheoGV[p.MaGV] = { daNop: p.TrangThai === "Da nop", maPhieu: p.MaPhieu };
            }
            return {
              maNhom,
              maHV: ds[0].MaHV,
              hoTen: hv?.HoTen ?? ds[0].MaHV,
              email: hv?.Email ?? "",
              trangThaiTheoGV,
              maPhieuDaiDien: ds[0].MaPhieu,
            };
          })
          .sort((a, b) => a.hoTen.localeCompare(b.hoTen, "vi"));

        const tongO = hocViensBang.length * danhSachGV.length;
        const soONop = hocViensBang.reduce(
          (s, h) => s + Object.values(h.trangThaiTheoGV).filter((x) => x.daNop).length,
          0
        );

        return {
          key,
          maKhoa,
          tenKhoa: khoas.find((k) => k.MaKhoa === maKhoa)?.TenKhoa ?? maKhoa,
          ngayGui,
          danhSachGV,
          hocViens: hocViensBang,
          tongO,
          soONop,
        };
      })
      .sort((a, b) => (a.ngayGui < b.ngayGui ? 1 : -1));

    // Phieu don (1 GV, hoac link dung chung khong co danh sach) - giu nguyen
    // dinh dang the nhu truoc.
    const nhom = new Map<string, PhieuKhaoSat[]>();
    for (const p of phieuDon) {
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
          hocVienDaNop: coDanhSach
            ? daNop.map((p) => {
                const hv = hocViens.find((h) => h.MaHV === p.MaHV);
                return {
                  maPhieu: p.MaPhieu,
                  maHV: p.MaHV,
                  hoTen: hv?.HoTen ?? p.MaHV,
                  email: hv?.Email ?? "",
                };
              })
            : [],
          dsHoTenDaNopQuaLinkChung: coDanhSach
            ? []
            : daNop.map((p) => ({
                maPhieu: p.MaPhieu,
                hoTen: p.HoTenNhap || "(khong ro ten)",
              })),
        };
      })
      .sort((a, b) => (a.ngayGui < b.ngayGui ? 1 : -1));

    return NextResponse.json({ dot, dotNhieuGV });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
