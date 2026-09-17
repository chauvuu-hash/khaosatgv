"use client";

import { useState } from "react";
import { CAU_HOI_KHAO_SAT, CAU_Y_KIEN_KHAC } from "@/lib/types";

export default function KhoaChungForm({
  maKhoa,
  maGV,
  ngayDay,
  donVis,
  miens,
}: {
  maKhoa: string;
  maGV: string;
  ngayDay: string;
  donVis: string[];
  miens: string[];
}) {
  const [hoTen, setHoTen] = useState("");
  const [donVi, setDonVi] = useState("");
  const [mien, setMien] = useState("");
  const [diem, setDiem] = useState<number[]>(Array(10).fill(0));
  const [yKienKhac, setYKienKhac] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState(false);

  const chuaChamHet = diem.some((d) => d === 0);

  async function submit() {
    setLoi(null);
    if (!hoTen.trim()) {
      setLoi("Vui long nhap ho ten.");
      return;
    }
    if (chuaChamHet) {
      setLoi("Vui long cham diem cho tat ca 10 tieu chi.");
      return;
    }
    setDangGui(true);
    try {
      const res = await fetch(
        `/api/khao-sat-chung/${encodeURIComponent(maKhoa)}/${encodeURIComponent(maGV)}/${encodeURIComponent(ngayDay)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hoTen, donVi, mien, diem, yKienKhac }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setLoi(data.loi ?? "Co loi xay ra, vui long thu lai.");
        return;
      }
      setXong(true);
    } catch {
      setLoi("Khong ket noi duoc may chu, vui long thu lai.");
    } finally {
      setDangGui(false);
    }
  }

  if (xong) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-lg mx-auto">
        <p className="text-vnpt-blue font-semibold text-lg mb-2">
          Cam on ban da hoan thanh khao sat!
        </p>
        <p className="text-sm text-slate-600">Y kien cua ban da duoc ghi nhan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Ho ten cua ban</label>
          <input
            type="text"
            value={hoTen}
            onChange={(e) => setHoTen(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Nguyễn Văn A"
          />
          <p className="text-xs text-slate-400 mt-1">Ghi day du ho ten co dau, vi du: Nguyễn Văn A</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Don vi (khong bat buoc)</label>
          <select
            value={donVi}
            onChange={(e) => setDonVi(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">-- Chon don vi --</option>
            {donVis.map((dv) => (
              <option key={dv} value={dv}>
                {dv}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mien (khong bat buoc)</label>
          <select
            value={mien}
            onChange={(e) => setMien(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">-- Chon mien --</option>
            {miens.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {CAU_HOI_KHAO_SAT.map((cau, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm font-medium mb-3">
            {i + 1}. {cau}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, n) => n + 1).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() =>
                  setDiem((prev) => prev.map((d, idx) => (idx === i ? v : d)))
                }
                className={`w-8 h-8 rounded-md text-sm font-medium border transition ${
                  diem[i] === v
                    ? "bg-vnpt-blue text-white border-vnpt-blue"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-vnpt-blue"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <p className="text-sm font-medium mb-3">
          11. {CAU_Y_KIEN_KHAC} (khong bat buoc)
        </p>
        <textarea
          value={yKienKhac}
          onChange={(e) => setYKienKhac(e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Gop y them cho giang vien / khoa hoc (neu co)..."
        />
      </div>

      {loi && <p className="text-vnpt-red text-sm font-medium text-center">{loi}</p>}

      <button
        type="button"
        disabled={dangGui}
        onClick={submit}
        className="w-full bg-vnpt-red text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
      >
        {dangGui ? "Dang gui..." : "Gui khao sat"}
      </button>
    </div>
  );
}
