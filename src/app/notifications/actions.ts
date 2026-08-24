"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const v = (f: FormData, k: string) => String(f.get(k) || "").trim();
async function context() {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await s
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return { s, user, role: p?.role || "member" };
}
export async function sendAnnouncement(f: FormData) {
  const { s, user, role } = await context();
  if (!["super_admin", "admin", "staff"].includes(role)) redirect("/");
  const title = v(f, "title"),
    message = v(f, "message"),
    memberId = v(f, "member_id");
  if (!title || !message)
    redirect("/notifications?error=Tajuk dan mesej diperlukan");
  let q = s
    .from("members")
    .select("id,linked_user_id")
    .not("linked_user_id", "is", null);
  if (memberId) q = q.eq("id", memberId);
  const { data: members } = await q,
    payload = (members || []).map((m) => ({
      user_id: m.linked_user_id,
      member_id: m.id,
      title,
      message,
      type: "announcement",
      created_by: user.id,
    }));
  if (!payload.length)
    redirect("/notifications?error=Tiada akaun ahli yang telah dipautkan");
  const { error } = await s.from("notifications").insert(payload);
  if (error)
    redirect(`/notifications?error=${encodeURIComponent(error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "announcement_sent",
      entity_type: "notification",
      details: { recipients: payload.length, title },
    });
  revalidatePath("/notifications");
  redirect(
    `/notifications?success=${encodeURIComponent(`${payload.length} notifikasi berjaya dijana.`)}`,
  );
}
export async function generatePaymentReminders() {
  const { s, user, role } = await context();
  if (!["super_admin", "admin", "staff"].includes(role)) redirect("/");
  const year = new Date().getFullYear(),
    [{ data: members }, { data: payments }] = await Promise.all([
      s
        .from("members")
        .select("id,linked_user_id,full_name,member_categories(annual_fee)")
        .eq("status", "active")
        .not("linked_user_id", "is", null),
      s
        .from("payments")
        .select("member_id,amount")
        .eq("fee_year", year)
        .is("voided_at", null),
    ]),
    paid = new Map<string, number>();
  for (const p of payments || [])
    paid.set(p.member_id, (paid.get(p.member_id) || 0) + Number(p.amount));
  const payload = (members || [])
    .map((m: any) => {
      const balance = Math.max(
        Number(m.member_categories?.annual_fee || 0) - (paid.get(m.id) || 0),
        0,
      );
      return { m, balance };
    })
    .filter((x) => x.balance > 0)
    .map(({ m, balance }) => ({
      user_id: m.linked_user_id,
      member_id: m.id,
      title: `Peringatan Yuran ${year}`,
      message: `Baki yuran khairat anda ialah RM ${balance.toFixed(2)}. Sila hubungi pihak pengurusan untuk urusan bayaran.`,
      type: "payment_reminder",
      link: "/portal",
      created_by: user.id,
    }));
  if (!payload.length)
    redirect(
      "/notifications?success=Tiada tunggakan bagi akaun ahli yang dipautkan",
    );
  const { error } = await s.from("notifications").insert(payload);
  if (error)
    redirect(`/notifications?error=${encodeURIComponent(error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "payment_reminders_generated",
      entity_type: "notification",
      details: { year, recipients: payload.length },
    });
  revalidatePath("/notifications");
  redirect(
    `/notifications?success=${encodeURIComponent(`${payload.length} peringatan tunggakan berjaya dijana.`)}`,
  );
}
export async function markAsRead(f: FormData) {
  const { s } = await context(),
    id = v(f, "id");
  if (id)
    await s
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  revalidatePath("/notifications");
  redirect("/notifications");
}
