import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  'https://qmlhagpdfnckuufhhixu.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk' // replace with actual key
);

const status = document.getElementById('status');

document.getElementById('signup')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    status.innerText = `Sign up failed: ${error.message}`;
  } else {
    status.innerText = 'Sign up successful! Check your email.';
  }
});

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

async function createAccountRowIfNeeded(user) {
  // Check if account row exists for this email
  const { data, error } = await supabase
    .from('accounts')
    .select('email')
    .eq('email', user.email);

  if (error) {
    console.error("Failed to check accounts table:", error);
    return;
  }

  if (!data || data.length === 0) {
    // If no row exists, insert one
    const { error: insertError } = await supabase
      .from('accounts')
      .insert({
        email: user.email,
        songsfound: 0
      });

    if (insertError) {
      console.error("Error inserting new account row:", insertError);
    }
  }
}

// Called in frontpage.html
export async function loadSongsFound() {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (!user || authError) {
    console.error('No authenticated user.');
    return;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', user.email); // Don't use .single()

  if (error) {
    console.error('Error loading songsfound:', error);
    return;
  }

  if (data.length > 0) {
    document.getElementById('songs-found').textContent = `Songs Found: ${data[0].songsfound}/52`;
  } else {
    console.warn('No songsfound row found for this user.');
    document.getElementById('songs-found').textContent = `Songs Found: 0/52`;
  }
}