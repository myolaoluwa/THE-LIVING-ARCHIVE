import "server-only";
import { redirect } from "next/navigation";
import { adminDatabase } from "@/lib/database/server";
import { databaseConfig } from "@/lib/database/config";
import { permits, roleSchema, type Permission } from "@/lib/admin/validation";
import { z } from "zod";
const profileSchema = z.object({
  id: z.uuid(),
  auth_user_id: z.uuid(),
  role: roleSchema,
  display_name: z.string(),
  active: z.boolean(),
});
export async function adminSession() {
  if (!databaseConfig()) return null;
  const client = await adminDatabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const { data, error: profileError } = await client
    .from("admin_profiles")
    .select("id,auth_user_id,role,display_name,active")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const profile = profileSchema.safeParse(data);
  if (profileError || !profile.success || !profile.data.active) return null;
  return {
    client,
    user,
    profile: profile.data,
  };
}
export async function requireAdmin(permission: Permission = "edit") {
  const session = await adminSession();
  if (!session) redirect("/admin/login");
  if (!permits(session.profile.role, permission))
    redirect("/admin/dashboard?notice=forbidden");
  return session;
}
