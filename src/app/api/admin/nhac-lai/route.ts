import { NextRequest, NextResponse } from "next/server";
import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  layDanhSachPhieu,
} from "@/lib/data";
import { guiEmailKhaoSat } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const maPhieus: string[] | undefined = body?.maPhieus;
  if (!Array.isArray(maPhieus) || maPhieus.length === 0) {
    return NextResponse.json(
      { loi: "Thieu danh sach phieu can nhac lai." },
      { status: 400 }
    );
  }

  try {
    const [{ rows: phieus }, { rows: hocViens }, { rows: khoas }, { rows: giangViens }] =
      await Promise.all([
        layDanhSachPhieu(),
        layDanhSachHocVien(),
        layDanhSachKhoa(),
        layDanhSachGiangVien(),
      ]);

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const dsPhieuCanGui = phieus.filter(
      (p) => maPhieus.includes(p.MaPhieu) && p.TrangThai !== "Da nop"
    );

    const ketQuaGui = await Promise.allSettled(
      dsPhieuCanGui.map((p) => {
        const hv = hocViens.find((h) => h.MaHV === p.MaHV);
        const khoa = khoas.find((k) => k.MaKhoa === p.MaKhoa);
        const gv = giangViens.find((g) => g.MaGV === p.MaGV);
        if (!hv?.Email) return Promise.reject(new Error("Khong co email"));
        return guiEmailKhaoSat({
          toEmail: hv.Email,
          hoTenHocVien: hv.HoTen,
          hoTenGV: gv?.HoTen ?? p.MaGV,
          tenKhoa: khoa?.TenKhoa ?? p.MaKhoa,
          link: `${baseUrl}/khao-sat/${p.MaPhieu}`,
          laNhacLai: true,
        });
      })
    );

    const soLoi = ketQuaGui.filter((k) => k.status === "rejected").length;

    return NextResponse.json({
      ok: true,
      soEmailGuiThanhCong: dsPhieuCanGui.length - soLoi,
      soEmailLoi: soLoi,
    });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
