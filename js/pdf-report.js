/**
 * FinAI – PDF Report Generator (Clean Edition)
 * Uses jsPDF – avoids Unicode symbols unsupported by Helvetica
 * Currency shown as "Rs." instead of ₹ to prevent garbled output
 */

const PDFReporter = {

    async generate(data) {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) { alert('jsPDF not loaded. Please check your internet connection.'); return; }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210, H = 297;
        const ML = 18, MR = 18; // left/right margins
        const CW = W - ML - MR;  // content width
        let y = 0;

        const monthName = new Date(data.year, data.month).toLocaleString('default', { month: 'long' });

        // ── Palette ──
        const C = {
            indigo: [79, 70, 229],
            indigoL: [99, 102, 241],
            purple: [124, 58, 237],
            green: [5, 150, 105],
            red: [220, 38, 38],
            amber: [217, 119, 6],
            cyan: [8, 145, 178],
            slate: [30, 41, 59],
            slateM: [71, 85, 105],
            slateL: [148, 163, 184],
            white: [255, 255, 255],
            offWhite: [248, 250, 252],
            cardBg: [241, 245, 249],
            border: [226, 232, 240],
            headerBg: [238, 242, 255],
        };

        // ── Helpers ──
        const font = (sz, style = 'normal', color = C.slate) => {
            doc.setFontSize(sz);
            doc.setFont('helvetica', style);
            doc.setTextColor(...color);
        };
        const fill = (color) => doc.setFillColor(...color);
        const box = (x, yy, w, h, r = 0) => doc.roundedRect(x, yy, w, h, r, r, 'F');
        const hline = (yy, color = C.border) => {
            doc.setDrawColor(...color);
            doc.setLineWidth(0.3);
            doc.line(ML, yy, W - MR, yy);
        };
        // Format currency without rupee symbol
        const fmt = (n) => 'Rs. ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        // ══════════════════════════════════════════
        //  PAGE 1
        // ══════════════════════════════════════════

        // ── Header Band ──
        fill(C.indigo);
        box(0, 0, W, 52, 0);

        // Decorative accent strip
        fill(C.purple);
        box(0, 44, W, 8, 0);

        // Logo
        font(26, 'bold', C.white);
        doc.text('FinAI', ML, 22);
        font(9, 'normal', [180, 185, 255]);
        doc.text('AI Smart Expense Tracker', ML, 30);

        // User info – right aligned
        font(11, 'bold', C.white);
        doc.text(data.user?.displayName || 'FinAI User', W - MR, 20, { align: 'right' });
        font(8, 'normal', [180, 185, 255]);
        doc.text(data.user?.email || '', W - MR, 27, { align: 'right' });

        // Report title band
        font(16, 'bold', C.white);
        doc.text(monthName + ' ' + data.year + ' — Expense Report', ML, 42);

        y = 62;

        // Generated date
        font(8, 'normal', C.slateL);
        doc.text('Generated on ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), ML, y);
        y += 10;

        // ── Summary Cards ──
        const summary = data.insights?.summary || {};
        const totalSpent = summary.thisMonthTotal || 0;
        const totalBudget = data.budgets?.monthly || 0;
        const savings = Math.max(0, totalBudget - totalSpent);
        const txCount = summary.transactionCount || (data.expenses || []).length;

        const cards = [
            { label: 'Total Spent', value: fmt(totalSpent), color: C.red, icon: 'SPENT' },
            { label: 'Budget', value: fmt(totalBudget), color: C.indigo, icon: 'BUDGET' },
            { label: 'Savings', value: fmt(savings), color: C.green, icon: 'SAVED' },
            { label: 'Transactions', value: txCount + ' txns', color: C.amber, icon: 'TXN' },
        ];

        const cardW = (CW - 9) / 4;
        cards.forEach((card, i) => {
            const cx = ML + i * (cardW + 3);
            // Card shadow effect
            fill([220, 220, 230]);
            box(cx + 1, y + 1, cardW, 30, 4);
            // Card background
            fill(C.white);
            box(cx, y, cardW, 30, 4);
            // Top accent
            fill(card.color);
            box(cx, y, cardW, 3, 2);
            // Label
            font(7, 'normal', C.slateL);
            doc.text(card.label, cx + cardW / 2, y + 11, { align: 'center' });
            // Value
            font(9, 'bold', card.color);
            doc.text(card.value, cx + cardW / 2, y + 22, { align: 'center' });
        });

        y += 40;

        // ── Section: Budget Overview ──
        font(12, 'bold', C.slate);
        doc.text('Budget Overview', ML, y);
        hline(y + 3);
        y += 10;

        if (totalBudget > 0) {
            const pct = Math.min(totalSpent / totalBudget, 1);
            const barColor = pct >= 1 ? C.red : pct >= 0.8 ? C.amber : C.green;
            const barW = CW * pct;

            // Track
            fill(C.cardBg);
            box(ML, y, CW, 7, 3);
            // Fill
            fill(barColor);
            box(ML, y, Math.max(barW, 2), 7, 3);

            y += 11;
            font(8, 'normal', C.slateM);
            const pctLabel = (pct * 100).toFixed(1) + '% used  |  Spent: ' + fmt(totalSpent) + '  |  Budget: ' + fmt(totalBudget) + '  |  Remaining: ' + fmt(Math.max(0, totalBudget - totalSpent));
            doc.text(pctLabel, ML, y);
            y += 12;
        } else {
            font(8, 'italic', C.slateL);
            doc.text('No budget set for this month.', ML, y);
            y += 10;
        }

        // ── Section: Category Breakdown ──
        font(12, 'bold', C.slate);
        doc.text('Category Breakdown', ML, y);
        hline(y + 3);
        y += 10;

        const catColorMap = {
            Food: C.amber, Travel: C.indigoL, Shopping: [219, 39, 119],
            Bills: C.red, Health: C.green, Entertainment: C.purple,
            Education: C.cyan, Other: C.slateL
        };

        const catGroups = {};
        (data.expenses || []).forEach(e => {
            const cat = e.category || 'Other';
            catGroups[cat] = (catGroups[cat] || 0) + parseFloat(e.amount || 0);
        });

        const sortedCats = Object.entries(catGroups).sort(([, a], [, b]) => b - a);

        if (sortedCats.length === 0) {
            font(8, 'italic', C.slateL);
            doc.text('No expenses recorded this month.', ML, y);
            y += 10;
        } else {
            const colW = (CW - 6) / 2;
            const rowH = 18;

            sortedCats.forEach(([cat, amt], i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const cx = ML + col * (colW + 6);
                const cy = y + row * rowH;

                if (cy + rowH > H - 40) return; // overflow guard

                const pct = totalSpent > 0 ? (amt / totalSpent * 100).toFixed(1) : '0.0';
                const catColor = catColorMap[cat] || C.slateL;
                const barMaxW = colW - 10;
                const barFill = barMaxW * (parseFloat(pct) / 100);

                // Row background (alternating)
                if (row % 2 === 0) {
                    fill(C.offWhite);
                    box(cx, cy - 1, colW, rowH - 1, 2);
                }

                // Color dot
                doc.setFillColor(...catColor);
                doc.circle(cx + 4, cy + 5, 2.5, 'F');

                // Category name
                font(9, 'bold', C.slate);
                doc.text(cat, cx + 10, cy + 7);

                // Amount + pct
                font(8, 'normal', C.slateM);
                doc.text(fmt(amt) + '  (' + pct + '%)', cx + colW, cy + 7, { align: 'right' });

                // Mini progress bar
                fill(C.border);
                box(cx + 10, cy + 10, barMaxW, 3, 1);
                fill(catColor);
                box(cx + 10, cy + 10, Math.max(barFill, 1), 3, 1);
            });

            y += Math.ceil(sortedCats.length / 2) * rowH + 8;
        }

        // ── Section: AI Insights ──
        if (y < H - 70) {
            font(12, 'bold', C.slate);
            doc.text('AI Insights', ML, y);
            hline(y + 3);
            y += 10;

            // Insight box
            fill(C.headerBg);
            const insightText = data.insights?.summary?.message || 'No AI insights available for this period.';
            const insightLines = doc.splitTextToSize(insightText, CW - 10);
            const boxH = insightLines.length * 5 + 14;
            box(ML, y, CW, boxH, 4);
            doc.setDrawColor(...C.indigoL);
            doc.setLineWidth(0.4);
            doc.roundedRect(ML, y, CW, boxH, 4, 4);

            font(8, 'normal', C.slate);
            doc.text(insightLines, ML + 5, y + 8);

            y += boxH + 4;

            // Prediction
            if (data.insights?.prediction?.message && y < H - 40) {
                const predLines = doc.splitTextToSize('Prediction: ' + data.insights.prediction.message, CW - 10);
                font(8, 'italic', C.slateM);
                doc.text(predLines, ML, y);
                y += predLines.length * 5 + 4;
            }
        }

        // ── Section: Financial Health Score ──
        if (data.insights?.healthScore && y < H - 40) {
            const hs = data.insights.healthScore;
            const scoreColor = hs.score >= 70 ? C.green : hs.score >= 40 ? C.amber : C.red;

            fill(C.cardBg);
            box(ML, y, CW, 22, 4);

            // Score bar background
            fill(C.border);
            box(ML + 5, y + 13, CW - 80, 4, 2);
            fill(scoreColor);
            box(ML + 5, y + 13, (CW - 80) * (hs.score / 100), 4, 2);

            font(9, 'bold', C.slate);
            doc.text('Financial Health Score', ML + 5, y + 9);
            font(14, 'bold', scoreColor);
            doc.text(hs.score + '/100', W - MR - 30, y + 10, { align: 'right' });
            font(9, 'normal', scoreColor);
            doc.text(hs.label || '', W - MR, y + 10, { align: 'right' });
            font(7, 'normal', C.slateL);
            doc.text('Scored on budget discipline, spending trends & savings rate', ML + 5, y + 20);

            y += 30;
        }

        // ══════════════════════════════════════════
        //  PAGE 2 – Transaction Table
        // ══════════════════════════════════════════
        const expenses = data.expenses || [];
        if (expenses.length > 0) {
            doc.addPage();
            y = 0;

            // Page header band
            fill(C.indigo);
            box(0, 0, W, 16, 0);
            font(9, 'bold', C.white);
            doc.text('FinAI  —  Transaction Details', ML, 11);
            font(8, 'normal', [180, 185, 255]);
            doc.text(monthName + ' ' + data.year, W - MR, 11, { align: 'right' });

            y = 26;
            font(12, 'bold', C.slate);
            doc.text('All Transactions  (' + expenses.length + ')', ML, y);
            hline(y + 3);
            y += 10;

            // Table header
            fill(C.indigo);
            box(ML, y, CW, 9, 2);
            font(7.5, 'bold', C.white);
            const cols = { date: ML + 3, title: ML + 28, cat: ML + 90, mode: ML + 128, amt: W - MR - 3 };
            doc.text('Date', cols.date, y + 6);
            doc.text('Title', cols.title, y + 6);
            doc.text('Category', cols.cat, y + 6);
            doc.text('Mode', cols.mode, y + 6);
            doc.text('Amount', cols.amt, y + 6, { align: 'right' });
            y += 11;

            const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
            let runningTotal = 0;

            sorted.forEach((exp, i) => {
                if (y > H - 22) {
                    // Footer on this page before adding new one
                    hline(H - 14, C.border);
                    font(7, 'normal', C.slateL);
                    doc.text('FinAI – AI Smart Expense Tracker', ML, H - 9);
                    doc.text('Page ' + doc.internal.getCurrentPageInfo().pageNumber, W - MR, H - 9, { align: 'right' });

                    doc.addPage();
                    y = 20;
                    // Repeat header
                    fill(C.indigo);
                    box(ML, y, CW, 9, 2);
                    font(7.5, 'bold', C.white);
                    doc.text('Date', cols.date, y + 6);
                    doc.text('Title', cols.title, y + 6);
                    doc.text('Category', cols.cat, y + 6);
                    doc.text('Mode', cols.mode, y + 6);
                    doc.text('Amount', cols.amt, y + 6, { align: 'right' });
                    y += 11;
                }

                const amt = parseFloat(exp.amount || 0);
                runningTotal += amt;
                const rowBg = i % 2 === 0 ? C.offWhite : C.white;
                fill(rowBg);
                box(ML, y - 2, CW, 9, 1);

                const dateStr = new Date(exp.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
                const title = (exp.title || 'Expense').substring(0, 28);
                const catColor = catColorMap[exp.category] || C.slateL;

                font(7.5, 'normal', C.slate);
                doc.text(dateStr, cols.date, y + 5);
                doc.text(title, cols.title, y + 5);

                // Category with color dot
                doc.setFillColor(...catColor);
                doc.circle(cols.cat + 2, y + 3.5, 1.5, 'F');
                font(7.5, 'normal', C.slateM);
                doc.text(exp.category || 'Other', cols.cat + 6, y + 5);
                doc.text(exp.paymentMode || 'Cash', cols.mode, y + 5);

                font(7.5, 'bold', C.red);
                doc.text(fmt(amt), cols.amt, y + 5, { align: 'right' });
                y += 9;
            });

            // Total row
            fill(C.slate);
            box(ML, y, CW, 10, 2);
            font(8.5, 'bold', C.white);
            doc.text('TOTAL  (' + expenses.length + ' transactions)', cols.date, y + 7);
            doc.text(fmt(runningTotal), cols.amt, y + 7, { align: 'right' });
            y += 14;

            // Savings summary
            if (totalBudget > 0) {
                fill(totalSpent <= totalBudget ? [220, 252, 231] : [254, 226, 226]);
                box(ML, y, CW, 10, 2);
                const savingsColor = totalSpent <= totalBudget ? C.green : C.red;
                font(8, 'bold', savingsColor);
                const savingsLabel = totalSpent <= totalBudget
                    ? 'You are within budget! Saved: ' + fmt(totalBudget - totalSpent)
                    : 'Over budget by: ' + fmt(totalSpent - totalBudget);
                doc.text(savingsLabel, ML + CW / 2, y + 7, { align: 'center' });
            }
        }

        // ── Footer on ALL pages ──
        const pageCount = doc.internal.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
            doc.setPage(p);
            hline(H - 12, C.border);
            font(7, 'normal', C.slateL);
            doc.text('Generated by FinAI – AI Smart Expense Tracker  |  Confidential', ML, H - 7);
            doc.text('Page ' + p + ' of ' + pageCount, W - MR, H - 7, { align: 'right' });
        }

        // ── Save ──
        const filename = 'FinAI_Report_' + monthName + '_' + data.year + '.pdf';
        doc.save(filename);
        return filename;
    }
};

window.PDFReporter = PDFReporter;
