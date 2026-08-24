import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MapPin, Tags, Settings, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { saveArea, saveCategory, saveOrganization } from "./actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
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
  if (!profile || !["super_admin", "admin"].includes(profile.role))
    redirect("/");
  const [{ data: areas }, { data: categories }, { data: settings }] =
    await Promise.all([
      s.from("areas").select("id,name,active").order("name"),
      s
        .from("member_categories")
        .select("id,name,annual_fee,active")
        .order("name"),
      s.from("system_settings").select("key,value"),
    ]);
  const org: any = settings?.find((x) => x.key === "organization")?.value || {};
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL KONFIGURASI SISTEM</p>
            <h1>Tetapan Utama</h1>
            <span>Urus kawasan, kategori ahli dan kadar yuran persatuan.</span>
          </div>
          <Settings size={34} />
        </header>
        {p.success && <div className="success">{p.success}</div>}
        {p.error && <div className="error">{p.error}</div>}
        {profile.role === "super_admin" && (
          <section className="card config-section">
            <div className="config-title">
              <Building2 />
              <div>
                <h2>Identiti Organisasi</h2>
                <p>Nama rasmi yang digunakan dalam sistem dan laporan.</p>
              </div>
            </div>
            <form action={saveOrganization} className="config-form">
              <div className="field">
                <label>Nama rasmi</label>
                <input name="name" defaultValue={org.name || ""} required />
              </div>
              <div className="field">
                <label>Nama ringkas</label>
                <input
                  name="short_name"
                  defaultValue={org.short_name || ""}
                  required
                />
              </div>
              <button className="btn-filter">Simpan</button>
            </form>
          </section>
        )}
        <div className="config-grid">
          <section className="card config-section">
            <div className="config-title">
              <MapPin />
              <div>
                <h2>Kawasan Kariah</h2>
                <p>Kawasan pilihan dalam pendaftaran ahli.</p>
              </div>
            </div>
            <form action={saveArea} className="config-form new-row">
              <div className="field">
                <label>Kawasan baharu</label>
                <input name="name" required />
              </div>
              <input type="hidden" name="active" value="true" />
              <button className="btn-filter">Tambah</button>
            </form>
            <div className="config-list">
              {areas?.map((x) => (
                <form action={saveArea} className="config-row" key={x.id}>
                  <input type="hidden" name="id" value={x.id} />
                  <input name="name" defaultValue={x.name} />
                  <select name="active" defaultValue={String(x.active)}>
                    <option value="true">Aktif</option>
                    <option value="false">Tidak aktif</option>
                  </select>
                  <button>Simpan</button>
                </form>
              ))}
            </div>
          </section>
          <section className="card config-section">
            <div className="config-title">
              <Tags />
              <div>
                <h2>Kategori & Yuran</h2>
                <p>Tentukan kategori ahli dan kadar tahunan.</p>
              </div>
            </div>
            <form action={saveCategory} className="config-form new-category">
              <div className="field">
                <label>Kategori baharu</label>
                <input name="name" required />
              </div>
              <div className="field">
                <label>Yuran (RM)</label>
                <input
                  name="annual_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <input type="hidden" name="active" value="true" />
              <button className="btn-filter">Tambah</button>
            </form>
            <div className="config-list">
              {categories?.map((x) => (
                <form
                  action={saveCategory}
                  className="config-row category-row"
                  key={x.id}
                >
                  <input type="hidden" name="id" value={x.id} />
                  <input name="name" defaultValue={x.name} />
                  <input
                    name="annual_fee"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={Number(x.annual_fee)}
                  />
                  <select name="active" defaultValue={String(x.active)}>
                    <option value="true">Aktif</option>
                    <option value="false">Tidak aktif</option>
                  </select>
                  <button>Simpan</button>
                </form>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
