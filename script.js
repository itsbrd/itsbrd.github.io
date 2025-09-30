// script.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://qmlhagpdfnckuufhhixu.supabase.co', // replace this!
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk'             // replace this!
);

export async function loadSongsFound() {
  console.log('[LoadSongs] Starting...');

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.warn('[LoadSongs] No authenticated user:');
    console.warn(sessionError);
    return;
  }

  const email = session.user.email;
  console.log('[LoadSongs] Authenticated email: –', `%c"${email}"`, 'color:red');

  // Check if account row exists
  const { data: accounts, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('email', email)
    .single();

  if (accountError) {
    console.warn('[LoadSongs] No account row found for this user.');
    console.warn(accountError);
    return;
  }

  const songsFound = accounts.songsfound ?? 0;
  console.log(`[LoadSongs] Songs found: ${songsFound}`);

  const songsDiv = document.getElementById('songs-found');
  if (songsDiv) {
    songsDiv.textContent = `Songs Found: ${songsFound}/52`;
  }
}