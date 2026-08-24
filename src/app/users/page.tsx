import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck, Users, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateUser } from "./actions";
const roles: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Pentadbir",
  treasurer: "Bendahari",
  staff: "Kakitangan",
  auditor: "Juruaudit",
  member: "Ahli",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const f = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: actor } = await s
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!actor || !["super_admin", "admin"].includes(actor.role)) redirect("/");
  let q = s
    .from("profiles")
    .select("id,full_name,role,active,created_at")
    .order("full_name");
  if (f.role) q = q.eq("role", f.role);
  if (f.status) q = q.eq("active", f.status === "active");
  const { data, error } = await q,
    term = (f.q || "").toLowerCase(),
    rows = (data || []).filter(
      (x) => !term || x.full_name.toLowerCase().includes(term),
    );
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL PENGGUNA & PERANAN</p>
            <h1>Kawalan Akses</h1>
            <span>Urus nama, peranan dan status pengguna berdaftar.</span>
          </div>
          <ShieldCheck size={34} />
        </header>
        {f.success && <div className="success">{f.success}</div>}
        {f.error && <div className="error">{f.error}</div>}
        <form className="filter-card">
          <div className="search-field">
            <Search size={18} />
            <input
              name="q"
              defaultValue={f.q || ""}
              placeholder="Cari nama pengguna"
            />
          </div>
          <select name="role" defaultValue={f.role || ""}>
            <option value="">Semua peranan</option>
            {Object.entries(roles).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={f.status || ""}>
            <option value="">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak aktif</option>
          </select>
          <button className="btn-filter">Cari</button>
        </form>
        <section className="card user-list">
          <div className="list-summary">
            <div>
              <Users size={18} />
              <strong>{rows.length}</strong> pengguna
            </div>
            <small>
              Akaun baharu didaftarkan melalui Supabase Authentication
            </small>
          </div>
          {error ? (
            <div className="error">{error.message}</div>
          ) : rows.length ? (
            <div className="user-cards">
              {rows.map((x) => (
                <form action={updateUser} className="user-card" key={x.id}>
                  <input type="hidden" name="id" value={x.id} />
                  <div className="user-avatar">
                    {x.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="field">
                    <label>Nama pengguna</label>
                    <input
                      name="full_name"
                      defaultValue={x.full_name}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Peranan</label>
                    <select name="role" defaultValue={x.role}>
                      {Object.entries(roles)
                        .filter(
                          ([v]) =>
                            actor.role === "super_admin" || v !== "super_admin",
                        )
                        .map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select name="active" defaultValue={String(x.active)}>
                      <option value="true">Aktif</option>
                      <option value="false">Tidak aktif</option>
                    </select>
                  </div>
                  <button className="btn-filter">Simpan</button>
                  <div className="user-meta">
                    <span
                      className={`pill ${x.active ? "" : "status-inactive"}`}
                    >
                      {x.active ? "Aktif" : "Tidak aktif"}
                    </span>
                    {x.id === user.id && <small>Akaun anda</small>}
                  </div>
                </form>
              ))}
            </div>
          ) : (
            <div className="empty">Tiada pengguna sepadan.</div>
          )}
        </section>
      </div>
    </main>
  );
}
