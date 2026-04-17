/**
 * FinAI – Dashboard Controller
 */

// ── State ──
const State = {
    user: null,
    expenses: [],
    budgets: {},
    insights: null,
    currentPage: 'dashboard',
    charts: {},
    editingExpenseId: null,
    deletingExpenseId: null,
    voiceRecognition: null,
    voiceParsed: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// ── Init ──
window.addEventListener('DOMContentLoaded', async () => {
    applyTheme();
    FinAI.initFirebase();
    // Wait for Firebase Auth to resolve — getCurrentUser() is null until then
    FinAI.AuthService.onAuthStateChanged(async (user) => {
        if (!user) { window.location.href = 'auth.html'; return; }
        if (State.user) return; // already initialized
        State.user = user;
        updateUserUI();
        await loadData();
        renderPage('dashboard');
        setDefaultDate();
    });
});

function applyTheme() {
    const t = localStorage.getItem('finai-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    document.getElementById('themeIcon').textContent = t === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('finai-theme', next);
    document.getElementById('themeIcon').textContent = next === 'dark' ? '☀️' : '🌙';
    setTimeout(() => renderPage(State.currentPage), 100);
}

function updateUserUI() {
    const u = State.user;
    const name = u.displayName || u.email?.split('@')[0] || 'User';
    document.getElementById('userName').textContent = name;
    document.getElementById('userEmail').textContent = u.email || '';
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
}

async function loadData() {
    try {
        [State.expenses, State.budgets] = await Promise.all([
            FinAI.ExpenseService.getAll(State.user.uid),
            FinAI.BudgetService.get(State.user.uid)
        ]);
        State.insights = AIEngine.generateInsights(
            State.expenses, State.budgets, State.currentMonth, State.currentYear
        );
    } catch (e) { console.error('Load error:', e); }
}

// ── Navigation ──
function navigateTo(page) {
    State.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById('nav-' + page);
    if (navEl) navEl.classList.add('active');
    closeSidebar();
    renderPage(page);
}

function renderPage(page) {
    destroyCharts();
    const titles = {
        dashboard: ['Dashboard', 'Welcome back! Here\'s your financial overview.'],
        expenses: ['Expenses', 'Manage and track all your transactions.'],
        budget: ['Budget', 'Set and monitor your spending limits.'],
        reports: ['Reports', 'Visual analytics of your spending patterns.'],
        ai: ['AI Insights', 'Smart analysis powered by FinAI engine.'],
        health: ['Health Score', 'Your financial wellness score.'],
        settings: ['Settings', 'Manage your account and preferences.']
    };
    const [title, subtitle] = titles[page] || ['FinAI', ''];
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;

    const content = document.getElementById('pageContent');
    switch (page) {
        case 'dashboard': content.innerHTML = renderDashboard(); break;
        case 'expenses': content.innerHTML = renderExpenses(); break;
        case 'budget': content.innerHTML = renderBudget(); break;
        case 'reports': content.innerHTML = renderReports(); break;
        case 'ai': content.innerHTML = renderAI(); break;
        case 'health': content.innerHTML = renderHealth(); break;
        case 'settings': content.innerHTML = renderSettings(); break;
        default: content.innerHTML = renderDashboard();
    }
    setTimeout(() => initPageCharts(page), 50);
}

function destroyCharts() {
    Object.values(State.charts).forEach(c => { try { c.destroy(); } catch (e) { } });
    State.charts = {};
}

// ── Sidebar ──
function openSidebar() { document.getElementById('sidebar').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }
function toggleUserMenu() {
    document.getElementById('userMenu').classList.toggle('open');
}
document.addEventListener('click', (e) => {
    if (!e.target.closest('#userProfile') && !e.target.closest('#userMenu')) {
        document.getElementById('userMenu')?.classList.remove('open');
    }
});

// ── Sign Out ──
async function handleSignOut() {
    await FinAI.AuthService.signOut();
}

// ── Toast ──
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 4000);
}

// ── Helpers ──
function formatCurrency(n) { return '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function setDefaultDate() {
    const el = document.getElementById('expDate');
    if (el) el.value = new Date().toISOString().split('T')[0];
}

const CAT_ICONS = { Food: '🍕', Travel: '🚗', Shopping: '🛍️', Bills: '📄', Health: '💊', Entertainment: '🎬', Education: '📚', Other: '📦' };
const CAT_COLORS = {
    Food: ['#fb923c', 'rgba(251,146,60,0.15)'],
    Travel: ['#818cf8', 'rgba(99,102,241,0.15)'],
    Shopping: ['#f472b6', 'rgba(236,72,153,0.15)'],
    Bills: ['#f43f5e', 'rgba(244,63,94,0.15)'],
    Health: ['#34d399', 'rgba(16,185,129,0.15)'],
    Entertainment: ['#c084fc', 'rgba(168,85,247,0.15)'],
    Education: ['#22d3ee', 'rgba(6,182,212,0.15)'],
    Other: ['#94a3b8', 'rgba(100,116,139,0.15)']
};

