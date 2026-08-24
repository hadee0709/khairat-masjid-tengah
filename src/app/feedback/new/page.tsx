import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createFeedback } from "../actions";
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
  const { data: members } = await s
    .from("members")
    .select("id,member_no,full_name")
    .order("full_name");
  return (
    <main className="module-page">
      <div className="module-wrap narrow-wrap">
        <Link className="back" href="/feedback">
          <ArrowLeft size={17} /> Senarai Maklum Balas
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL MAKLUM BALAS & ADUAN</p>
            <h1>Daftar Maklum Balas</h1>
            <span>Rekod pertanyaan, cadangan atau aduan untuk tindakan.</span>
          </div>
          <MessageSquarePlus size={34} />
        </header>
        {p.error && <div className="error">{p.error}</div>}
        <form action={createFeedback} className="card feedback-form">
          <div className="field">
            <label>Kategori *</label>
            <select name="category" required>
              <option value="">Pilih kategori</option>
              <option value="pertanyaan">Pertanyaan</option>
              <option value="aduan">Aduan</option>
              <option value="cadangan">Cadangan</option>
              <option value="bayaran">Bayaran</option>
              <option value="keahlian">Keahlian</option>
              <option value="tuntutan">Tuntutan</option>
              <option value="lain-lain">Lain-lain</option>
            </select>
          </div>
          <div className="field">
            <label>Ahli berkaitan</label>
            <select name="member_id">
              <option value="">Tiada / umum</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_no} — {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field full-field">
            <label>Tajuk *</label>
            <input name="subject" required />
          </div>
          <div className="field full-field">
            <label>Penerangan *</label>
            <textarea name="message" rows={7} required />
          </div>
          <div className="form-actions full-field">
            <Link className="btn-secondary" href="/feedback">
              Batal
            </Link>
            <button className="btn-inline">Hantar</button>
          </div>
        </form>
      </div>
    </main>
  );
}
