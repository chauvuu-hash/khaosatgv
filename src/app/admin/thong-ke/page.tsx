"use client";

import { useEffect, useMemo, useState } from "react";
import { CAU_HOI_KHAO_SAT, CAU_Y_KIEN_KHAC } from "@/lib/types";

type HocVienChuaNop = { maPhieu: string; maHV: string; hoTen: string; email: string };
type HocVienDaNop = { maPhieu: string; maHV: string; hoTen: string; email: string };
type HoTenDaNopLinkChung = { maPhieu: string; hoTen: string };
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
  hocVienDaNop: HocVienDaNop[];
  dsHoTenDaNopQuaLinkChung: HoTenDaNopLinkChung[];
};
type GVCot = { maGV: string; ngayDay: string; tenGV: string };
type OTrangThai = { daNop: boolean; maPhieu: string };
type HocVienBang = {
  maNhom: string;
  maHV: string;
  hoTen: string;
  email: string;
  trangThaiTheoGV: Record<string, OTrangThai>;
  maPhieuDaiDien: string;
};
type DotNhieuGV = {
  key: string;
  maKhoa: string;
  tenKhoa: string;
  ngayGui: string;
  danhSachGV: GVCot[];
  hocViens: HocVienBang[];
  tongO: number;
  soONop: number;
};

