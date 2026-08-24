import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: doc } = await s
    .from("claim_documents")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (!doc) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await s.storage
    .from("claim-documents")
    .createSignedUrl(doc.storage_path, 60);
  if (error || !data)
    return new NextResponse("Unable to open document", { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}
