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

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    status.innerText = `Sign up failed: ${error.message}`;
    return;
  }

  status.innerText = 'Sign up successful! Check your email.';
  console.log('[SignUp] Sign up complete:', data);

  // Do NOT try to get session — it won’t exist until email is confirmed
  // Row will be created after login
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
  console.log('[Login] Logged in user:', data.user);

  await createAccountRowIfNeeded(data.user.email);

  window.location.href = 'frontpage.html';
});

// ---------- CREATE ACCOUNT ROW ----------
async function createAccountRowIfNeeded(email) {
  console.log('[CreateRow] Checking row for email:', email);

  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('email', email);

  if (error) {
    console.error('[CreateRow] Select error:', error);
    return;
  }

  if (data.length === 0) {
    console.log('[CreateRow] No row found. Creating...');

    const { error: insertError, data: insertData } = await supabase
      .from('accounts')
      .insert({ email, songsfound: 0 });

    if (insertError) {
      console.error('[CreateRow] Insert error:', insertError);
    } else {
      console.log('[CreateRow] Row inserted:', insertData);
    }
  } else {
    console.log('[CreateRow] Row already exists:', data);
  }
}

// ---------- LOAD SONGS FOUND ----------
export async function loadSongsFound() {
  console.log('[LoadSongs] Starting...');

  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user?.email) {
    console.error('[LoadSongs] No authenticated user or error:', authError);
    return;
  }

  const email = userData.user.email;
  console.log('[LoadSongs] Authenticated email: –', email);

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', email);

  if (error) {
    console.error('[LoadSongs] Error loading songsfound:', error);
    return;
  }

  if (data.length > 0) {
    document.getElementById('songs-found').textContent = `Songs Found: ${data[0].songsfound}/52`;
    console.log('[LoadSongs] Loaded:', data[0].songsfound);
  } else {
    console.warn('[LoadSongs] No account row found for this user.');
    document.getElementById('songs-found').textContent = `Songs Found: 0/52`;
  }
}