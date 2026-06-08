// ─── TeenMed Auth Module ──────────────────────────────────────────────────────
// Replace the firebaseConfig below with your own from Firebase Console

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// US States list
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington D.C."
];

const COUNTRIES = [
  "United States","Afghanistan","Albania","Algeria","Andorra","Angola","Argentina",
  "Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh",
  "Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina",
  "Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia",
  "Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China",
  "Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Djibouti","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana",
  "Greece","Guatemala","Guinea","Haiti","Honduras","Hungary","Iceland","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho",
  "Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia",
  "Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia",
  "Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine",
  "United Arab Emirates","United Kingdom","Uruguay","Uzbekistan","Venezuela",
  "Vietnam","Yemen","Zambia","Zimbabwe"
];

// ─── State ────────────────────────────────────────────────────────────────────
let currentTab = 'login';
let firebaseApp = null;
let googleAuth = null;
let currentStep = 1; // for signup: 1=account info, 2=location
let pendingGoogleData = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  populateSelects();
  bindEvents();
  checkAuth();
});

function initFirebase() {
  try {
    if (typeof firebase !== 'undefined' && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY") {
      firebase.initializeApp(FIREBASE_CONFIG);
      googleAuth = firebase.auth();
    }
  } catch (e) {
    console.log('Firebase not configured yet');
  }
}

function populateSelects() {
  const countrySels = document.querySelectorAll('.country-select');
  const stateSels = document.querySelectorAll('.state-select');

  countrySels.forEach(sel => {
    COUNTRIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => handleCountryChange(sel));
  });

  stateSels.forEach(sel => {
    US_STATES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      sel.appendChild(opt);
    });
  });
}

function handleCountryChange(countryEl) {
  const form = countryEl.closest('form') || countryEl.closest('.auth-form-content');
  const stateGroup = form ? form.querySelector('.state-group') : null;
  if (stateGroup) {
    stateGroup.style.display = countryEl.value === 'United States' ? 'block' : 'none';
  }
}

function bindEvents() {
  // Modal open/close
  document.querySelectorAll('[data-open-auth]').forEach(el => {
    el.addEventListener('click', (e) => {
      const tab = el.dataset.openAuth || 'login';
      openModal(tab);
    });
  });

  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el) closeModal();
    });
  });

  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Register form (step 1)
  const step1Form = document.getElementById('registerStep1');
  if (step1Form) step1Form.addEventListener('submit', handleStep1);

  // Register form (step 2)
  const step2Form = document.getElementById('registerStep2');
  if (step2Form) step2Form.addEventListener('submit', handleStep2);

  // Google buttons
  document.querySelectorAll('.btn-google').forEach(btn => {
    btn.addEventListener('click', handleGoogleSignIn);
  });

  // Back button
  const backBtn = document.getElementById('backToStep1');
  if (backBtn) backBtn.addEventListener('click', () => goToStep(1));

  // Username availability check
  const usernameInput = document.getElementById('reg-username');
  if (usernameInput) {
    usernameInput.addEventListener('input', debounce(checkUsernameAvailability, 500));
  }

  // Logout
  document.querySelectorAll('[data-logout]').forEach(el => {
    el.addEventListener('click', handleLogout);
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(tab = 'login') {
  const overlay = document.getElementById('authModal');
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  switchTab(tab);
}

function closeModal() {
  const overlay = document.getElementById('authModal');
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.auth-panel').forEach(p => {
    p.style.display = p.dataset.panel === tab ? 'block' : 'none';
  });
  if (tab === 'register') goToStep(1);
}

function goToStep(step) {
  currentStep = step;
  document.querySelectorAll('.reg-step').forEach(s => {
    s.style.display = parseInt(s.dataset.step) === step ? 'block' : 'none';
  });
  document.querySelectorAll('.step-indicator').forEach((s, i) => {
    s.classList.toggle('active', i + 1 === step);
    s.classList.toggle('done', i + 1 < step);
  });
}

// ─── Auth Handlers ────────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('[type=submit]');

  setLoading(btn, true);
  clearErrors('loginForm');

  const res = await apiFetch('/api/login', { email, password });
  setLoading(btn, false);

  if (res.error) {
    showFieldError('login-error', res.error);
  } else {
    closeModal();
    showToast('Welcome back! 👋', 'success');
    setTimeout(() => updateAuthUI(res.user), 300);
  }
}

async function handleStep1(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  clearErrors('registerStep1');

  if (password !== confirm) {
    showFieldError('reg-confirm-error', 'Passwords do not match');
    return;
  }
  if (password.length < 6) {
    showFieldError('reg-password-error', 'Password must be at least 6 characters');
    return;
  }

  // Store for step 2
  sessionStorage.setItem('reg_username', username);
  sessionStorage.setItem('reg_email', email);
  sessionStorage.setItem('reg_password', password);

  goToStep(2);
}

