import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";
import {
  Users,
  Wallet,
  ReceiptText,
  MessageSquare,
  LayoutDashboard,
  UserRoundSearch,
  Settings,
  ShieldCheck,
  LogOut,
  UserPlus,
  BadgeDollarSign,
  FileText,
  Search,
} from "lucide-react";
const money = new Intl.NumberFormat("ms-MY", {
  style: "currency",
  currency: "MYR",
});
export default async function Dashboard() {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [
    { count: members },
    { data: payments },
    { count: feedback },
    { data: profile },
    { data: recent },
  ] = await Promise.all([
    s
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    s
      .from("payments")
      .select("amount,paid_on")
      .is("voided_at", null)
      .eq("fee_year", new Date().getFullYear()),
    s
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "in_progress"]),
    s.from("profiles").select("full_name,role").eq("id", user.id).single(),
    s
      .from("payments")
      .select("receipt_no,amount,paid_on,members(full_name,member_no)")
      .is("voided_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const total = (payments || []).reduce((n, p) => n + Number(p.amount), 0),
    bars = [38, 56, 45, 72, 62, 84, 68, 90, 74, 82, 65, 42];
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="mark">خ</div>
          <div>
            <strong>Khairat Masjid Tengah</strong>
            <small>Sistem Maklumat Persatuan</small>
          </div>
        </div>
        <nav className="nav">
          <Link href="/">
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </Link>
          <Link href="/members">
            <Users size={19} />
            <span>Pengurusan Ahli</span>
          </Link>
          <Link href="/payments">
            <ReceiptText size={19} />
            <span>Yuran & Ledger</span>
          </Link>
          <Link href="/claims">
            <MessageSquare size={19} />
            <span>Tuntutan Khairat</span>
          </Link>
          <Link href="/feedback">
            <MessageSquare size={19} />
            <span>Maklum Balas</span>
          </Link>
          <Link href="/dependents">
            <UserRoundSearch size={19} />
            <span>Tanggungan Ahli</span>
          </Link>
          <Link href="/users">
            <ShieldCheck size={19} />
            <span>Pengguna Sistem</span>
          </Link>
          <Link href="/reports">
            <Settings size={19} />
            <span>Laporan & Analitik</span>
          </Link>
          <Link href="/settings">
            <Settings size={19} />
            <span>Konfigurasi</span>
          </Link>
          <Link href="/audit">
            <ShieldCheck size={19} />
            <span>Audit Trail</span>
          </Link>
          <Link href="/import">
            <FileText size={19} />
            <span>Import Data</span>
          </Link>
        </nav>
        <div className="side-foot">
          <form action={logout}>
            <button
              style={{
                background: "none",
                border: 0,
                color: "inherit",
                display: "flex",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <LogOut size={16} /> Log keluar
            </button>
          </form>
        </div>
      </aside>
      <main className="main">
        <header className="top">
          <div>
            <h1>Assalamualaikum, {profile?.full_name || "Pentadbir"}</h1>
            <p>
              Ringkasan operasi persatuan bagi{" "}
              {new Date().toLocaleDateString("ms-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="user">
            <div className="avatar">
              {(profile?.full_name || "P").charAt(0)}
            </div>
            <div>
              <strong style={{ fontSize: 13 }}>
                {profile?.full_name || user.email}
              </strong>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                {String(profile?.role || "member").replaceAll("_", " ")}
              </div>
            </div>
          </div>
        </header>
        <section className="grid4">
          <div className="card stat">
            <div className="icon">
              <Users size={20} />
            </div>
            <span className="tag">Aktif</span>
            <h3>{members || 0}</h3>
            <p>Jumlah ahli aktif</p>
          </div>
          <div className="card stat">
            <div className="icon">
              <Wallet size={20} />
            </div>
            <h3>{money.format(total)}</h3>
            <p>Kutipan tahun semasa</p>
          </div>
          <div className="card stat">
            <div className="icon">
              <ReceiptText size={20} />
            </div>
            <h3>{payments?.length || 0}</h3>
            <p>Transaksi yuran direkodkan</p>
          </div>
          <div className="card stat">
            <div className="icon">
              <MessageSquare size={20} />
            </div>
            <h3>{feedback || 0}</h3>
            <p>Maklum balas perlu tindakan</p>
          </div>
        </section>
        <section className="section-grid">
          <div className="card">
            <div className="card-head">
              <h2>Trend kutipan bulanan</h2>
              <span>{new Date().getFullYear()}</span>
            </div>
            <div className="bars">
              {bars.map((h, i) => (
                <div className="bar-group" key={i}>
                  <div className="bar" style={{ height: `${h}%` }} />
                  <span>
                    {
                      [
                        "Jan",
                        "Feb",
                        "Mac",
                        "Apr",
                        "Mei",
                        "Jun",
                        "Jul",
                        "Ogo",
                        "Sep",
                        "Okt",
                        "Nov",
                        "Dis",
                      ][i]
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <h2>Tindakan pantas</h2>
            </div>
            <div className="actions">
              <Link className="action" href="/members/new">
                <UserPlus size={19} color="var(--green)" />
                Daftar ahli
              </Link>
              <Link className="action" href="/payments/new">
                <BadgeDollarSign size={19} color="var(--green)" />
                Rekod bayaran
              </Link>
              <Link className="action" href="/members">
                <Search size={19} color="var(--green)" />
                Cari ahli
              </Link>
              <Link className="action" href="/reports">
                <FileText size={19} color="var(--green)" />
                Jana laporan
              </Link>
            </div>
          </div>
        </section>
        <section className="card recent">
          <div className="card-head">
            <h2>Bayaran terkini</h2>
            <Link href="/payments">Lihat semua</Link>
          </div>
          {recent?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>No. Resit</th>
                  <th>Ahli</th>
                  <th>Tarikh</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any) => (
                  <tr key={r.receipt_no}>
                    <td>
                      <strong>{r.receipt_no}</strong>
                    </td>
                    <td>
                      {r.members?.full_name}
                      <br />
                      <small>{r.members?.member_no}</small>
                    </td>
                    <td>{new Date(r.paid_on).toLocaleDateString("ms-MY")}</td>
                    <td>{money.format(Number(r.amount))}</td>
                    <td>
                      <span className="pill">Diterima</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">Belum ada bayaran direkodkan.</div>
          )}
        </section>
      </main>
    </div>
  );
}
