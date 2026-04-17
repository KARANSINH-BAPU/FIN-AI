/**
 * FinAI – Authentication JavaScript
 */

// ── Theme ──
const theme = localStorage.getItem('finai-theme') || 'dark';
document.documentElement.setAttribute('data-theme', theme);

document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('finai-theme', next);
});

// ── Check if already logged in ──
window.addEventListener('DOMContentLoaded', () => {
    FinAI.initFirebase();
    // Use onAuthStateChanged — getCurrentUser() is null until Firebase resolves async
    FinAI.AuthService.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'dashboard.html';
            return;
        }
    });
    // Check URL params for mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') switchTab('signup');
});

// ── Tab Switching ──
function switchTab(tab) {
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const forgotForm = document.getElementById('forgotForm');
    const signinTab = document.getElementById('signinTab');
    const signupTab = document.getElementById('signupTab');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');

    signinForm.style.display = 'none';
    signupForm.style.display = 'none';
    forgotForm.style.display = 'none';
    signinTab.classList.remove('active');
    signupTab.classList.remove('active');

    if (tab === 'signin') {
        signinForm.style.display = 'flex';
        signinTab.classList.add('active');
        title.textContent = 'Welcome Back';
        subtitle.textContent = 'Sign in to your FinAI account';
    } else if (tab === 'signup') {
        signupForm.style.display = 'flex';
        signupTab.classList.add('active');
        title.textContent = 'Create Account';
        subtitle.textContent = 'Start your financial journey today';
    } else if (tab === 'forgot') {
        forgotForm.style.display = 'flex';
        title.textContent = 'Reset Password';
        subtitle.textContent = 'We\'ll send you a reset link';
    }
}

function showForgotPassword() { switchTab('forgot'); }

// ── Toast ──
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ── Password Toggle ──
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

// ── Password Strength ──
function checkPasswordStrength(password) {
    const segs = [document.getElementById('seg1'), document.getElementById('seg2'),
    document.getElementById('seg3'), document.getElementById('seg4')];
    const label = document.getElementById('strengthLabel');
    segs.forEach(s => { s.className = 'strength-segment'; });

    if (!password) { label.textContent = 'Enter a password'; return; }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const classes = ['weak', 'medium', 'medium', 'strong'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#f43f5e', '#f59e0b', '#f59e0b', '#10b981'];

    for (let i = 0; i < score; i++) {
        segs[i].classList.add(classes[score - 1]);
    }
    label.textContent = labels[score - 1] || 'Weak';
    label.style.color = colors[score - 1] || '#f43f5e';
}

// ── Set Loading State ──
function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<span style="opacity:0">Loading</span>';
        btn.classList.add('btn-loading');
    } else {
        btn.disabled = false;
        btn.classList.remove('btn-loading');
    }
}

