// ── RENDER FUNCTIONS ──

// ── Dashboard Page ──
function renderDashboard() {
  const monthExp = getMonthExpenses();
  const totalSpent = monthExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const budget = State.budgets.monthly || 0;
  const savings = Math.max(0, budget - totalSpent);
  const summary = State.insights?.summary || {};
  const health = State.insights?.healthScore || { score: 0, label: 'N/A', color: '#94a3b8' };
  const topCats = State.insights?.topCategories || [];
  const alerts = State.insights?.riskAlerts || [];
  const recentExp = State.expenses.slice(0, 6);

  const changeSign = summary.changePercent > 0 ? '+' : '';
  const changeTrend = summary.changePercent > 0 ? 'down' : 'up';

  return `
  ${alerts.length ? `<div style="margin-bottom:16px;display:flex;flex-direction:column;gap:8px">
    ${alerts.map(a => `<div style="padding:12px 16px;border-radius:12px;font-size:0.85rem;font-weight:600;
      background:${a.level === 'critical' ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)'};
      border:1px solid ${a.level === 'critical' ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)'};
      color:${a.level === 'critical' ? '#f43f5e' : '#f59e0b'}">${a.message}</div>`).join('')}
  </div>` : ''}

  <div class="stats-grid">
    <div class="stat-card" style="--card-gradient:linear-gradient(135deg,#6366f1,#a855f7)">
      <div class="stat-card-header">
        <div class="stat-card-icon" style="background:rgba(99,102,241,0.15)">💰</div>
        <div class="stat-card-trend ${changeTrend}">${changeSign}${summary.changePercent || 0}%</div>
      </div>
      <div class="stat-card-value">${formatCurrency(totalSpent)}</div>
      <div class="stat-card-label">Spent This Month</div>
    </div>
    <div class="stat-card" style="--card-gradient:linear-gradient(135deg,#10b981,#06b6d4)">
      <div class="stat-card-header">
        <div class="stat-card-icon" style="background:rgba(16,185,129,0.15)">🎯</div>
        <div class="stat-card-trend up">${budget > 0 ? Math.round(totalSpent / budget * 100) : 0}%</div>
      </div>
      <div class="stat-card-value">${formatCurrency(budget)}</div>
      <div class="stat-card-label">Monthly Budget</div>
    </div>
    <div class="stat-card" style="--card-gradient:linear-gradient(135deg,#f59e0b,#ef4444)">
      <div class="stat-card-header">
        <div class="stat-card-icon" style="background:rgba(245,158,11,0.15)">📈</div>
      </div>
      <div class="stat-card-value">${formatCurrency(savings)}</div>
      <div class="stat-card-label">Savings This Month</div>
    </div>
    <div class="stat-card" style="--card-gradient:linear-gradient(135deg,#ec4899,#8b5cf6)">
      <div class="stat-card-header">
        <div class="stat-card-icon" style="background:rgba(236,72,153,0.15)">🏆</div>
        <div class="stat-card-trend ${health.score >= 60 ? 'up' : 'down'}">${health.label}</div>
      </div>
      <div class="stat-card-value" style="color:${health.color}">${health.score}</div>
      <div class="stat-card-label">Health Score</div>
    </div>
  </div>

  <div class="dashboard-grid-3">
    <div class="glass-card">
      <div class="card-header">
        <div><div class="card-title">Spending Trend</div><div class="card-subtitle">Last 7 days</div></div>
        <button class="card-action" onclick="navigateTo('reports')">View All →</button>
      </div>
      <div class="card-body"><div class="chart-container" style="height:220px"><canvas id="trendChart"></canvas></div></div>
    </div>
    <div class="glass-card">
      <div class="card-header">
        <div><div class="card-title">By Category</div><div class="card-subtitle">This month</div></div>
      </div>
      <div class="card-body"><div class="chart-container" style="height:180px"><canvas id="pieChart"></canvas></div>
        <div class="chart-legend" id="pieLegend"></div>
      </div>
    </div>
  </div>

  <div class="dashboard-grid">
    <div class="glass-card">
      <div class="card-header">
        <div><div class="card-title">Recent Transactions</div><div class="card-subtitle">${recentExp.length} latest</div></div>
        <button class="card-action" onclick="navigateTo('expenses')">View All →</button>
      </div>
      <div class="card-body">
        ${recentExp.length === 0 ? `<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">No expenses yet</div><div class="empty-desc">Add your first expense to get started</div></div>` :
      `<div class="expense-list">${recentExp.map(e => renderExpenseItem(e)).join('')}</div>`}
      </div>
    </div>
    <div class="glass-card">
      <div class="card-header">
        <div><div class="card-title">🤖 AI Insights</div><div class="card-subtitle">Smart analysis</div></div>
        <button class="card-action" onclick="navigateTo('ai')">More →</button>
      </div>
      <div class="card-body">
        <div class="ai-insight-card">
          <div class="ai-insight-header">
            <div class="ai-insight-badge"><div class="ai-dot"></div>AI Engine Active</div>
          </div>
          <div class="ai-insight-text">${summary.message || 'Add expenses to get AI insights.'}</div>
          <div class="ai-insight-list">
            ${(State.insights?.savingsSuggestions || []).slice(0, 2).map(s =>
        `<div class="ai-insight-item"><span class="ai-insight-item-icon">💡</span><span>${s.message}</span></div>`
      ).join('')}
            ${State.insights?.weekdayVsWeekend?.message ?
      `<div class="ai-insight-item"><span class="ai-insight-item-icon">📅</span><span>${State.insights.weekdayVsWeekend.message}</span></div>` : ''}
          </div>
        </div>
        ${budget > 0 ? `
        <div style="margin-top:16px">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:6px">
            <span style="color:var(--text-muted)">Budget Used</span>
            <span style="font-weight:600">${formatCurrency(totalSpent)} / ${formatCurrency(budget)}</span>
          </div>
          <div class="budget-bar">
            <div class="budget-fill ${totalSpent / budget > 1 ? 'danger' : totalSpent / budget > 0.8 ? 'warning' : 'safe'}"
              style="width:${Math.min(totalSpent / budget * 100, 100)}%"></div>
          </div>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

// ── Expense Item HTML ──
function renderExpenseItem(e) {
  const { color, bg } = getCatStyle(e.category);
  return `<div class="expense-item">
    <div class="expense-cat-icon" style="background:${bg};color:${color}">${CAT_ICONS[e.category] || '📦'}</div>
    <div class="expense-info">
      <div class="expense-title">${e.title || 'Expense'}</div>
      <div class="expense-meta"><span>${formatDate(e.date)}</span><span>${e.paymentMode || ''}</span>
        <span class="cat-badge" style="background:${bg};color:${color}">${e.category || 'Other'}</span>
      </div>
    </div>
    <div class="expense-amount negative">${formatCurrency(e.amount)}</div>
    <div class="expense-actions">
      <button class="btn btn-ghost btn-icon btn-sm" onclick="openEditExpenseModal('${e.id}')" title="Edit">✏️</button>
      <button class="btn btn-danger btn-icon btn-sm" onclick="openDeleteModal('${e.id}')" title="Delete">🗑️</button>
    </div>
  </div>`;
}

// ── Expenses Page ──
function renderExpenses() {
  const cats = ['All', 'Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];
  return `
  <div class="filter-bar">
    <div class="search-input-wrap">
      <span class="search-icon">🔍</span>
      <input class="search-input" id="expSearch" placeholder="Search expenses..." oninput="filterExpenses()" />
    </div>
    <select class="filter-select" id="expCatFilter" onchange="filterExpenses()">
      ${cats.map(c => `<option value="${c}">${c === 'All' ? '📋 All Categories' : CAT_ICONS[c] + ' ' + c}</option>`).join('')}
    </select>
    <select class="filter-select" id="expMonthFilter" onchange="filterExpenses()">
      ${getLast6Months().map(m => `<option value="${m.value}" ${m.value === `${State.currentYear}-${String(State.currentMonth + 1).padStart(2, '0')}` ? 'selected' : ''}>${m.label}</option>`).join('')}
    </select>
    <button class="btn btn-primary btn-sm" onclick="openAddExpenseModal()">+ Add</button>
    <button class="btn btn-ghost btn-sm" onclick="downloadPDF()">📄 PDF</button>
  </div>
  <div class="glass-card">
    <div class="card-header">
      <div><div class="card-title">All Transactions</div><div class="card-subtitle" id="expCount">${State.expenses.length} total</div></div>
    </div>
    <div class="card-body">
      <div class="expense-list" id="expenseListContainer">
        ${State.expenses.length === 0
      ? `<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">No expenses yet</div><div class="empty-desc">Click "+ Add" to record your first expense</div></div>`
      : State.expenses.map(e => renderExpenseItem(e)).join('')}
      </div>
    </div>
  </div>`;
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
    });
  }
  return months;
}

function filterExpenses() {
  const search = document.getElementById('expSearch')?.value.toLowerCase() || '';
  const cat = document.getElementById('expCatFilter')?.value || 'All';
  const monthVal = document.getElementById('expMonthFilter')?.value || '';
  let filtered = State.expenses;
  if (search) filtered = filtered.filter(e => (e.title || '').toLowerCase().includes(search));
  if (cat !== 'All') filtered = filtered.filter(e => e.category === cat);
  if (monthVal) {
    const [y, m] = monthVal.split('-').map(Number);
    filtered = filtered.filter(e => { const d = new Date(e.date); return d.getFullYear() === y && d.getMonth() === m - 1; });
  }
  const container = document.getElementById('expenseListContainer');
  const countEl = document.getElementById('expCount');
  if (countEl) countEl.textContent = `${filtered.length} results`;
  if (container) {
    container.innerHTML = filtered.length === 0
      ? `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No results</div><div class="empty-desc">Try adjusting your filters</div></div>`
      : filtered.map(e => renderExpenseItem(e)).join('');
  }
}

// ── Budget Page ──
function renderBudget() {
  const monthExp = getMonthExpenses();
  const catTotals = {};
  monthExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount || 0); });
  const cats = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Other'];

  return `
  <div class="dashboard-grid">
    <div class="glass-card">
      <div class="card-header"><div class="card-title">Monthly Budget</div></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Total Monthly Budget (₹)</label>
          <input type="number" id="monthlyBudget" class="form-input" value="${State.budgets.monthly || 0}" placeholder="20000" />
        </div>
        <div style="margin-top:8px">
          ${State.budgets.monthly > 0 ? (() => {
      const total = monthExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
      const pct = Math.min(total / State.budgets.monthly * 100, 100);
      const cls = pct > 100 ? 'danger' : pct > 80 ? 'warning' : 'safe';
      return `<div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:6px">
              <span style="color:var(--text-muted)">Used: ${formatCurrency(total)}</span>
              <span style="font-weight:600">${pct.toFixed(1)}%</span>
            </div>
            <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>`;
    })() : ''}
        </div>
        <div style="margin-top:24px">
          <div class="card-title" style="margin-bottom:16px">Category Budgets</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${cats.map(cat => {
      const spent = catTotals[cat] || 0;
      const budget = State.budgets.categories?.[cat] || 0;
      const pct = budget > 0 ? Math.min(spent / budget * 100, 100) : 0;
      const cls = pct > 100 ? 'danger' : pct > 80 ? 'warning' : 'safe';
      const { color, bg } = getCatStyle(cat);
      return `<div>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                  <span style="font-size:1.1rem">${CAT_ICONS[cat]}</span>
                  <span style="font-size:0.88rem;font-weight:600;flex:1">${cat}</span>
                  <input type="number" id="budget_${cat}" class="form-input" style="width:110px;padding:6px 10px;font-size:0.82rem"
                    value="${budget}" placeholder="0" />
                </div>
                ${budget > 0 ? `<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">
                  <span>Spent: ${formatCurrency(spent)}</span><span>${pct.toFixed(0)}%</span>
                </div>
                <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%;background:${color}"></div></div>` : ''}
              </div>`;
    }).join('')}
          </div>
        </div>
        <button class="btn btn-primary" style="margin-top:24px;width:100%" onclick="saveBudgets()">💾 Save Budgets</button>
      </div>
    </div>
    <div class="glass-card">
      <div class="card-header"><div class="card-title">Budget Overview</div></div>
      <div class="card-body">
        <div style="height:260px"><canvas id="budgetChart"></canvas></div>
        <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
          ${cats.filter(c => (State.budgets.categories?.[c] || 0) > 0).map(cat => {
      const spent = catTotals[cat] || 0;
      const budget = State.budgets.categories?.[cat] || 0;
      const { color } = getCatStyle(cat);
      return `<div style="display:flex;align-items:center;justify-content:space-between;font-size:0.82rem">
              <span>${CAT_ICONS[cat]} ${cat}</span>
              <span style="color:${spent > budget ? '#f43f5e' : color};font-weight:600">${formatCurrency(spent)} / ${formatCurrency(budget)}</span>
            </div>`;
    }).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

// ── Reports Page ──
function renderReports() {
  const monthExp = getMonthExpenses();
  const total = monthExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const summary = State.insights?.summary || {};
  return `
  <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
    <div class="page-tabs">
      <button class="page-tab active" onclick="switchReportTab('monthly',this)">Monthly</button>
      <button class="page-tab" onclick="switchReportTab('weekly',this)">Weekly</button>
      <button class="page-tab" onclick="switchReportTab('trend',this)">Trend</button>
    </div>
    <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="downloadPDF()">📄 Download PDF</button>
  </div>
  <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat-card" style="--card-gradient:var(--gradient-primary)">
      <div class="stat-card-header"><div class="stat-card-icon" style="background:rgba(99,102,241,0.15)">💸</div></div>
      <div class="stat-card-value">${formatCurrency(total)}</div>
      <div class="stat-card-label">Total This Month</div>
    </div>
    <div class="stat-card" style="--card-gradient:var(--gradient-green)">
      <div class="stat-card-header"><div class="stat-card-icon" style="background:rgba(16,185,129,0.15)">📋</div></div>
      <div class="stat-card-value">${monthExp.length}</div>
      <div class="stat-card-label">Transactions</div>
    </div>
    <div class="stat-card" style="--card-gradient:var(--gradient-red)">
      <div class="stat-card-header"><div class="stat-card-icon" style="background:rgba(244,63,94,0.15)">📊</div>
        <div class="stat-card-trend ${(summary.changePercent || 0) > 0 ? 'down' : 'up'}">${summary.changePercent > 0 ? '+' : ''}${summary.changePercent || 0}%</div>
      </div>
      <div class="stat-card-value">${formatCurrency(monthExp.length > 0 ? total / monthExp.length : 0)}</div>
      <div class="stat-card-label">Avg per Transaction</div>
    </div>
  </div>
  <div class="dashboard-grid">
    <div class="glass-card">
      <div class="card-header"><div class="card-title">Monthly Spending</div></div>
      <div class="card-body"><div style="height:260px"><canvas id="barChart"></canvas></div></div>
    </div>
    <div class="glass-card">
      <div class="card-header"><div class="card-title">Category Split</div></div>
      <div class="card-body"><div style="height:220px"><canvas id="doughnutChart"></canvas></div>
        <div class="chart-legend" id="doughnutLegend"></div>
      </div>
    </div>
  </div>
  <div class="glass-card">
    <div class="card-header"><div class="card-title">Spending Trend (Last 30 Days)</div></div>
    <div class="card-body"><div style="height:240px"><canvas id="lineChart"></canvas></div></div>
  </div>`;
}

function switchReportTab(tab, btn) {
  document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

// ── AI Page ──
function renderAI() {
  const ins = State.insights || {};
  const catIns = ins.categoryInsights || [];
  const suggestions = ins.savingsSuggestions || [];
  const alerts = ins.riskAlerts || [];
  const pred = ins.prediction || {};
  const ww = ins.weekdayVsWeekend || {};
  const pattern = ins.spendingPattern || {};

  return `
  <div class="ai-insight-card" style="margin-bottom:20px">
    <div class="ai-insight-header">
      <div class="ai-insight-badge"><div class="ai-dot"></div>FinAI Engine v1.0</div>
      <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25)">
        <div style="width:6px;height:6px;border-radius:50%;background:#10b981;animation:aiPulse 2s ease-in-out infinite"></div>
        <span style="font-size:0.72rem;font-weight:700;color:#10b981">GPT-3.5 Active</span>
      </div>
    </div>
    <div class="ai-insight-text" style="font-size:1rem">
      ${ins.gptInsight || ins.summary?.message || 'Add more expenses to unlock AI insights.'}
    </div>
  </div>

  ${ins.gptLoading ? `
  <div style="margin-bottom:20px;padding:14px 18px;border-radius:12px;background:rgba(99,102,241,0.06);border:1px dashed rgba(99,102,241,0.2);display:flex;align-items:center;gap:12px">
    <div style="width:8px;height:8px;border-radius:50%;background:#6366f1;animation:aiPulse 1.5s ease-in-out infinite;flex-shrink:0"></div>
    <span style="font-size:0.82rem;color:var(--text-muted)">GPT-3.5 is analyzing all your expenses... full insights will appear shortly.</span>
  </div>` : ''}
  <div class="dashboard-grid">
    <div class="glass-card">
      <div class="card-header">
        <div class="card-title">📊 Category Analysis</div>
        ${ins.gptCategoryInsights?.length ? `<span style="font-size:0.7rem;padding:2px 8px;border-radius:99px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-weight:700">✨ GPT</span>` : ''}
      </div>
      <div class="card-body">
        ${(() => {
      const data = ins.gptCategoryInsights?.length ? ins.gptCategoryInsights : catIns;
      if (data.length === 0) {
        return ins.gptLoading
          ? [1, 2, 3].map(() => `<div style="padding:14px;border-radius:10px;margin-bottom:10px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.1)"><div style="height:10px;border-radius:6px;background:rgba(99,102,241,0.15);width:60%;margin-bottom:8px;animation:aiPulse 1.5s ease-in-out infinite"></div><div style="height:8px;border-radius:6px;background:rgba(99,102,241,0.08);width:90%;animation:aiPulse 1.5s ease-in-out infinite"></div></div>`).join('')
          : `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Not enough data</div><div class="empty-desc">Add expenses for 2+ months to see category comparisons</div></div>`;
      }
      return data.map(c => `<div class="ai-insight-card" style="margin-bottom:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:1.2rem">${CAT_ICONS[c.category] || '📦'}</span><strong>${c.category}</strong><span style="margin-left:auto;font-weight:700;color:${(c.change || 0) > 0 ? '#f43f5e' : '#10b981'}">${(c.change || 0) > 0 ? '+' : ''}${c.change || 0}%</span></div><div style="font-size:0.85rem;color:var(--text-secondary)">${c.message}</div></div>`).join('');
    })()}
      </div>
    </div>
    <div class="glass-card">
      <div class="card-header">
        <div class="card-title">💡 Savings Suggestions</div>
        ${ins.gptSavingsSuggestions?.length ? `<span style="font-size:0.7rem;padding:2px 8px;border-radius:99px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-weight:700">✨ GPT</span>` : ''}
      </div>
      <div class="card-body">
        ${(() => {
      const data = ins.gptSavingsSuggestions?.length ? ins.gptSavingsSuggestions : suggestions;
      if (data.length === 0) {
        return ins.gptLoading
          ? [1, 2, 3].map(() => `<div style="padding:14px;border-radius:10px;margin-bottom:10px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.1)"><div style="height:10px;border-radius:6px;background:rgba(16,185,129,0.15);width:50%;margin-bottom:8px;animation:aiPulse 1.5s ease-in-out infinite"></div><div style="height:8px;border-radius:6px;background:rgba(16,185,129,0.08);width:85%;animation:aiPulse 1.5s ease-in-out infinite"></div></div>`).join('')
          : `<div class="empty-state"><div class="empty-icon">💡</div><div class="empty-title">All good!</div><div class="empty-desc">Your spending looks well-managed</div></div>`;
      }
      return data.map(s => `<div class="ai-insight-card" style="margin-bottom:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span>💡</span><strong>${s.saveable ? 'Save ' + formatCurrency(s.saveable) : (CAT_ICONS[s.category] || '💡') + ' ' + (s.category || 'Tip')}</strong></div><div style="font-size:0.85rem;color:var(--text-secondary)">${s.message}</div></div>`).join('');
    })()}
      </div>
    </div>
  </div>
  <div class="dashboard-grid">
    <div class="glass-card">
      <div class="card-header">
        <div class="card-title">🔮 Prediction</div>
        ${ins.gptPrediction ? `<span style="font-size:0.7rem;padding:2px 8px;border-radius:99px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-weight:700">✨ GPT</span>` : ''}
      </div>
      <div class="card-body">
        <div style="text-align:center;padding:20px 0">
          ${ins.gptLoading && !ins.gptPrediction && !pred.predicted
      ? `<div style="height:48px;border-radius:12px;background:rgba(99,102,241,0.1);width:60%;margin:0 auto 12px;animation:aiPulse 1.5s ease-in-out infinite"></div><div style="height:12px;border-radius:6px;background:rgba(99,102,241,0.07);width:80%;margin:0 auto;animation:aiPulse 1.5s ease-in-out infinite"></div>`
      : `<div style="font-size:2.5rem;font-weight:800;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${formatCurrency((ins.gptPrediction || pred).predicted || 0)}</div>
               <div style="color:var(--text-muted);margin:8px 0">Predicted next month spending</div>
               <div style="font-size:0.8rem;padding:4px 12px;border-radius:99px;display:inline-block;background:rgba(99,102,241,0.1);color:#a5b4fc">Confidence: ${(ins.gptPrediction || pred).confidence || 'low'}</div>
               <div style="margin-top:16px;font-size:0.88rem;color:var(--text-secondary)">${(ins.gptPrediction || pred).message || ''}</div>`}
        </div>
      </div>
    </div>
    <div class="glass-card">
      <div class="card-header">
        <div class="card-title">📅 Weekday vs Weekend</div>
        ${ins.gptSpendingPattern ? `<span style="font-size:0.7rem;padding:2px 8px;border-radius:99px;background:rgba(99,102,241,0.15);color:#a5b4fc;font-weight:700">✨ GPT</span>` : ''}
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
          <div style="text-align:center;padding:16px;border-radius:12px;background:rgba(99,102,241,0.08)">
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">Weekdays</div>
            <div style="font-size:1.3rem;font-weight:700">${formatCurrency(ww.weekdayTotal || 0)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Avg: ${formatCurrency(ww.weekdayAvg || 0)}/day</div>
          </div>
          <div style="text-align:center;padding:16px;border-radius:12px;background:rgba(168,85,247,0.08)">
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:4px">Weekends</div>
            <div style="font-size:1.3rem;font-weight:700">${formatCurrency(ww.weekendTotal || 0)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Avg: ${formatCurrency(ww.weekendAvg || 0)}/day</div>
          </div>
        </div>
        <div style="font-size:0.85rem;color:var(--text-secondary)">${ww.message || ''}</div>
        <div style="margin-top:10px;font-size:0.85rem;color:var(--text-secondary);font-style:italic">${ins.gptSpendingPattern || pattern.message || ''}</div>
      </div>
    </div>
  </div>
  ${alerts.length ? `<div class="glass-card">
    <div class="card-header"><div class="card-title">🚨 Risk Alerts</div></div>
    <div class="card-body">${alerts.map(a => `<div style="padding:12px 16px;border-radius:12px;margin-bottom:8px;font-size:0.88rem;
      background:${a.level === 'critical' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)'};
      border:1px solid ${a.level === 'critical' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'};
      color:${a.level === 'critical' ? '#f43f5e' : '#f59e0b'}">${a.message}</div>`).join('')}</div>
  </div>` : ''}`;
}

// ── Health Score Page ──
function renderHealth() {
  const health = State.insights?.healthScore || { score: 0, label: 'N/A', color: '#94a3b8' };
  const monthExp = getMonthExpenses();
  const total = monthExp.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const budget = State.budgets.monthly || 1;
  const savingsRate = Math.max(0, Math.round((budget - total) / budget * 100));
  const budgetDiscipline = Math.max(0, Math.min(100, Math.round((1 - total / budget) * 100 + 50)));
  const circum = 2 * Math.PI * 54;
  const offset = circum - (health.score / 100) * circum;

  return `
  <div class="glass-card" style="margin-bottom:20px">
    <div class="card-body" style="padding:32px">
      <div class="health-score-wrap">
        <div class="health-score-circle">
          <svg viewBox="0 0 120 120" width="160" height="160">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="${health.color}" stroke-width="10"
              stroke-dasharray="${circum}" stroke-dashoffset="${offset}" stroke-linecap="round"
              transform="rotate(-90 60 60)" style="transition:stroke-dashoffset 1s ease"/>
          </svg>
          <div class="health-score-number">${health.score}</div>
        </div>
        <div class="health-score-details">
          <div class="health-score-label">Financial Health: <span style="color:${health.color}">${health.label}</span></div>
          <div class="health-score-desc">Your score is based on budget discipline, spending trends, and savings rate.</div>
          <div class="health-metrics">
            <div class="health-metric">
              <span class="health-metric-label">Savings Rate</span>
              <div class="health-metric-bar"><div class="health-metric-fill" style="width:${savingsRate}%;background:#10b981"></div></div>
              <span class="health-metric-val">${savingsRate}%</span>
            </div>
            <div class="health-metric">
              <span class="health-metric-label">Budget Discipline</span>
              <div class="health-metric-bar"><div class="health-metric-fill" style="width:${Math.min(budgetDiscipline, 100)}%;background:#6366f1"></div></div>
              <span class="health-metric-val">${Math.min(budgetDiscipline, 100)}%</span>
            </div>
            <div class="health-metric">
              <span class="health-metric-label">Consistency</span>
              <div class="health-metric-bar"><div class="health-metric-fill" style="width:${Math.min(monthExp.length * 3, 100)}%;background:#a855f7"></div></div>
              <span class="health-metric-val">${Math.min(monthExp.length * 3, 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="dashboard-grid">
    <div class="glass-card">
      <div class="card-header"><div class="card-title">Score Breakdown</div></div>
      <div class="card-body">
        ${[
      { label: 'Budget Adherence', score: total <= budget ? 100 : Math.max(0, 100 - Math.round((total - budget) / budget * 100)), icon: '🎯' },
      { label: 'Spending Trend', score: (State.insights?.summary?.changePercent || 0) < 0 ? 90 : 70, icon: '📈' },
      { label: 'Category Balance', score: 75, icon: '⚖️' },
      { label: 'Savings Rate', score: savingsRate, icon: '💰' }
    ].map(item => `<div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:0.88rem">${item.icon} ${item.label}</span>
            <span style="font-weight:700;color:${item.score >= 70 ? '#10b981' : item.score >= 40 ? '#f59e0b' : '#f43f5e'}">${item.score}/100</span>
          </div>
          <div class="budget-bar"><div class="budget-fill ${item.score >= 70 ? 'safe' : item.score >= 40 ? 'warning' : 'danger'}" style="width:${item.score}%"></div></div>
        </div>`).join('')}
      </div>
    </div>
    <div class="glass-card">
      <div class="card-header"><div class="card-title">Tips to Improve</div></div>
      <div class="card-body">
        ${[
      { icon: '💡', tip: 'Set category budgets to track spending limits' },
      { icon: '📅', tip: 'Review your expenses weekly to stay on track' },
      { icon: '🎯', tip: 'Keep spending under 80% of your monthly budget' },
      { icon: '📈', tip: 'Aim to reduce spending by 5% each month' },
      { icon: '💰', tip: 'Save at least 20% of your income each month' }
    ].map(t => `<div style="display:flex;gap:12px;padding:12px;border-radius:10px;margin-bottom:8px;background:rgba(255,255,255,0.03)">
          <span style="font-size:1.2rem">${t.icon}</span>
          <span style="font-size:0.88rem;color:var(--text-secondary)">${t.tip}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ── Settings Page ──
function renderSettings() {
  const u = State.user || {};
  return `
  <div style="max-width:600px">
    <div class="glass-card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title">👤 Profile</div></div>
      <div class="card-body">
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input type="text" id="settingName" class="form-input" value="${u.displayName || ''}" placeholder="Your name" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" value="${u.email || ''}" disabled style="opacity:0.6" />
        </div>
        <button class="btn btn-primary" onclick="saveSettings()">Save Changes</button>
      </div>
    </div>
    <div class="glass-card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title">🎨 Appearance</div></div>
      <div class="card-body">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:0.9rem;font-weight:600">Dark Mode</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Toggle between dark and light theme</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="toggleTheme()">
            ${document.documentElement.getAttribute('data-theme') === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
    </div>
    <div class="glass-card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title">🤖 AI Settings</div></div>
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:14px;padding:14px;border-radius:12px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2)">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">✨</div>
          <div style="flex:1">
            <div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:3px">GPT-3.5 Turbo — Active</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">AI-powered insights are enabled and running automatically</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25)">
            <div style="width:7px;height:7px;border-radius:50%;background:#10b981;animation:aiPulse 2s ease-in-out infinite"></div>
            <span style="font-size:0.75rem;font-weight:700;color:#10b981">Connected</span>
          </div>
        </div>
      </div>
    </div>
    <div class="glass-card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title">📦 Data Backup &amp; Sync</div></div>
      <div class="card-body">
        <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px;line-height:1.6">
          Your data is saved on this device. Use <strong style="color:var(--text-primary)">Export</strong> to download a backup file,
          then use <strong style="color:var(--text-primary)">Import</strong> on any other device to restore your expenses.
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" id="exportDataBtn" onclick="handleExportData()">⬇️ Export My Data</button>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer" for="importFileInput">⬆️ Import Backup</label>
          <input type="file" id="importFileInput" accept=".json" style="display:none" onchange="handleImportData(this)" />
        </div>
        <div id="importStatus" style="margin-top:12px;font-size:0.82rem;display:none"></div>
      </div>
    </div>
    <div class="glass-card">
      <div class="card-header"><div class="card-title">⚠️ Danger Zone</div></div>
      <div class="card-body">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:10px;background:rgba(244,63,94,0.05);border:1px solid rgba(244,63,94,0.15)">
          <div>
            <div style="font-size:0.9rem;font-weight:600;color:#f43f5e">Clear All Data</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Permanently delete all your expenses</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="clearAllData()">Clear Data</button>
        </div>
        <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:10px;background:rgba(244,63,94,0.05);border:1px solid rgba(244,63,94,0.15)">
          <div>
            <div style="font-size:0.9rem;font-weight:600;color:#f43f5e">Sign Out</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Sign out of your FinAI account</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="handleSignOut()">Sign Out</button>
        </div>
      </div>
    </div>
  </div>`;
}


