import { z } from "zod";
import { biography } from "./content";

const line = z.string().trim().min(1).max(250);
const paragraph = z.string().trim().min(1).max(5000);
const chapterSchema = z.object({ label: line, title: line, text: paragraph });
export const homeContentSchema = z
  .object({
    hero_first: line,
    hero_second: line,
    hero_italic_first: line,
    hero_italic_second: line,
    hero_description: paragraph,
    author_standfirst: paragraph,
    author_introduction: paragraph,
    author_note: paragraph,
    featured_book_slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  })
  .strict();
export const aboutContentSchema = z
  .object({
    headline_first: line,
    headline_second: line,
    introduction: paragraph,
    chapters: z.array(chapterSchema).min(1).max(12),
    milestones: z.array(chapterSchema).min(1).max(12),
  })
  .strict();
export const contactContentSchema = z
  .object({
    headline_first: line,
    headline_second: line,
    introduction: paragraph,
    invitation: paragraph,
    guidance: paragraph,
  })
  .strict();
export const contentSchemas = {
  home: homeContentSchema,
  about: aboutContentSchema,
  contact: contactContentSchema,
};
export type PageSlug = keyof typeof contentSchemas;
export type HomeContent = z.infer<typeof homeContentSchema>;
export type AboutContent = z.infer<typeof aboutContentSchema>;
export type ContactContent = z.infer<typeof contactContentSchema>;
export const defaultHome: HomeContent = {
  hero_first: "History",
  hero_second: "remembered.",
  hero_italic_first: "Stories",
  hero_italic_second: "preserved.",
  hero_description:
    "Explore the books and life of Edmund Spencer Katso — a personal window into the histories of Central and Southern Africa.",
  author_standfirst:
    "From Zimbabwe to Germany, from the classroom to the written page.",
  author_introduction:
    "Zimbabwean-born author, educator and historian. Exploring the histories, cultures and lived experiences of Central and Southern Africa.",
  author_note:
    "His work brings historical research into conversation with personal memory — preserving a connection between the past and those who will inherit its stories.",
  featured_book_slug: "the-bile-of-the-river",
};
export const defaultAbout: AboutContent = {
  headline_first: "A witness to history.",
  headline_second: "A keeper of stories.",
  introduction:
    "Author. Educator. Historian. A life shaped by Zimbabwe, education and the enduring importance of memory.",
  chapters: biography,
  milestones: [
    {
      label: "Zimbabwe",
      title: "Life and work in Zimbabwe",
      text: "Early life in Umtali, now Mutare, and a professional career that included a pioneering teaching role at Peterhouse.",
    },
    {
      label: "Germany",
      title: "A new chapter in Germany",
      text: "Relocated to Germany, where he worked as an English communication trainer and later pursued writing in retirement.",
    },
  ],
};
export const defaultContact: ContactContent = {
  headline_first: "Good conversations",
  headline_second: "begin with a word.",
  introduction:
    "For readers, fellow educators and anyone curious about the stories.",
  invitation:
    "Enquiries about the books, media and interviews, academic discussions and book club conversations are welcome.",
  guidance:
    "For book-related enquiries, include the title and edition. For an interview or book club, share a little about the conversation you have in mind.",
};
export const defaultPages = {
  home: defaultHome,
  about: defaultAbout,
  contact: defaultContact,
};

export type ContentField = {
  name: string;
  label: string;
  value: string;
  multiline: boolean;
};
export function contentFields(
  slug: PageSlug,
  content: unknown,
): ContentField[] {
  const parsed = contentSchemas[slug].parse(content);
  const fields: ContentField[] = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string")
      fields.push({
        name: key,
        label: key.replaceAll("_", " "),
        value,
        multiline:
          value.length > 180 ||
          [
            "introduction",
            "invitation",
            "guidance",
            "author_note",
            "author_introduction",
            "hero_description",
          ].includes(key),
      });
    else if (Array.isArray(value))
      value.forEach((chapter, index) =>
        Object.entries(chapter).forEach(([field, text]) =>
          fields.push({
            name: `${key}.${index}.${field}`,
            label: `${key === "chapters" ? "Biography chapter" : "Milestone"} ${index + 1} — ${field}`,
            value: String(text),
            multiline: field === "text",
          }),
        ),
      );
  }
  return fields;
}
export function contentFromForm(
  slug: PageSlug,
  current: unknown,
  form: FormData,
) {
  const result: Record<string, unknown> = structuredClone(
    contentSchemas[slug].parse(current),
  );
  for (const field of contentFields(slug, current)) {
    const value = form.get(field.name);
    if (typeof value !== "string") throw new Error("Missing content field");
    const parts = field.name.split(".");
    if (parts.length === 1) result[parts[0]] = value;
    else
      (result[parts[0]] as Record<string, string>[])[Number(parts[1])][
        parts[2]
      ] = value;
  }
  return contentSchemas[slug].parse(result);
}
