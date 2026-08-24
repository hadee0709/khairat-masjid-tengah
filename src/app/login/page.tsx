import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authenticate } from "./actions";

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="login-page">
      <section className="login-art">
        <div>
          <div className="mark">خ</div>
          <h1>Urus khairat dengan lebih teratur dan telus.</h1>
          <p>Satu pusat maklumat untuk keahlian, kutipan yuran, resit dan perkhidmatan ahli Kariah Masjid Tengah.</p>
        </div>
        <small>Persatuan Khairat Kematian Kariah Masjid Tengah</small>
      </section>
      <section className="login-box">
        <form className="form" action={authenticate}>
          <h2>Selamat kembali</h2>
          <p>Log masuk menggunakan akaun yang telah didaftarkan oleh pentadbir sistem.</p>
          {q.error && <div className="error" role="alert">{q.error}</div>}
          <div className="field">
            <label htmlFor="email">Alamat e-mel</label>
            <input id="email" type="email" name="email" required autoComplete="email" autoFocus placeholder="nama@email.com" />
          </div>
          <div className="field">
            <label htmlFor="password">Kata laluan</label>
            <input id="password" type="password" name="password" required autoComplete="current-password" placeholder="Masukkan kata laluan" />
          </div>
          <button className="btn" type="submit">Log Masuk</button>
          <p className="login-help">Hubungi pentadbir sistem jika anda terlupa kata laluan atau memerlukan akaun baharu.</p>
        </form>
      </section>
    </main>
  );
}
