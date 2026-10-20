import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { contentFields } from "@/lib/site-content";
export default async function ContentPreview({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { client } = await requireAdmin();
  const slug = z
    .enum(["home", "about", "contact"])
    .safeParse((await params).slug);
  if (!slug.success) notFound();
  const { data, error } = await client
    .from("content_drafts")
    .select("title,content,version")
    .eq("page_slug", slug.data)
    .maybeSingle();
  if (error) throw new Error("Content preview unavailable.");
  if (!data) notFound();
  return (
    <main id="main" className="admin-main">
      <div className="admin-notice">
        Private content preview · version {data.version}.{" "}
        <Link href={`/admin/content/${slug.data}`}>Return to editing</Link>
      </div>
      <div className="admin-page-heading">
        <h1>{data.title}</h1>
      </div>
      <article className="admin-panel admin-copy-preview">
        {contentFields(slug.data, data.content).map((field) => (
          <section key={field.name}>
            <p className="eyebrow">{field.label}</p>
            <p>{field.value}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
