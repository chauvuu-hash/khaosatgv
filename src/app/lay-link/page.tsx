"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Khoa = { MaKhoa: string; TenKhoa: string; LoaiLop: string };
type GiangVien = { MaGV: string; HoTen: string; QTDT: string };

export default function LayLinkPage() {
  const [khoas, setKhoas] = useState<Khoa[]>([]);
  const [giangViens, setGiangViens] = useState<GiangVien[]>([]);
  const [maKhoa, setMaKhoa] = useState("");
  const [maGV, setMaGV] = useState("");
  const [ngayDay, setNgayDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [daCopy, setDaCopy] = useState(false);

  useEffect(() => {
    fetch("/api/lay-link")
      .then((r) => r.json())
      .then((d) => {
        setKhoas(d.khoas ?? []);
        setGiangViens(d.giangViens ?? []);
      })
      .catch(() => setLoi("Khong tai duoc danh sach khoa/giang vien."))
      .finally(() => setDangTai(false));
  }, []);

  function taoLink() {
    setLoi(null);
    if (!maKhoa || !maGV) {
      setLoi("Vui long chon ma khoa va giang vien.");
      return;
    }
    const url = `${window.location.origin}/khao-sat-chung/${encodeURIComponent(maKhoa)}/${encodeURIComponent(maGV)}/${encodeURIComponent(ngayDay)}`;
    setLink(url);
    setDaCopy(false);
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setDaCopy(true);
    } catch {
      setLoi("Khong copy duoc, vui long bam giu va copy thu cong.");
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h1 className="text-lg font-bold text-vnpt-blue mb-1">
            Lay link khao sat sau buoi hoc
          </h1>
          <p className="text-sm text-slate-600">
            Danh cho giang vien vua day xong 1 buoi, tu lay link khao sat de
            gui hoc vien qua Zalo/Telegram — khong can dang nhap trang QTDT.
          </p>
        </div>

        {dangTai ? (
          <p className="text-sm text-slate-500">Dang tai...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ma khoa</label>
              <select
                value={maKhoa}
                onChange={(e) => setMaKhoa(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium mb-1">Giang vien</label>
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

            {loi && <p className="text-vnpt-red text-sm">{loi}</p>}

            <button
              type="button"
              onClick={taoLink}
              className="bg-vnpt-red text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90"
            >
              Lay link
            </button>

            {link && (
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={link}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-600"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 shrink-0"
                >
                  {daCopy ? "Da copy" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:underline">
            Ve trang chu
          </Link>
        </p>
      </div>
    </main>
  );
}
