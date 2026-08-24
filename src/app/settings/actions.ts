"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const v = (f: FormData, k: string) => String(f.get(k) || "").trim();
async function admin() {
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
  if (!p || !["super_admin", "admin"].includes(p.role)) redirect("/");
  return { s, user, role: p.role };
}
export async function saveArea(f: FormData) {
  const { s, user } = await admin(),
    id = v(f, "id"),
    name = v(f, "name"),
    active = v(f, "active") !== "false";
  if (!name) redirect("/settings?error=Nama kawasan diperlukan");
  const r = id
    ? await s.from("areas").update({ name, active }).eq("id", id)
    : await s.from("areas").insert({ name, active });
  if (r.error)
    redirect(`/settings?error=${encodeURIComponent(r.error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: id ? "area_updated" : "area_created",
      entity_type: "area",
      entity_id: id || null,
    });
  revalidatePath("/settings");
  redirect("/settings?success=Kawasan berjaya disimpan");
}
export async function saveCategory(f: FormData) {
  const { s, user } = await admin(),
    id = v(f, "id"),
    name = v(f, "name"),
    annual_fee = Number(v(f, "annual_fee")),
    active = v(f, "active") !== "false";
  if (!name || !Number.isFinite(annual_fee) || annual_fee < 0)
    redirect("/settings?error=Maklumat kategori tidak sah");
  const r = id
    ? await s
        .from("member_categories")
        .update({ name, annual_fee, active })
        .eq("id", id)
    : await s.from("member_categories").insert({ name, annual_fee, active });
  if (r.error)
    redirect(`/settings?error=${encodeURIComponent(r.error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: id ? "category_updated" : "category_created",
      entity_type: "member_category",
      entity_id: id || null,
      details: { annual_fee },
    });
  revalidatePath("/settings");
  redirect("/settings?success=Kategori ahli berjaya disimpan");
}
export async function saveOrganization(f: FormData) {
  const { s, user, role } = await admin();
  if (role !== "super_admin")
    redirect(
      "/settings?error=Hanya Super Admin boleh mengubah identiti organisasi",
    );
  const value = { name: v(f, "name"), short_name: v(f, "short_name") };
  if (!value.name || !value.short_name)
    redirect("/settings?error=Nama organisasi diperlukan");
  const { error } = await s
    .from("system_settings")
    .upsert({
      key: "organization",
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "organization_settings_updated",
      entity_type: "system_setting",
      entity_id: "organization",
    });
  revalidatePath("/settings");
  redirect("/settings?success=Tetapan organisasi berjaya dikemas kini");
}
