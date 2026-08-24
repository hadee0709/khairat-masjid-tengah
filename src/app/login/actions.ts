"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function authenticate(formData:FormData){
  const s=await createClient();
  const email=String(formData.get("email")||"").trim();
  const password=String(formData.get("password")||"");
  if(!email||!password)redirect("/login?error="+encodeURIComponent("Sila masukkan alamat e-mel dan kata laluan."));
  const {error}=await s.auth.signInWithPassword({email,password});
  if(error)redirect("/login?error="+encodeURIComponent("E-mel atau kata laluan tidak sah."));
  redirect("/");
}
