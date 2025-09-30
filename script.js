import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Initialize Supabase
const supabase = createClient(
  'https://qmlhagpdfnckuufhhixu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk'
);

// DOM references
const status = document.getElementById('status');

// ---------- SIGN UP ----------
document.getElementById('signup')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    status.innerText = `Sign up failed: ${error.message}`;
    return;
  }

  status.innerText = 'Sign up successful! Check your email.';

  // Wait for session and create account row
  const { data: sessionData } = await supabase.auth.getSession();
  const userEmail = sessionData?.session?.user?.email;

  if (userEmail) {
    await createAccountRowIfNeeded(userEmail);
  } else {
    console.warn("Could not fetch user email after sign-up.");
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
  await createAccountRowIfNeeded(data.user.email);
  window.location.href = 'frontpage.html';
});

// ---------- CREATE ACCOUNT ROW IF MISSING ----------
async function createAccountRowIfNeeded(email) {
  if (!email) {
    console.error("No email passed to account check.");
    return;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('email', email);

  if (error) {
    console.error("Error checking accounts:", error.message);
    return;
  }

  if (!data || data.length === 0) {
    const { error: insertError } = await supabase
      .from('accounts')
      .insert({ email, songsfound: 0 });

    if (insertError) {
      console.error("Error inserting account row:", insertError.message);
    } else {
      console.log(`Account row created for ${email}`);
    }
  } else {
    console.log(`Account already exists for ${email}`);
  }
}

// ---------- LOAD SONGS FOUND ----------
export async function loadSongsFound() {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user || authError) {
    console.error('No authenticated user or auth error:', authError?.message);
    return;
  }

  const email = user.email;

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error loading songsfound:', error.message);
    return;
  }

  const found = data?.songsfound ?? 0;
  document.getElementById('songs-found').textContent = `Songs Found: ${found}/52`;

  if (data === null) {
    console.warn('[LoadSongs] No account row found for this user.');
  }
}