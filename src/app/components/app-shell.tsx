"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  FileSpreadsheet,
  FileText,
  Gauge,
  HandCoins,
  History,
  Import,
  LogOut,
  Menu,
  MessageSquareText,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { logout } from "@/app/actions";

const menu = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/members", label: "Pengurusan Ahli", icon: Users },
  { href: "/dependents", label: "Tanggungan Ahli", icon: UsersRound },
  { href: "/payments", label: "Yuran & Bayaran", icon: ReceiptText },
  { href: "/claims", label: "Tuntutan Khairat", icon: HandCoins },
  { href: "/portal", label: "Portal Ahli", icon: UserRound },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
  { href: "/feedback", label: "Maklum Balas", icon: MessageSquareText },
  { href: "/reports", label: "Laporan & Analitik", icon: FileSpreadsheet },
  { href: "/users", label: "Pengguna & Peranan", icon: ShieldCheck },
  { href: "/audit", label: "Jejak Audit", icon: History },
  { href: "/import", label: "Import Data", icon: Import },
  { href: "/settings", label: "Konfigurasi", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const plain = pathname === "/login" || /^\/payments\/[^/]+\/receipt/.test(pathname);

  useEffect(() => setOpen(false), [pathname]);

  if (plain) return <>{children}</>;

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <button className="menu-trigger" onClick={() => setOpen(true)} aria-label="Buka menu navigasi">
          <Menu size={23} />
        </button>
        <Link href="/" className="mobile-brand" aria-label="Ke dashboard">
          <span className="nav-mark">خ</span>
          <span>Khairat Masjid Tengah</span>
        </Link>
      </header>

      {open && <button className="nav-backdrop" aria-label="Tutup menu" onClick={() => setOpen(false)} />}
      <aside className={`app-navigation ${open ? "is-open" : ""}`} aria-label="Navigasi utama">
        <div className="nav-brand">
          <span className="nav-mark">خ</span>
          <span>
            <strong>Khairat Masjid Tengah</strong>
            <small>Sistem Maklumat Persatuan</small>
          </span>
          <button className="nav-close" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X size={22} />
          </button>
        </div>
        <nav className="primary-menu">
          {menu.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={isActive(pathname, href) ? "active" : ""} aria-current={isActive(pathname, href) ? "page" : undefined}>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="nav-footer">
          <Link href="/reports"><FileText size={17} />Pusat laporan</Link>
          <form action={logout}>
            <button><LogOut size={17} />Log keluar</button>
          </form>
        </div>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}