// ── Sign In ──
async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;

    if (!email || !password) { showToast('Please fill in all fields', 'error'); return; }

    setLoading('signinBtn', true);
    try {
        const user = await FinAI.AuthService.signIn(email, password);
        showToast('Welcome back! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } catch (err) {
        const msg = getFirebaseErrorMessage(err.code || err.message);
        showToast(msg, 'error');
        setLoading('signinBtn', false);
        document.getElementById('signinBtn').innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
}

// ── Sign Up ──
async function handleSignUp(e) {
    e.preventDefault();
    const firstName = document.getElementById('signupFirstName').value.trim();
    const lastName = document.getElementById('signupLastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const agreed = document.getElementById('agreeTerms').checked;

    if (!firstName || !lastName || !email || !password) { showToast('Please fill in all fields', 'error'); return; }
    if (password !== confirm) {
        document.getElementById('signupConfirmError').textContent = 'Passwords do not match';
        document.getElementById('signupConfirmError').classList.add('show');
        return;
    }
    if (password.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    if (!agreed) { showToast('Please agree to the Terms of Service', 'error'); return; }

    document.getElementById('signupConfirmError').classList.remove('show');
    setLoading('signupBtn', true);

    try {
        const displayName = `${firstName} ${lastName}`;
        const user = await FinAI.AuthService.signUp(email, password, displayName);
        // Add demo expenses for new users
        await addDemoData(user.uid);
        showToast('Account created! Welcome to FinAI 🎉', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    } catch (err) {
        const msg = getFirebaseErrorMessage(err.code || err.message);
        showToast(msg, 'error');
        setLoading('signupBtn', false);
        document.getElementById('signupBtn').innerHTML = '<span>Create Account</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    }
}

// ── Google Sign In ──
async function handleGoogleSignIn() {
    try {
        const user = await FinAI.AuthService.signInWithGoogle();
        showToast('Signed in with Google! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } catch (err) {
        showToast('Google sign-in failed. Please try again.', 'error');
    }
}

// ── Forgot Password ──
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) { showToast('Please enter your email', 'error'); return; }
    try {
        await FinAI.AuthService.resetPassword(email);
        showToast('Reset link sent! Check your email.', 'success');
        setTimeout(() => switchTab('signin'), 2000);
    } catch (err) {
        showToast('Failed to send reset email. Please try again.', 'error');
    }
}

// ── Firebase Error Messages ──
function getFirebaseErrorMessage(code) {
    const messages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    };
    return messages[code] || 'Something went wrong. Please try again.';
}

// ── Add Demo Data for New Users ──
async function addDemoData(uid) {
    const now = new Date();
    const demoExpenses = [
        { title: 'Swiggy Order', amount: 350, category: 'Food', date: getDateStr(0), paymentMode: 'UPI' },
        { title: 'Uber Ride', amount: 180, category: 'Travel', date: getDateStr(1), paymentMode: 'UPI' },
        { title: 'Amazon Shopping', amount: 1299, category: 'Shopping', date: getDateStr(2), paymentMode: 'Credit Card' },
        { title: 'Electricity Bill', amount: 1200, category: 'Bills', date: getDateStr(3), paymentMode: 'Net Banking' },
        { title: 'Dominos Pizza', amount: 450, category: 'Food', date: getDateStr(4), paymentMode: 'UPI' },
        { title: 'Netflix Subscription', amount: 649, category: 'Entertainment', date: getDateStr(5), paymentMode: 'Credit Card' },
        { title: 'Gym Membership', amount: 1500, category: 'Health', date: getDateStr(6), paymentMode: 'Cash' },
        { title: 'Zomato Dinner', amount: 520, category: 'Food', date: getDateStr(7), paymentMode: 'UPI' },
        { title: 'Metro Card Recharge', amount: 200, category: 'Travel', date: getDateStr(8), paymentMode: 'UPI' },
        { title: 'Udemy Course', amount: 499, category: 'Education', date: getDateStr(9), paymentMode: 'Credit Card' },
        { title: 'Grocery - BigBasket', amount: 1850, category: 'Food', date: getDateStr(10), paymentMode: 'UPI' },
        { title: 'Myntra Clothes', amount: 2100, category: 'Shopping', date: getDateStr(11), paymentMode: 'Credit Card' },
        { title: 'Doctor Visit', amount: 500, category: 'Health', date: getDateStr(12), paymentMode: 'Cash' },
        { title: 'PVR Movie Tickets', amount: 600, category: 'Entertainment', date: getDateStr(13), paymentMode: 'UPI' },
        { title: 'Ola Cab', amount: 220, category: 'Travel', date: getDateStr(14), paymentMode: 'UPI' },
    ];

    for (const exp of demoExpenses) {
        await FinAI.ExpenseService.add(uid, exp);
    }

    // Set default budgets
    await FinAI.BudgetService.save(uid, {
        monthly: 20000,
        categories: { Food: 5000, Travel: 3000, Shopping: 4000, Bills: 3000, Health: 2000, Entertainment: 2000, Education: 1000, Other: 1000 }
    });
}

function getDateStr(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
}
