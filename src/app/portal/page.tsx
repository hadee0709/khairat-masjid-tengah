import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  UsersRound,
  ReceiptText,
  ClipboardCheck,
  Download,
  MessageSquarePlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
const money = new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }),
  claimLabels: Record<string, string> = {
    submitted: "Dihantar",
    under_review: "Dalam semakan",
    approved: "Diluluskan",
    rejected: "Ditolak",
    paid: "Dibayar",
    cancelled: "Dibatalkan",
  },
  rel: Record<string, string> = {
    spouse: "Pasangan",
    child: "Anak",
    parent: "Ibu/Bapa",
    sibling: "Adik-beradik",
    guardian: "Penjaga",
    other: "Lain-lain",
  };
export default async function Page() {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: member } = await s
    .from("members")
    .select(
      "id,member_no,full_name,identification_no,phone,email,address,postcode,joined_on,status,areas(name),member_categories(name,annual_fee)",
    )
    .eq("linked_user_id", user.id)
    .single();
  if (!member)
    return (
      <main className="module-page">
        <div className="module-wrap narrow-wrap">
          <Link className="back" href="/">
            <ArrowLeft size={17} /> Dashboard
          </Link>
          <section className="card portal-unlinked">
            <UserRound size={48} />
            <h1>Akaun belum dipautkan</h1>
            <p>
              Akaun pengguna ini belum dipautkan kepada rekod ahli. Pentadbir
              perlu menetapkan <code>linked_user_id</code> pada rekod ahli yang
              betul sebelum portal boleh digunakan.
            </p>
            <Link className="btn-inline" href="/feedback/new">
              Hubungi Pentadbir
            </Link>
          </section>
        </div>
      </main>
    );
  const m: any = member;
  const [
    { data: dependents },
    { data: payments },
    { data: claims },
    { data: feedback },
  ] = await Promise.all([
    s
      .from("dependents")
      .select("id,full_name,relationship,date_of_birth,eligibility_status")
      .eq("member_id", m.id)
      .order("full_name"),
    s
      .from("payments")
      .select("id,receipt_no,fee_year,amount,paid_on,method,voided_at")
      .eq("member_id", m.id)
      .order("paid_on", { ascending: false }),
    s
      .from("claims")
      .select("id,reference_no,claimant_name,submitted_on,amount,status")
      .eq("member_id", m.id)
      .order("submitted_on", { ascending: false }),
    s
      .from("feedback")
      .select("id,reference_no,subject,status,created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false }),
  ]);
  const year = new Date().getFullYear(),
    paid = (payments || [])
      .filter((x) => x.fee_year === year && !x.voided_at)
      .reduce((n, x) => n + Number(x.amount), 0),
    annual = Number(m.member_categories?.annual_fee || 0),
    balance = Math.max(annual - paid, 0);
  return (
    <main className="module-page">
      <div className="module-wrap">
        <Link className="back" href="/">
          <ArrowLeft size={17} /> Dashboard
        </Link>
        <header className="module-head portal-head">
          <div>
            <p className="eyebrow">PORTAL LAYAN DIRI AHLI</p>
            <h1>Assalamualaikum, {m.full_name}</h1>
            <span>
              No. Ahli {m.member_no} · Status {m.status}
            </span>
          </div>
          <div className="portal-avatar">{m.full_name.charAt(0)}</div>
        </header>
        <section className="portal-stats">
          <div className="card">
            <ReceiptText />
            <small>Yuran {year}</small>
            <strong>{money.format(paid)}</strong>
            <span>{balance ? `Baki ${money.format(balance)}` : "Selesai"}</span>
          </div>
          <div className="card">
            <UsersRound />
            <small>Tanggungan</small>
            <strong>{dependents?.length || 0}</strong>
            <span>rekod berdaftar</span>
          </div>
          <div className="card">
            <ClipboardCheck />
            <small>Tuntutan</small>
            <strong>{claims?.length || 0}</strong>
            <span>jumlah permohonan</span>
          </div>
        </section>
        <section className="portal-grid">
          <div className="card">
            <div className="card-head">
              <h2>Profil Saya</h2>
            </div>
            <div className="profile-grid">
              <span>No. Pengenalan</span>
              <strong>{m.identification_no || "—"}</strong>
              <span>Telefon</span>
              <strong>{m.phone || "—"}</strong>
              <span>E-mel</span>
              <strong>{m.email || user.email || "—"}</strong>
              <span>Kawasan</span>
              <strong>{m.areas?.name || "—"}</strong>
              <span>Kategori</span>
              <strong>{m.member_categories?.name || "—"}</strong>
              <span>Tarikh menyertai</span>
              <strong>
                {new Date(m.joined_on).toLocaleDateString("ms-MY")}
              </strong>
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <h2>Tanggungan Saya</h2>
            </div>
            {dependents?.length ? (
              <div className="portal-list">
                {dependents.map((d: any) => (
                  <div key={d.id}>
                    <div>
                      <strong>{d.full_name}</strong>
                      <small>{rel[d.relationship] || d.relationship}</small>
                    </div>
                    <span className="pill">
                      {d.eligibility_status === "eligible"
                        ? "Layak"
                        : d.eligibility_status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">Tiada tanggungan berdaftar.</div>
            )}
          </div>
        </section>
        <section className="card portal-section">
          <div className="card-head">
            <h2>Sejarah Bayaran</h2>
          </div>
          {payments?.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Resit</th>
                    <th>Tarikh</th>
                    <th>Tahun</th>
                    <th>Kaedah</th>
                    <th>Jumlah</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((x: any) => (
                    <tr key={x.id}>
                      <td>
                        <strong>{x.receipt_no}</strong>
                      </td>
                      <td>{new Date(x.paid_on).toLocaleDateString("ms-MY")}</td>
                      <td>{x.fee_year}</td>
                      <td>{x.method.replaceAll("_", " ")}</td>
                      <td>{money.format(Number(x.amount))}</td>
                      <td>
                        {!x.voided_at && (
                          <Link
                            className="table-link"
                            href={`/payments/${x.id}/receipt`}
                          >
                            <Download size={14} /> Resit
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">Belum ada bayaran.</div>
          )}
        </section>
        <section className="portal-grid">
          <div className="card">
            <div className="card-head">
              <h2>Status Tuntutan</h2>
            </div>
            {claims?.length ? (
              <div className="portal-list">
                {claims.map((x: any) => (
                  <div key={x.id}>
                    <div>
                      <strong>{x.reference_no}</strong>
                      <small>
                        {x.claimant_name} · {money.format(Number(x.amount))}
                      </small>
                    </div>
                    <span className="pill">
                      {claimLabels[x.status] || x.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">Tiada tuntutan.</div>
            )}
          </div>
          <div className="card">
            <div className="card-head">
              <h2>Maklum Balas Saya</h2>
              <Link href="/feedback/new">
                <MessageSquarePlus size={18} />
              </Link>
            </div>
            {feedback?.length ? (
              <div className="portal-list">
                {feedback.map((x: any) => (
                  <Link href={`/feedback/${x.id}`} key={x.id}>
                    <div>
                      <strong>{x.subject}</strong>
                      <small>{x.reference_no}</small>
                    </div>
                    <span className="pill">
                      {x.status.replaceAll("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty">Tiada maklum balas.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
