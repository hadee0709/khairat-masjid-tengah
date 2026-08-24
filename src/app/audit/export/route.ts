import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: p } = await s
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!p || !["super_admin", "auditor"].includes(p.role))
    return new NextResponse("Forbidden", { status: 403 });
  const f = req.nextUrl.searchParams;
  let q = s
    .from("audit_logs")
    .select(
      "created_at,action,entity_type,entity_id,details,profiles:actor_id(full_name,role)",
    )
    .order("created_at", { ascending: false })
    .limit(5000);
  if (f.get("entity")) q = q.eq("entity_type", f.get("entity")!);
  if (f.get("action")) q = q.eq("action", f.get("action")!);
  if (f.get("from")) q = q.gte("created_at", `${f.get("from")}T00:00:00`);
  if (f.get("to")) q = q.lte("created_at", `${f.get("to")}T23:59:59`);
  const { data } = await q,
    esc = (x: unknown) => `"${String(x ?? "").replaceAll('"', '""')}"`,
    rows = (data || []).map((x: any) => [
      x.created_at,
      x.profiles?.full_name,
      x.profiles?.role,
      x.action,
      x.entity_type,
      x.entity_id,
      JSON.stringify(x.details || {}),
    ]),
    csv =
      "\uFEFF" +
      [
        [
          "Tarikh",
          "Pengguna",
          "Peranan",
          "Tindakan",
          "Modul",
          "ID Rekod",
          "Butiran",
        ],
        ...rows,
      ]
        .map((r) => r.map(esc).join(","))
        .join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=log-audit-khairat.csv",
    },
  });
}
