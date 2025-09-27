// Load Supabase from CDN
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Your project credentials
const SUPABASE_URL = 'https://qmlhagpdfnckuufhhixu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup');
const loginBtn = document.getElementById('login');
const status = document.getElementById('status');

// Sign up
signupBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    status.textContent = `Sign up error: ${error.message}`;
  } else {
    status.textContent = `Signed up! Check your email.`;
    // Insert into your accounts table
    await supabase.from('accounts').insert([{ email }]);
  }
});

// Log in
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    status.textContent = `Login error: ${error.message}`;
  } else {
    status.textContent = `Logged in as ${email}`;
  }
});