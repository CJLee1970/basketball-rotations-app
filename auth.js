// Simple auth page logic
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authError = document.getElementById('auth-error');

loginBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  auth.signInWithEmailAndPassword(email, password)
    .then(()=> { window.location.href = "dashboard.html"; })
    .catch(err => authError.textContent = err.message);
});

signupBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const password = passwordInput.value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      // set default role
      db.collection('users').doc(cred.user.uid).set({ email: cred.user.email, role: 'Coach' });
      window.location.href = "dashboard.html";
    })
    .catch(err => authError.textContent = err.message);
});
