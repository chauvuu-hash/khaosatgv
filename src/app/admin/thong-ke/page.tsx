"use client";

import { useEffect, useMemo, useState } from "react";

type HocVienChuaNop = { maPhieu: string; maHV: string; hoTen: string; email: string };
type Dot = {
  key: string;
  maKhoa: string;
  maGV: string;
  ngayGui: string;
  ngayDay: string;
  coDanhSach: boolean;
  tenKhoa: string;
  tenGV: string;
  tongSo: number;
  soDaNop: number;
  hocVienChuaNop: HocVienChuaNop[];
  dsHoTenDaNopQuaLinkChung: string[];
};

export default function ThongKePage() {
  const [dot, setDot] = useState<Dot[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangGuiKey, setDangGuiKey] = useState<string | null>(null);
  const [thongBaoKey, setThongBaoKey] = useState<Record<string, string>>({});
  const [dangHuyMaPhieu, setDangHuyMaPhieu] = useState<string | null>(null);

  const [locKhoa, setLocKhoa] = useState("");
  const [locGV, setLocGV] = useState("");
  const [locTu, setLocTu] = useState("");
  const [locDen, setLocDen] = useState("");

  function taiLai() {
    fetch("/api/admin/thong-ke")
      .then((r) => r.json())
      .then((d) => setDot(d.dot ?? []))
      .finally(() => setDangTai(false));
  }

  useEffect(taiLai, []);

  const khoaOptions = useMemo(() => {
    const map = new Map<string, string>();
    dot.forEach((d) => map.set(d.maKhoa, d.tenKhoa));
    return Array.from(map.entries());
  }, [dot]);

  const gvOptions = useMemo(() => {
    const map = new Map<string, string>();
    dot.forEach((d) => map.set(d.maGV, d.tenGV));
    return Array.from(map.entries());
  }, [dot]);

  const dotDaLoc = useMemo(() => {
    return dot.filter((d) => {
      if (locKhoa && d.maKhoa !== locKhoa) return false;
      if (locGV && d.maGV !== locGV) return false;
      if (locTu && d.ngayDay && d.ngayDay < locTu) return false;
      if (locDen && d.ngayDay && d.ngayDay > locDen) return false;
      return true;
    });
  }, [dot, locKhoa, locGV, locTu, locDen]);

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

  async function huyPhieu(h: HocVienChuaNop) {
    if (
      !window.confirm(
        `Huy phieu khao sat cua "${h.hoTen}"? Link/email da gui se khong dung duoc nua va phieu se khong tinh vao thong ke.`
      )
    ) {
      return;
    }
    setDangHuyMaPhieu(h.maPhieu);
    try {
      const res = await fetch("/api/admin/huy-phieu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maPhieu: h.maPhieu }),
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.loi ?? "Co loi xay ra, khong huy duoc phieu.");
        return;
      }
      taiLai();
    } finally {
      setDangHuyMaPhieu(null);
    }
  }

  if (dangTai) return <p className="text-sm text-slate-500">Dang tai...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-vnpt-blue">Thong ke ty le nop phieu</h1>

      {dot.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Khoa</label>
            <select
              value={locKhoa}
              onChange={(e) => setLocKhoa(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">-- Tat ca --</option>
              {khoaOptions.map(([ma, ten]) => (
                <option key={ma} value={ma}>
                  {ten}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Giang vien</label>
            <select
              value={locGV}
              onChange={(e) => setLocGV(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">-- Tat ca --</option>
              {gvOptions.map(([ma, ten]) => (
                <option key={ma} value={ma}>
                  {ten}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Ngay day tu</label>
            <input
              type="date"
              value={locTu}
              onChange={(e) => setLocTu(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Den</label>
            <input
              type="date"
              value={locDen}
              onChange={(e) => setLocDen(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          {(locKhoa || locGV || locTu || locDen) && (
            <button
              type="button"
              onClick={() => {
                setLocKhoa("");
                setLocGV("");
                setLocTu("");
                setLocDen("");
              }}
              className="text-vnpt-blue text-sm hover:underline"
            >
              Xoa loc
            </button>
          )}
        </div>
      )}

      {dot.length === 0 && (
        <p className="text-sm text-slate-500">Chua co dot gui khao sat nao.</p>
      )}
      {dot.length > 0 && dotDaLoc.length === 0 && (
        <p className="text-sm text-slate-500">Khong co dot nao khop bo loc.</p>
      )}

      <div className="space-y-4">
        {dotDaLoc.map((d) => {
          const tyLe = d.tongSo > 0 ? Math.round((d.soDaNop / d.tongSo) * 100) : 0;
          return (
            <div
              key={d.key}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {d.tenKhoa} &middot; {d.tenGV}
                    {!d.coDanhSach && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-vnpt-blue/10 text-vnpt-blue">
                        Link dung chung
                      </span>
                    )}
                  </p>
                  {d.coDanhSach ? (
                    <p className="text-xs text-slate-500">
                      Ngay day: {d.ngayDay || "-"} &middot; Gui luc:{" "}
                      {new Date(d.ngayGui).toLocaleString("vi-VN")}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">Ngay day: {d.ngayDay || "-"}</p>
                  )}
                </div>
                <div className="text-right">
                  {d.coDanhSach ? (
                    <p className="font-bold text-vnpt-blue text-lg">
                      {d.soDaNop}/{d.tongSo} ({tyLe}%)
                    </p>
                  ) : (
                    <p className="font-bold text-vnpt-blue text-lg">{d.soDaNop} da nop</p>
                  )}
                </div>
              </div>

              {!d.coDanhSach ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Gui qua link dung chung nen khong co danh sach du kien, chi
                    dem duoc so nguoi da nop.
                  </p>
                  {d.dsHoTenDaNopQuaLinkChung.length > 0 && (
                    <ul className="text-sm text-slate-600 list-disc list-inside">
                      {d.dsHoTenDaNopQuaLinkChung.map((ten, i) => (
                        <li key={i}>{ten}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : d.hocVienChuaNop.length > 0 ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium mb-1">
                    Chua nop ({d.hocVienChuaNop.length}):
                  </p>
                  <ul className="text-sm text-slate-600 mb-3 divide-y divide-slate-100">
                    {d.hocVienChuaNop.map((h) => (
                      <li
                        key={h.maPhieu}
                        className="flex items-center justify-between gap-2 py-1"
                      >
                        <span>
                          &bull; {h.hoTen}
                          {h.email ? ` (${h.email})` : ""}
                        </span>
                        <button
                          type="button"
                          disabled={dangHuyMaPhieu === h.maPhieu}
                          onClick={() => huyPhieu(h)}
                          className="text-xs text-vnpt-red hover:underline shrink-0 disabled:opacity-60"
                        >
                          {dangHuyMaPhieu === h.maPhieu ? "Dang huy..." : "Huy phieu"}
                        </button>
                      </li>
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
