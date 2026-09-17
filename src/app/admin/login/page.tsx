"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    setDangGui(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoi(data.loi ?? "Sai mat khau.");
        setDangGui(false);
        return;
      }
      // Dieu huong bang cach tai lai trang (khong dung router.push) de dam
      // bao trinh duyet luon xin trang moi tu server voi cookie phien vua
      // duoc set, thay vi dua vao dieu huong client-side co the bi ket qua
      // cache cu neu router.refresh() khong lam moi kip du lieu.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- can thiet de dam bao cookie phien moi duoc doc lai
      window.location.href = "/admin/gui-khao-sat";
    } catch {
      setLoi("Khong ket noi duoc may chu, vui long thu lai.");
      setDangGui(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <form
        onSubmit={submit}
        className="max-w-sm w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8"
      >
        <h1 className="text-lg font-bold text-vnpt-blue mb-4 text-center">
          Dang nhap trang noi bo QTDT
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mat khau"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm"
          autoFocus
        />
        {loi && <p className="text-vnpt-red text-sm mb-3">{loi}</p>}
        <button
          type="submit"
          disabled={dangGui}
          className="w-full bg-vnpt-blue text-white py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-60"
        >
          {dangGui ? "Dang kiem tra..." : "Dang nhap"}
        </button>
      </form>
    </div>
  );
}
