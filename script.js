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
    status.innerText = 'Sign up successful! Check your email to confirm.';
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
    await createAccountRowIfNeeded(data.user);
    window.location.href = 'frontpage.html';
  }
});

// Ensure the user has an account row in the `accounts` table
async function createAccountRowIfNeeded(user) {
  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', user.email)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Don't proceed if the error is not "no rows found"
    console.error('Error checking for existing account row:', error);
    return;
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from('accounts')
      .insert({
        email: user.email,
        songsfound: 0
      });

    if (insertError) {
      console.error('Failed to create account row:', insertError);
    }
  }
}

// Load songsfound from the `accounts` table (to be used in frontpage.html)
export async function loadSongsFound() {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('No authenticated user:', authError);
    return;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', user.email)
    .single();

  if (error) {
    console.error('Error loading songsfound:', error);
    return;
  }

  document.getElementById('songs-found').textContent = `Songs Found: ${data.songsfound}/52`;
}