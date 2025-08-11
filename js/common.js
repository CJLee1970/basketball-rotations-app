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
// --- Shared globals (single source of truth) ---
window.MINUTES_PER_QUARTER = window.MINUTES_PER_QUARTER || 10;
window.currentRoster = window.currentRoster || [];      // [{id, name, number, color, ppg, rpg, spg}, ...]
window.currentRotation = window.currentRotation || {};  // { q1:{PG:[],...}, q2:..., q3:..., q4:... }

// Lightweight helper accessible everywhere
window.playerById = function (id) {
  return (window.currentRoster || []).find(p => p.id === id) || null;
};
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
