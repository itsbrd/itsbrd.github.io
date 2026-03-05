// auth-ui.js
import { supabase } from "./supabaseClient.js";

async function getUsername(userId){
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  return data?.username || null;
}

export async function refreshAccountButton(){
  const btn = document.getElementById("ppAccountBtn");
  if (!btn) return;

  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

  if (!user){
    btn.textContent = "Log in";
    btn.href = "auth.html";
    return;
  }

  const username = await getUsername(user.id);

  if (!username){
    btn.textContent = "Setup";
    btn.href = "setup.html";
    return;
  }

  btn.textContent = username;
  btn.href = "setup.html"; // later this can be a real profile/settings page
}

supabase.auth.onAuthStateChange(() => refreshAccountButton());
