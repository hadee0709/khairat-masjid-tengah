import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "./print-button";
const money = new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }),
  methods: Record<string, string> = {
    cash: "Tunai",
    bank_transfer: "Pindahan bank",
    qr: "QR",
    card: "Kad",
    other: "Lain-lain",
  };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: p }, { data: settings }] = await Promise.all([
    s
      .from("payments")
      .select(
        "id,receipt_no,fee_year,amount,paid_on,method,reference_no,notes,voided_at,void_reason,created_at,members(member_no,full_name,identification_no,phone,address),profiles:received_by(full_name)",
      )
      .eq("id", id)
      .single(),
    s
      .from("system_settings")
      .select("key,value")
      .in("key", ["organization", "receipt"]),
  ]);
  if (!p) notFound();
  const member: any = p.members;
  const receiver: any = p.profiles;
  const org: any = settings?.find((x) => x.key === "organization")?.value || {},
    receipt: any = settings?.find((x) => x.key === "receipt")?.value || {};
  return (
    <main className="receipt-page">
      <div className="receipt-actions">
        <Link className="back" href="/payments">
          <ArrowLeft size={17} /> Ledger Bayaran
        </Link>
        <PrintButton />
      </div>
      <article
        className={`digital-receipt ${p.voided_at ? "void-receipt" : ""}`}
      >
        {p.voided_at && <div className="void-mark">DIBATALKAN</div>}
        <header className="receipt-head">
          <div className="receipt-logo">خ</div>
          <div>
            <h1>
              {org.name || "Persatuan Khairat Kematian Kariah Masjid Tengah"}
            </h1>
            <p>{org.short_name || "Khairat Masjid Tengah"}</p>
          </div>
          <div className="receipt-type">
            <strong>RESIT RASMI</strong>
            <span>{p.receipt_no}</span>
          </div>
        </header>
        <section className="receipt-info">
          <div>
            <small>Diterima daripada</small>
            <strong>{member?.full_name}</strong>
            <span>No. Ahli: {member?.member_no}</span>
            <span>No. Pengenalan: {member?.identification_no || "—"}</span>
          </div>
          <div>
            <small>Tarikh bayaran</small>
            <strong>
              {new Date(p.paid_on).toLocaleDateString("ms-MY", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
            <span>Tahun yuran: {p.fee_year}</span>
          </div>
        </section>
        <table className="receipt-table">
          <thead>
            <tr>
              <th>Butiran</th>
              <th>Kaedah</th>
              <th>Rujukan</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bayaran yuran khairat bagi tahun {p.fee_year}</td>
              <td>{methods[p.method] || p.method}</td>
              <td>{p.reference_no || "—"}</td>
              <td>{money.format(Number(p.amount))}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Jumlah Diterima</td>
              <td>{money.format(Number(p.amount))}</td>
            </tr>
          </tfoot>
        </table>
        {p.notes && (
          <section className="receipt-notes">
            <small>Catatan</small>
            <p>{p.notes}</p>
          </section>
        )}
        <footer className="receipt-footer">
          <div>
            <span>Diterima oleh</span>
            <strong>{receiver?.full_name || "Pentadbir Sistem"}</strong>
          </div>
          <div>
            <span>Tarikh dijana</span>
            <strong>{new Date().toLocaleDateString("ms-MY")}</strong>
          </div>
          <p>
            {receipt.footer ||
              "Resit ini dijana oleh komputer dan tidak memerlukan tandatangan."}
          </p>
        </footer>
      </article>
    </main>
  );
}
