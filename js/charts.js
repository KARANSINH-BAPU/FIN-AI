// ── CHART INITIALIZATION ──

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        text: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        tooltip: {
            bg: isDark ? 'rgba(15,15,26,0.95)' : 'rgba(255,255,255,0.95)',
            border: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
            title: isDark ? '#f1f5f9' : '#0f172a',
            body: isDark ? '#94a3b8' : '#475569'
        }
    };
}

function makeGradient(ctx, color1, color2, h = 300) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, color1);
    g.addColorStop(1, color2);
    return g;
}

function initPageCharts(page) {
    switch (page) {
        case 'dashboard': initDashboardCharts(); break;
        case 'reports': initReportCharts(); break;
        case 'budget': initBudgetChart(); break;
    }
}

// ── Dashboard Charts ──
function initDashboardCharts() {
    initTrendChart();
    initPieChart();
}

function initTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const c = getChartColors();

    // Last 7 days data
    const days = [];
    const amounts = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayTotal = State.expenses
            .filter(e => e.date === dateStr)
            .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        days.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
        amounts.push(dayTotal);
    }

    const grad = makeGradient(ctx, 'rgba(99,102,241,0.4)', 'rgba(99,102,241,0)', 220);
    State.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Spending',
                data: amounts,
                borderColor: '#6366f1',
                backgroundColor: grad,
                borderWidth: 2.5,
                pointRadius: 5,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: c.tooltip.bg, borderColor: c.tooltip.border, borderWidth: 1,
                    titleColor: c.tooltip.title, bodyColor: c.tooltip.body, padding: 12,
                    callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}` }
                }
            },
            scales: {
                x: { grid: { color: c.grid }, ticks: { color: c.text, font: { size: 11 } } },
                y: { min: 0, suggestedMax: 500, grid: { color: c.grid }, ticks: { color: c.text, font: { size: 11 }, callback: v => '₹' + v } }
            }
        }
    });
}

function initPieChart() {
    const canvas = document.getElementById('pieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const monthExp = getMonthExpenses();
    const catTotals = {};
    monthExp.forEach(e => { catTotals[e.category || 'Other'] = (catTotals[e.category || 'Other'] || 0) + parseFloat(e.amount || 0); });

    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals);
    const colors = labels.map(l => (CAT_COLORS[l] || CAT_COLORS.Other)[0]);

    if (labels.length === 0) return;

    State.charts.pie = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}` } }
            }
        }
    });

    // Legend
    const legend = document.getElementById('pieLegend');
    if (legend) {
        legend.innerHTML = labels.map((l, i) =>
            `<div class="legend-item"><div class="legend-dot" style="background:${colors[i]}"></div>${l}</div>`
        ).join('');
    }
}

// ── Report Charts ──
function initReportCharts() {
    initBarChart();
    initDoughnutChart();
    initLineChart();
}

function initBarChart() {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const c = getChartColors();

    // Last 6 months
    const labels = [], data = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth(), y = d.getFullYear();
        const total = State.expenses
            .filter(e => { const ed = new Date(e.date); return ed.getMonth() === m && ed.getFullYear() === y; })
            .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        labels.push(d.toLocaleString('default', { month: 'short' }));
        data.push(Math.round(total));
    }

    State.charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Monthly Spending',
                data,
                backgroundColor: labels.map((_, i) => i === 5 ? '#6366f1' : 'rgba(99,102,241,0.3)'),
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}` } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: c.text } },
                y: { min: 0, suggestedMax: 1000, grid: { color: c.grid }, ticks: { color: c.text, callback: v => '₹' + v } }
            }
        }
    });
}

function initDoughnutChart() {
    const canvas = document.getElementById('doughnutChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const monthExp = getMonthExpenses();
    const catTotals = {};
    monthExp.forEach(e => { catTotals[e.category || 'Other'] = (catTotals[e.category || 'Other'] || 0) + parseFloat(e.amount || 0); });

    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals);
    const colors = labels.map(l => (CAT_COLORS[l] || CAT_COLORS.Other)[0]);

    if (!labels.length) return;

    State.charts.doughnut = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: {
                legend: { position: 'bottom', labels: { color: getChartColors().text, padding: 12, font: { size: 11 } } },
                tooltip: { callbacks: { label: ctx => `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}` } }
            }
        }
    });
}

function initLineChart() {
    const canvas = document.getElementById('lineChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const c = getChartColors();

    // Last 30 days
    const labels = [], data = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const total = State.expenses
            .filter(e => e.date === dateStr)
            .reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        labels.push(i % 5 === 0 ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
        data.push(total);
    }

    const grad = makeGradient(ctx, 'rgba(168,85,247,0.3)', 'rgba(168,85,247,0)', 240);
    State.charts.line = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Daily Spending',
                data,
                borderColor: '#a855f7',
                backgroundColor: grad,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}` } }
            },
            scales: {
                x: { grid: { color: c.grid }, ticks: { color: c.text, font: { size: 10 } } },
                y: { min: 0, suggestedMax: 500, grid: { color: c.grid }, ticks: { color: c.text, callback: v => '₹' + v } }
            }
        }
    });
}

// ── Budget Chart ──
function initBudgetChart() {
    const canvas = document.getElementById('budgetChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const c = getChartColors();
    const monthExp = getMonthExpenses();
    const catTotals = {};
    monthExp.forEach(e => { catTotals[e.category || 'Other'] = (catTotals[e.category || 'Other'] || 0) + parseFloat(e.amount || 0); });

    const cats = Object.keys(State.budgets.categories || {}).filter(k => (State.budgets.categories[k] || 0) > 0);
    if (!cats.length) return;

    const spent = cats.map(c => Math.round(catTotals[c] || 0));
    const budgets = cats.map(c => State.budgets.categories[c] || 0);
    const colors = cats.map(c => (CAT_COLORS[c] || CAT_COLORS.Other)[0]);

    State.charts.budget = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cats,
            datasets: [
                { label: 'Spent', data: spent, backgroundColor: colors, borderRadius: 6, borderSkipped: false },
                { label: 'Budget', data: budgets, backgroundColor: colors.map(c => c + '33'), borderRadius: 6, borderSkipped: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: c.text, font: { size: 11 } } },
                tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}` } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: c.text, font: { size: 10 } } },
                y: { min: 0, grid: { color: c.grid }, ticks: { color: c.text, callback: v => '₹' + v } }
            }
        }
    });
}
