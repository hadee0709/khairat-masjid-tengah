import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.0";
Deno.serve(async (req: Request) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Kaedah tidak dibenarkan." }), { status: 405, headers });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Sesi tidak sah." }), { status: 401, headers });
  const url=Deno.env.get("SUPABASE_URL")!, anonKey=Deno.env.get("SUPABASE_ANON_KEY")!, serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller=createClient(url,anonKey,{global:{headers:{Authorization:authHeader}}});
  const {data:{user},error:userError}=await caller.auth.getUser();
  if(userError||!user)return new Response(JSON.stringify({error:"Sesi tidak sah."}),{status:401,headers});
  const admin=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:actor}=await admin.from("profiles").select("role,active").eq("id",user.id).single();
  if(!actor?.active||actor.role!=="super_admin")return new Response(JSON.stringify({error:"Hanya Super Admin boleh melihat penggunaan platform."}),{status:403,headers});
  const {data:stats,error:statsError}=await admin.rpc("platform_usage_stats");
  if(statsError)return new Response(JSON.stringify({error:"Statistik Supabase tidak dapat dibaca."}),{status:500,headers});
  let vercelOnline=false,vercelStatus=0;
  try{const response=await fetch("https://khairat-masjid-tengah.vercel.app/login",{method:"HEAD",signal:AbortSignal.timeout(8000)});vercelOnline=response.ok;vercelStatus=response.status;}catch{}
  return new Response(JSON.stringify({supabase:stats,vercel:{online:vercelOnline,status:vercelStatus,plan:"Hobby",dashboard_url:"https://vercel.com/dashboard"}}),{status:200,headers});
});