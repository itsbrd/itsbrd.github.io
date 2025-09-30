// script.js
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Replace with your actual Supabase project URL and anon key
const supabaseUrl = "https://YOUR_PROJECT.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loadSongsFound() {
  console.log("[LoadSongs] Starting...");

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[LoadSongs] No authenticated user:", userError);
    return;
  }

  const email = user.email;
  console.log(`[LoadSongs] Authenticated email: – "${email}"`);

  const { data, error } = await supabase
    .from("accounts")
    .select("songsfound")
    .eq("email", email)
    .single();

  if (error) {
    console.warn("[LoadSongs] No account row found for this user.");
    console.debug("[LoadSongs] Query error:", error.message);
    return;
  }

  const songsfound = data?.songsfound ?? 0;
  console.log(`[LoadSongs] Songs found: ${songsfound}`);

  const songsFoundElement = document.getElementById("songs-found");
  if (songsFoundElement) {
    songsFoundElement.textContent = `Songs Found: ${songsfound}/52`;
  } else {
    console.warn("[LoadSongs] songs-found element not found in DOM.");
  }
}

// Automatically call on load
loadSongsFound();