"use client";

import { useEffect, useState } from "react";

type KetQua = { soPhieu: number; soPhieuDat: number; tyLe: number | null; dat: boolean };
type KpiGV = KetQua & { MaGV: string; HoTen: string; QTDT: string };
type KpiQTDT = KetQua & { QTDT: string };
type KpiTongHop = KetQua & { ten: string; vaiTro: string };

export default function KpiPage() {
  const [thang, setThang] = useState(() => new Date().toISOString().slice(0, 7));
  const [locTheoThang, setLocTheoThang] = useState(true);
  const [kpiGV, setKpiGV] = useState<KpiGV[]>([]);
  const [kpiQTDT, setKpiQTDT] = useState<KpiQTDT[]>([]);
  const [kpiTongHop, setKpiTongHop] = useState<KpiTongHop | null>(null);
  const [nguongApDung, setNguongApDung] = useState(0.96);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    const qs = locTheoThang ? `?thang=${thang}` : "";
    fetch(`/api/admin/kpi${qs}`)
      .then((r) => r.json())
      .then((d) => {
        setKpiGV(d.kpiGV ?? []);
        setKpiQTDT(d.kpiQTDT ?? []);
        setKpiTongHop(d.kpiTongHop ?? null);
        setNguongApDung(d.nguongApDung ?? 0.96);
      })
      .finally(() => setDangTai(false));
  }, [thang, locTheoThang]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-vnpt-blue">KPI Giang vien / QTDT / CV QTHT</h1>
      <div className="text-sm text-slate-600 -mt-4 space-y-1">
        <p>
          KPI = so phieu diem trung binh &gt;8 / tong so phieu da nop trong ky.
        </p>
        <p>
          Nguong: <b>≥90%</b> ap dung thang 1–7/2026, <b>≥96%</b> ap dung tu
          thang 8/2026 — dang xem theo nguong{" "}
          <b>{(nguongApDung * 100).toFixed(0)}%</b>.
        </p>
        <p>
          GV/QTDT/CV QTHT khong day (khong co phieu) trong thang dang loc thi
          tinh thang do la <b>100%</b> (khong bi tru KPI).
        </p>
        <p className="text-xs text-slate-400">
          Bang duoi day chi tinh tu phieu nop qua he thong nay (tu thang
          9/2026). Du lieu doi chieu T1–T9/2026 tu file Excel cu (chua nhap
          vao Google Sheet dang chay) xem o{" "}
          <a
            href="https://claude.ai/artifact/LRzH1W5Fn4kDM9qtAeW67d"
            target="_blank"
            rel="noopener noreferrer"
            className="text-vnpt-blue underline"
          >
            Bao cao KPI 6 thang
          </a>
          .
        </p>
      </div>

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
            <h2 className="font-semibold mb-2">CV Quan tri he thong (CV QTHT) — gop tat ca GV</h2>
            <Bang
              cols={["Ho ten", "Vai tro", "So phieu", "Phieu dat", "Ty le", "KPI"]}
              rows={
                kpiTongHop
                  ? [
                      [
                        kpiTongHop.ten,
                        kpiTongHop.vaiTro,
                        String(kpiTongHop.soPhieu),
                        String(kpiTongHop.soPhieuDat),
                        kpiTongHop.tyLe === null ? "-" : `${(kpiTongHop.tyLe * 100).toFixed(1)}%`,
                        <Badge key="b" ketQua={kpiTongHop} />,
                      ],
                    ]
                  : []
              }
            />
          </section>

          <section>
            <h2 className="font-semibold mb-2">Theo Quan tri dao tao (QTDT)</h2>
            <Bang
              cols={["QTDT", "So phieu", "Phieu dat", "Ty le", "KPI"]}
              rows={kpiQTDT.map((k) => [
                k.QTDT,
                String(k.soPhieu),
                String(k.soPhieuDat),
                k.tyLe === null ? "-" : `${(k.tyLe * 100).toFixed(1)}%`,
                <Badge key="b" ketQua={k} />,
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
                <Badge key="b" ketQua={k} />,
              ])}
            />
          </section>
        </>
      )}
    </div>
  );
}

function Badge({ ketQua }: { ketQua: KetQua }) {
  if (ketQua.tyLe === null) {
    return <span className="text-slate-400 text-xs">Chua co phieu</span>;
  }
  if (ketQua.soPhieu === 0) {
    return (
      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
        Dat (khong day thang nay)
      </span>
    );
  }
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${
        ketQua.dat ? "bg-green-100 text-green-700" : "bg-vnpt-red/10 text-vnpt-red"
      }`}
    >
      {ketQua.dat ? "Dat" : "Chua dat"}
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
