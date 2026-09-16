import { NextRequest, NextResponse } from "next/server";
import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  taoDotGuiKhaoSat,
} from "@/lib/data";
import { guiEmailKhaoSat } from "@/lib/email";

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const maKhoa = body?.maKhoa;
  const maGV = body?.maGV;
  const ngayDay = body?.ngayDay || new Date().toISOString().slice(0, 10);
  const maHVDaChon: string[] | undefined = body?.maHVDaChon;

  if (!maKhoa || !maGV) {
    return NextResponse.json(
      { loi: "Thieu khoa hoc hoac giang vien." },
      { status: 400 }
    );
  }

  try {
    const [{ rows: hocViens }, { rows: khoas }, { rows: giangViens }] =
      await Promise.all([
        layDanhSachHocVien(),
        layDanhSachKhoa(),
        layDanhSachGiangVien(),
      ]);

    let dsHocVien = hocViens.filter((hv) => hv.MaKhoa === maKhoa);
    if (Array.isArray(maHVDaChon) && maHVDaChon.length > 0) {
      dsHocVien = dsHocVien.filter((hv) => maHVDaChon.includes(hv.MaHV));
    }
    if (dsHocVien.length === 0) {
      return NextResponse.json(
        { loi: "Khong co hoc vien nao duoc chon de gui." },
        { status: 400 }
      );
    }

    const khoa = khoas.find((k) => k.MaKhoa === maKhoa);
    const gv = giangViens.find((g) => g.MaGV === maGV);

    const phieus = await taoDotGuiKhaoSat({
      maKhoa,
      maGV,
      ngayDay,
      hocViens: dsHocVien,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const ketQuaGui = await Promise.allSettled(
      phieus.map((p) => {
        const hv = dsHocVien.find((h) => h.MaHV === p.MaHV);
        if (!hv?.Email) return Promise.reject(new Error("Khong co email"));
        return guiEmailKhaoSat({
          toEmail: hv.Email,
          hoTenHocVien: hv.HoTen,
          hoTenGV: gv?.HoTen ?? maGV,
          tenKhoa: khoa?.TenKhoa ?? maKhoa,
          link: `${baseUrl}/khao-sat/${p.MaPhieu}`,
        });
      })
    );

    const soLoi = ketQuaGui.filter((k) => k.status === "rejected").length;

    return NextResponse.json({
      ok: true,
      soPhieuTao: phieus.length,
      soEmailGuiThanhCong: phieus.length - soLoi,
      soEmailLoi: soLoi,
    });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
