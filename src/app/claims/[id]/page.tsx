import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateClaimStatus } from "../actions";
import { uploadClaimDocument } from "../documents/actions";
import { adminDelete } from "@/app/actions/admin-delete";
import { DeleteButton } from "@/app/components/delete-button";
const money = new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }),
  labels: Record<string, string> = {
    submitted: "Dihantar",
    under_review: "Dalam semakan",
    approved: "Diluluskan",
    rejected: "Ditolak",
    paid: "Dibayar",
    cancelled: "Dibatalkan",
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
  const [{ data: c }, { data: documents }] = await Promise.all([
    s
      .from("claims")
      .select(
        "*,members(member_no,full_name,phone),dependents(full_name,relationship)",
      )
      .eq("id", id)
      .single(),
    s
      .from("claim_documents")
      .select("id,file_name,mime_type,file_size,document_type,created_at")
      .eq("claim_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!c) notFound();
  return (
    <main className="module-page">
      <div className="module-wrap narrow-wrap">
        <Link className="back" href="/claims">
          <ArrowLeft size={17} /> Senarai Tuntutan
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">{c.reference_no}</p>
            <h1>Semakan Tuntutan</h1>
            <span>Butiran permohonan dan tindakan kelulusan.</span>
          </div>
          <ClipboardCheck size={34} />
        </header>
        {p.success && <div className="success">{p.success}</div>}
        {p.error && <div className="error">{p.error}</div>}
        <section className="card claim-detail">
          <div>
            <small>Ahli utama</small>
            <strong>{c.members?.full_name}</strong>
            <span>{c.members?.member_no}</span>
          </div>
          <div>
            <small>Penuntut</small>
            <strong>{c.claimant_name}</strong>
            <span>{c.dependents?.full_name || "Ahli utama"}</span>
          </div>
          <div>
            <small>Tarikh kejadian</small>
            <strong>
              {new Date(c.event_date).toLocaleDateString("ms-MY")}
            </strong>
          </div>
          <div>
            <small>Amaun</small>
            <strong>{money.format(Number(c.amount))}</strong>
          </div>
          <div>
            <small>Status semasa</small>
            <strong>{labels[c.status] || c.status}</strong>
          </div>
          <div className="full-field">
            <small>Catatan</small>
            <p>{c.notes || "Tiada catatan."}</p>
          </div>
        </section>
        <form action={updateClaimStatus} className="card status-form">
          <input type="hidden" name="id" value={id} />
          <label>Tindakan seterusnya</label>
          <select name="status" defaultValue={c.status}>
            <option value="under_review">Dalam semakan</option>
            <option value="approved">Luluskan</option>
            <option value="rejected">Tolak</option>
            <option value="paid">Tandakan dibayar</option>
            <option value="cancelled">Batalkan</option>
          </select>
          <button className="btn-inline">Kemas Kini Status</button>
        </form>
        <div className="danger-zone"><DeleteButton action={adminDelete} id={id} entity="claim" label="Padam tuntutan" message={`Padam tuntutan ${c.reference_no} secara kekal?`}/></div>
        <section className="card documents-card">
          <div className="card-head">
            <div>
              <h2>Dokumen & Lampiran</h2>
              <p>PDF atau imej, maksimum 10 MB setiap fail.</p>
            </div>
            <span>{documents?.length || 0} fail</span>
          </div>
          <form action={uploadClaimDocument} className="document-upload">
            <input type="hidden" name="claim_id" value={id} />
            <select name="document_type" defaultValue="supporting">
              <option value="death_certificate">Sijil berkaitan</option>
              <option value="identification">Dokumen pengenalan</option>
              <option value="payment_proof">Bukti bayaran</option>
              <option value="application_form">Borang permohonan</option>
              <option value="supporting">Dokumen sokongan</option>
              <option value="other">Lain-lain</option>
            </select>
            <input
              name="file"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              required
            />
            <button className="btn-inline">Muat Naik</button>
          </form>
          {documents?.length ? (
            <div className="document-list">
              {documents.map((d: any) => (
                <a
                  key={d.id}
                  href={`/claims/documents/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div>
                    <strong>{d.file_name}</strong>
                    <small>
                      {d.document_type.replaceAll("_", " ")} ·{" "}
                      {(Number(d.file_size) / 1024).toFixed(1)} KB
                    </small>
                  </div>
                  <span>Lihat / Muat Turun</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="empty">Belum ada dokumen dilampirkan.</div>
          )}
        </section>
      </div>
    </main>
  );
}
