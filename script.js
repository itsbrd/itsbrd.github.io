
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://qmlhagpdfnckuufhhixu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtbGhhZ3BkZm5ja3V1ZmhoaXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEzMTIsImV4cCI6MjA3NDU4NzMxMn0.HFrgVdnETfPL6EDa9lrj0SwZkEFehMbDUjvkq7VkRTk"
);

document.addEventListener("DOMContentLoaded", async () => {
  // Handle redirected hash with access token
  if (window.location.hash.includes("access_token")) {
    const { data, error } = await supabase.auth.getSession();
    if (data?.session) {
      document.getElementById("status").textContent = `Logged in as ${data.session.user.email}`;
    } else {
      console.error("Session fetch error:", error);
    }
  }

  // Sign-up button handler
  const signupBtn = document.getElementById("signup");
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const { error } = await supabase.auth.signUp({ email });
      if (error) {
        alert("Signup error: " + error.message);
      } else {
        alert("Check your email for a magic login link.");
      }
    });
  }

  // Login button handler
  const loginBtn = document.getElementById("login");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        alert("Login error: " + error.message);
      } else {
        alert("Check your email for a magic login link.");
      }
    });
  }
});
