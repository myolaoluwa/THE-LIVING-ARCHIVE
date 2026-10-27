"use server";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import {
  parseBookForm,
  bookDraftSchema,
  editionSchema,
  uuid,
  roleSchema,
} from "@/lib/admin/validation";
import { contentFromForm, type PageSlug } from "@/lib/site-content";
import type { ActionState } from "@/lib/admin/action-state";

function fail(error: unknown): ActionState {
  if (error instanceof z.ZodError)
    return {
      message: error.issues
        .map((issue) => `${issue.path.join(".") || "Form"}: ${issue.message}`)
        .join(" "),
    };
  const parsed = z
    .object({ code: z.string().optional(), message: z.string().optional() })
    .safeParse(error);
  if (parsed.success) {
    if (parsed.data.code === "23505")
      return {
        message:
          "That URL, edition or record already exists. Use a unique value.",
      };
    const message = parsed.data.message || "";
    if (/draft changed|last active owner|reviewed digital asset/i.test(message))
      return { message };
  }
  console.error("Administrator operation failed", {
    code: parsed.success ? parsed.data.code : "unknown",
  });
  return {
    message:
      "Changes were not saved. Check the fields and your permissions, then reload and retry.",
  };
}
function refreshPublic() {
  updateTag("public-content");
  revalidatePath("/", "layout");
}
export async function saveBook(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("edit");
  try {
    const id = String(form.get("id") || "");
    const version = z.coerce.number().int().min(0).parse(form.get("version"));
    const draft = parseBookForm(form);
    const { data, error } = await client.rpc("save_book_draft", {
      p_book_id: id ? uuid.parse(id) : null,
      p_data: draft,
      p_version: version,
    });
    if (error) throw error;
    revalidatePath("/admin/books");
    return {
      success: true,
      message: "Draft saved. Public content has not changed.",
      id: String(data),
      version: version + 1,
    };
  } catch (error) {
    return fail(error);
  }
}
export async function publishBook(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("manage");
  try {
    if (form.get("confirm") !== "on")
      return { message: "Review the preview and confirm publication first." };
    const id = uuid.parse(form.get("id"));
    const version = z.coerce
      .number()
      .int()
      .positive()
      .parse(form.get("version"));
    const { data: draft, error: draftError } = await client
      .from("book_drafts")
      .select("data")
      .eq("book_id", id)
      .single();
    if (draftError) throw draftError;
    const content = bookDraftSchema.parse(draft.data);
    if (
      !content.short_description ||
      !content.full_description.length ||
      (!content.cover_asset_id && !content.cover_path)
    )
      return {
        message:
          "Add a description, full book copy and a cover before publishing.",
      };
    const { error } = await client.rpc("publish_book", {
      p_book_id: id,
      p_version: version,
    });
    if (error) throw error;
    refreshPublic();
    return {
      success: true,
      message: "Book published. The public collection now uses this version.",
    };
  } catch (error) {
    return fail(error);
  }
}
export async function changeBookStatus(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("manage");
  try {
    const id = uuid.parse(form.get("id"));
    const status = z
      .enum(["draft", "archived", "delete"])
      .parse(form.get("status"));
    const { data, error: lookupError } = await client
      .from("books")
      .select("title,status")
      .eq("id", id)
      .single();
    if (lookupError) throw lookupError;
    if (form.get("confirmation") !== data.title)
      return { message: "Type the exact book title to confirm this action." };
    if (status === "delete") {
      if (data.status !== "draft")
        return {
          message:
            "Only an unpublished draft can be deleted. Archive published books instead.",
        };
      const { error } = await client.from("books").delete().eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await client.rpc("set_book_status", {
        p_book_id: id,
        p_status: status,
      });
      if (error) throw error;
    }
    refreshPublic();
    return {
      success: true,
      message:
        status === "delete" ? "Draft deleted." : "Publication status updated.",
      destination: status === "delete" ? "/admin/books" : undefined,
    };
  } catch (error) {
    return fail(error);
  }
}
export async function saveEdition(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("manage");
  try {
    const price = String(form.get("price") || "").trim();
    if (price && !/^\d{1,5}(\.\d{1,2})?$/.test(price))
      return {
        message: "Enter a nonnegative price with at most two decimal places.",
      };
    const [major, minor = ""] = price.split(".");
    const input = editionSchema.parse({
      id: form.get("id") || "",
      book_id: form.get("book_id"),
      format: form.get("format"),
      sale_channel: form.get("sale_channel"),
      isbn: form.get("isbn") || "",
      currency: form.get("currency") || "",
      price_minor: price
        ? Number(major) * 100 + Number(minor.padEnd(2, "0"))
        : null,
      availability: form.get("availability"),
      external_purchase_url: form.get("external_purchase_url") || "",
      link_verified: form.get("link_verified") === "on",
      direct_sale_rights_confirmed:
        form.get("direct_sale_rights_confirmed") === "on",
      tax_category: form.get("tax_category") || "",
    });
    if (
      input.currency &&
      !["USD", "EUR", "GBP", "ZAR"].includes(input.currency)
    )
      return { message: "Choose one of the supported currencies." };
    const { id, ...values } = input;
    const row = {
      ...values,
      isbn: values.isbn || null,
      currency: values.currency || null,
      external_purchase_url: values.external_purchase_url || null,
      external_product_identifier: values.external_purchase_url
        ? values.external_purchase_url.split("/").at(-1)
        : null,
    };
    const result = id
      ? await client
          .from("book_editions")
          .update(row)
          .eq("id", id)
          .eq("book_id", values.book_id)
          .select("id")
          .single()
      : await client.from("book_editions").insert(row).select("id").single();
    if (result.error) throw result.error;
    refreshPublic();
    return {
      success: true,
      message:
        "Edition saved. Direct checkout remains disabled until the commerce phase.",
    };
  } catch (error) {
    return fail(error);
  }
}
export async function saveContent(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("edit");
  try {
    const slug = z.enum(["home", "about", "contact"]).parse(form.get("slug"));
    const version = z.coerce.number().int().min(0).parse(form.get("version"));
    const { data, error } = await client
      .from("content_drafts")
      .select("content")
      .eq("page_slug", slug)
      .single();
    if (error) throw error;
    const content = contentFromForm(slug, data.content, form);
    const { error: saveError } = await client.rpc("save_content_draft", {
      p_slug: slug,
      p_title: z.string().trim().min(1).max(200).parse(form.get("title")),
      p_content: content,
      p_version: version,
    });
    if (saveError) throw saveError;
    revalidatePath(`/admin/content/${slug}`);
    return {
      success: true,
      message: "Draft saved. The published page is unchanged.",
      version: version + 1,
    };
  } catch (error) {
    return fail(error);
  }
}
export async function publishContent(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("manage");
  try {
    if (form.get("confirm") !== "on")
      return { message: "Review the preview and confirm publication first." };
    const slug = z.enum(["home", "about", "contact"]).parse(form.get("slug"));
    const version = z.coerce
      .number()
      .int()
      .positive()
      .parse(form.get("version"));
    const { data, error: readError } = await client
      .from("content_drafts")
      .select("content")
      .eq("page_slug", slug)
      .single();
    if (readError) throw readError;
    // The same field schema used by editing and public rendering must pass before publication.
    const { contentSchemas } = await import("@/lib/site-content");
    contentSchemas[slug as PageSlug].parse(data.content);
    const { error } = await client.rpc("publish_content", {
      p_slug: slug,
      p_version: version,
    });
    if (error) throw error;
    refreshPublic();
    return { success: true, message: "Content published." };
  } catch (error) {
    return fail(error);
  }
}
export async function saveSettings(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("owner");
  try {
    const values = z
      .object({
        site_name: z.string().trim().min(1).max(120),
        contact_email: z.union([z.email(), z.literal("")]),
        newsletter_intro: z.string().trim().max(2000),
      })
      .parse(
        Object.fromEntries(
          ["site_name", "contact_email", "newsletter_intro"].map((key) => [
            key,
            String(form.get(key) || ""),
          ]),
        ),
      );
    const { error } = await client
      .from("site_settings")
      .upsert(Object.entries(values).map(([key, value]) => ({ key, value })));
    if (error) throw error;
    refreshPublic();
    return {
      success: true,
      message:
        "Public settings saved. Newsletter collection remains a later-phase feature.",
    };
  } catch (error) {
    return fail(error);
  }
}
export async function saveProfile(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("owner");
  try {
    const row = z
      .object({
        auth_user_id: uuid,
        display_name: z.string().trim().min(1).max(120),
        role: roleSchema,
        active: z.boolean(),
      })
      .parse({
        auth_user_id: form.get("auth_user_id"),
        display_name: form.get("display_name"),
        role: form.get("role"),
        active: form.get("active") === "on",
      });
    const { error } = await client
      .from("admin_profiles")
      .upsert(row, { onConflict: "auth_user_id" });
    if (error) throw error;
    revalidatePath("/admin/team");
    return {
      success: true,
      message:
        "Access profile saved. Account creation and invitations are managed in Supabase Auth.",
    };
  } catch (error) {
    return fail(error);
  }
}
export async function markEnquiry(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("manage");
  try {
    const id = uuid.parse(form.get("id"));
    const status = z
      .enum(["new", "read", "archived"])
      .parse(form.get("status"));
    const { error } = await client
      .from("contact_messages")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/enquiries");
    return { success: true, message: "Enquiry status saved." };
  } catch (error) {
    return fail(error);
  }
}
export async function reviewAsset(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client, user } = await requireAdmin("manage");
  try {
    if (form.get("confirm") !== "on")
      return { message: "Confirm that you have reviewed this exact file." };
    const id = uuid.parse(form.get("id"));
    const status = z.enum(["ready", "retired"]).parse(form.get("status"));
    const { error } = await client
      .from("digital_assets")
      .update({ status, reviewed_by: user.id })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/assets");
    return {
      success: true,
      message: "File review status saved. Paid delivery is not enabled.",
    };
  } catch (error) {
    return fail(error);
  }
}
export async function saveSeries(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { client } = await requireAdmin("manage");
  try {
    const values = z
      .object({
        name: z.string().trim().min(1).max(120),
        slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
        description: z.string().max(3000),
        display_order: z.coerce.number().int().min(0).max(10000),
      })
      .parse(
        Object.fromEntries(
          ["name", "slug", "description", "display_order"].map((k) => [
            k,
            form.get(k) || "",
          ]),
        ),
      );
    const id = String(form.get("id") || "");
    const result = id
      ? await client.from("book_series").update(values).eq("id", uuid.parse(id))
      : await client.from("book_series").insert(values);
    if (result.error) throw result.error;
    refreshPublic();
    return { success: true, message: "Series saved." };
  } catch (error) {
    return fail(error);
  }
}