function getCatStyle(cat) {
    const [color, bg] = CAT_COLORS[cat] || CAT_COLORS.Other;
    return { color, bg };
}

function getMonthExpenses() {
    return State.expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === State.currentMonth && d.getFullYear() === State.currentYear;
    });
}

// ── Expense Modal ──
function openAddExpenseModal() {
    State.editingExpenseId = null;
    document.getElementById('expenseModalTitle').textContent = 'Add Expense';
    document.getElementById('expSubmitText').textContent = 'Add Expense';
    document.getElementById('expenseForm').reset();
    document.getElementById('expEditId').value = '';
    document.getElementById('autoCatHint').style.display = 'none';
    setDefaultDate();
    document.getElementById('expenseModal').classList.add('open');
}

function openEditExpenseModal(id) {
    const exp = State.expenses.find(e => e.id === id);
    if (!exp) return;
    State.editingExpenseId = id;
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
    document.getElementById('expSubmitText').textContent = 'Save Changes';
    document.getElementById('expTitle').value = exp.title || '';
    document.getElementById('expAmount').value = exp.amount || '';
    document.getElementById('expDate').value = exp.date || '';
    document.getElementById('expCategory').value = exp.category || '';
    document.getElementById('expPaymentMode').value = exp.paymentMode || 'UPI';
    document.getElementById('expNotes').value = exp.notes || '';
    document.getElementById('expEditId').value = id;
    document.getElementById('autoCatHint').style.display = 'none';
    document.getElementById('expenseModal').classList.add('open');
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('open');
}

async function handleExpenseSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const title = document.getElementById('expTitle').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    const date = document.getElementById('expDate').value;
    const category = document.getElementById('expCategory').value;
    const paymentMode = document.getElementById('expPaymentMode').value;
    const notes = document.getElementById('expNotes').value.trim();

    if (!title || !amount || !date || !category) { showToast('Please fill all required fields', 'error'); return; }

    const btn = document.getElementById('expSubmitBtn');
    btn.disabled = true;
    try {
        const expData = { title, amount, date, category, paymentMode, notes };
        if (State.editingExpenseId) {
            await FinAI.ExpenseService.update(State.user.uid, State.editingExpenseId, expData);
            showToast('Expense updated!', 'success');
        } else {
            await FinAI.ExpenseService.add(State.user.uid, expData);
            showToast('Expense added!', 'success');
        }
        closeExpenseModal();
        await loadData();
        renderPage(State.currentPage);
    } catch (err) {
        console.error('Expense save error:', err);
        showToast('Failed to save: ' + (err.message || String(err)), 'error');
    } finally { btn.disabled = false; }
}

// ── Delete Modal ──
function openDeleteModal(id) {
    State.deletingExpenseId = id;
    document.getElementById('deleteModal').classList.add('open');
}
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('open');
    State.deletingExpenseId = null;
}
async function confirmDelete() {
    if (!State.deletingExpenseId) return;
    try {
        await FinAI.ExpenseService.delete(State.user.uid, State.deletingExpenseId);
        showToast('Expense deleted', 'info');
        closeDeleteModal();
        await loadData();
        renderPage(State.currentPage);
    } catch { showToast('Failed to delete', 'error'); }
}

// ── Auto Category ──
function autoFillCategory(title) {
    if (!title || title.length < 3) { document.getElementById('autoCatHint').style.display = 'none'; return; }
    const cat = AIEngine.autoCategory(title);
    if (cat !== 'Other') {
        document.getElementById('expCategory').value = cat;
        document.getElementById('autoCatName').textContent = `${CAT_ICONS[cat]} ${cat}`;
        document.getElementById('autoCatHint').style.display = 'block';
    } else {
        document.getElementById('autoCatHint').style.display = 'none';
    }
}

// ── Voice Entry ──
function openVoiceModal() { document.getElementById('voiceModal').classList.add('open'); }
function closeVoiceModal() {
    document.getElementById('voiceModal').classList.remove('open');
    stopVoice();
}

function toggleVoice() {
    const btn = document.getElementById('voiceBtn');
    if (btn.classList.contains('listening')) { stopVoice(); return; }
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice recognition not supported in this browser', 'error'); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN'; recognition.continuous = false; recognition.interimResults = true;
    State.voiceRecognition = recognition;

    recognition.onstart = () => {
        btn.classList.add('listening'); btn.textContent = '🔴';
        document.getElementById('voiceStatus').textContent = 'Listening... speak now';
        document.getElementById('voiceParsed').style.display = 'none';
    };
    recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        document.getElementById('voiceTranscript').textContent = `"${transcript}"`;
        if (e.results[e.results.length - 1].isFinal) {
            const parsed = AIEngine.parseVoiceCommand(transcript);
            State.voiceParsed = parsed;
            showParsedVoice(parsed);
        }
    };
    recognition.onerror = () => { stopVoice(); showToast('Voice recognition error', 'error'); };
    recognition.onend = () => stopVoice();
    recognition.start();
}

