import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { importMembers } from "./actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    skipped?: string;
    failed?: string;
  }>;
}) {
  const p = await searchParams,
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
  if (!profile || !["super_admin", "admin", "staff"].includes(profile.role))
    redirect("/");
  const done = p.imported !== undefined;
  return (
    <main className="module-page">
      <div className="module-wrap narrow-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL IMPORT DATA PUKAL</p>
            <h1>Import Senarai Ahli</h1>
            <span>Muat naik rekod ahli melalui fail CSV standard.</span>
          </div>
          <FileSpreadsheet size={34} />
        </header>
        {p.error && <div className="error">{p.error}</div>}
        {done && (
          <section className="import-results">
            <div className="card result-good">
              <CheckCircle2 />
              <strong>{p.imported}</strong>
              <span>Berjaya diimport</span>
            </div>
            <div className="card result-warn">
              <AlertTriangle />
              <strong>{p.skipped}</strong>
              <span>Dilangkau/pendua</span>
            </div>
            <div className="card result-bad">
              <AlertTriangle />
              <strong>{p.failed}</strong>
              <span>Gagal</span>
            </div>
          </section>
        )}
        <section className="card import-card">
          <div className="import-step">
            <span>1</span>
            <div>
              <h2>Muat turun templat</h2>
              <p>
                Gunakan struktur kolum yang disediakan. Jangan ubah nama tajuk
                kolum.
              </p>
              <a
                className="btn-secondary inline-button"
                href="/import/template"
              >
                <Download size={16} /> Muat Turun Templat CSV
              </a>
            </div>
          </div>
          <div className="import-step">
            <span>2</span>
            <div>
              <h2>Lengkapkan data</h2>
              <p>
                <strong>full_name</strong> wajib diisi. Nama kawasan dan
                kategori perlu sama dengan tetapan sistem. Tarikh menggunakan
                format YYYY-MM-DD.
              </p>
            </div>
          </div>
          <div className="import-step">
            <span>3</span>
            <div>
              <h2>Muat naik fail</h2>
              <p>
                Maksimum 500 baris dan 2 MB. Rekod dengan nombor pengenalan
                pendua akan dilangkau.
              </p>
              <form action={importMembers} className="import-form">
                <input
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                />
                <button className="btn-inline">
                  <Upload size={16} /> Import Ahli
                </button>
              </form>
            </div>
          </div>
        </section>
        <section className="card column-guide">
          <h2>Panduan kolum</h2>
          <div className="guide-grid">
            <code>full_name *</code>
            <span>Nama penuh ahli</span>
            <code>identification_no</code>
            <span>No. pengenalan unik</span>
            <code>area</code>
            <span>Nama kawasan kariah</span>
            <code>category</code>
            <span>Nama kategori ahli</span>
            <code>joined_on</code>
            <span>Tarikh YYYY-MM-DD</span>
            <code>status</code>
            <span>active, inactive, suspended atau deceased</span>
          </div>
        </section>
      </div>
    </main>
  );
}
