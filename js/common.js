// Common helpers + nav
const MINUTES_PER_QUARTER = 10;
function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function requireAuth(then){
  auth.onAuthStateChanged(user => {
    if(!user){
      window.location.href = "index.html";
    } else {
      then(user);
    }
  });
}

function setUserBadge(){
  auth.onAuthStateChanged(user => {
    const el = document.getElementById("user-email-display");
    const logout = document.getElementById("logout-btn");
    if(el && user){
      el.textContent = user.email;
      if(logout){ logout.style.display = "inline-block"; }
    }
  });
}

function signOut(){
  auth.signOut().then(()=> { window.location.href = "index.html"; });
}