function stopVoice() {
    const btn = document.getElementById('voiceBtn');
    btn.classList.remove('listening'); btn.textContent = '🎙️';
    document.getElementById('voiceStatus').textContent = 'Click the mic to start listening';
    if (State.voiceRecognition) { try { State.voiceRecognition.stop(); } catch (e) { } State.voiceRecognition = null; }
}

function showParsedVoice(parsed) {
    const el = document.getElementById('voiceParsed');
    const content = document.getElementById('voiceParsedContent');
    content.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;font-size:0.88rem">
      <div><span style="color:var(--text-muted)">Title:</span> <strong>${parsed.title || 'Unknown'}</strong></div>
      <div><span style="color:var(--text-muted)">Amount:</span> <strong>${parsed.amount ? formatCurrency(parsed.amount) : 'Not detected'}</strong></div>
      <div><span style="color:var(--text-muted)">Category:</span> <strong>${parsed.category || 'Other'}</strong></div>
      <div><span style="color:var(--text-muted)">Date:</span> <strong>${formatDate(parsed.date)}</strong></div>
    </div>`;
    el.style.display = 'block';
}

async function confirmVoiceExpense() {
    const p = State.voiceParsed;
    if (!p || !p.amount) { showToast('Could not detect amount. Please try again.', 'error'); return; }
    try {
        await FinAI.ExpenseService.add(State.user.uid, {
            title: p.title || 'Voice Expense',
            amount: p.amount,
            date: p.date,
            category: p.category || 'Other',
            paymentMode: 'UPI',
            notes: 'Added via voice'
        });
        showToast('Voice expense added!', 'success');
        closeVoiceModal();
        await loadData();
        renderPage(State.currentPage);
    } catch { showToast('Failed to add expense', 'error'); }
}

// ── PDF Download ──
async function downloadPDF() {
    showToast('Generating PDF report...', 'info');
    try {
        const monthExp = getMonthExpenses();
        await PDFReporter.generate({
            expenses: monthExp,
            budgets: State.budgets,
            insights: State.insights,
            user: State.user,
            month: State.currentMonth,
            year: State.currentYear
        });
        showToast('PDF downloaded successfully!', 'success');
    } catch (e) { showToast('PDF generation failed: ' + e.message, 'error'); }
}

// ── Budget Save ──
async function saveBudgets() {
    const monthly = parseFloat(document.getElementById('monthlyBudget')?.value || 0);
    const cats = {};
    ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'].forEach(cat => {
        const el = document.getElementById('budget_' + cat);
        if (el) cats[cat] = parseFloat(el.value || 0);
    });
    try {
        await FinAI.BudgetService.save(State.user.uid, { monthly, categories: cats });
        State.budgets = { monthly, categories: cats };
        State.insights = AIEngine.generateInsights(State.expenses, State.budgets, State.currentMonth, State.currentYear);
        showToast('Budgets saved!', 'success');
        renderPage('budget');
    } catch { showToast('Failed to save budgets', 'error'); }
}

// ── Settings Save ──
async function saveSettings() {
    const name = document.getElementById('settingName')?.value?.trim();
    if (name) {
        const stored = JSON.parse(localStorage.getItem('finai-user') || '{}');
        stored.displayName = name;
        localStorage.setItem('finai-user', JSON.stringify(stored));
        State.user.displayName = name;
        updateUserUI();
    }
    showToast('Settings saved!', 'success');
}

async function clearAllData() {
    if (!confirm('Delete ALL your expenses? This cannot be undone!')) return;
    localStorage.removeItem(`finai-expenses-${State.user.uid}`);
    State.expenses = [];
    State.insights = AIEngine.generateInsights([], State.budgets, State.currentMonth, State.currentYear);
    showToast('All data cleared', 'info');
    renderPage(State.currentPage);
}


// ── Data Export ──
async function handleExportData() {
    const btn = document.getElementById('exportDataBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Exporting...'; }
    try {
        const result = await FinAI.DataTransferService.exportData(State.user.uid);
        showToast(`Exported ${result.expenses.length} expenses successfully!`, 'success');
    } catch (err) {
        showToast('Export failed: ' + err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⬇️ Export My Data'; }
    }
}

// ── Data Import ──
async function handleImportData(input) {
    const file = input.files[0];
    if (!file) return;
    const statusEl = document.getElementById('importStatus');
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = 'var(--text-muted)';
        statusEl.textContent = 'Importing data...';
    }
    try {
        const text = await file.text();
        const result = await FinAI.DataTransferService.importData(State.user.uid, text);
        if (statusEl) {
            statusEl.style.color = '#10b981';
            statusEl.textContent = `✅ Imported ${result.imported} new expenses (${result.total} total in file).`;
        }
        showToast(`✅ Imported ${result.imported} new expenses!`, 'success');
        await loadData();
        renderPage(State.currentPage);
    } catch (err) {
        if (statusEl) {
            statusEl.style.color = '#f43f5e';
            statusEl.textContent = '❌ ' + err.message;
        }
        showToast('Import failed: ' + err.message, 'error');
    }
    // Reset file input so same file can be re-imported if needed
    input.value = '';
}
