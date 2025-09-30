import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://qmlhagpdfnckuufhhixu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk" // must be anon key
);

const status = document.getElementById('status');

// ---------- SIGN UP ----------
document.getElementById('signup')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    status.innerText = `Sign up failed: ${error.message}`;
    console.error(error);
    return;
  }

  status.innerText = 'Sign up successful! Check your email.';
  console.log("[SignUp] New auth user:", data.user);

  // Insert into accounts immediately
  await createAccountRowIfNeeded(email);
});

// ---------- LOGIN ----------
document.getElementById('login')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    status.innerText = `Login failed: ${error.message}`;
    console.error(error);
    return;
  }

  status.innerText = `Logged in as ${data.user.email}`;
  console.log("[Login] Authenticated user:", data.user);

  await createAccountRowIfNeeded(data.user.email);
  window.location.href = 'frontpage.html';
});

// ---------- CREATE ACCOUNT IF NOT EXISTS ----------
async function createAccountRowIfNeeded(email) {
  if (!email) return;

  const { data, error } = await supabase
    .from('accounts')
    .select('email')
    .eq('email', email);

  if (error) {
    console.error("[Accounts] Error checking table:", error);
    return;
  }

  if (!data || data.length === 0) {
    const { error: insertError } = await supabase
      .from('accounts')
      .insert({ email, songsfound: 0 });

    if (insertError) {
      console.error("[Accounts] Insert failed:", insertError);
    } else {
      console.log("[Accounts] Inserted new account row for:", email);
    }
  } else {
    console.log("[Accounts] Account already exists for:", email);
  }
}

// ---------- LOAD SONGS FOUND ----------
export async function loadSongsFound() {
  console.log("[LoadSongs] Starting...");
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user || authError) {
    console.warn("[LoadSongs] No authenticated user:", authError);
    return;
  }

  console.log("[LoadSongs] Authenticated email:", user.email);

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', user.email);

  if (error) {
    console.error('[LoadSongs] Error loading songsfound:', error);
    return;
  }

  if (data && data.length > 0) {
    document.getElementById('songs-found').textContent = `Songs Found: ${data[0].songsfound}/52`;
  } else {
    console.warn('[LoadSongs] No account row found for this user.');
    document.getElementById('songs-found').textContent = `Songs Found: 0/52`;
  }
}