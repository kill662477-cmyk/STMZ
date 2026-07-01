import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const USER_ID_KEY = "slay-the-monstarz.user_id";

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    // Generate a simple UUID-like random string
    userId = "usr_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}
