import { z } from "zod";
const schema = z.object({
  siteUrl: z.url().default("http://localhost:3000"),
  contactEmail: z.union([z.email(), z.literal("")]).default("edmund.katso@gmail.com"),
});
export const env = schema.parse({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || undefined,
});
