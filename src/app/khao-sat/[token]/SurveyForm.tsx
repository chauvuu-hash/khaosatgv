"use client";

import { useState } from "react";
import { CAU_HOI_KHAO_SAT } from "@/lib/types";

export default function SurveyForm({ token }: { token: string }) {
  const [diem, setDiem] = useState<number[]>(Array(10).fill(0));
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [xong, setXong] = useState(false);

  const chuaChamHet = diem.some((d) => d === 0);

  async function submit() {
    setLoi(null);
    if (chuaChamHet) {
      setLoi("Vui long cham diem cho tat ca 10 tieu chi.");
      return;
    }
    setDangGui(true);
    try {
      const res = await fetch(`/api/khao-sat/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diem }),
      });
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
        <p className="text-sm text-slate-600">
          Y kien cua ban da duoc ghi nhan.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
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

      {loi && (
        <p className="text-vnpt-red text-sm font-medium text-center">{loi}</p>
      )}

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
