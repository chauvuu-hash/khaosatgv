import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-vnpt-blue text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-bold">P.NVDT - Khao sat giang vien</p>
            <p className="text-xs opacity-80">Cong cu tam thoi thang 9/2026</p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/gui-khao-sat" className="hover:underline">
              Gui khao sat
            </Link>
            <Link href="/admin/thong-ke" className="hover:underline">
              Thong ke nop phieu
            </Link>
            <Link href="/admin/kpi" className="hover:underline">
              KPI
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto p-4">{children}</main>
    </div>
  );
}
