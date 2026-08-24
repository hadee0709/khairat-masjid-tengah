import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { updateClaimStatus } from "../actions";
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
  const { data: c } = await s
    .from("claims")
    .select(
      "*,members(member_no,full_name,phone),dependents(full_name,relationship)",
    )
    .eq("id", id)
    .single();
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
      </div>
    </main>
  );
}
