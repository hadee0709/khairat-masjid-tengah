"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
const allowed = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export async function uploadClaimDocument(f: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login");
  const claimId = String(f.get("claim_id") || ""),
    type = String(f.get("document_type") || "supporting"),
    file = f.get("file");
  if (!claimId || !(file instanceof File) || file.size === 0)
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent("Sila pilih dokumen.")}`,
    );
  if (file.size > 10485760 || !allowed.has(file.type))
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent("Fail mesti PDF, JPG, PNG atau WebP dan tidak melebihi 10 MB.")}`,
    );
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
    path = `${claimId}/${crypto.randomUUID()}-${safe}`,
    bytes = await file.arrayBuffer();
  const { error: uploadError } = await s.storage
    .from("claim-documents")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError)
    redirect(
      `/claims/${claimId}?error=${encodeURIComponent(uploadError.message)}`,
    );
  const { data, error } = await s
    .from("claim_documents")
    .insert({
      claim_id: claimId,
      file_name: file.name,
      storage_path: path,
      mime_type: file.type,
      file_size: file.size,
      document_type: type,
      uploaded_by: user.id,
    })
    .select("id")
    .single();
  if (error) {
    await s.storage.from("claim-documents").remove([path]);
    redirect(`/claims/${claimId}?error=${encodeURIComponent(error.message)}`);
  }
  await s
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      action: "claim_document_uploaded",
      entity_type: "claim_document",
      entity_id: data.id,
      details: { claim_id: claimId, file_name: file.name },
    });
  revalidatePath(`/claims/${claimId}`);
  redirect(
    `/claims/${claimId}?success=${encodeURIComponent("Dokumen berjaya dimuat naik.")}`,
  );
}
