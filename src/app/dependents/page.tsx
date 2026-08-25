import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Search, UserPlus, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { adminDelete } from "@/app/actions/admin-delete";
import { DeleteButton } from "@/app/components/delete-button";
const rel: Record<string, string> = {
    spouse: "Pasangan",
    child: "Anak",
    parent: "Ibu/Bapa",
    sibling: "Adik-beradik",
    guardian: "Penjaga",
    other: "Lain-lain",
  },
  status: Record<string, string> = {
    eligible: "Layak",
    pending: "Dalam semakan",
    ineligible: "Tidak layak",
  };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    relationship?: string;
    eligibility?: string;
    success?: string;
  }>;
}) {
  const f = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  let q = s
    .from("dependents")
    .select(
      "id,full_name,identification_no,relationship,date_of_birth,phone,eligibility_status,members(member_no,full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (f.relationship) q = q.eq("relationship", f.relationship);
  if (f.eligibility) q = q.eq("eligibility_status", f.eligibility);
  const { data, error } = await q,
    term = (f.q || "").toLowerCase(),
    rows = (data || []).filter(
      (x: any) =>
        !term ||
        x.full_name.toLowerCase().includes(term) ||
        x.identification_no?.toLowerCase().includes(term) ||
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
            <p className="eyebrow">MODUL TANGGUNGAN AHLI</p>
            <h1>Direktori Tanggungan</h1>
            <span>
              Urus pasangan, anak dan waris yang bernaung di bawah ahli.
            </span>
          </div>
          <Link className="btn-inline" href="/dependents/new">
            <UserPlus size={18} /> Daftar Tanggungan
          </Link>
        </header>
        {f.success && <div className="success">{f.success}</div>}
        <form className="filter-card">
          <div className="search-field">
            <Search size={18} />
            <input
              name="q"
              defaultValue={f.q || ""}
              placeholder="Cari tanggungan atau ahli utama"
            />
          </div>
          <select name="relationship" defaultValue={f.relationship || ""}>
            <option value="">Semua hubungan</option>
            {Object.entries(rel).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select name="eligibility" defaultValue={f.eligibility || ""}>
            <option value="">Semua kelayakan</option>
            {Object.entries(status).map(([v, l]) => (
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
              <UsersRound size={18} />
              <strong>{rows.length}</strong> tanggungan
            </div>
          </div>
          {error ? (
            <div className="error">{error.message}</div>
          ) : rows.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Ahli utama</th>
                    <th>Hubungan</th>
                    <th>Tarikh lahir</th>
                    <th>Telefon</th>
                    <th>Kelayakan</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x: any) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.full_name}</strong>
                        <br />
                        <small>{x.identification_no || "—"}</small>
                      </td>
                      <td>
                        {x.members?.full_name}
                        <br />
                        <small>{x.members?.member_no}</small>
                      </td>
                      <td>{rel[x.relationship]}</td>
                      <td>
                        {x.date_of_birth
                          ? new Date(x.date_of_birth).toLocaleDateString(
                              "ms-MY",
                            )
                          : "—"}
                      </td>
                      <td>{x.phone || "—"}</td>
                      <td>
                        <span className="pill">
                          {status[x.eligibility_status]}
                        </span>
                      </td>
                      <td><DeleteButton action={adminDelete} id={x.id} entity="dependent" label="Padam" message={`Padam tanggungan ${x.full_name}?`}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">
              Belum ada tanggungan atau tiada rekod sepadan.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
