"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const value = (f: FormData, k: string) => String(f.get(k) || "").trim();
const optional = (f: FormData, k: string) => value(f, k) || null;
export async function recordPayment(f: FormData) {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect("/login");
  const member_id = value(f, "member_id"),
    amount = Number(value(f, "amount")),
    fee_year = Number(value(f, "fee_year")),
    paid_on = value(f, "paid_on"),
    method = value(f, "method");
  if (
    !member_id ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !fee_year ||
    !paid_on ||
    !method
  )
    redirect(
      `/payments/new?error=${encodeURIComponent("Sila lengkapkan semua maklumat bayaran yang diperlukan.")}`,
    );
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(2, 14),
    receipt_no = `KMT-${fee_year}-${stamp}`;
  const { data, error } = await s
    .from("payments")
    .insert({
      receipt_no,
      member_id,
      fee_year,
      amount,
      paid_on,
      method,
      reference_no: optional(f, "reference_no"),
      notes: optional(f, "notes"),
      received_by: user.id,
    })
    .select("id")
    .single();
  if (error)
    redirect(`/payments/new?error=${encodeURIComponent(error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "payment_recorded",
      entity_type: "payment",
      entity_id: data.id,
      details: { receipt_no, member_id, amount, fee_year },
    });
  revalidatePath("/");
  revalidatePath("/payments");
  redirect(
    `/payments?success=${encodeURIComponent(`Bayaran berjaya direkodkan. No. resit: ${receipt_no}`)}`,
  );
}
