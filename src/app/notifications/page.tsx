import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, Send, ReceiptText, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  generatePaymentReminders,
  markAsRead,
  sendAnnouncement,
} from "./actions";
const types: Record<string, string> = {
  general: "Umum",
  payment_reminder: "Peringatan yuran",
  payment_received: "Bayaran diterima",
  claim_update: "Status tuntutan",
  announcement: "Pengumuman",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await s
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
    staff = ["super_admin", "admin", "staff"].includes(profile?.role || "");
  const [{ data: notifications }, { data: members }] = await Promise.all([
    s
      .from("notifications")
      .select(
        "id,title,message,type,link,read_at,created_at,members(member_no,full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    staff
      ? s
          .from("members")
          .select("id,member_no,full_name")
          .not("linked_user_id", "is", null)
          .order("full_name")
      : Promise.resolve({ data: [] }),
  ]);
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL NOTIFIKASI DALAMAN</p>
            <h1>Pusat Notifikasi</h1>
            <span>
              Pengumuman, peringatan yuran dan perkembangan urusan ahli.
            </span>
          </div>
          <Bell size={34} />
        </header>
        {p.success && <div className="success">{p.success}</div>}
        {p.error && <div className="error">{p.error}</div>}
        {staff && (
          <section className="notification-tools">
            <form action={sendAnnouncement} className="card announcement-form">
              <div className="card-head">
                <h2>Pengumuman Baharu</h2>
                <Send size={18} />
              </div>
              <div className="field">
                <label>Penerima</label>
                <select name="member_id">
                  <option value="">Semua ahli yang mempunyai akaun</option>
                  {members?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.member_no} — {m.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Tajuk</label>
                <input name="title" required />
              </div>
              <div className="field">
                <label>Mesej</label>
                <textarea name="message" rows={4} required />
              </div>
              <button className="btn-inline">Jana Notifikasi</button>
            </form>
            <div className="card reminder-tool">
              <div>
                <ReceiptText />
                <h2>Peringatan Tunggakan</h2>
                <p>
                  Jana peringatan berdasarkan baki yuran tahun semasa kepada
                  akaun ahli yang telah dipautkan.
                </p>
              </div>
              <form action={generatePaymentReminders}>
                <button className="btn-inline">Jana Peringatan</button>
              </form>
            </div>
          </section>
        )}
        <section className="card notification-list">
          <div className="card-head">
            <h2>{staff ? "Sejarah Notifikasi" : "Notifikasi Saya"}</h2>
            <span>
              {notifications?.filter((x) => !x.read_at).length || 0} belum
              dibaca
            </span>
          </div>
          {notifications?.length ? (
            notifications.map((n: any) => (
              <article
                className={`notification-item ${n.read_at ? "read" : "unread"}`}
                key={n.id}
              >
                <div className="notification-icon">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="notification-meta">
                    <span>{types[n.type] || n.type}</span>
                    <time>
                      {new Date(n.created_at).toLocaleString("ms-MY")}
                    </time>
                  </div>
                  <h3>{n.title}</h3>
                  <p>{n.message}</p>
                  {staff && n.members && (
                    <small>
                      Kepada: {n.members.full_name} ({n.members.member_no})
                    </small>
                  )}
                  {n.link && (
                    <Link className="table-link" href={n.link}>
                      Buka pautan
                    </Link>
                  )}
                </div>
                {!staff && !n.read_at && (
                  <form action={markAsRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button title="Tandakan dibaca">
                      <Check size={17} />
                    </button>
                  </form>
                )}
              </article>
            ))
          ) : (
            <div className="empty">Belum ada notifikasi.</div>
          )}
        </section>
      </div>
    </main>
  );
}
