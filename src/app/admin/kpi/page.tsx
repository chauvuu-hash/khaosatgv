"use client";

import { useEffect, useState } from "react";

type KpiGV = {
  MaGV: string;
  HoTen: string;
  QTDT: string;
  soPhieu: number;
  soPhieuDat: number;
  tyLe: number | null;
  dat: boolean;
};
type KpiQTDT = {
  QTDT: string;
  soPhieu: number;
  soPhieuDat: number;
  tyLe: number | null;
  dat: boolean;
};

export default function KpiPage() {
  const [thang, setThang] = useState(() => new Date().toISOString().slice(0, 7));
  const [locTheoThang, setLocTheoThang] = useState(true);
  const [kpiGV, setKpiGV] = useState<KpiGV[]>([]);
  const [kpiQTDT, setKpiQTDT] = useState<KpiQTDT[]>([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    const qs = locTheoThang ? `?thang=${thang}` : "";
    fetch(`/api/admin/kpi${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setKpiGV(d.kpiGV ?? []);
        setKpiQTDT(d.kpiQTDT ?? []);
      })
      .finally(() => setDangTai(false));
  }, [thang, locTheoThang]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-vnpt-blue">KPI Giang vien / QTDT</h1>
      <p className="text-sm text-slate-600 -mt-4">
        KPI = so phieu diem trung binh &gt;8 / tong so phieu da nop trong ky —
        dat khi ty le &ge; 96%.
      </p>

      <div className="flex items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={locTheoThang}
            onChange={(e) => setLocTheoThang(e.target.checked)}
          />
          Loc theo thang
        </label>
        {locTheoThang && (
          <input
            type="month"
            value={thang}
            onChange={(e) => setThang(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1"
          />
        )}
      </div>

      {dangTai ? (
        <p className="text-sm text-slate-500">Dang tai...</p>
      ) : (
        <>
          <section>
            <h2 className="font-semibold mb-2">Theo Quan tri dao tao (QTDT)</h2>
            <Bang
              cols={["QTDT", "So phieu", "Phieu dat", "Ty le", "KPI"]}
              rows={kpiQTDT.map((k) => [
                k.QTDT,
                String(k.soPhieu),
                String(k.soPhieuDat),
                k.tyLe === null ? "-" : `${(k.tyLe * 100).toFixed(1)}%`,
                <Badge key="b" dat={k.dat} coPhieu={k.soPhieu > 0} />,
              ])}
            />
          </section>

          <section>
            <h2 className="font-semibold mb-2">Theo Giang vien</h2>
            <Bang
              cols={["Giang vien", "QTDT", "So phieu", "Phieu dat", "Ty le", "KPI"]}
              rows={kpiGV.map((k) => [
                k.HoTen,
                k.QTDT,
                String(k.soPhieu),
                String(k.soPhieuDat),
                k.tyLe === null ? "-" : `${(k.tyLe * 100).toFixed(1)}%`,
                <Badge key="b" dat={k.dat} coPhieu={k.soPhieu > 0} />,
              ])}
            />
          </section>
        </>
      )}
    </div>
  );
}

function Badge({ dat, coPhieu }: { dat: boolean; coPhieu: boolean }) {
  if (!coPhieu) return <span className="text-slate-400 text-xs">Chua co phieu</span>;
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${
        dat ? "bg-green-100 text-green-700" : "bg-vnpt-red/10 text-vnpt-red"
      }`}
    >
      {dat ? "Dat" : "Chua dat"}
    </span>
  );
}

function Bang({ cols, rows }: { cols: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left">
            {cols.map((c) => (
              <th key={c} className="px-4 py-2 font-medium text-slate-600">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="px-4 py-4 text-slate-400 text-center">
                Chua co du lieu
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
