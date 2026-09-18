"use client";

import { useEffect, useState } from "react";

type HocVien = {
  MaHV: string;
  HoTen: string;
  Email: string;
  DonVi: string;
  Mien: string;
  MaKhoa: string;
  MaDot: string;
};

type DongUpload = Partial<
  Record<"MaHV" | "HoTen" | "Email" | "DonVi" | "Mien" | "MaKhoa" | "MaDot", string>
>;

type KetQuaUpload = {
  soDongDoc: number;
  soThemMoi: number;
  soTrung: number;
  loi: { dong: number; ly_do: string }[];
};

/** Bo dau tieng Viet + chuan hoa de so sanh ten cot linh hoat (khong phan biet hoa/thuong, co/khong dau). */
function chuanHoaHeader(h: string): string {
  return h
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const HEADER_ALIASES: Record<string, keyof DongUpload> = {
  mahv: "MaHV",
  mahocvien: "MaHV",
  hoten: "HoTen",
  hotenhv: "HoTen",
  email: "Email",
  donvi: "DonVi",
  mien: "Mien",
  makhoa: "MaKhoa",
  malop: "MaKhoa",
  dot: "MaDot",
  madot: "MaDot",
};

/** Parse CSV don gian (ho tro truong co dau ngoac kep chua dau phay/xuong dong), khong dung thu vien ngoai. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function csvThanhDong(text: string): DongUpload[] {
  const bang = parseCSV(text);
  if (bang.length === 0) return [];
  const header = bang[0].map((h) => HEADER_ALIASES[chuanHoaHeader(h)]);
  return bang.slice(1).map((r) => {
    const obj: DongUpload = {};
    header.forEach((field, i) => {
      if (field) obj[field] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

export default function HocVienPage() {
  const [hocViens, setHocViens] = useState<HocVien[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [timKiem, setTimKiem] = useState("");
  const [maDot, setMaDot] = useState("");
  const [dangUpload, setDangUpload] = useState(false);
  const [ketQuaUpload, setKetQuaUpload] = useState<KetQuaUpload | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  function taiLai() {
    fetch("/api/admin/hoc-vien")
      .then((r) => r.json())
      .then((d) => setHocViens(d.hocViens ?? []))
      .finally(() => setDangTai(false));
  }

  useEffect(taiLai, []);

  async function chonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoi(null);
    setKetQuaUpload(null);
    if (!maDot.trim()) {
      setLoi("Vui long nhap Ma dot truoc khi chon file.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setLoi("Chi ho tro file .csv. Neu dang co file Excel, mo file do va chon Save As / Export -> CSV.");
      return;
    }
    const text = await file.text();
    const dong = csvThanhDong(text);
    if (dong.length === 0) {
      setLoi("Khong doc duoc dong nao tu file. Kiem tra lai dong tieu de cot.");
      return;
    }
    setDangUpload(true);
    try {
      const res = await fetch("/api/admin/hoc-vien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dong, maDot: maDot.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoi(data.loi ?? "Co loi xay ra.");
        return;
      }
      setKetQuaUpload(data);
      taiLai();
    } catch {
      setLoi("Khong ket noi duoc may chu, vui long thu lai.");
    } finally {
      setDangUpload(false);
    }
  }

  const dsHienThi = hocViens.filter((hv) => {
    if (!timKiem.trim()) return true;
    const q = timKiem.trim().toLowerCase();
    return (
      hv.HoTen.toLowerCase().includes(q) ||
      hv.Email.toLowerCase().includes(q) ||
      hv.MaKhoa.toLowerCase().includes(q) ||
      (hv.MaDot ?? "").toLowerCase().includes(q) ||
      hv.MaHV.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-vnpt-blue">Danh sach hoc vien</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3 max-w-xl">
        <h2 className="font-semibold">Tai danh sach hoc vien len (file .csv)</h2>
        <p className="text-sm text-slate-600">
          File CSV can co dong tieu de cot voi cac ten (khong phan biet hoa/thuong,
          co hay khong dau deu duoc): <code>Ho ten</code>, <code>Email</code>,{" "}
          <code>Don vi</code>, <code>Mien</code>, <code>Ma khoa</code> (bat buoc
          tru Ma khoa va Ho ten). <code>Ma hoc vien</code> co the de trong, he
          thong tu sinh so.
        </p>
        <p className="text-xs text-slate-400">
          Neu danh sach dang o file Excel: mo file, chon File → Save As (hoac
          Export) → CSV UTF-8, roi tai file .csv do len day.
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">
            Ma dot (bat buoc, vd 2026-10)
          </label>
          <input
            type="text"
            value={maDot}
            onChange={(e) => setMaDot(e.target.value)}
            placeholder="2026-10"
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-48"
          />
          <p className="text-xs text-slate-400 mt-1">
            Dung de tach hoc vien cua tung lan mo lop khi Ma khoa bi dung lai
            nhieu thang (vd lop chuyen doi mo hang thang deu dung 1 Ma khoa).
            Khi gui khao sat se chon theo Ma khoa + Ma dot nay.
          </p>
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={chonFile}
          disabled={dangUpload}
          className="text-sm"
        />
        {dangUpload && <p className="text-sm text-slate-500">Dang tai len...</p>}
        {loi && <p className="text-vnpt-red text-sm">{loi}</p>}
        {ketQuaUpload && (
          <div className="text-sm bg-slate-50 rounded-lg p-3 space-y-1">
            <p>
              Doc {ketQuaUpload.soDongDoc} dong — them moi{" "}
              <b className="text-green-700">{ketQuaUpload.soThemMoi}</b>, bo
              qua trung email <b>{ketQuaUpload.soTrung}</b>, loi{" "}
              <b className="text-vnpt-red">{ketQuaUpload.loi.length}</b>.
            </p>
            {ketQuaUpload.loi.length > 0 && (
              <ul className="text-xs text-vnpt-red list-disc list-inside">
                {ketQuaUpload.loi.slice(0, 20).map((l, i) => (
                  <li key={i}>
                    Dong {l.dong}: {l.ly_do}
                  </li>
                ))}
                {ketQuaUpload.loi.length > 20 && <li>... va {ketQuaUpload.loi.length - 20} loi khac</li>}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold">
            Da co {hocViens.length} hoc vien trong he thong
          </h2>
          <input
            type="text"
            value={timKiem}
            onChange={(e) => setTimKiem(e.target.value)}
            placeholder="Tim theo ten, email, ma khoa, ma dot..."
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-64"
          />
        </div>

        {dangTai ? (
          <p className="text-sm text-slate-500">Dang tai...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-2 font-medium text-slate-600">Ma HV</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Ho ten</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Email</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Don vi</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Mien</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Ma khoa</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Dot</th>
                </tr>
              </thead>
              <tbody>
                {dsHienThi.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-slate-400 text-center">
                      Khong co du lieu
                    </td>
                  </tr>
                ) : (
                  dsHienThi.map((hv, i) => (
                    <tr key={`${hv.MaHV}-${i}`} className="border-t border-slate-100">
                      <td className="px-4 py-2">{hv.MaHV}</td>
                      <td className="px-4 py-2">{hv.HoTen}</td>
                      <td className="px-4 py-2">{hv.Email}</td>
                      <td className="px-4 py-2">{hv.DonVi}</td>
                      <td className="px-4 py-2">{hv.Mien}</td>
                      <td className="px-4 py-2">{hv.MaKhoa}</td>
                      <td className="px-4 py-2">{hv.MaDot}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
