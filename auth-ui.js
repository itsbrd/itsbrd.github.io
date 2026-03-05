// auth-ui.js
import { supabase } from "./supabaseClient.js";

async function getUsername(userId){
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data?.username || null;
}

function ensureMenu(){
  const host = document.querySelector(".pp-topright");
  if (!host) return null;

  let menu = document.getElementById("ppAccountMenu");
  if (menu) return menu;

  menu = document.createElement("div");
  menu.id = "ppAccountMenu";
  menu.className = "pp-account-menu";
  menu.hidden = true;

  menu.innerHTML = `
    <div class="pp-account-menu-inner">
      <div class="pp-account-menu-header terminal-line subtle" id="ppAccountMenuHeader">USER: ???</div>
      <a class="pp-account-item" href="setup.html">profile</a>
      <button class="pp-account-item" type="button" id="ppLogoutBtn">logout</button>
    </div>
  `;

  host.appendChild(menu);

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    const btn = document.getElementById("ppAccountBtn");
    if (!btn) return;
    if (menu.hidden) return;

    const clickedInside = host.contains(e.target);
    if (!clickedInside) menu.hidden = true;
  });

  // ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") menu.hidden = true;
  });

  // Logout
  const logoutBtn = menu.querySelector("#ppLogoutBtn");
  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    menu.hidden = true;
    await refreshAccountButton();
  });

  return menu;
}

function setButtonAsLogin(btn){
  btn.textContent = "Log in";
  btn.href = "auth.html";
  btn.setAttribute("aria-label", "Log in");
  btn.onclick = null;
}

function setButtonAsSetup(btn){
  btn.textContent = "Setup";
  btn.href = "setup.html";
  btn.setAttribute("aria-label", "Complete setup");
  btn.onclick = null;
}

function setButtonAsUserMenu(btn, username){
  btn.textContent = `[ ${username} ]`;
  btn.href = "#";
  btn.setAttribute("aria-label", "Account menu");

  btn.onclick = (e) => {
    e.preventDefault();
    const menu = ensureMenu();
    if (!menu) return;
    menu.hidden = !menu.hidden;

    // Update header
    const header = document.getElementById("ppAccountMenuHeader");
    if (header) header.textContent = `USER: ${username}`;
  };
}

export async function refreshAccountButton(){
  const btn = document.getElementById("ppAccountBtn");
  if (!btn) return;

  const { data, error } = await supabase.auth.getSession();
  if (error){
    setButtonAsLogin(btn);
    return;
  }

  const user = data?.session?.user;
  if (!user){
    setButtonAsLogin(btn);
    return;
  }

  const username = await getUsername(user.id);
  if (!username){
    setButtonAsSetup(btn);
    return;
  }

  setButtonAsUserMenu(btn, username);
}

supabase.auth.onAuthStateChange(() => refreshAccountButton());
