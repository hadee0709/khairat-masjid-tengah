"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const v = (f: FormData, k: string) => String(f.get(k) || "").trim(),
  o = (f: FormData, k: string) => v(f, k) || null;
export async function saveDependent(f: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const id = v(f, "id"),
    member_id = v(f, "member_id"),
    full_name = v(f, "full_name");
  if (!member_id || !full_name)
    redirect(
      `/dependents/new?error=${encodeURIComponent("Ahli dan nama tanggungan diperlukan.")}`,
    );
  const payload = {
    member_id,
    full_name,
    identification_no: o(f, "identification_no"),
    relationship: v(f, "relationship"),
    date_of_birth: o(f, "date_of_birth"),
    phone: o(f, "phone"),
    eligibility_status: v(f, "eligibility_status") || "eligible",
    notes: o(f, "notes"),
    updated_at: new Date().toISOString(),
  };
  const r = id
    ? await s
        .from("dependents")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await s
        .from("dependents")
        .insert({ ...payload, created_by: user.id })
        .select("id")
        .single();
  if (r.error)
    redirect(`/dependents/new?error=${encodeURIComponent(r.error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: id ? "dependent_updated" : "dependent_created",
      entity_type: "dependent",
      entity_id: r.data.id,
    });
  revalidatePath("/dependents");
  redirect(
    `/dependents?success=${encodeURIComponent("Maklumat tanggungan berjaya disimpan.")}`,
  );
}
