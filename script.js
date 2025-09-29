// Only import ONCE at the top
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://qmlhagpdfnckuufhhixu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // truncated for safety
const supabase = createClient(supabaseUrl, supabaseKey);

// Auth buttons
document.addEventListener("DOMContentLoaded", () => {
  const signupBtn = document.getElementById('signup');
  const loginBtn = document.getElementById('login');
  const status = document.getElementById('status');

  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        status.innerText = `Sign up failed: ${error.message}`;
      } else {
        status.innerText = 'Sign up successful! Please check your email to verify.';
        await createAccountRowIfNeeded(data.user);
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        status.innerText = `Login failed: ${error.message}`;
      } else {
        status.innerText = `Logged in as ${data.user.email}`;
        await createAccountRowIfNeeded(data.user);
        window.location.href = "frontpage.html"; // redirect after login
      }
    });
  }

  // Auto-load songs if on frontpage
  if (document.getElementById('songs-found')) {
    loadSongsFound();
  }
});

// Ensure account row exists
async function createAccountRowIfNeeded(user) {
  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!data && !error) {
    await supabase.from('accounts').insert({
      id: user.id,
      email: user.email,
      songsfound: 0
    });
  }
}

// Display songs found
async function loadSongsFound() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from('accounts')
    .select('songsfound')
    .eq('id', user.id)
    .single();

  if (data && !error) {
    document.getElementById('songs-found').textContent =
      `Songs Found: ${data.songsfound}/52`;
  }
}