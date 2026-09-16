import {
  layDanhSachGiangVien,
  layDanhSachHocVien,
  layDanhSachKhoa,
  timPhieuTheoMa,
} from "@/lib/data";
import SurveyForm from "./SurveyForm";

export const dynamic = "force-dynamic";

export default async function KhaoSatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let phieu;
  try {
    phieu = await timPhieuTheoMa(token);
  } catch (err) {
    return (
      <ThongBao tieuDe="Loi he thong">
        Khong ket noi duoc du lieu khao sat. Vui long bao P.NVDT kiem tra cau
        hinh he thong. ({err instanceof Error ? err.message : "loi khong xac dinh"})
      </ThongBao>
    );
  }

  if (!phieu) {
    return (
      <ThongBao tieuDe="Khong tim thay khao sat">
        Duong dan khong hop le hoac da het han. Vui long lien he QTDT phu trach
        khoa hoc de duoc gui lai.
      </ThongBao>
    );
  }

  if (phieu.row.TrangThai === "Da nop") {
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

  const hocVien = hocViens.find((h) => h.MaHV === phieu.row.MaHV);
  const khoa = khoas.find((k) => k.MaKhoa === phieu.row.MaKhoa);
  const gv = giangViens.find((g) => g.MaGV === phieu.row.MaGV);

  return (
    <main className="flex-1 p-6">
      <div className="max-w-lg mx-auto mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h1 className="text-lg font-bold text-vnpt-blue mb-1">
          Khao sat chat luong giang vien
        </h1>
        <p className="text-sm text-slate-600">
          Hoc vien: <b>{hocVien?.HoTen ?? phieu.row.MaHV}</b>
        </p>
        <p className="text-sm text-slate-600">
          Khoa hoc: <b>{khoa?.TenKhoa ?? phieu.row.MaKhoa}</b>
        </p>
        <p className="text-sm text-slate-600">
          Giang vien danh gia: <b>{gv?.HoTen ?? phieu.row.MaGV}</b>
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
