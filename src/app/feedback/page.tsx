import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  MessageSquarePlus,
  Search,
  MessagesSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
const labels: Record<string, string> = {
  new: "Baharu",
  in_progress: "Dalam tindakan",
  resolved: "Selesai",
  closed: "Ditutup",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const f = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  let q = s
    .from("feedback")
    .select(
      "id,reference_no,category,subject,status,created_at,members(member_no,full_name),profiles:assigned_to(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (f.status) q = q.eq("status", f.status);
  if (f.category) q = q.eq("category", f.category);
  const { data, error } = await q,
    term = (f.q || "").toLowerCase(),
    rows = (data || []).filter(
      (x: any) =>
        !term ||
        x.reference_no.toLowerCase().includes(term) ||
        x.subject.toLowerCase().includes(term) ||
        x.members?.full_name?.toLowerCase().includes(term),
    );
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL MAKLUM BALAS & ADUAN</p>
            <h1>Senarai Kes</h1>
            <span>Jejak pertanyaan, cadangan dan aduan sehingga selesai.</span>
          </div>
          <Link className="btn-inline" href="/feedback/new">
            <MessageSquarePlus size={18} /> Daftar Baharu
          </Link>
        </header>
        <form className="filter-card">
          <div className="search-field">
            <Search size={18} />
            <input
              name="q"
              defaultValue={f.q || ""}
              placeholder="Cari rujukan, tajuk atau ahli"
            />
          </div>
          <select name="status" defaultValue={f.status || ""}>
            <option value="">Semua status</option>
            {Object.entries(labels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select name="category" defaultValue={f.category || ""}>
            <option value="">Semua kategori</option>
            {[
              "pertanyaan",
              "aduan",
              "cadangan",
              "bayaran",
              "keahlian",
              "tuntutan",
              "lain-lain",
            ].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          <button className="btn-filter">Cari</button>
        </form>
        <section className="card member-list">
          <div className="list-summary">
            <div>
              <MessagesSquare size={18} />
              <strong>{rows.length}</strong> kes
            </div>
          </div>
          {error ? (
            <div className="error">{error.message}</div>
          ) : rows.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rujukan</th>
                    <th>Tajuk</th>
                    <th>Kategori</th>
                    <th>Ahli</th>
                    <th>Pegawai</th>
                    <th>Tarikh</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x: any) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.reference_no}</strong>
                      </td>
                      <td>{x.subject}</td>
                      <td className="capitalize">{x.category}</td>
                      <td>
                        {x.members?.full_name || "Umum"}
                        <br />
                        <small>{x.members?.member_no || "—"}</small>
                      </td>
                      <td>{x.profiles?.full_name || "Belum diagih"}</td>
                      <td>
                        {new Date(x.created_at).toLocaleDateString("ms-MY")}
                      </td>
                      <td>
                        <span className={`pill feedback-${x.status}`}>
                          {labels[x.status]}
                        </span>
                      </td>
                      <td>
                        <Link className="table-link" href={`/feedback/${x.id}`}>
                          Semak
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              Belum ada maklum balas atau tiada rekod sepadan.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
