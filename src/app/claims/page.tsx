import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FilePlus2, Search, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
const money = new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }),
  labels: Record<string, string> = {
    draft: "Draf",
    submitted: "Dihantar",
    under_review: "Dalam semakan",
    approved: "Diluluskan",
    rejected: "Ditolak",
    paid: "Dibayar",
    cancelled: "Dibatalkan",
  };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const f = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  let q = s
    .from("claims")
    .select(
      "id,reference_no,claimant_name,event_date,submitted_on,amount,status,members(member_no,full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (f.status) q = q.eq("status", f.status);
  const { data, error } = await q,
    term = (f.q || "").toLowerCase(),
    rows = (data || []).filter(
      (x: any) =>
        !term ||
        x.reference_no.toLowerCase().includes(term) ||
        x.claimant_name.toLowerCase().includes(term) ||
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
            <p className="eyebrow">MODUL TUNTUTAN KHAIRAT</p>
            <h1>Senarai Tuntutan</h1>
            <span>Daftar, semak dan urus kelulusan bantuan khairat.</span>
          </div>
          <Link className="btn-inline" href="/claims/new">
            <FilePlus2 size={18} /> Tuntutan Baharu
          </Link>
        </header>
        <form className="filter-card">
          <div className="search-field">
            <Search size={18} />
            <input
              name="q"
              defaultValue={f.q || ""}
              placeholder="Cari rujukan, ahli atau penuntut"
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
          <button className="btn-filter">Cari</button>
        </form>
        <section className="card member-list">
          <div className="list-summary">
            <div>
              <ClipboardCheck size={18} />
              <strong>{rows.length}</strong> tuntutan
            </div>
          </div>
          {error ? (
            <div className="error">{error.message}</div>
          ) : rows.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Rujukan</th>
                    <th>Ahli</th>
                    <th>Penuntut</th>
                    <th>Tarikh</th>
                    <th>Amaun</th>
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
                      <td>
                        {x.members?.full_name}
                        <br />
                        <small>{x.members?.member_no}</small>
                      </td>
                      <td>{x.claimant_name}</td>
                      <td>
                        {new Date(x.submitted_on).toLocaleDateString("ms-MY")}
                      </td>
                      <td>{money.format(Number(x.amount))}</td>
                      <td>
                        <span className={`pill claim-${x.status}`}>
                          {labels[x.status]}
                        </span>
                      </td>
                      <td>
                        <Link className="table-link" href={`/claims/${x.id}`}>
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
              Belum ada tuntutan atau tiada rekod sepadan.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
