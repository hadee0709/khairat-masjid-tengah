import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeDollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { recordPayment } from "../actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; member?: string }>;
}) {
  const p = await searchParams,
    s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: members } = await s
      .from("members")
      .select("id,member_no,full_name,member_categories(annual_fee)")
      .eq("status", "active")
      .order("full_name"),
    today = new Date().toISOString().slice(0, 10),
    year = new Date().getFullYear();
  return (
    <main className="module-page">
      <div className="module-wrap narrow-wrap">
        <Link className="back" href="/payments">
          <ArrowLeft size={17} /> Senarai Bayaran
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL YURAN & BAYARAN</p>
            <h1>Rekod Bayaran</h1>
            <span>Daftarkan kutipan yuran ahli dan jana nombor resit.</span>
          </div>
          <BadgeDollarSign size={34} />
        </header>
        {p.error && <div className="error">{p.error}</div>}
        <form action={recordPayment} className="card payment-form">
          <div className="field full-field">
            <label>Ahli *</label>
            <select name="member_id" defaultValue={p.member || ""} required>
              <option value="">Pilih ahli</option>
              {members?.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.member_no} — {m.full_name} (Yuran RM{" "}
                  {Number(m.member_categories?.annual_fee || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tahun yuran *</label>
            <input
              name="fee_year"
              type="number"
              min="2020"
              max="2100"
              defaultValue={year}
              required
            />
          </div>
          <div className="field">
            <label>Jumlah (RM) *</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
          </div>
          <div className="field">
            <label>Tarikh bayaran *</label>
            <input name="paid_on" type="date" defaultValue={today} required />
          </div>
          <div className="field">
            <label>Kaedah *</label>
            <select name="method" defaultValue="cash">
              <option value="cash">Tunai</option>
              <option value="bank_transfer">Pindahan bank</option>
              <option value="qr">QR</option>
              <option value="card">Kad</option>
              <option value="other">Lain-lain</option>
            </select>
          </div>
          <div className="field full-field">
            <label>No. rujukan</label>
            <input name="reference_no" />
          </div>
          <div className="field full-field">
            <label>Catatan</label>
            <textarea name="notes" rows={3} />
          </div>
          <div className="form-actions full-field">
            <Link className="btn-secondary" href="/payments">
              Batal
            </Link>
            <button className="btn-inline">Simpan Bayaran</button>
          </div>
        </form>
      </div>
    </main>
  );
}
