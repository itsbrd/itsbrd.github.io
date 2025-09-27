document.addEventListener('DOMContentLoaded', function () {
  const mainContent = document.getElementById('main-content');
  
  const supabase = supabase.createClient(
    'https://qmlhagpdfnckuufhhixu.supabase.co',  // replace with your actual URL
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk'                  // replace with your anon public key
  );

  // SIGNUP
async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signUp({ email, password });

  document.getElementById('auth-msg').textContent = error 
    ? error.message 
    : 'Sign-up successful! Check your email to confirm.';
}

// LOGIN
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  document.getElementById('auth-msg').textContent = error 
    ? error.message 
    : 'Login successful!';
  if (!error) showUserArea();
}

// LOGOUT
async function logout() {
  await supabase.auth.signOut();
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('user-area').style.display = 'none';
}

// SHOW LOGGED-IN UI
async function showUserArea() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('user-area').style.display = 'block';
  }
}

// SESSION RESTORE ON PAGE LOAD
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) showUserArea();
});

});
