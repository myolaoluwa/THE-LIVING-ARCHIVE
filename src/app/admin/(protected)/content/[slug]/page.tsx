import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { contentFields } from "@/lib/site-content";
import { ActionForm } from "@/components/admin/action-form";
import { saveContent, publishContent } from "@/app/admin/actions";
export default async function EditContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { client, profile } = await requireAdmin();
  const slug = z
    .enum(["home", "about", "contact"])
    .safeParse((await params).slug);
  if (!slug.success) notFound();
  const { data, error } = await client
    .from("content_drafts")
    .select("title,content,version")
    .eq("page_slug", slug.data)
    .maybeSingle();
  if (error) throw new Error("Content could not be loaded.");
  if (!data) notFound();
  return (
    <main id="main" className="admin-main">
      <Link href="/admin/content" className="text-link">
        ← Website content
      </Link>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Editorial workspace</p>
          <h1>{data.title}</h1>
          <p>Words can change. The approved page design stays consistent.</p>
        </div>
      </div>
      <ActionForm
        action={saveContent}
        label="Save content draft"
        className="admin-panel"
      >
        <input type="hidden" name="slug" value={slug.data} />
        <input type="hidden" name="version" value={data.version} />
        <label>
          Page title
          <input
            name="title"
            defaultValue={data.title}
            required
            maxLength={200}
          />
        </label>
        {contentFields(slug.data, data.content).map((field) => (
          <label key={field.name} className="content-field">
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea
                name={field.name}
                defaultValue={field.value}
                rows={4}
                required
              />
            ) : (
              <input name={field.name} defaultValue={field.value} required />
            )}
          </label>
        ))}
      </ActionForm>
      <section className="admin-panel">
        <h2>Review & publish</h2>
        <Link
          className="text-link"
          href={`/admin/content/${slug.data}/preview`}
        >
          Preview saved content ↗
        </Link>
        {profile.role !== "editor" ? (
          <ActionForm action={publishContent} label="Publish content">
            <input type="hidden" name="slug" value={slug.data} />
            <input type="hidden" name="version" value={data.version} />
            <label className="admin-checkbox">
              <input name="confirm" type="checkbox" required />I have reviewed
              the saved content and want to publish this version.
            </label>
          </ActionForm>
        ) : (
          <p className="admin-help">
            An owner or administrator can publish after reviewing your draft.
          </p>
        )}
      </section>
    </main>
  );
}
