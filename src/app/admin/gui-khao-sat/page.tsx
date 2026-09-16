"use client";

import { useEffect, useState } from "react";

type Khoa = { MaKhoa: string; TenKhoa: string; LoaiLop: string };
type GiangVien = { MaGV: string; HoTen: string; QTDT: string };
type HocVien = { MaHV: string; HoTen: string; Email: string; MaKhoa: string };

export default function GuiKhaoSatPage() {
  const [khoas, setKhoas] = useState<Khoa[]>([]);
  const [giangViens, setGiangViens] = useState<GiangVien[]>([]);
  const [hocViens, setHocViens] = useState<HocVien[]>([]);
  const [maKhoa, setMaKhoa] = useState("");
  const [maGV, setMaGV] = useState("");
  const [ngayDay, setNgayDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [chonTatCa, setChonTatCa] = useState(true);
  const [maHVDaChon, setMaHVDaChon] = useState<Set<string>>(new Set());
  const [dangTai, setDangTai] = useState(true);
  const [dangGui, setDangGui] = useState(false);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/gui-khao-sat")
      .then((r) => r.json())
      .then((d) => {
        setKhoas(d.khoas ?? []);
        setGiangViens(d.giangViens ?? []);
      })
      .catch(() => setLoi("Khong tai duoc danh sach khoa/giang vien."))
      .finally(() => setDangTai(false));
  }, []);

  useEffect(() => {
    if (!maKhoa) return;
    fetch(`/api/admin/hoc-vien?maKhoa=${encodeURIComponent(maKhoa)}`)
      .then((r) => r.json())
      .then((d) => setHocViens(d.hocViens ?? []));
  }, [maKhoa]);

  async function guiKhaoSat() {
    setLoi(null);
    setThongBao(null);
    if (!maKhoa || !maGV) {
      setLoi("Vui long chon khoa hoc va giang vien.");
      return;
    }
    setDangGui(true);
    try {
      const res = await fetch("/api/admin/gui-khao-sat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maKhoa,
          maGV,
          ngayDay,
          maHVDaChon: chonTatCa ? undefined : Array.from(maHVDaChon),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoi(data.loi ?? "Co loi xay ra.");
        return;
      }
      setThongBao(
        `Da tao ${data.soPhieuTao} phieu khao sat, gui email thanh cong ${data.soEmailGuiThanhCong}/${data.soPhieuTao}` +
          (data.soEmailLoi > 0 ? ` (${data.soEmailLoi} email loi, kiem tra lai email hoc vien).` : ".")
      );
    } finally {
      setDangGui(false);
    }
  }

  if (dangTai) return <p className="text-sm text-slate-500">Dang tai...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-vnpt-blue">Gui khao sat sau buoi hoc</h1>
      <p className="text-sm text-slate-600 -mt-4">
        Bam khi 1 giang vien vua day xong 1 buoi. He thong tao link khao sat
        rieng cho tung hoc vien va gui email ngay.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">Khoa hoc</label>
          <select
            value={maKhoa}
            onChange={(e) => {
              setMaKhoa(e.target.value);
              setHocViens([]);
              setMaHVDaChon(new Set());
            }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- Chon khoa hoc --</option>
            {khoas.map((k) => (
              <option key={k.MaKhoa} value={k.MaKhoa}>
                {k.TenKhoa} ({k.MaKhoa})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Giang vien vua day xong
          </label>
          <select
            value={maGV}
            onChange={(e) => setMaGV(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- Chon giang vien --</option>
            {giangViens.map((g) => (
              <option key={g.MaGV} value={g.MaGV}>
                {g.HoTen}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ngay day</label>
          <input
            type="date"
            value={ngayDay}
            onChange={(e) => setNgayDay(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {maKhoa && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                Hoc vien ({hocViens.length} nguoi trong khoa)
              </label>
              <label className="text-xs flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={chonTatCa}
                  onChange={(e) => setChonTatCa(e.target.checked)}
                />
                Gui cho tat ca
              </label>
            </div>
            {!chonTatCa && (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                {hocViens.map((hv) => (
                  <label key={hv.MaHV} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={maHVDaChon.has(hv.MaHV)}
                      onChange={(e) => {
                        setMaHVDaChon((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(hv.MaHV);
                          else next.delete(hv.MaHV);
                          return next;
                        });
                      }}
                    />
                    {hv.HoTen} ({hv.Email})
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {loi && <p className="text-vnpt-red text-sm">{loi}</p>}
        {thongBao && <p className="text-green-700 text-sm">{thongBao}</p>}

        <button
          type="button"
          disabled={dangGui}
          onClick={guiKhaoSat}
          className="bg-vnpt-red text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
        >
          {dangGui ? "Dang gui..." : "Gui khao sat"}
        </button>
      </div>
    </div>
  );
}
