import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-xl font-bold text-vnpt-blue mb-2">
          Khao sat chat luong giang vien
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Cong cu tam thoi (thang 9/2026) cho P.NVDT - dung song song voi he
          thong chinh thuc do P.CN xay dung.
        </p>
        <Link
          href="/admin"
          className="inline-block bg-vnpt-blue text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90"
        >
          Vao trang noi bo QTDT
        </Link>
      </div>
    </main>
  );
}
