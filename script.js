import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://qmlhagpdfnckuufhhixu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

const status = document.getElementById('status');

// ---------- SIGN UP ----------
document.getElementById('signup')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    status.innerText = `Sign up failed: ${error.message}`;
    return;
  }

  status.innerText = 'Sign up successful! Check your email.';
  console.log("[Signup] Auth data:", data);

  const { data: sessionData } = await supabase.auth.getSession();
  const userEmail = sessionData?.session?.user?.email;

  if (userEmail) {
    await createAccountRowIfNeeded(userEmail);
  } else {
    console.warn("[Signup] Could not get email after signup.");
  }
});

// ---------- LOGIN ----------
document.getElementById('login')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    status.innerText = `Login failed: ${error.message}`;
    return;
  }

  status.innerText = `Logged in as ${data.user.email}`;
  console.log("[Login] Logged in user:", data.user.email);

  await createAccountRowIfNeeded(data.user.email);
  window.location.href = 'frontpage.html';
});

// ---------- CREATE ACCOUNT IF NOT EXISTS ----------
async function createAccountRowIfNeeded(email) {
  if (!email) {
    console.error("[CreateRow] No valid email");
    return;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('email', email);

  if (error) {
    console.error("[CreateRow] Error selecting:", error);
    return;
  }

  if (!data || data.length === 0) {
    const { error: insertError } = await supabase
      .from('accounts')
      .insert({ email, songsfound: 0 });

    if (insertError) {
      console.error("[CreateRow] Insert error:", insertError);
    } else {
      console.log("[CreateRow] Inserted account row for", email);
    }
  } else {
    console.log("[CreateRow] Account already exists for", email);
  }
}

// ---------- LOAD SONGS FOUND ----------
export async function loadSongsFound() {
  console.log("[LoadSongs] Starting...");

  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    console.warn("[LoadSongs] No authenticated user:", authError?.message);
    return;
  }

  const email = userData.user.email;
  console.log("[LoadSongs] Authenticated email:", email);

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', email);

  if (error) {
    console.error("[LoadSongs] DB error:", error);
    return;
  }

  if (data.length > 0) {
    const count = data[0].songsfound;
    document.getElementById('songs-found').textContent = `Songs Found: ${count}/52`;
    console.log(`[LoadSongs] Found ${count} songs for ${email}`);
  } else {
    document.getElementById('songs-found').textContent = `Songs Found: 0/52`;
    console.warn("[LoadSongs] No account row found for this user.");
  }
}