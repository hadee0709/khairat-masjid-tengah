"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const v = (f: FormData, k: string) => String(f.get(k) || "").trim();
const o = (f: FormData, k: string) => v(f, k) || null;
export async function createClaim(f: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const member_id = v(f, "member_id"),
    claimant_name = v(f, "claimant_name"),
    event_date = v(f, "event_date"),
    amount = Number(v(f, "amount") || 0);
  if (!member_id || !claimant_name || !event_date || amount < 0)
    redirect(
      `/claims/new?error=${encodeURIComponent("Sila lengkapkan maklumat tuntutan.")}`,
    );
  const reference_no = `KMT-TK-${new Date().toISOString().replace(/\D/g, "").slice(2, 14)}`;
  const { data, error } = await s
    .from("claims")
    .insert({
      reference_no,
      member_id,
      dependent_id: o(f, "dependent_id"),
      claimant_name,
      event_date,
      submitted_on:
        v(f, "submitted_on") || new Date().toISOString().slice(0, 10),
      amount,
      status: "submitted",
      notes: o(f, "notes"),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) redirect(`/claims/new?error=${encodeURIComponent(error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "claim_submitted",
      entity_type: "claim",
      entity_id: data.id,
      details: { reference_no, amount },
    });
  revalidatePath("/claims");
  redirect(
    `/claims/${data.id}?success=${encodeURIComponent("Tuntutan berjaya didaftarkan.")}`,
  );
}
export async function updateClaimStatus(f: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const id = v(f, "id"),
    status = v(f, "status"),
    allowed = ["under_review", "approved", "rejected", "paid", "cancelled"];
  if (!id || !allowed.includes(status)) redirect("/claims");
  const payload: any = { status, updated_at: new Date().toISOString() };
  if (["approved", "rejected"].includes(status)) {
    payload.reviewed_by = user.id;
    payload.reviewed_at = new Date().toISOString();
  }
  const { error } = await s.from("claims").update(payload).eq("id", id);
  if (error)
    redirect(`/claims/${id}?error=${encodeURIComponent(error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: `claim_${status}`,
      entity_type: "claim",
      entity_id: id,
    });
  revalidatePath("/claims");
  revalidatePath(`/claims/${id}`);
  redirect(
    `/claims/${id}?success=${encodeURIComponent("Status tuntutan berjaya dikemas kini.")}`,
  );
}
