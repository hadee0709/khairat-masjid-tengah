import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileText,
  Wallet,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
const money = new Intl.NumberFormat("ms-MY", {
  style: "currency",
  currency: "MYR",
});
const months = [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogo",
  "Sep",
  "Okt",
  "Nov",
  "Dis",
];
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const f = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const year = Number(f.year || new Date().getFullYear());
  const start = `${year}-01-01`,
    end = `${year}-12-31`;
  const [
    { data: payments },
    { data: claims },
    { data: members },
    { data: categories },
  ] = await Promise.all([
    s
      .from("payments")
      .select("amount,paid_on,member_id")
      .is("voided_at", null)
      .gte("paid_on", start)
      .lte("paid_on", end),
    s
      .from("claims")
      .select("amount,status,submitted_on")
      .gte("submitted_on", start)
      .lte("submitted_on", end),
    s.from("members").select("id,status,category_id").eq("status", "active"),
    s.from("member_categories").select("id,name,annual_fee"),
  ]);
  const collected = (payments || []).reduce((n, x) => n + Number(x.amount), 0),
    approved = (claims || [])
      .filter((x) => ["approved", "paid"].includes(x.status))
      .reduce((n, x) => n + Number(x.amount), 0),
    expected = (members || []).reduce(
      (n, m) =>
        n +
        Number(
          categories?.find((c) => c.id === m.category_id)?.annual_fee || 0,
        ),
      0,
    ),
    outstanding = Math.max(expected - collected, 0),
    paidMembers = new Set((payments || []).map((x) => x.member_id)).size;
  const monthly = months.map((label, i) => ({
      label,
      collection: (payments || [])
        .filter((x) => new Date(x.paid_on).getMonth() === i)
        .reduce((n, x) => n + Number(x.amount), 0),
      claims: (claims || [])
        .filter(
          (x) =>
            new Date(x.submitted_on).getMonth() === i &&
            ["approved", "paid"].includes(x.status),
        )
        .reduce((n, x) => n + Number(x.amount), 0),
    })),
    max = Math.max(1, ...monthly.flatMap((x) => [x.collection, x.claims]));
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head">
          <div>
            <p className="eyebrow">MODUL LAPORAN & ANALITIK</p>
            <h1>Prestasi Tahunan</h1>
            <span>
              Ringkasan kutipan, tuntutan dan tunggakan berdasarkan data semasa.
            </span>
          </div>
          <BarChart3 size={34} />
        </header>
        <form className="report-filter">
          <label>Tahun laporan</label>
          <input
            name="year"
            type="number"
            min="2020"
            max="2100"
            defaultValue={year}
          />
          <button className="btn-filter">Papar</button>
          <a className="btn-secondary" href={`/reports/export?year=${year}`}>
            <Download size={16} /> Eksport CSV
          </a>
        </form>
        <section className="report-stats">
          <div className="card report-stat">
            <Wallet />
            <small>Kutipan diterima</small>
            <strong>{money.format(collected)}</strong>
          </div>
          <div className="card report-stat">
            <FileText />
            <small>Sasaran yuran</small>
            <strong>{money.format(expected)}</strong>
          </div>
          <div className="card report-stat warning">
            <ClipboardCheck />
            <small>Anggaran tunggakan</small>
            <strong>{money.format(outstanding)}</strong>
          </div>
          <div className="card report-stat">
            <Users />
            <small>Ahli telah membayar</small>
            <strong>
              {paidMembers} / {members?.length || 0}
            </strong>
          </div>
        </section>
        <section className="card report-chart">
          <div className="card-head">
            <h2>Kutipan dan tuntutan bulanan</h2>
            <span>{year}</span>
          </div>
          <div className="legend">
            <span>
              <i className="collection-key" />
              Kutipan
            </span>
            <span>
              <i className="claim-key" />
              Tuntutan diluluskan
            </span>
          </div>
          <div className="month-chart">
            {monthly.map((x) => (
              <div className="month-group" key={x.label}>
                <div className="month-bars">
                  <div
                    title={money.format(x.collection)}
                    className="report-bar collection-bar"
                    style={{
                      height: `${Math.max((x.collection / max) * 100, x.collection ? 4 : 0)}%`,
                    }}
                  />
                  <div
                    title={money.format(x.claims)}
                    className="report-bar claim-bar"
                    style={{
                      height: `${Math.max((x.claims / max) * 100, x.claims ? 4 : 0)}%`,
                    }}
                  />
                </div>
                <span>{x.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="report-grid">
          <div className="card">
            <div className="card-head">
              <h2>Status tuntutan</h2>
            </div>
            {[
              "submitted",
              "under_review",
              "approved",
              "rejected",
              "paid",
              "cancelled",
            ].map((st) => (
              <div className="report-row" key={st}>
                <span>
                  {
                    (
                      {
                        submitted: "Dihantar",
                        under_review: "Dalam semakan",
                        approved: "Diluluskan",
                        rejected: "Ditolak",
                        paid: "Dibayar",
                        cancelled: "Dibatalkan",
                      } as Record<string, string>
                    )[st]
                  }
                </span>
                <strong>
                  {(claims || []).filter((x) => x.status === st).length}
                </strong>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-head">
              <h2>Ringkasan kewangan</h2>
            </div>
            <div className="report-row">
              <span>Jumlah kutipan</span>
              <strong>{money.format(collected)}</strong>
            </div>
            <div className="report-row">
              <span>Tuntutan dilulus/dibayar</span>
              <strong>{money.format(approved)}</strong>
            </div>
            <div className="report-row total-row">
              <span>Baki bersih aktiviti</span>
              <strong>{money.format(collected - approved)}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
