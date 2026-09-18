import { layDanhSachDonViMien, layDanhSachGiangVien, layDanhSachKhoa } from "@/lib/data";
import { parseDsGV } from "@/lib/dsGVToken";
import KhoaChungFormNhom from "./KhoaChungFormNhom";

export const dynamic = "force-dynamic";

export default async function KhaoSatChungNhieuGVPage({
  params,
}: {
  params: Promise<{ maKhoa: string; dsGV: string }>;
}) {
  const { maKhoa, dsGV } = await params;
  const danhSachGVParam = parseDsGV(dsGV);

  let khoas, giangViens, donVis, miens;
  try {
    [{ rows: khoas }, { rows: giangViens }, { donVis, miens }] = await Promise.all([
      layDanhSachKhoa(),
      layDanhSachGiangVien(),
      layDanhSachDonViMien(),
    ]);
  } catch (err) {
    return (
      <ThongBao tieuDe="Loi he thong">
        Khong ket noi duoc du lieu khao sat. Vui long bao P.NVDT kiem tra cau
        hinh he thong. ({err instanceof Error ? err.message : "loi khong xac dinh"})
      </ThongBao>
    );
  }

  const khoa = khoas.find((k) => k.MaKhoa === maKhoa);
  const danhSachGV = danhSachGVParam
    .map((g) => {
      const gv = giangViens.find((x) => x.MaGV === g.maGV);
      return gv ? { maGV: g.maGV, ngayDay: g.ngayDay, hoTen: gv.HoTen } : null;
    })
    .filter((g): g is { maGV: string; ngayDay: string; hoTen: string } => g !== null);

  if (!khoa || danhSachGV.length === 0) {
    return (
      <ThongBao tieuDe="Khong tim thay khao sat">
        Duong dan khong hop le. Vui long lien he QTDT phu trach de duoc gui
        lai link dung.
      </ThongBao>
    );
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-lg mx-auto mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h1 className="text-lg font-bold text-vnpt-blue mb-1">
          Khao sat chat luong giang vien
        </h1>
        <p className="text-sm text-slate-600">
          Khoa hoc: <b>{khoa.TenKhoa}</b>
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
      <KhoaChungFormNhom
        maKhoa={maKhoa}
        dsGV={dsGV}
        danhSachGV={danhSachGV}
        donVis={donVis}
        miens={miens}
      />
    </main>
  );
}

function ThongBao({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-lg font-bold text-vnpt-blue mb-2">{tieuDe}</h1>
        <p className="text-sm text-slate-600">{children}</p>
      </div>
    </main>
  );
}