async function handleStep2(e) {
  e.preventDefault();
  const country = document.getElementById('reg-country').value;
  const state = document.getElementById('reg-state') ? document.getElementById('reg-state').value : '';
  const btn = e.target.querySelector('[type=submit]');

  if (!country) { showFieldError('reg-country-error', 'Please select your country'); return; }
  if (country === 'United States' && !state) {
    showFieldError('reg-state-error', 'Please select your state');
    return;
  }

  setLoading(btn, true);

  const payload = {
    username: sessionStorage.getItem('reg_username'),
    email: sessionStorage.getItem('reg_email'),
    password: sessionStorage.getItem('reg_password'),
    country, state
  };

  const res = await apiFetch('/api/register', payload);
  setLoading(btn, false);

  if (res.error) {
    showFieldError('reg-step2-error', res.error);
  } else {
    sessionStorage.removeItem('reg_username');
    sessionStorage.removeItem('reg_email');
    sessionStorage.removeItem('reg_password');
    closeModal();
    showToast('Welcome to TeenMed! 🩺', 'success');
    setTimeout(() => updateAuthUI(res.user), 300);
  }
}

async function handleGoogleSignIn() {
  if (!googleAuth) {
    showToast('Google sign-in not configured yet. Use email/password.', 'error');
    return;
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await googleAuth.signInWithPopup(provider);
    const idToken = await result.user.getIdToken();
    const uid = result.user.uid;
    const email = result.user.email;

    // First check if user exists
    const res = await apiFetch('/api/google-auth', { idToken, uid, email });

    if (res.needs_profile) {
      // Need to collect username + location
      pendingGoogleData = { idToken, uid, email };
      showGoogleProfileStep();
    } else if (res.error) {
      showToast(res.error, 'error');
    } else {
      closeModal();
      showToast('Signed in with Google! 🎉', 'success');
      setTimeout(() => updateAuthUI(res.user), 300);
    }
  } catch (err) {
    showToast('Google sign-in failed. Try again.', 'error');
    console.error(err);
  }
}

function showGoogleProfileStep() {
  switchTab('register');
  // pre-fill email if shown
  const emailEl = document.getElementById('reg-email');
  if (emailEl && pendingGoogleData) {
    emailEl.value = pendingGoogleData.email;
    emailEl.readOnly = true;
  }
  goToStep(2);
  // override step2 submit to use google auth
  const step2Form = document.getElementById('registerStep2');
  step2Form.onsubmit = async (e) => {
    e.preventDefault();
    const country = document.getElementById('reg-country').value;
    const state = document.getElementById('reg-state') ? document.getElementById('reg-state').value : '';
    const username = document.getElementById('reg-username') ? document.getElementById('reg-username').value.trim() : '';
    const btn = step2Form.querySelector('[type=submit]');

    setLoading(btn, true);

    const res = await apiFetch('/api/google-auth', {
      ...pendingGoogleData, username, country, state
    });

    setLoading(btn, false);

    if (res.error) {
      showFieldError('reg-step2-error', res.error);
    } else {
      pendingGoogleData = null;
      closeModal();
      showToast('Welcome to TeenMed! 🩺', 'success');
      setTimeout(() => updateAuthUI(res.user), 300);
    }
  };
}

async function handleLogout() {
  await apiFetch('/api/logout', {});
  if (googleAuth) { try { await googleAuth.signOut(); } catch(e) {} }
  showToast('Logged out. See you soon!', 'success');
  setTimeout(() => { window.location.href = '/'; }, 800);
}

async function checkUsernameAvailability() {
  const val = document.getElementById('reg-username').value.trim();
  const hint = document.getElementById('username-hint');
  if (!val || val.length < 3) { if (hint) hint.textContent = ''; return; }

  const res = await fetch(`/api/check-username?username=${encodeURIComponent(val)}`);
  const data = await res.json();
  if (hint) {
    hint.textContent = data.taken ? '✗ Username taken' : '✓ Username available';
    hint.style.color = data.taken ? 'var(--red-soft)' : 'var(--green-soft)';
  }
}

// ─── Auth State ───────────────────────────────────────────────────────────────
async function checkAuth() {
  const res = await fetch('/api/me');
  const data = await res.json();
  if (data.authenticated) {
    updateAuthUI(data.user);
  } else {
    updateAuthUI(null);
  }
}

function updateAuthUI(user) {
  const loggedIn = !!user;
  document.querySelectorAll('[data-auth-show]').forEach(el => {
    el.style.display = el.dataset.authShow === (loggedIn ? 'user' : 'guest') ? '' : 'none';
  });

  if (user) {
    document.querySelectorAll('.user-username').forEach(el => { el.textContent = user.username; });
    document.querySelectorAll('.user-email').forEach(el => { el.textContent = user.email; });
    document.querySelectorAll('.user-country').forEach(el => { el.textContent = user.country; });
  }

  // Hide lock banners if logged in
  if (loggedIn) {
    document.querySelectorAll('.lock-banner').forEach(el => el.remove());
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
async function apiFetch(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error. Please try again.' };
  }
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; });
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
  btn.innerHTML = loading
    ? '<span class="spinner"></span>'
    : btn.dataset.originalText;
}

function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
