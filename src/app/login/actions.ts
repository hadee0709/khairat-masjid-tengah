"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function authenticate(formData:FormData){
  const s=await createClient();
  const email=String(formData.get("email")||"").trim();
  const password=String(formData.get("password")||"");
  const intent=String(formData.get("intent")||"login");
  if(intent==="signup"){
    const name=String(formData.get("name")||"").trim();
    if(!name)redirect("/login?error="+encodeURIComponent("Nama penuh diperlukan untuk pendaftaran."));
    const {data,error}=await s.auth.signUp({email,password,options:{data:{full_name:name}}});
    if(error)redirect("/login?error="+encodeURIComponent("Pendaftaran gagal: "+error.message));
    if(data.session)redirect("/");
    redirect("/login?success="+encodeURIComponent("Akaun berjaya didaftarkan. Sila sahkan e-mel sebelum log masuk."));
  }
  const {error}=await s.auth.signInWithPassword({email,password});
  if(error)redirect("/login?error="+encodeURIComponent("E-mel atau kata laluan tidak sah."));
  redirect("/");
}
