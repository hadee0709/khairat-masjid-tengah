import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowLeft, Database, ExternalLink, HardDrive, ShieldAlert, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Stats = { database_bytes:number; storage_bytes:number; storage_files:number; registered_users:number; members:number; payments:number; claims:number; feedback:number; audit_logs:number; measured_at:string };
type UsageResponse = { supabase:Stats; vercel:{ online:boolean; status:number; plan:string; dashboard_url:string } };
const MB=1024*1024;
const limits={database:500*MB,storage:1024*MB,users:50000};
const percentage=(value:number,limit:number)=>Math.min(100,(value/limit)*100);
const formatSize=(bytes:number)=>bytes<MB?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/MB).toFixed(1)} MB`;
const tone=(value:number)=>value>=95?"danger":value>=85?"warning":value>=70?"notice":"safe";

function Meter({label,value,limit,display,icon:Icon}:{label:string;value:number;limit:number;display:string;icon:typeof Database}){
  const percent=percentage(value,limit),state=tone(percent);
  return <article className="usage-card"><div className={`usage-icon ${state}`}><Icon size={21}/></div><div className="usage-title"><h2>{label}</h2><span className={`usage-state ${state}`}>{percent.toFixed(1)}%</span></div><strong>{display}</strong><p>Had percuma: {limit===limits.users?limit.toLocaleString("ms-MY")+" pengguna":formatSize(limit)}</p><div className="meter"><span className={state} style={{width:percent+"%"}}/></div></article>;
}

export default async function PlatformUsagePage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login");
  const {data:profile}=await supabase.from("profiles").select("role,active").eq("id",user.id).single();
  if(!profile?.active||profile.role!=="super_admin")redirect("/");
  const {data,error}=await supabase.functions.invoke<UsageResponse>("platform-usage",{body:{}});
  const stats=data?.supabase;
  return <main className="module-page"><div className="module-wrap"><Link className="back" href="/"><ArrowLeft size={17}/> Dashboard</Link><header className="module-head"><div><p className="eyebrow">SUPER ADMIN</p><h1>Penggunaan Platform</h1><span>Pantau kapasiti pelan percuma Vercel dan Supabase.</span></div><Activity size={34}/></header>
  {error||!stats?<div className="error">Statistik platform tidak dapat dimuatkan. Cuba semula sebentar lagi.</div>:<>
    <section className="usage-grid"><Meter label="Database Supabase" value={stats.database_bytes} limit={limits.database} display={formatSize(stats.database_bytes)} icon={Database}/><Meter label="Supabase Storage" value={stats.storage_bytes} limit={limits.storage} display={`${formatSize(stats.storage_bytes)} · ${stats.storage_files} fail`} icon={HardDrive}/><Meter label="Pengguna Berdaftar" value={stats.registered_users} limit={limits.users} display={stats.registered_users.toLocaleString("ms-MY")} icon={Users}/></section>
    <section className="platform-grid"><article className="card platform-card"><div className="platform-head"><div className={`live-dot ${data.vercel.online?"online":"offline"}`}/><div><h2>Vercel</h2><p>Pelan {data.vercel.plan}</p></div></div><strong>{data.vercel.online?"Sistem dalam talian":"Semakan diperlukan"}</strong><p>Status HTTP: {data.vercel.status||"Tidak tersedia"}</p><a className="platform-link" href={data.vercel.dashboard_url} target="_blank" rel="noreferrer">Buka Usage Vercel <ExternalLink size={15}/></a></article><article className="card platform-card"><div className="platform-head"><div className="live-dot online"/><div><h2>Supabase</h2><p>Pelan Free</p></div></div><strong>Database aktif</strong><p>Diukur {new Date(stats.measured_at).toLocaleString("ms-MY")}</p><a className="platform-link" href="https://supabase.com/dashboard/project/gcpfsxqapvhqjwvieeiy/settings/billing/usage" target="_blank" rel="noreferrer">Buka Usage Supabase <ExternalLink size={15}/></a></article></section>
    <section className="card record-card"><h2>Ringkasan rekod sistem</h2><div className="record-grid"><span><strong>{stats.members}</strong>Ahli</span><span><strong>{stats.payments}</strong>Bayaran</span><span><strong>{stats.claims}</strong>Tuntutan</span><span><strong>{stats.feedback}</strong>Maklum balas</span><span><strong>{stats.audit_logs}</strong>Log audit</span></div></section>
    <section className="card limit-note"><ShieldAlert size={22}/><div><h2>Perkara yang perlu diawasi</h2><p>Semak egress dan penggunaan fungsi terus di dashboard penyedia. Supabase Free boleh dipause selepas tempoh tidak aktif; elakkan terlalu banyak deployment Vercel dalam masa singkat.</p></div></section>
  </>}</div></main>;
}
