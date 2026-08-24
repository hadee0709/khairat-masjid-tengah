import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveDependent } from "../actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; member?: string }>;
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
    .eq("status", "active")
    .order("full_name");
  return (
    <main className="module-page">
      <div className="module-wrap narrow-wrap">
        <Link className="back" href="/dependents">
          <ArrowLeft size={17} /> Senarai Tanggungan
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL TANGGUNGAN AHLI</p>
            <h1>Daftar Tanggungan</h1>
            <span>Daftar pasangan, anak, ibu bapa atau waris ahli.</span>
          </div>
          <UsersRound size={34} />
        </header>
        {p.error && <div className="error">{p.error}</div>}
        <form action={saveDependent} className="card dependent-form">
          <div className="field full-field">
            <label>Ahli utama *</label>
            <select name="member_id" defaultValue={p.member || ""} required>
              <option value="">Pilih ahli</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_no} — {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Nama penuh *</label>
            <input name="full_name" required />
          </div>
          <div className="field">
            <label>No. pengenalan</label>
            <input name="identification_no" />
          </div>
          <div className="field">
            <label>Hubungan *</label>
            <select name="relationship" defaultValue="child">
              <option value="spouse">Pasangan</option>
              <option value="child">Anak</option>
              <option value="parent">Ibu/Bapa</option>
              <option value="sibling">Adik-beradik</option>
              <option value="guardian">Penjaga</option>
              <option value="other">Lain-lain</option>
            </select>
          </div>
          <div className="field">
            <label>Tarikh lahir</label>
            <input name="date_of_birth" type="date" />
          </div>
          <div className="field">
            <label>Telefon</label>
            <input name="phone" />
          </div>
          <div className="field">
            <label>Status kelayakan</label>
            <select name="eligibility_status">
              <option value="eligible">Layak</option>
              <option value="pending">Dalam semakan</option>
              <option value="ineligible">Tidak layak</option>
            </select>
          </div>
          <div className="field full-field">
            <label>Catatan</label>
            <textarea name="notes" rows={3} />
          </div>
          <div className="form-actions full-field">
            <Link className="btn-secondary" href="/dependents">
              Batal
            </Link>
            <button className="btn-inline">Simpan Tanggungan</button>
          </div>
        </form>
      </div>
    </main>
  );
}
