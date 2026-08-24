"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const v = (f: FormData, k: string) => String(f.get(k) || "").trim();
export async function updateUser(f: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: actor } = await s
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!actor || !["super_admin", "admin"].includes(actor.role))
    redirect("/users?error=Akses tidak dibenarkan");
  const id = v(f, "id"),
    role = v(f, "role"),
    full_name = v(f, "full_name"),
    active = v(f, "active") === "true",
    allowed = [
      "super_admin",
      "admin",
      "treasurer",
      "staff",
      "auditor",
      "member",
    ];
  if (!id || !full_name || !allowed.includes(role))
    redirect("/users?error=Maklumat tidak lengkap");
  if (role === "super_admin" && actor.role !== "super_admin")
    redirect("/users?error=Hanya Super Admin boleh menetapkan peranan ini");
  if (id === user.id && !active)
    redirect("/users?error=Akaun sendiri tidak boleh dinyahaktifkan");
  const { error } = await s
    .from("profiles")
    .update({ full_name, role, active })
    .eq("id", id);
  if (error) redirect(`/users?error=${encodeURIComponent(error.message)}`);
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "user_access_updated",
      entity_type: "profile",
      entity_id: id,
      details: { role, active },
    });
  revalidatePath("/users");
  redirect(
    `/users?success=${encodeURIComponent("Akses pengguna berjaya dikemas kini.")}`,
  );
}
