import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = 'https://qmlhagpdfnckuufhhixu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk';
const supabase = createClient(supabaseUrl, supabaseKey);

const status = document.getElementById('status');

document.getElementById('signup').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    status.innerText = `Sign up failed: ${error.message}`;
  } else {
    status.innerText = 'Sign up successful! Please check your email to verify.';
  }
});

document.getElementById('login').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    status.innerText = `Login failed: ${error.message}`;
  } else {
    status.innerText = `Logged in as ${data.user.email}`;
  }
});

const { data: { user } } = await supabase.auth.getUser();

import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://your-project.supabase.co', 'public-anon-key')

// Run this after auth
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

async function loadSongsFound() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
  .from('accounts')
  .select('songsfound')
  .eq('id', user.id)
  .single();
  
  if (data && !error) {
    document.getElementById('songs-found').textContent = `Songs Found: ${data.songsfound}/52`;
  }
}