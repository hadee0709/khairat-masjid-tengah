import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const year = Number(
      req.nextUrl.searchParams.get("year") || new Date().getFullYear(),
    ),
    { data } = await s
      .from("payments")
      .select(
        "receipt_no,paid_on,fee_year,amount,method,reference_no,members(member_no,full_name)",
      )
      .is("voided_at", null)
      .eq("fee_year", year)
      .order("paid_on");
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`,
    header = [
      "No. Resit",
      "Tarikh",
      "Tahun",
      "No. Ahli",
      "Nama Ahli",
      "Kaedah",
      "Rujukan",
      "Jumlah",
    ],
    rows = (data || []).map((x: any) => [
      x.receipt_no,
      x.paid_on,
      x.fee_year,
      x.members?.member_no,
      x.members?.full_name,
      x.method,
      x.reference_no,
      x.amount,
    ]);
  const csv =
    "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-khairat-${year}.csv"`,
    },
  });
}
