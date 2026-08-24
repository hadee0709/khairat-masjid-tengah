import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Search, ShieldCheck, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
const actionLabels: Record<string, string> = {
  member_created: "Ahli didaftarkan",
  member_updated: "Ahli dikemas kini",
  payment_recorded: "Bayaran direkodkan",
  dependent_created: "Tanggungan didaftarkan",
  dependent_updated: "Tanggungan dikemas kini",
  claim_submitted: "Tuntutan dihantar",
  claim_under_review: "Tuntutan disemak",
  claim_approved: "Tuntutan diluluskan",
  claim_rejected: "Tuntutan ditolak",
  claim_paid: "Tuntutan dibayar",
  claim_cancelled: "Tuntutan dibatalkan",
  claim_document_uploaded: "Dokumen dimuat naik",
  feedback_created: "Maklum balas didaftarkan",
  feedback_updated: "Maklum balas dikemas kini",
  user_access_updated: "Akses pengguna diubah",
  area_created: "Kawasan ditambah",
  area_updated: "Kawasan dikemas kini",
  category_created: "Kategori ditambah",
  category_updated: "Kategori dikemas kini",
  organization_settings_updated: "Tetapan organisasi diubah",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    entity?: string;
    action?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const f = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await s
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["super_admin", "auditor"].includes(profile.role))
    redirect("/");
  let q = s
    .from("audit_logs")
    .select(
      "id,action,entity_type,entity_id,details,created_at,profiles:actor_id(full_name,role)",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (f.entity) q = q.eq("entity_type", f.entity);
  if (f.action) q = q.eq("action", f.action);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00`);
  if (f.to) q = q.lte("created_at", `${f.to}T23:59:59`);
  const { data, error } = await q,
    term = (f.q || "").toLowerCase(),
    rows = (data || []).filter(
      (x: any) =>
        !term ||
        x.action.toLowerCase().includes(term) ||
        x.entity_type.toLowerCase().includes(term) ||
        x.entity_id?.toLowerCase().includes(term) ||
        x.profiles?.full_name?.toLowerCase().includes(term),
    );
  const exportParams = new URLSearchParams(
    Object.entries(f).filter(([, v]) => v) as [string, string][],
  ).toString();
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL AUDIT TRAIL</p>
            <h1>Log Aktiviti Sistem</h1>
            <span>
              Rekod baca sahaja bagi tindakan pengguna dan perubahan data.
            </span>
          </div>
          <a className="btn-inline" href={`/audit/export?${exportParams}`}>
            <Download size={17} /> Eksport CSV
          </a>
        </header>
        <form className="audit-filter">
          <div className="search-field">
            <Search size={18} />
            <input
              name="q"
              defaultValue={f.q || ""}
              placeholder="Cari pengguna, tindakan atau ID rekod"
            />
          </div>
          <select name="entity" defaultValue={f.entity || ""}>
            <option value="">Semua modul</option>
            {[
              "member",
              "payment",
              "dependent",
              "claim",
              "claim_document",
              "feedback",
              "profile",
              "area",
              "member_category",
              "system_setting",
            ].map((x) => (
              <option key={x} value={x}>
                {x.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select name="action" defaultValue={f.action || ""}>
            <option value="">Semua tindakan</option>
            {Object.entries(actionLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <input name="from" type="date" defaultValue={f.from || ""} />
          <input name="to" type="date" defaultValue={f.to || ""} />
          <button className="btn-filter">Cari</button>
        </form>
        <section className="card member-list">
          <div className="list-summary">
            <div>
              <ShieldCheck size={18} />
              <strong>{rows.length}</strong> aktiviti
            </div>
            <small>Maksimum 300 rekod</small>
          </div>
          {error ? (
            <div className="error">{error.message}</div>
          ) : rows.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tarikh & Masa</th>
                    <th>Pengguna</th>
                    <th>Tindakan</th>
                    <th>Modul</th>
                    <th>ID Rekod</th>
                    <th>Butiran</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x: any) => (
                    <tr key={x.id}>
                      <td>{new Date(x.created_at).toLocaleString("ms-MY")}</td>
                      <td>
                        <strong>{x.profiles?.full_name || "Sistem"}</strong>
                        <br />
                        <small>{x.profiles?.role || "—"}</small>
                      </td>
                      <td>
                        {actionLabels[x.action] ||
                          x.action.replaceAll("_", " ")}
                      </td>
                      <td className="capitalize">
                        {x.entity_type.replaceAll("_", " ")}
                      </td>
                      <td>
                        <code>{x.entity_id || "—"}</code>
                      </td>
                      <td>
                        <details>
                          <summary>Lihat</summary>
                          <pre>{JSON.stringify(x.details || {}, null, 2)}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Tiada rekod audit sepadan.</div>
          )}
        </section>
      </div>
    </main>
  );
}
