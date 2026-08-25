"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const v = (f: FormData, k: string) => String(f.get(k) || "").trim();
export async function createUser(f: FormData) {
  const s = await createClient(),
    { data: { user } } = await s.auth.getUser();
  if (!user) redirect("/login");
  const { data: actor } = await s.from("profiles").select("role,active").eq("id", user.id).single();
  if (!actor?.active || actor.role !== "super_admin")
    redirect("/users?error=" + encodeURIComponent("Hanya Super Admin boleh menambah pengguna."));

  const payload = {
    full_name: v(f, "full_name"),
    email: v(f, "email").toLowerCase(),
    password: v(f, "password"),
    role: v(f, "role"),
  };
  if (!payload.full_name || !payload.email || payload.password.length < 10)
    redirect("/users?error=" + encodeURIComponent("Lengkapkan maklumat dan gunakan kata laluan sekurang-kurangnya 10 aksara."));

  const { error } = await s.functions.invoke("create-system-user", { body: payload });
  if (error) {
    let message = "Pengguna tidak dapat ditambah.";
    try {
      const body = await error.context?.json();
      if (body?.error) message = body.error;
    } catch {}
    redirect("/users?error=" + encodeURIComponent(message));
  }
  revalidatePath("/users");
  redirect("/users?success=" + encodeURIComponent("Pengguna baharu berjaya ditambah dan boleh terus log masuk."));
}

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

export async function deleteUser(f: FormData) {
  const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login");
  const id=v(f,"id");const{error}=await s.functions.invoke("delete-system-user",{body:{id}});
  if(error){let message="Pengguna tidak dapat dipadam.";try{const body=await error.context?.json();if(body?.error)message=body.error}catch{}redirect(`/users?error=${encodeURIComponent(message)}`)}
  revalidatePath("/users");redirect(`/users?success=${encodeURIComponent("Pengguna berjaya dipadam.")}`);
}
