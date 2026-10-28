import { z } from "zod";
import { adminSession } from "@/lib/auth/session";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await adminSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.profile.role === "editor")
    return new Response("Forbidden", { status: 403 });
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) return new Response("Not found", { status: 404 });
  const { data, error } = await session.client
    .from("digital_assets")
    .select("id,storage_path")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error || !data) return new Response("Not found", { status: 404 });
  const audit = await session.client.rpc("record_asset_access", {
    p_asset_id: parsed.data,
  });
  if (audit.error) return new Response("Unavailable", { status: 503 });
  const download = await session.client.storage
    .from("private-ebooks")
    .createSignedUrl(data.storage_path, 60, { download: true });
  if (download.error) return new Response("Unavailable", { status: 503 });
  return new Response(null, {
    status: 303,
    headers: {
      Location: download.data.signedUrl,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
