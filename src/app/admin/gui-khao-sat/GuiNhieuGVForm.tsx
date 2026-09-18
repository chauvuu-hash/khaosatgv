"use client";

import { useEffect, useState } from "react";
import { encodeDsGV } from "@/lib/dsGVToken";

type Khoa = { MaKhoa: string; TenKhoa: string; LoaiLop: string };
type GiangVien = { MaGV: string; HoTen: string; QTDT: string };
type HocVien = { MaHV: string; HoTen: string; Email: string; MaKhoa: string; MaDot: string };
type HangGV = { maGV: string; ngayDay: string };

function ngayHomNay() {
  return new Date().toISOString().slice(0, 10);
}

export default function GuiNhieuGVForm({
  khoas,
  giangViens,
}: {
  khoas: Khoa[];
  giangViens: GiangVien[];
}) {
  const [maKhoa, setMaKhoa] = useState("");
  const [maDot, setMaDot] = useState("");
  const [hangGV, setHangGV] = useState<HangGV[]>([
    { maGV: "", ngayDay: ngayHomNay() },
    { maGV: "", ngayDay: ngayHomNay() },
  ]);
  const [hocViensCaKhoa, setHocViensCaKhoa] = useState<HocVien[]>([]);
  const [chonTatCa, setChonTatCa] = useState(true);
  const [maHVDaChon, setMaHVDaChon] = useState<Set<string>>(new Set());
  const [dangGui, setDangGui] = useState(false);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [linkChung, setLinkChung] = useState<string | null>(null);
  const [daCopy, setDaCopy] = useState(false);

  useEffect(() => {
    if (!maKhoa) return;
    fetch(`/api/admin/hoc-vien?maKhoa=${encodeURIComponent(maKhoa)}`)
      .then((r) => r.json())
      .then((d) => setHocViensCaKhoa(d.hocViens ?? []));
  }, [maKhoa]);

  const dsDot = Array.from(new Set(hocViensCaKhoa.map((h) => h.MaDot ?? "")))
    .sort()
    .reverse();
  const hocViens = maDot
    ? hocViensCaKhoa.filter((h) => h.MaDot === maDot)
    : dsDot.length <= 1
      ? hocViensCaKhoa
      : [];

  function themHangGV() {
    setHangGV((prev) => [...prev, { maGV: "", ngayDay: ngayHomNay() }]);
  }
  function xoaHangGV(i: number) {
    setHangGV((prev) => prev.filter((_, idx) => idx !== i));
  }
  function suaHangGV(i: number, field: keyof HangGV, value: string) {
    setHangGV((prev) => prev.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));
  }

  async function gui() {
    setLoi(null);
    setThongBao(null);
    if (!maKhoa) {
      setLoi("Vui long chon ma khoa.");
      return;
    }
    if (dsDot.length > 1 && !maDot) {
      setLoi("Khoa nay co nhieu dot, vui long chon dot can gui.");
      return;
    }
    const danhSachGV = hangGV.filter((h) => h.maGV);
    if (danhSachGV.length < 2) {
      setLoi("Chon it nhat 2 giang vien (neu chi 1 GV, dung form ben tren).");
      return;
    }
    const maGVs = danhSachGV.map((h) => h.maGV);
    if (new Set(maGVs).size !== maGVs.length) {
      setLoi("Khong chon trung 1 giang vien 2 lan.");
      return;
    }
    setDangGui(true);
    try {
      const res = await fetch("/api/admin/gui-khao-sat-nhieu-gv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maKhoa,
          maDot: maDot || undefined,
          danhSachGV,
          maHVDaChon: chonTatCa ? undefined : Array.from(maHVDaChon),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoi(data.loi ?? "Co loi xay ra.");
        return;
      }
      setThongBao(
        `Da tao ${data.soPhieuTao} phieu (${data.soHocVien} hoc vien x ${data.soGV} giang vien), gui email thanh cong ${data.soEmailGuiThanhCong}/${data.soHocVien}` +
          (data.soEmailLoi > 0 ? ` (${data.soEmailLoi} email loi, kiem tra lai email hoc vien).` : ".")
      );
    } finally {
      setDangGui(false);
    }
  }

  function taoLinkChung() {
    setLoi(null);
    if (!maKhoa) {
      setLoi("Vui long chon ma khoa.");
      return;
    }
    const danhSachGV = hangGV.filter((h) => h.maGV);
    if (danhSachGV.length < 2) {
      setLoi("Chon it nhat 2 giang vien (neu chi 1 GV, dung link o form ben tren).");
      return;
    }
    const maGVs = danhSachGV.map((h) => h.maGV);
    if (new Set(maGVs).size !== maGVs.length) {
      setLoi("Khong chon trung 1 giang vien 2 lan.");
      return;
    }
    const dsGV = encodeDsGV(danhSachGV);
    const url = `${window.location.origin}/khao-sat-chung-nhieu-gv/${encodeURIComponent(maKhoa)}/${encodeURIComponent(dsGV)}`;
    setLinkChung(url);
    setDaCopy(false);
  }

  async function copyLinkChung() {
    if (!linkChung) return;
    try {
      await navigator.clipboard.writeText(linkChung);
      setDaCopy(true);
    } catch {
      setLoi("Khong copy duoc, vui long bam giu va copy thu cong.");
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">Ma khoa</label>
        <select
          value={maKhoa}
          onChange={(e) => {
            setMaKhoa(e.target.value);
            setHocViensCaKhoa([]);
            setMaDot("");
            setMaHVDaChon(new Set());
          }}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">-- Chon ma khoa --</option>
          {khoas.map((k) => (
            <option key={k.MaKhoa} value={k.MaKhoa}>
              {k.MaKhoa}
            </option>
          ))}
        </select>
      </div>

      {maKhoa && dsDot.length > 1 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Dot (khoa nay dung lai ma, dang co {dsDot.length} dot)
          </label>
          <select
            value={maDot}
            onChange={(e) => {
              setMaDot(e.target.value);
              setMaHVDaChon(new Set());
            }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- Chon dot --</option>
            {dsDot.map((d) => (
              <option key={d} value={d}>
                {d || "(khong ro dot)"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Cac giang vien da day (kem ngay day tung nguoi)
        </label>
        <div className="space-y-2">
          {hangGV.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={h.maGV}
                onChange={(e) => suaHangGV(i, "maGV", e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              >
                <option value="">-- Giang vien --</option>
                {giangViens.map((g) => (
                  <option key={g.MaGV} value={g.MaGV}>
                    {g.HoTen}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={h.ngayDay}
                onChange={(e) => suaHangGV(i, "ngayDay", e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              />
              {hangGV.length > 1 && (
                <button
                  type="button"
                  onClick={() => xoaHangGV(i)}
                  className="text-vnpt-red text-sm px-2 shrink-0"
                >
                  Xoa
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={themHangGV}
          className="text-vnpt-blue text-sm mt-2 hover:underline"
        >
          + Them giang vien
        </button>
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
        onClick={gui}
        className="bg-vnpt-red text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
      >
        {dangGui ? "Dang gui..." : "Gui khao sat nhieu GV"}
      </button>

      <div className="border-t border-slate-100 pt-4 space-y-2">
        <p className="text-xs text-slate-500">
          Chua co danh sach hoc vien/email? Tao 1 link dung chung cho khoa +
          cac GV/ngay day da chon o tren, gui qua Zalo/Telegram. Hoc vien tu
          dien ho ten va danh gia lan luot tat ca GV trong 1 lan.
        </p>
        <button
          type="button"
          onClick={taoLinkChung}
          className="bg-vnpt-blue text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90"
        >
          Tao link dung chung
        </button>
        {linkChung && (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={linkChung}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-600"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={copyLinkChung}
              className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 shrink-0"
            >
              {daCopy ? "Da copy" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
