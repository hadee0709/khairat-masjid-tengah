"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const value=(f:FormData,k:string)=>String(f.get(k)||"").trim();
const optional=(f:FormData,k:string)=>value(f,k)||null;
export async function saveMember(formData:FormData){
  const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect("/login");
  const id=value(formData,"id"),full_name=value(formData,"full_name");
  if(!full_name)redirect(`/members/${id||"new"}?error=${encodeURIComponent("Nama penuh diperlukan.")}`);
  const payload={full_name,identification_no:optional(formData,"identification_no"),phone:optional(formData,"phone"),email:optional(formData,"email"),address:optional(formData,"address"),postcode:optional(formData,"postcode"),area_id:optional(formData,"area_id"),category_id:optional(formData,"category_id"),joined_on:value(formData,"joined_on")||new Date().toISOString().slice(0,10),status:value(formData,"status")||"active",emergency_contact_name:optional(formData,"emergency_contact_name"),emergency_contact_phone:optional(formData,"emergency_contact_phone"),notes:optional(formData,"notes"),updated_at:new Date().toISOString()};
  const result=id?await s.from("members").update(payload).eq("id",id).select("id").single():await s.from("members").insert({...payload,created_by:user.id}).select("id").single();
  if(result.error)redirect(`/members/${id||"new"}?error=${encodeURIComponent(result.error.message)}`);
  await s.from("audit_logs").insert({actor_id:user.id,action:id?"member_updated":"member_created",entity_type:"member",entity_id:result.data.id});
  revalidatePath("/");revalidatePath("/members");redirect(`/members/${result.data.id}?success=${encodeURIComponent(id?"Maklumat ahli berjaya dikemas kini.":"Ahli baharu berjaya didaftarkan.")}`);
}
