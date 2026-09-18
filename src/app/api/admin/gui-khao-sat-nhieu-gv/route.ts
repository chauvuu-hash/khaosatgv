import { NextRequest, NextResponse } from "next/server";
import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  taoDotGuiKhaoSatNhieuGV,
} from "@/lib/data";
import { chayTuanTu, guiEmailKhaoSatNhieuGV } from "@/lib/email";
import type { PhieuKhaoSat } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const maKhoa = body?.maKhoa;
  const maDot: string | undefined = typeof body?.maDot === "string" ? body.maDot : undefined;
  const danhSachGVRaw = body?.danhSachGV;
  const maHVDaChon: string[] | undefined = body?.maHVDaChon;

  if (!maKhoa || !Array.isArray(danhSachGVRaw)) {
    return NextResponse.json(
      { loi: "Thieu khoa hoc hoac danh sach giang vien." },
      { status: 400 }
    );
  }

  const danhSachGV = danhSachGVRaw
    .map((g: { maGV?: unknown; ngayDay?: unknown }) => ({
      maGV: typeof g?.maGV === "string" ? g.maGV : "",
      ngayDay:
        typeof g?.ngayDay === "string" && g.ngayDay
          ? g.ngayDay
          : new Date().toISOString().slice(0, 10),
    }))
    .filter((g) => g.maGV);

  if (danhSachGV.length < 2) {
    return NextResponse.json(
      { loi: "Can chon it nhat 2 giang vien (neu chi 1 GV, dung form phia tren)." },
      { status: 400 }
    );
  }
  const maGVSet = new Set(danhSachGV.map((g) => g.maGV));
  if (maGVSet.size !== danhSachGV.length) {
    return NextResponse.json(
      { loi: "Khong duoc chon trung 1 giang vien nhieu lan." },
      { status: 400 }
    );
  }

  try {
    const [{ rows: hocViens }, { rows: khoas }, { rows: giangViens }] = await Promise.all([
      layDanhSachHocVien(),
      layDanhSachKhoa(),
      layDanhSachGiangVien(),
    ]);

    let dsHocVien = hocViens.filter((hv) => hv.MaKhoa === maKhoa);
    if (maDot) {
      dsHocVien = dsHocVien.filter((hv) => hv.MaDot === maDot);
    }
    if (Array.isArray(maHVDaChon) && maHVDaChon.length > 0) {
      dsHocVien = dsHocVien.filter((hv) => maHVDaChon.includes(hv.MaHV));
    }
    if (dsHocVien.length === 0) {
      return NextResponse.json(
        { loi: "Khong co hoc vien nao duoc chon de gui." },
        { status: 400 }
      );
    }
    for (const g of danhSachGV) {
      if (!giangViens.some((gv) => gv.MaGV === g.maGV)) {
        return NextResponse.json(
          { loi: `Khong tim thay giang vien ma ${g.maGV}.` },
          { status: 400 }
        );
      }
    }

    const khoa = khoas.find((k) => k.MaKhoa === maKhoa);
    const tenGVs = danhSachGV.map(
      (g) => giangViens.find((gv) => gv.MaGV === g.maGV)?.HoTen ?? g.maGV
    );

    const phieus = await taoDotGuiKhaoSatNhieuGV({ maKhoa, danhSachGV, hocViens: dsHocVien });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const theoNhom = new Map<string, PhieuKhaoSat[]>();
    for (const p of phieus) {
      const list = theoNhom.get(p.MaNhom) ?? [];
      list.push(p);
      theoNhom.set(p.MaNhom, list);
    }

    const ketQuaGui = await chayTuanTu(Array.from(theoNhom.entries()), ([maNhom, ds]) => {
      const hv = dsHocVien.find((h) => h.MaHV === ds[0].MaHV);
      if (!hv?.Email) return Promise.reject(new Error("Khong co email"));
      return guiEmailKhaoSatNhieuGV({
        toEmail: hv.Email,
        hoTenHocVien: hv.HoTen,
        tenKhoa: khoa?.TenKhoa ?? maKhoa,
        tenGVs,
        link: `${baseUrl}/khao-sat/${maNhom}`,
      });
    });

    const thatBai = ketQuaGui.filter(
      (k): k is PromiseRejectedResult => k.status === "rejected"
    );
    for (const k of thatBai) {
      console.error("[gui-khao-sat-nhieu-gv] Loi gui email:", k.reason);
    }
    const soLoi = thatBai.length;

    return NextResponse.json({
      ok: true,
      soPhieuTao: phieus.length,
      soHocVien: dsHocVien.length,
      soGV: danhSachGV.length,
      soEmailGuiThanhCong: dsHocVien.length - soLoi,
      soEmailLoi: soLoi,
    });
  } catch (err) {
    return NextResponse.json(
      { loi: err instanceof Error ? err.message : "Loi khong xac dinh" },
      { status: 500 }
    );
  }
}
