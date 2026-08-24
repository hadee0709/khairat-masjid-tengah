"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const v = (f: FormData, k: string) => String(f.get(k) || "").trim(),
  o = (f: FormData, k: string) => v(f, k) || null;
export async function createFeedback(f: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const subject = v(f, "subject"),
    message = v(f, "message"),
    category = v(f, "category");
  if (!subject || !message || !category)
    redirect(
      `/feedback/new?error=${encodeURIComponent("Sila lengkapkan kategori, tajuk dan penerangan.")}`,
    );
  const reference_no = `KMT-MB-${new Date().toISOString().replace(/\D/g, "").slice(2, 14)}`,
    { data, error } = await s
      .from("feedback")
      .insert({
        reference_no,
        member_id: o(f, "member_id"),
        category,
        subject,
        message,
        status: "new",
        created_by: user.id,
      })
      .select("id")
      .single();
  if (error)
    redirect(`/feedback/new?error=${encodeURIComponent(error.message)}`);
  await s.from("audit_logs").insert({
    actor_id: user.id,
    action: "feedback_created",
    entity_type: "feedback",
    entity_id: data.id,
    details: { reference_no },
  });
  revalidatePath("/feedback");
  redirect(
    `/feedback/${data.id}?success=${encodeURIComponent("Maklum balas berjaya didaftarkan.")}`,
  );
}
export async function updateFeedback(f: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const id = v(f, "id"),
    status = v(f, "status"),
    resolution = o(f, "resolution"),
    assigned_to = o(f, "assigned_to");
  if (!id || !["new", "in_progress", "resolved", "closed"].includes(status))
    redirect("/feedback");
  const { error } = await s
    .from("feedback")
    .update({
      status,
      resolution,
      assigned_to,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error)
    redirect(`/feedback/${id}?error=${encodeURIComponent(error.message)}`);
  await s.from("audit_logs").insert({
    actor_id: user.id,
    action: "feedback_updated",
    entity_type: "feedback",
    entity_id: id,
    details: { status, assigned_to },
  });
  revalidatePath("/feedback");
  revalidatePath(`/feedback/${id}`);
  redirect(
    `/feedback/${id}?success=${encodeURIComponent("Status maklum balas berjaya dikemas kini.")}`,
  );
}
