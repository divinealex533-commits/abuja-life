import { createServerSupabaseClient } from "@/lib/supabase/server";

function getConfiguredAdminIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function getAdminUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const isAdmin =
    user.app_metadata?.role === "admin" ||
    getConfiguredAdminIds().includes(user.id);

  return isAdmin ? user : null;
}

export async function requireAdmin() {
  const user = await getAdminUser();

  if (!user) {
    throw new Error("ADMIN_ACCESS_REQUIRED");
  }

  return user;
}
