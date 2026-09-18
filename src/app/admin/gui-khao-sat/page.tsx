"use client";

import { useEffect, useState } from "react";
import GuiNhieuGVForm from "./GuiNhieuGVForm";

type Khoa = { MaKhoa: string; TenKhoa: string; LoaiLop: string };
type GiangVien = { MaGV: string; HoTen: string; QTDT: string };
type HocVien = { MaHV: string; HoTen: string; Email: string; MaKhoa: string; MaDot: string };

export default function GuiKhaoSatPage() {
  const [khoas, setKhoas] = useState<Khoa[]>([]);
  const [giangViens, setGiangViens] = useState<GiangVien[]>([]);
  const [hocViensCaKhoa, setHocViensCaKhoa] = useState<HocVien[]>([]);
  const [maKhoa, setMaKhoa] = useState("");
  const [maDot, setMaDot] = useState("");
  const [maGV, setMaGV] = useState("");
  const [ngayDay, setNgayDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [chonTatCa, setChonTatCa] = useState(true);
  const [maHVDaChon, setMaHVDaChon] = useState<Set<string>>(new Set());
  const [dangTai, setDangTai] = useState(true);
  const [dangGui, setDangGui] = useState(false);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [linkChung, setLinkChung] = useState<string | null>(null);
  const [daCopy, setDaCopy] = useState(false);

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

  async function guiKhaoSat() {
    setLoi(null);
    setThongBao(null);
    if (!maKhoa || !maGV) {
      setLoi("Vui long chon khoa hoc va giang vien.");
      return;
    }
    if (dsDot.length > 1 && !maDot) {
      setLoi("Khoa nay co nhieu dot, vui long chon dot can gui.");
      return;
    }
    setDangGui(true);
    try {
      const res = await fetch("/api/admin/gui-khao-sat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maKhoa,
          maDot: maDot || undefined,
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

  function taoLinkChung() {
    setLoi(null);
    if (!maKhoa || !maGV) {
      setLoi("Vui long chon khoa hoc va giang vien truoc.");
      return;
    }
    const url = `${window.location.origin}/khao-sat-chung/${encodeURIComponent(maKhoa)}/${encodeURIComponent(maGV)}/${encodeURIComponent(ngayDay)}`;
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

      <div className="space-y-3 max-w-xl">
        <div>
          <h2 className="font-semibold">Khoa co nhieu giang vien?</h2>
          <p className="text-sm text-slate-600">
            Danh cho khoa keo dai nhieu buoi, moi buoi 1 GV khac nhau day. Chon
            het cac GV da day + ngay day tung nguoi, moi hoc vien chi nhan{" "}
            <b>1 email/1 link duy nhat</b> de danh gia lan luot tat ca GV
            trong 1 lan, thay vi nhan rieng tung email cho moi GV.
          </p>
        </div>
        <GuiNhieuGVForm khoas={khoas} giangViens={giangViens} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 max-w-xl">
        <h2 className="font-semibold">Chua co danh sach hoc vien / email?</h2>
        <p className="text-sm text-slate-600">
          Ap dung cho khoa 1 giang vien (form ben tren). Tao 1 link dung chung
          cho khoa + giang vien + ngay day da chon, gui qua Zalo/Telegram cho
          ca lop. Hoc vien tu dien Ho ten khi vao lam khao sat. Link nay dung
          duoc nhieu lan (khong khoa sau khi 1 nguoi da nop).
        </p>
        <p className="text-xs text-slate-400 -mt-1">
          Khoa co nhieu giang vien? Dung nut &quot;Tao link dung chung&quot; o
          trong khung ben duoi.
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
