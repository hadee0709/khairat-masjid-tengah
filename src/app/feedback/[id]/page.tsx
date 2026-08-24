import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateFeedback } from "../actions";
const labels: Record<string, string> = {
  new: "Baharu",
  in_progress: "Dalam tindakan",
  resolved: "Selesai",
  closed: "Ditutup",
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params,
    p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: f }, { data: staff }] = await Promise.all([
    s
      .from("feedback")
      .select("*,members(member_no,full_name),profiles:assigned_to(full_name)")
      .eq("id", id)
      .single(),
    s
      .from("profiles")
      .select("id,full_name,role")
      .eq("active", true)
      .in("role", ["super_admin", "admin", "staff"])
      .order("full_name"),
  ]);
  if (!f) notFound();
  return (
    <main className="module-page">
      <div className="module-wrap narrow-wrap">
        <Link className="back" href="/feedback">
          <ArrowLeft size={17} /> Senarai Kes
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">{f.reference_no}</p>
            <h1>{f.subject}</h1>
            <span>
              {f.category} · {labels[f.status]}
            </span>
          </div>
          <MessageSquare size={34} />
        </header>
        {p.success && <div className="success">{p.success}</div>}
        {p.error && <div className="error">{p.error}</div>}
        <section className="card feedback-detail">
          <div>
            <small>Ahli berkaitan</small>
            <strong>{f.members?.full_name || "Umum"}</strong>
            <span>{f.members?.member_no || "—"}</span>
          </div>
          <div>
            <small>Tarikh diterima</small>
            <strong>
              {new Date(f.created_at).toLocaleDateString("ms-MY")}
            </strong>
          </div>
          <div className="full-field">
            <small>Penerangan</small>
            <p>{f.message}</p>
          </div>
        </section>
        <form action={updateFeedback} className="card feedback-action">
          <input type="hidden" name="id" value={id} />
          <div className="field">
            <label>Pegawai bertanggungjawab</label>
            <select name="assigned_to" defaultValue={f.assigned_to || ""}>
              <option value="">Belum diagih</option>
              {staff?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.full_name} ({x.role})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={f.status}>
              {Object.entries(labels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field full-field">
            <label>Penyelesaian / tindakan</label>
            <textarea
              name="resolution"
              rows={5}
              defaultValue={f.resolution || ""}
            />
          </div>
          <div className="form-actions full-field">
            <button className="btn-inline">Kemas Kini Kes</button>
          </div>
        </form>
      </div>
    </main>
  );
}
