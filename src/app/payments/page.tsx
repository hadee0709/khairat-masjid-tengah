import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeDollarSign,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { adminDelete } from "@/app/actions/admin-delete";
import { DeleteButton } from "@/app/components/delete-button";
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
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    year?: string;
    method?: string;
    status?: string;
    success?: string;
  }>;
}) {
  const f = await searchParams,
    s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const year = Number(f.year || new Date().getFullYear());
  let q = s
    .from("payments")
    .select(
      "id,receipt_no,fee_year,amount,paid_on,method,reference_no,voided_at,members(id,member_no,full_name)",
    )
    .eq("fee_year", year)
    .order("created_at", { ascending: false })
    .limit(200);
  if (f.method) q = q.eq("method", f.method);
  if ((f.status || "valid") === "valid") q = q.is("voided_at", null);
  if (f.status === "void") q = q.not("voided_at", "is", null);
  const { data, error } = await q,
    term = (f.q || "").toLowerCase(),
    rows = (data || []).filter(
      (x: any) =>
        !term ||
        x.receipt_no.toLowerCase().includes(term) ||
        x.members?.full_name?.toLowerCase().includes(term) ||
        x.members?.member_no?.toLowerCase().includes(term),
    ),
    valid = rows.filter((x: any) => !x.voided_at),
    total = valid.reduce((n: number, x: any) => n + Number(x.amount), 0),
    memberCount = new Set(valid.map((x: any) => x.members?.id)).size;
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL YURAN & BAYARAN</p>
            <h1>Ledger Kutipan</h1>
            <span>Rekod, semak dan jejak transaksi yuran ahli.</span>
          </div>
          <Link className="btn-inline" href="/payments/new">
            <BadgeDollarSign size={18} /> Rekod Bayaran
          </Link>
        </header>
        {f.success && <div className="success">{f.success}</div>}
        <section className="payment-stats">
          <div className="card mini-stat">
            <Wallet />
            <div>
              <small>Jumlah kutipan {year}</small>
              <strong>{money.format(total)}</strong>
            </div>
          </div>
          <div className="card mini-stat">
            <ReceiptText />
            <div>
              <small>Transaksi sah</small>
              <strong>{valid.length}</strong>
            </div>
          </div>
          <div className="card mini-stat">
            <BadgeDollarSign />
            <div>
              <small>Ahli membayar</small>
              <strong>{memberCount}</strong>
            </div>
          </div>
        </section>
        <form className="filter-card">
          <div className="search-field">
            <Search size={18} />
            <input
              name="q"
              defaultValue={f.q || ""}
              placeholder="Cari resit, nama atau nombor ahli"
            />
          </div>
          <input
            className="year-filter"
            name="year"
            type="number"
            defaultValue={year}
          />
          <select name="method" defaultValue={f.method || ""}>
            <option value="">Semua kaedah</option>
            {Object.entries(methods).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={f.status || "valid"}>
            <option value="valid">Transaksi sah</option>
            <option value="void">Dibatalkan</option>
            <option value="">Semua status</option>
          </select>
          <button className="btn-filter">Cari</button>
        </form>
        <section className="card member-list">
          {error ? (
            <div className="error">{error.message}</div>
          ) : rows.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Resit</th>
                    <th>Ahli</th>
                    <th>Tarikh</th>
                    <th>Tahun</th>
                    <th>Kaedah</th>
                    <th>Rujukan</th>
                    <th>Jumlah</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((x: any) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.receipt_no}</strong>
                      </td>
                      <td>
                        {x.members?.full_name || "—"}
                        <br />
                        <small>{x.members?.member_no || "—"}</small>
                      </td>
                      <td>{new Date(x.paid_on).toLocaleDateString("ms-MY")}</td>
                      <td>{x.fee_year}</td>
                      <td>{methods[x.method] || x.method}</td>
                      <td>{x.reference_no || "—"}</td>
                      <td>
                        <strong>{money.format(Number(x.amount))}</strong>
                      </td>
                      <td>
                        <span
                          className={`pill ${x.voided_at ? "status-inactive" : ""}`}
                        >
                          {x.voided_at ? "Dibatalkan" : "Diterima"}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="table-link"
                          href={`/payments/${x.id}/receipt`}
                        >
                          Resit
                        </Link>
                        <DeleteButton action={adminDelete} id={x.id} entity="payment" label="Padam" message={`Padam transaksi ${x.receipt_no} secara kekal?`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Tiada transaksi sepadan dengan carian.</div>
          )}
        </section>
      </div>
    </main>
  );
}
