import { z } from "zod";
import { commerceServices, privateHeaders } from "@/lib/commerce/server";
import { saleSchema } from "@/lib/commerce/validation";
export const runtime = "nodejs";
export async function GET() {
  const services = commerceServices();
  if (!services)
    return Response.json(
      { enabled: false, books: [] },
      { headers: privateHeaders },
    );
  const result = await services.db.rpc("commerce_catalog");
  const books = z.array(saleSchema).safeParse(result.data);
  if (result.error || !books.success)
    return Response.json(
      { enabled: false, books: [] },
      { status: 503, headers: privateHeaders },
    );
  return Response.json(
    { enabled: true, testMode: !services.config.live, books: books.data },
    { headers: privateHeaders },
  );
}
