"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export async function importMembers(f: FormData) {
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
  if (!p || !["super_admin", "admin", "staff"].includes(p.role)) redirect("/");
  const file = f.get("file");
  if (!(file instanceof File) || !file.size)
    redirect("/import?error=Sila pilih fail CSV");
  if (file.size > 2 * 1024 * 1024)
    redirect("/import?error=Fail melebihi had 2 MB");
  const rows = parseCSV((await file.text()).replace(/^\uFEFF/, ""));
  if (rows.length < 2) redirect("/import?error=Fail CSV tidak mempunyai data");
  const headers = rows[0].map((x) => x.toLowerCase().replaceAll(" ", "_")),
    required = ["full_name"];
  if (required.some((x) => !headers.includes(x)))
    redirect("/import?error=Kolum full_name diperlukan");
  const [{ data: areas }, { data: categories }, { data: existing }] =
      await Promise.all([
        s.from("areas").select("id,name"),
        s.from("member_categories").select("id,name"),
        s
          .from("members")
          .select("identification_no")
          .not("identification_no", "is", null),
      ]),
    areaMap = new Map((areas || []).map((x) => [x.name.toLowerCase(), x.id])),
    categoryMap = new Map(
      (categories || []).map((x) => [x.name.toLowerCase(), x.id]),
    ),
    seen = new Set((existing || []).map((x) => x.identification_no));
  let skipped = 0;
  const payloads: any[] = [];
  for (const raw of rows.slice(1, 501)) {
    const x = Object.fromEntries(
      headers.map((h, i) => [h, (raw[i] || "").trim()]),
    );
    if (
      !x.full_name ||
      (x.identification_no && seen.has(x.identification_no))
    ) {
      skipped++;
      continue;
    }
    if (x.identification_no) seen.add(x.identification_no);
    payloads.push({
      full_name: x.full_name,
      identification_no: x.identification_no || null,
      phone: x.phone || null,
      email: x.email || null,
      address: x.address || null,
      postcode: x.postcode || null,
      area_id: x.area ? areaMap.get(x.area.toLowerCase()) || null : null,
      category_id: x.category
        ? categoryMap.get(x.category.toLowerCase()) || null
        : null,
      joined_on: /^\d{4}-\d{2}-\d{2}$/.test(x.joined_on)
        ? x.joined_on
        : new Date().toISOString().slice(0, 10),
      status: ["active", "inactive", "suspended", "deceased"].includes(x.status)
        ? x.status
        : "active",
      notes: x.notes || null,
      created_by: user.id,
    });
  }
  let imported = 0,
    failed = 0;
  for (let i = 0; i < payloads.length; i += 100) {
    const batch = payloads.slice(i, i + 100),
      { error } = await s.from("members").insert(batch);
    if (error) failed += batch.length;
    else imported += batch.length;
  }
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "members_bulk_imported",
      entity_type: "member",
      details: { file_name: file.name, imported, skipped, failed },
    });
  revalidatePath("/members");
  revalidatePath("/");
  redirect(`/import?imported=${imported}&skipped=${skipped}&failed=${failed}`);
}
