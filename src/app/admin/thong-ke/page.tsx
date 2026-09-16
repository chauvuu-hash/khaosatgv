"use client";

import { useEffect, useState } from "react";

type HocVienChuaNop = { maPhieu: string; maHV: string; hoTen: string; email: string };
type Dot = {
  key: string;
  maKhoa: string;
  maGV: string;
  ngayGui: string;
  ngayDay: string;
  tenKhoa: string;
  tenGV: string;
  tongSo: number;
  soDaNop: number;
  hocVienChuaNop: HocVienChuaNop[];
};

export default function ThongKePage() {
  const [dot, setDot] = useState<Dot[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangGuiKey, setDangGuiKey] = useState<string | null>(null);
  const [thongBaoKey, setThongBaoKey] = useState<Record<string, string>>({});

  function taiLai() {
    fetch("/api/admin/thong-ke")
      .then((r) => r.json())
      .then((d) => setDot(d.dot ?? []))
      .finally(() => setDangTai(false));
  }

  useEffect(taiLai, []);

  async function guiNhacLai(d: Dot) {
    setDangGuiKey(d.key);
    try {
      const res = await fetch("/api/admin/nhac-lai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maPhieus: d.hocVienChuaNop.map((h) => h.maPhieu),
        }),
      });
      const data = await res.json();
      setThongBaoKey((prev) => ({
        ...prev,
        [d.key]: res.ok
          ? `Da gui nhac lai ${data.soEmailGuiThanhCong} email.`
          : data.loi ?? "Co loi xay ra.",
      }));
    } finally {
      setDangGuiKey(null);
    }
  }

  if (dangTai) return <p className="text-sm text-slate-500">Dang tai...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-vnpt-blue">Thong ke ty le nop phieu</h1>

      {dot.length === 0 && (
        <p className="text-sm text-slate-500">Chua co dot gui khao sat nao.</p>
      )}

      <div className="space-y-4">
        {dot.map((d) => {
          const tyLe = d.tongSo > 0 ? Math.round((d.soDaNop / d.tongSo) * 100) : 0;
          return (
            <div
              key={d.key}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold">
                    {d.tenKhoa} &middot; {d.tenGV}
                  </p>
                  <p className="text-xs text-slate-500">
                    Ngay day: {d.ngayDay || "-"} &middot; Gui luc:{" "}
                    {new Date(d.ngayGui).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-vnpt-blue text-lg">
                    {d.soDaNop}/{d.tongSo} ({tyLe}%)
                  </p>
                </div>
              </div>

              {d.hocVienChuaNop.length > 0 ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium mb-1">
                    Chua nop ({d.hocVienChuaNop.length}):
                  </p>
                  <ul className="text-sm text-slate-600 list-disc list-inside mb-3">
                    {d.hocVienChuaNop.map((h) => (
                      <li key={h.maPhieu}>{h.hoTen}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={dangGuiKey === d.key}
                    onClick={() => guiNhacLai(d)}
                    className="bg-vnpt-red text-white text-sm px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
                  >
                    {dangGuiKey === d.key ? "Dang gui..." : "Gui nhac lai"}
                  </button>
                  {thongBaoKey[d.key] && (
                    <p className="text-xs text-slate-500 mt-2">{thongBaoKey[d.key]}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-700 mt-3">
                  Da hoan thanh 100% khao sat.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
