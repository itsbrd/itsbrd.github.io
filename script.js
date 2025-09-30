import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://qmlhagpdfnckuufhhixu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk'
);

const status = document.getElementById('status');

// Handle signup
document.getElementById('signup')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    status.innerText = `Sign up failed: ${error.message}`;
  } else {
    status.innerText = 'Sign up successful! Check your email.';
    console.log('[Signup] User:', data?.user);
    if (data?.user?.email) {
      await createAccountRowIfNeeded(data.user);
    } else {
      console.warn("[Signup] No user email returned yet; skipping insert.");
    }
  }
});

// Handle login
document.getElementById('login')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    status.innerText = `Login failed: ${error.message}`;
  } else {
    status.innerText = `Logged in as ${data.user.email}`;
    console.log('[Login] User:', data?.user);
    await createAccountRowIfNeeded(data.user);
    window.location.href = 'frontpage.html';
  }
});

async function createAccountRowIfNeeded(user) {
  const email = user.email || user?.user_metadata?.email;
  console.log("[Account] Checking account for:", email);

  if (!email) {
    console.error("[Account] No valid email found in user object:", user);
    return;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('email')
    .eq('email', email);

  if (error) {
    console.error("[Account] Error checking accounts table:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("[Account] No existing row found. Attempting insert...");
    const { error: insertError } = await supabase
      .from('accounts')
      .insert([{ email, songsfound: 0 }]);

    if (insertError) {
      console.error("[Account] Error inserting new row:", insertError);
    } else {
      console.log("[Account] Inserted new row for:", email);
    }
  } else {
    console.log("[Account] Row already exists for:", email);
  }
}

// Called in frontpage.html
export async function loadSongsFound() {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('[LoadSongs] No authenticated user.');
    return;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', user.email);

  if (error) {
    console.error('[LoadSongs] Error loading songsfound:', error);
    return;
  }

  if (data.length > 0) {
    document.getElementById('songs-found').textContent = `Songs Found: ${data[0].songsfound}/52`;
  } else {
    console.warn('[LoadSongs] No songsfound row found for this user.');
    document.getElementById('songs-found').textContent = `Songs Found: 0/52`;
  }
}