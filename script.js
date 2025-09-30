import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://qmlhagpdfnckuufhhixu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk'
);

const status = document.getElementById('status');

// ---------- SIGN UP ----------
document.getElementById('signup')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  console.log("[SignUp] Attempting signup for:", email);

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    console.error("[SignUp] Error:", error);
    status.innerText = `Sign up failed: ${error.message}`;
    return;
  }

  status.innerText = 'Sign up successful! Check your email.';
  console.log("[SignUp] Sign up success. Attempting to fetch session for:", email);

  const { data: sessionData } = await supabase.auth.getSession();
  const userEmail = sessionData?.session?.user?.email;

  if (userEmail) {
    console.log("[SignUp] Got user email from session:", userEmail);
    await createAccountRowIfNeeded(userEmail);
  } else {
    console.warn("[SignUp] Could not fetch user email after sign-up.");
  }
});

// ---------- LOGIN ----------
document.getElementById('login')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  console.log("[Login] Attempting login for:", email);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[Login] Error:", error);
    status.innerText = `Login failed: ${error.message}`;
    return;
  }

  status.innerText = `Logged in as ${data.user.email}`;
  console.log("[Login] Login success. Calling createAccountRowIfNeeded for:", data.user.email);

  await createAccountRowIfNeeded(data.user.email);
  window.location.href = 'frontpage.html';
});

// ---------- CREATE ACCOUNT IF NOT EXISTS ----------
async function createAccountRowIfNeeded(email) {
  if (!email) {
    console.error("[CreateRow] No valid email passed.");
    return;
  }

  console.log("[CreateRow] Checking if account exists for:", email);

  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('email', email);

  if (error) {
    console.error("[CreateRow] Select error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("[CreateRow] No existing account. Attempting insert...");

    const { error: insertError } = await supabase
      .from('accounts')
      .insert({ email, songsfound: 0 });

    if (insertError) {
      console.error("[CreateRow] Insert error:", insertError);
    } else {
      console.log("[CreateRow] ✅ Inserted new row for:", email);
    }
  } else {
    console.log("[CreateRow] Row already exists for:", email);
  }
}

// ---------- LOAD SONGS FOUND ----------
export async function loadSongsFound() {
  console.log("[LoadSongs] Starting...");

  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[LoadSongs] Auth error:", authError);
    return;
  }

  const user = userData?.user;

  if (!user) {
    console.error("[LoadSongs] No authenticated user found.");
    return;
  }

  const email = user.email;
  console.log("[LoadSongs] Authenticated email:", email);

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', email);

  if (error) {
    console.error("[LoadSongs] Error loading songsfound:", error);
    return;
  }

  if (data.length > 0) {
    console.log("[LoadSongs] Fetched songsfound:", data[0].songsfound);
    document.getElementById('songs-found').textContent = `Songs Found: ${data[0].songsfound}/52`;
  } else {
    console.warn("[LoadSongs] No account row found for this user.");
    document.getElementById('songs-found').textContent = `Songs Found: 0/52`;
  }
}