export default function ThongKePage() {
  const [dot, setDot] = useState<Dot[]>([]);
  const [dotNhieuGV, setDotNhieuGV] = useState<DotNhieuGV[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangGuiKey, setDangGuiKey] = useState<string | null>(null);
  const [thongBaoKey, setThongBaoKey] = useState<Record<string, string>>({});
  const [dangHuyMaPhieu, setDangHuyMaPhieu] = useState<string | null>(null);
  const [xemMaPhieu, setXemMaPhieu] = useState<string | null>(null);

  const [locKhoa, setLocKhoa] = useState("");
  const [locGV, setLocGV] = useState("");
  const [locTu, setLocTu] = useState("");
  const [locDen, setLocDen] = useState("");

  function taiLai() {
    fetch("/api/admin/thong-ke")
      .then((r) => r.json())
      .then((d) => {
        setDot(d.dot ?? []);
        setDotNhieuGV(d.dotNhieuGV ?? []);
      })
      .finally(() => setDangTai(false));
  }

  useEffect(taiLai, []);

  const khoaOptions = useMemo(() => {
    const map = new Map<string, string>();
    dot.forEach((d) => map.set(d.maKhoa, d.tenKhoa));
    dotNhieuGV.forEach((d) => map.set(d.maKhoa, d.tenKhoa));
    return Array.from(map.entries());
  }, [dot, dotNhieuGV]);

  const gvOptions = useMemo(() => {
    const map = new Map<string, string>();
    dot.forEach((d) => map.set(d.maGV, d.tenGV));
    dotNhieuGV.forEach((d) => d.danhSachGV.forEach((g) => map.set(g.maGV, g.tenGV)));
    return Array.from(map.entries());
  }, [dot, dotNhieuGV]);

  const dotDaLoc = useMemo(() => {
    return dot.filter((d) => {
      if (locKhoa && d.maKhoa !== locKhoa) return false;
      if (locGV && d.maGV !== locGV) return false;
      if (locTu && d.ngayDay && d.ngayDay < locTu) return false;
      if (locDen && d.ngayDay && d.ngayDay > locDen) return false;
      return true;
    });
  }, [dot, locKhoa, locGV, locTu, locDen]);

  const dotNhieuGVDaLoc = useMemo(() => {
    return dotNhieuGV.filter((d) => {
      if (locKhoa && d.maKhoa !== locKhoa) return false;
      if (locGV && !d.danhSachGV.some((g) => g.maGV === locGV)) return false;
      if (locTu && !d.danhSachGV.some((g) => !g.ngayDay || g.ngayDay >= locTu)) return false;
      if (locDen && !d.danhSachGV.some((g) => !g.ngayDay || g.ngayDay <= locDen)) return false;
      return true;
    });
  }, [dotNhieuGV, locKhoa, locGV, locTu, locDen]);

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

  async function huyPhieuTheoMa(maPhieu: string, xacNhan: string) {
    if (!window.confirm(xacNhan)) return;
    setDangHuyMaPhieu(maPhieu);
    try {
      const res = await fetch("/api/admin/huy-phieu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maPhieu }),
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

  const chuaCoDuLieu = dot.length === 0 && dotNhieuGV.length === 0;
  const khongKhopLoc =
    !chuaCoDuLieu && dotDaLoc.length === 0 && dotNhieuGVDaLoc.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-vnpt-blue">Thong ke ty le nop phieu</h1>

      {!chuaCoDuLieu && (
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

      {chuaCoDuLieu && (
        <p className="text-sm text-slate-500">Chua co dot gui khao sat nao.</p>
      )}
      {khongKhopLoc && (
        <p className="text-sm text-slate-500">Khong co dot nao khop bo loc.</p>
      )}

      {dotNhieuGVDaLoc.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-700">Khoa nhieu giang vien</h2>
          {dotNhieuGVDaLoc.map((d) => (
            <BangNhieuGV
              key={d.key}
              dot={d}
              dangHuy={dangHuyMaPhieu}
              onHuy={huyPhieuTheoMa}
              onXem={setXemMaPhieu}
            />
          ))}
        </div>
      )}

      {dotDaLoc.length > 0 && (
        <div className="space-y-4">
          {dotNhieuGVDaLoc.length > 0 && (
            <h2 className="font-semibold text-slate-700">Khoa 1 giang vien / link dung chung</h2>
          )}
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
                      <ul className="text-sm text-slate-600 divide-y divide-slate-100">
                        {d.dsHoTenDaNopQuaLinkChung.map((h) => (
                          <li
                            key={h.maPhieu}
                            className="flex items-center justify-between gap-2 py-1"
                          >
                            <span>&bull; {h.hoTen}</span>
                            <button
                              type="button"
                              onClick={() => setXemMaPhieu(h.maPhieu)}
                              className="text-xs text-vnpt-blue hover:underline shrink-0"
                            >
                              Xem chi tiet
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-3">
                    {d.hocVienChuaNop.length > 0 && (
                      <div>
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
                                onClick={() =>
                                  huyPhieuTheoMa(
                                    h.maPhieu,
                                    `Huy phieu khao sat cua "${h.hoTen}"? Link/email da gui se khong dung duoc nua va phieu se khong tinh vao thong ke.`
                                  )
                                }
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
                    )}
                    {d.hocVienDaNop.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Da nop ({d.hocVienDaNop.length}):
                        </p>
                        <ul className="text-sm text-slate-600 divide-y divide-slate-100">
                          {d.hocVienDaNop.map((h) => (
                            <li
                              key={h.maPhieu}
                              className="flex items-center justify-between gap-2 py-1"
                            >
                              <span>&bull; {h.hoTen}</span>
                              <button
                                type="button"
                                onClick={() => setXemMaPhieu(h.maPhieu)}
                                className="text-xs text-vnpt-blue hover:underline shrink-0"
                              >
                                Xem chi tiet
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      d.hocVienChuaNop.length === 0 && (
                        <p className="text-sm text-slate-400">Chua co ai nop.</p>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {xemMaPhieu && (
        <ModalChiTietPhieu
          key={xemMaPhieu}
          maPhieu={xemMaPhieu}
          onClose={() => setXemMaPhieu(null)}
        />
      )}
    </div>
  );
}

function BangNhieuGV({
  dot,
  dangHuy,
  onHuy,
  onXem,
}: {
  dot: DotNhieuGV;
  dangHuy: string | null;
  onHuy: (maPhieu: string, xacNhan: string) => void;
  onXem: (maPhieu: string) => void;
}) {
  const tyLe = dot.tongO > 0 ? Math.round((dot.soONop / dot.tongO) * 100) : 0;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <p className="font-semibold">{dot.tenKhoa}</p>
          <p className="text-xs text-slate-500">
            {dot.danhSachGV.length} giang vien &middot; Gui luc:{" "}
            {new Date(dot.ngayGui).toLocaleString("vi-VN")}
          </p>
        </div>
        <p className="font-bold text-vnpt-blue text-lg">
          {dot.soONop}/{dot.tongO} phieu ({tyLe}%)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-3 py-2 font-medium text-slate-600 w-10">STT</th>
              <th className="px-3 py-2 font-medium text-slate-600">Hoc vien</th>
              {dot.danhSachGV.map((g) => (
                <th key={g.maGV} className="px-3 py-2 font-medium text-slate-600 text-center">
                  {g.tenGV}
                  <div className="text-xs font-normal text-slate-400">{g.ngayDay}</div>
                </th>
              ))}
              <th className="px-3 py-2 font-medium text-slate-600 text-right">Huy</th>
            </tr>
          </thead>
          <tbody>
            {dot.hocViens.map((h, i) => (
              <tr key={h.maNhom} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                <td className="px-3 py-2">
                  {h.hoTen}
                  {h.email && (
                    <span className="text-xs text-slate-400"> ({h.email})</span>
                  )}
                </td>
                {dot.danhSachGV.map((g) => {
                  const o = h.trangThaiTheoGV[g.maGV];
                  return (
                    <td key={g.maGV} className="px-3 py-2 text-center">
                      {o?.daNop ? (
                        <button
                          type="button"
                          onClick={() => onXem(o.maPhieu)}
                          className="text-green-600 font-semibold hover:underline"
                          title="Xem chi tiet phieu"
                        >
                          ✓
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    disabled={dangHuy === h.maPhieuDaiDien}
                    onClick={() =>
                      onHuy(
                        h.maPhieuDaiDien,
                        `Huy toan bo phieu (${dot.danhSachGV.length} GV) cua "${h.hoTen}" trong dot nay? Link/email da gui se khong dung duoc nua.`
                      )
                    }
                    className="text-xs text-vnpt-red hover:underline disabled:opacity-60"
                  >
                    {dangHuy === h.maPhieuDaiDien ? "Dang huy..." : "Huy phieu"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ChiTietPhieu = {
  maPhieu: string;
  hoTenHocVien: string;
  email: string;
  tenKhoa: string;
  tenGV: string;
  ngayDay: string;
  trangThai: string;
  ngayHoanThanh: string;
  diem: string[];
  diemTB: string;
  yKienKhac: string;
};

function ModalChiTietPhieu({
  maPhieu,
  onClose,
}: {
  maPhieu: string;
  onClose: () => void;
}) {
  const [ct, setCt] = useState<ChiTietPhieu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/phieu/${encodeURIComponent(maPhieu)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.loi) setLoi(d.loi);
        else setCt(d);
      })
      .catch(() => setLoi("Khong tai duoc chi tiet phieu."))
      .finally(() => setDangTai(false));
  }, [maPhieu]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-vnpt-blue">Chi tiet phieu khao sat</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            Dong ✕
          </button>
        </div>

        {dangTai && <p className="text-sm text-slate-500">Dang tai...</p>}
        {loi && <p className="text-sm text-vnpt-red">{loi}</p>}

        {ct && (
          <div className="space-y-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3 space-y-0.5">
              <p>
                Hoc vien: <b>{ct.hoTenHocVien}</b>
                {ct.email && <span className="text-slate-500"> ({ct.email})</span>}
              </p>
              <p>Khoa: {ct.tenKhoa}</p>
              <p>Giang vien: {ct.tenGV}</p>
              <p>Ngay day: {ct.ngayDay || "-"}</p>
              <p>
                Diem trung binh: <b className="text-vnpt-blue">{ct.diemTB || "-"}</b>
              </p>
            </div>

            <ul className="divide-y divide-slate-100">
              {CAU_HOI_KHAO_SAT.map((cau, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="text-slate-600">
                    {i + 1}. {cau}
                  </span>
                  <span className="font-semibold shrink-0">{ct.diem[i] || "-"}</span>
                </li>
              ))}
            </ul>

            <div>
              <p className="font-medium mb-1">{CAU_Y_KIEN_KHAC}:</p>
              <p className="text-slate-600 bg-slate-50 rounded-lg p-2 min-h-[2.5rem]">
                {ct.yKienKhac || "(khong co)"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
