import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createClaim } from "../actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: members }, { data: dependents }] = await Promise.all([
    s
      .from("members")
      .select("id,member_no,full_name")
      .in("status", ["active", "deceased"])
      .order("full_name"),
    s
      .from("dependents")
      .select("id,member_id,full_name,relationship")
      .order("full_name"),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="module-page">
      <div className="module-wrap narrow-wrap">
        <Link className="back" href="/claims">
          <ArrowLeft size={17} /> Senarai Tuntutan
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL TUNTUTAN KHAIRAT</p>
            <h1>Daftar Tuntutan</h1>
            <span>
              Rekod permohonan bantuan khairat untuk semakan dan kelulusan.
            </span>
          </div>
          <FilePlus2 size={34} />
        </header>
        {p.error && <div className="error">{p.error}</div>}
        <form action={createClaim} className="card claim-form">
          <div className="field full-field">
            <label>Ahli utama *</label>
            <select name="member_id" required>
              <option value="">Pilih ahli</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_no} — {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field full-field">
            <label>Tanggungan berkaitan</label>
            <select name="dependent_id">
              <option value="">Tuntutan untuk ahli utama</option>
              {dependents?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} ({d.relationship})
                </option>
              ))}
            </select>
            <small>Pilih jika tuntutan melibatkan tanggungan.</small>
          </div>
          <div className="field">
            <label>Nama penerima/penuntut *</label>
            <input name="claimant_name" required />
          </div>
          <div className="field">
            <label>Tarikh kejadian *</label>
            <input name="event_date" type="date" required />
          </div>
          <div className="field">
            <label>Tarikh permohonan *</label>
            <input
              name="submitted_on"
              type="date"
              defaultValue={today}
              required
            />
          </div>
          <div className="field">
            <label>Amaun dimohon (RM)</label>
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
            />
          </div>
          <div className="field full-field">
            <label>Catatan permohonan</label>
            <textarea name="notes" rows={4} />
          </div>
          <div className="form-actions full-field">
            <Link className="btn-secondary" href="/claims">
              Batal
            </Link>
            <button className="btn-inline">Hantar Tuntutan</button>
          </div>
        </form>
      </div>
    </main>
  );
}
