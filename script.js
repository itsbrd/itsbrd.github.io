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
    await tryInsertAccount(email); // insert row into accounts
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
    await tryInsertAccount(data.user.email); // insert if missing
    window.location.href = 'frontpage.html';
  }
});

// Attempt to insert row if not already there
async function tryInsertAccount(email) {
  if (!email) return;

  const { data, error } = await supabase
    .from('accounts')
    .select('email')
    .eq('email', email);

  if (error) {
    console.error("Error querying accounts table:", error);
    return;
  }

  if (!data || data.length === 0) {
    const { error: insertError } = await supabase
      .from('accounts')
      .insert({ email, songsfound: 0 });

    if (insertError) {
      console.error("Insert failed:", insertError);
    } else {
      console.log(`Account row created for ${email}`);
    }
  } else {
    console.log(`Account already exists for ${email}`);
  }
}

// Load songsfound count in frontpage.html
export async function loadSongsFound() {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('No authenticated user.', authError);
    return;
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('email', user.email);

  if (error) {
    console.error('Error loading songsfound:', error);
    return;
  }

  if (data && data.length > 0) {
    document.getElementById('songs-found').textContent = `Songs Found: ${data[0].songsfound}/52`;
  } else {
    console.warn('No songsfound row found for this user.');
    document.getElementById('songs-found').textContent = `Songs Found: 0/52`;
  }
}