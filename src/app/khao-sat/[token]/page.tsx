import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  timPhieuKhaoSatTheoToken,
} from "@/lib/data";
import SurveyForm from "./SurveyForm";
import SurveyFormNhom from "./SurveyFormNhom";

export const dynamic = "force-dynamic";

export default async function KhaoSatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let ketQua;
  try {
    ketQua = await timPhieuKhaoSatTheoToken(token);
  } catch (err) {
    return (
      <ThongBao tieuDe="Loi he thong">
        Khong ket noi duoc du lieu khao sat. Vui long bao P.NVDT kiem tra cau
        hinh he thong. ({err instanceof Error ? err.message : "loi khong xac dinh"})
      </ThongBao>
    );
  }

  if (!ketQua) {
    return (
      <ThongBao tieuDe="Khong tim thay khao sat">
        Duong dan khong hop le hoac da het han. Vui long lien he QTDT phu trach
        khoa hoc de duoc gui lai.
      </ThongBao>
    );
  }

  const daNopHet =
    ketQua.loai === "don"
      ? ketQua.row.TrangThai === "Da nop"
      : ketQua.danhSach.every((d) => d.row.TrangThai === "Da nop");
  if (daNopHet) {
    return (
      <ThongBao tieuDe="Da hoan thanh">
        Ban da nop khao sat nay truoc do. Cam on ban!
      </ThongBao>
    );
  }

  const [{ rows: hocViens }, { rows: khoas }, { rows: giangViens }] =
    await Promise.all([
      layDanhSachHocVien(),
      layDanhSachKhoa(),
      layDanhSachGiangVien(),
    ]);

  if (ketQua.loai === "don") {
    const phieu = ketQua.row;
    const hocVien = hocViens.find((h) => h.MaHV === phieu.MaHV);
    const khoa = khoas.find((k) => k.MaKhoa === phieu.MaKhoa);
    const gv = giangViens.find((g) => g.MaGV === phieu.MaGV);

    return (
      <main className="flex-1 p-6">
        <div className="max-w-lg mx-auto mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h1 className="text-lg font-bold text-vnpt-blue mb-1">
            Khao sat chat luong giang vien
          </h1>
          <p className="text-sm text-slate-600">
            Hoc vien: <b>{hocVien?.HoTen ?? phieu.MaHV}</b>
          </p>
          <p className="text-sm text-slate-600">
            Khoa hoc: <b>{khoa?.TenKhoa ?? phieu.MaKhoa}</b>
          </p>
          <p className="text-sm text-slate-600">
            Giang vien danh gia: <b>{gv?.HoTen ?? phieu.MaGV}</b>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Ket qua duoc bao mat, giang vien va QTDT chi xem duoc diem tong hop,
            khong gan voi ten hoc vien.
          </p>
        </div>
        <SurveyForm token={token} />
      </main>
    );
  }

  // loai === "nhom": khoa co nhieu giang vien, 1 link cham het cho tung GV
  const phieuDauTien = ketQua.danhSach[0].row;
  const hocVien = hocViens.find((h) => h.MaHV === phieuDauTien.MaHV);
  const khoa = khoas.find((k) => k.MaKhoa === phieuDauTien.MaKhoa);
  const danhSachGV = ketQua.danhSach.map((d) => ({
    maGV: d.row.MaGV,
    hoTen: giangViens.find((g) => g.MaGV === d.row.MaGV)?.HoTen ?? d.row.MaGV,
  }));

  return (
    <main className="flex-1 p-6">
      <div className="max-w-lg mx-auto mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h1 className="text-lg font-bold text-vnpt-blue mb-1">
          Khao sat chat luong giang vien
        </h1>
        <p className="text-sm text-slate-600">
          Hoc vien: <b>{hocVien?.HoTen ?? phieuDauTien.MaHV}</b>
        </p>
        <p className="text-sm text-slate-600">
          Khoa hoc: <b>{khoa?.TenKhoa ?? phieuDauTien.MaKhoa}</b>
        </p>
        <p className="text-sm text-slate-600">
          Khoa nay co <b>{danhSachGV.length} giang vien</b>, vui long danh gia
          lan luot tung nguoi ben duoi.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Ket qua duoc bao mat, giang vien va QTDT chi xem duoc diem tong hop,
          khong gan voi ten hoc vien.
        </p>
      </div>
      <SurveyFormNhom token={token} danhSachGV={danhSachGV} />
    </main>
  );
}

function ThongBao({
  tieuDe,
  children,
}: {
  tieuDe: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-lg font-bold text-vnpt-blue mb-2">{tieuDe}</h1>
        <p className="text-sm text-slate-600">{children}</p>
      </div>
    </main>
  );
}
