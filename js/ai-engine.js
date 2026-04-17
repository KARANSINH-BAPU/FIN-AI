/**
 * FinAI – AI Insight Engine
 * Rule-based AI + OpenAI GPT-3.5-turbo powered insights
 * Generates smart financial insights, predictions, and recommendations
 */

// ── Hardcoded OpenAI API Key ──
const OPENAI_API_KEY = 'sk-proj-XA0q7E8H1hYToDoPJv89WgILsKmUlrq0l2hvB-xDVybXAMBQcbh6XiVWqMK3cBlWb4aMEdoQmrT3BlbkFJoOE6fM0a8PJBfnRYW6LZsHZP3ebIIlXCP9px3HxQV3LoyuivM65fMronbjtCosYQhE_UQks0A';

const AIEngine = {
    // ── Category Keywords for Auto-Categorization ──
    categoryKeywords: {
        Food: ['dominos', 'pizza', 'swiggy', 'zomato', 'mcdonalds', 'kfc', 'burger', 'restaurant',
            'cafe', 'coffee', 'starbucks', 'food', 'meal', 'lunch', 'dinner', 'breakfast',
            'biryani', 'chai', 'tea', 'snack', 'grocery', 'vegetables', 'fruits', 'milk',
            'bread', 'rice', 'dal', 'sabzi', 'hotel', 'dhaba', 'canteen'],
        Travel: ['uber', 'ola', 'rapido', 'auto', 'taxi', 'bus', 'train', 'metro', 'flight',
            'irctc', 'petrol', 'diesel', 'fuel', 'parking', 'toll', 'cab', 'rickshaw',
            'makemytrip', 'goibibo', 'redbus', 'travel', 'trip', 'journey', 'transport'],
        Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'clothes', 'shirt', 'shoes',
            'dress', 'jeans', 'fashion', 'mall', 'market', 'shop', 'purchase', 'buy',
            'electronics', 'mobile', 'laptop', 'gadget', 'accessories', 'bag', 'watch'],
        Bills: ['electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'mobile recharge',
            'phone bill', 'rent', 'emi', 'loan', 'insurance', 'subscription', 'netflix',
            'spotify', 'amazon prime', 'hotstar', 'youtube premium', 'maintenance', 'society'],
        Health: ['doctor', 'hospital', 'clinic', 'medicine', 'pharmacy', 'medical', 'health',
            'gym', 'fitness', 'yoga', 'dentist', 'chemist', 'tablet', 'injection',
            'apollo', 'fortis', 'max hospital', 'diagnostic', 'test', 'blood test'],
        Entertainment: ['movie', 'cinema', 'pvr', 'inox', 'bookmyshow', 'concert', 'event',
            'game', 'gaming', 'steam', 'playstation', 'xbox', 'party', 'club',
            'bar', 'pub', 'outing', 'picnic', 'amusement', 'fun', 'entertainment'],
        Education: ['course', 'udemy', 'coursera', 'book', 'stationery', 'school', 'college',
            'tuition', 'coaching', 'exam', 'fee', 'education', 'study', 'learning',
            'workshop', 'seminar', 'training', 'certification', 'degree']
    },

    /**
     * Auto-categorize expense based on title
     * @param {string} title - Expense title
     * @returns {string} - Category name
     */
    autoCategory(title) {
        if (!title) return 'Other';
        const lower = title.toLowerCase();
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            if (keywords.some(kw => lower.includes(kw))) {
                return category;
            }
        }
        return 'Other';
    },

    /**
     * Generate comprehensive AI insights from expense data
     * @param {Array} expenses - All expenses
     * @param {Object} budgets - Budget configuration
     * @param {number} currentMonth - 0-indexed month
     * @param {number} currentYear - Full year
     * @returns {Object} - Insights object
     */
    generateInsights(expenses, budgets, currentMonth, currentYear) {
        const thisMonth = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const lastMonth = expenses.filter(e => {
            const d = new Date(e.date);
            const lm = currentMonth === 0 ? 11 : currentMonth - 1;
            const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lm && d.getFullYear() === ly;
        });

        const insights = {
            summary: this._generateSummary(thisMonth, lastMonth, budgets),
            categoryInsights: this._generateCategoryInsights(thisMonth, lastMonth),
            weekdayVsWeekend: this._analyzeWeekdayVsWeekend(thisMonth),
            prediction: this._predictNextMonth(expenses, currentMonth, currentYear),
            savingsSuggestions: this._generateSavingsSuggestions(thisMonth, budgets),
            riskAlerts: this._generateRiskAlerts(thisMonth, budgets),
            topCategories: this._getTopCategories(thisMonth),
            spendingPattern: this._analyzeSpendingPattern(thisMonth),
            healthScore: this._calculateHealthScore(thisMonth, lastMonth, budgets),
            gptLoading: true
        };

        // Kick off GPT enrichment — populates ALL sections when ready
        this.getOpenAIInsight(thisMonth, budgets, OPENAI_API_KEY).then(gptData => {
            if (gptData) {
                insights.gptInsight = gptData.summary || null;
                insights.gptLoading = false;

                // Merge GPT data into insights — only fill empty rule-based sections
                if (gptData.categoryInsights?.length) {
                    insights.gptCategoryInsights = gptData.categoryInsights;
                }
                if (gptData.savingsSuggestions?.length) {
                    insights.gptSavingsSuggestions = gptData.savingsSuggestions;
                }
                if (gptData.prediction) {
                    insights.gptPrediction = gptData.prediction;
                }
                if (gptData.spendingPattern) {
                    insights.gptSpendingPattern = gptData.spendingPattern;
                }

                if (window.State) {
                    window.State.insights = insights;
                    if (window.State.currentPage === 'ai') {
                        if (typeof renderPage === 'function') renderPage('ai');
                    }
                }
            } else {
                insights.gptLoading = false;
            }
        }).catch(() => { insights.gptLoading = false; });

        return insights;
    },

    _generateSummary(thisMonth, lastMonth, budgets) {
        const thisTotal = thisMonth.reduce((s, e) => s + parseFloat(e.amount), 0);
        const lastTotal = lastMonth.reduce((s, e) => s + parseFloat(e.amount), 0);
        const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal * 100).toFixed(1) : 0;
        const budgetUsed = budgets.monthly > 0 ? (thisTotal / budgets.monthly * 100).toFixed(1) : 0;

        let message = '';
        if (change > 20) {
            message = `⚠️ Your spending is up ${change}% compared to last month. Consider reviewing your expenses.`;
        } else if (change > 0) {
            message = `📊 Spending increased by ${change}% this month. You're within a manageable range.`;
        } else if (change < -10) {
            message = `🎉 Great job! You've reduced spending by ${Math.abs(change)}% compared to last month.`;
        } else {
            message = `✅ Your spending is stable this month, consistent with last month's pattern.`;
        }

        return {
            thisMonthTotal: thisTotal,
            lastMonthTotal: lastTotal,
            changePercent: parseFloat(change),
            budgetUsedPercent: parseFloat(budgetUsed),
            message,
            transactionCount: thisMonth.length
        };
    },

    _generateCategoryInsights(thisMonth, lastMonth) {
        const thisCategories = this._groupByCategory(thisMonth);
        const lastCategories = this._groupByCategory(lastMonth);
        const insights = [];

        for (const [cat, thisAmt] of Object.entries(thisCategories)) {
            const lastAmt = lastCategories[cat] || 0;
            if (lastAmt > 0) {
                const change = ((thisAmt - lastAmt) / lastAmt * 100).toFixed(1);
                if (Math.abs(change) > 15) {
                    insights.push({
                        category: cat,
                        thisMonth: thisAmt,
                        lastMonth: lastAmt,
                        change: parseFloat(change),
                        message: change > 0
                            ? `You spend ${change}% more on ${cat} compared to last month.`
                            : `You've reduced ${cat} spending by ${Math.abs(change)}% — great discipline!`
                    });
                }
            }
        }
        return insights.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
    },

    _analyzeWeekdayVsWeekend(expenses) {
        let weekdayTotal = 0, weekendTotal = 0;
        let weekdayCount = 0, weekendCount = 0;

        expenses.forEach(e => {
            const day = new Date(e.date).getDay();
            const amt = parseFloat(e.amount);
            if (day === 0 || day === 6) {
                weekendTotal += amt; weekendCount++;
            } else {
                weekdayTotal += amt; weekdayCount++;
            }
        });

        const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
        const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;
        const ratio = weekdayAvg > 0 ? (weekendAvg / weekdayAvg).toFixed(2) : 1;

        return {
            weekdayTotal: Math.round(weekdayTotal),
            weekendTotal: Math.round(weekendTotal),
            weekdayAvg: Math.round(weekdayAvg),
            weekendAvg: Math.round(weekendAvg),
            ratio: parseFloat(ratio),
            message: ratio > 1.3
                ? `Your weekend expenses are ${((ratio - 1) * 100).toFixed(0)}% higher than weekdays. Consider planning weekend activities better.`
                : `Your spending is fairly balanced between weekdays and weekends. Good discipline!`
        };
    },

    _predictNextMonth(expenses, currentMonth, currentYear) {
        // Simple moving average prediction
        const monthlyTotals = [];
        for (let i = 0; i < 3; i++) {
            const m = currentMonth - i < 0 ? currentMonth - i + 12 : currentMonth - i;
            const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
            const monthExp = expenses.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === m && d.getFullYear() === y;
            });
            const total = monthExp.reduce((s, e) => s + parseFloat(e.amount), 0);
            if (total > 0) monthlyTotals.push(total);
        }

        if (monthlyTotals.length === 0) return { predicted: 0, confidence: 'low', message: 'Not enough data for prediction.' };

        const avg = monthlyTotals.reduce((s, v) => s + v, 0) / monthlyTotals.length;
        const trend = monthlyTotals.length > 1 ? (monthlyTotals[0] - monthlyTotals[monthlyTotals.length - 1]) / monthlyTotals.length : 0;
        const predicted = Math.round(avg + trend * 0.5);
        const confidence = monthlyTotals.length >= 3 ? 'high' : monthlyTotals.length === 2 ? 'medium' : 'low';

        return {
            predicted,
            confidence,
            message: `Based on your spending trends, you'll likely spend ₹${predicted.toLocaleString('en-IN')} next month.`
        };
    },

    _generateSavingsSuggestions(expenses, budgets) {
        const suggestions = [];
        const categories = this._groupByCategory(expenses);

        // Check each category against budget
        for (const [cat, spent] of Object.entries(categories)) {
            const budget = budgets.categories?.[cat] || 0;
            if (budget > 0 && spent > budget * 0.8) {
                const overspend = spent - budget;
                const saveable = Math.round(spent * 0.2);
                suggestions.push({
                    category: cat,
                    spent,
                    budget,
                    saveable,
                    message: `Reducing ${cat} by 20% could save you ₹${saveable.toLocaleString('en-IN')} this month.`
                });
            }
        }

        // Food-specific suggestion
        if (categories.Food > 3000) {
            suggestions.push({
                category: 'Food',
                message: `Cooking at home 3 more days a week could save ₹${Math.round(categories.Food * 0.25).toLocaleString('en-IN')} monthly.`,
                saveable: Math.round(categories.Food * 0.25)
            });
        }

        return suggestions.slice(0, 4);
    },

    _generateRiskAlerts(expenses, budgets) {
        const alerts = [];
        const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
        const categories = this._groupByCategory(expenses);

        // Overall budget alert
        if (budgets.monthly > 0) {
            const pct = (total / budgets.monthly * 100).toFixed(0);
            if (pct >= 100) {
                alerts.push({ level: 'critical', message: `🚨 You've exceeded your monthly budget by ₹${(total - budgets.monthly).toLocaleString('en-IN')}!` });
            } else if (pct >= 80) {
                alerts.push({ level: 'warning', message: `⚠️ You've used ${pct}% of your monthly budget. Slow down spending!` });
            }
        }

        // Category alerts
        for (const [cat, spent] of Object.entries(categories)) {
            const budget = budgets.categories?.[cat];
            if (budget && spent >= budget) {
                alerts.push({ level: 'warning', message: `⚠️ ${cat} budget exceeded! Spent ₹${spent.toLocaleString('en-IN')} vs ₹${budget.toLocaleString('en-IN')} budget.` });
            }
        }

        return alerts;
    },

    _getTopCategories(expenses) {
        const categories = this._groupByCategory(expenses);
        return Object.entries(categories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([cat, amt]) => ({ category: cat, amount: amt }));
    },

    _analyzeSpendingPattern(expenses) {
        if (expenses.length === 0) return { pattern: 'none', message: 'No data available.' };

        // Group by day of month
        const byDay = {};
        expenses.forEach(e => {
            const day = new Date(e.date).getDate();
            byDay[day] = (byDay[day] || 0) + parseFloat(e.amount);
        });

        const days = Object.keys(byDay).map(Number);
        const earlyMonth = days.filter(d => d <= 10).length;
        const midMonth = days.filter(d => d > 10 && d <= 20).length;
        const lateMonth = days.filter(d => d > 20).length;

        let pattern = 'balanced';
        let message = 'Your spending is fairly distributed throughout the month.';

        if (earlyMonth > midMonth + lateMonth) {
            pattern = 'front-loaded';
            message = 'You tend to spend more at the start of the month. Consider spreading expenses evenly.';
        } else if (lateMonth > earlyMonth + midMonth) {
            pattern = 'back-loaded';
            message = 'You spend more towards month-end. This may cause cash flow issues.';
        }

        return { pattern, message, byDay };
    },

    _calculateHealthScore(thisMonth, lastMonth, budgets) {
        let score = 100;
        const thisTotal = thisMonth.reduce((s, e) => s + parseFloat(e.amount), 0);
        const lastTotal = lastMonth.reduce((s, e) => s + parseFloat(e.amount), 0);

        // Budget discipline (40 points)
        if (budgets.monthly > 0) {
            const budgetPct = thisTotal / budgets.monthly;
            if (budgetPct > 1.2) score -= 40;
            else if (budgetPct > 1.0) score -= 25;
            else if (budgetPct > 0.9) score -= 10;
            else if (budgetPct < 0.7) score += 5; // bonus for under-budget
        }

        // Spending trend (30 points)
        if (lastTotal > 0) {
            const change = (thisTotal - lastTotal) / lastTotal;
            if (change > 0.3) score -= 30;
            else if (change > 0.15) score -= 15;
            else if (change < -0.1) score += 5; // bonus for reduction
        }

        // Transaction frequency (20 points)
        if (thisMonth.length > 60) score -= 20;
        else if (thisMonth.length > 40) score -= 10;

        // Category diversity (10 points) - penalize if >60% in one category
        const categories = this._groupByCategory(thisMonth);
        const maxCatPct = Math.max(...Object.values(categories)) / (thisTotal || 1);
        if (maxCatPct > 0.6) score -= 10;

        score = Math.max(0, Math.min(100, Math.round(score)));

        let label, color;
        if (score >= 80) { label = 'Excellent'; color = '#10b981'; }
        else if (score >= 60) { label = 'Good'; color = '#6366f1'; }
        else if (score >= 40) { label = 'Fair'; color = '#f59e0b'; }
        else { label = 'Needs Work'; color = '#f43f5e'; }

        return { score, label, color };
    },

    _groupByCategory(expenses) {
        return expenses.reduce((acc, e) => {
            const cat = e.category || 'Other';
            acc[cat] = (acc[cat] || 0) + parseFloat(e.amount || 0);
            return acc;
        }, {});
    },

    // ── OpenAI GPT-3.5-turbo Integration ──
    async getOpenAIInsight(expenses, budgets, apiKey) {
        if (!apiKey || expenses.length === 0) return null;
        try {
            const topCats = this._getTopCategories(expenses).slice(0, 5);
            const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
            const catSummary = topCats.map(c => `${c.category}: Rs.${Math.round(c.amount)}`).join(', ');
            const monthlyBudget = budgets?.monthly || 0;
            const budgetInfo = monthlyBudget > 0 ? `Monthly budget: Rs.${monthlyBudget}` : 'No budget set';

            const prompt = `You are a smart personal finance advisor for an Indian user. Analyze their expense data and return a JSON object ONLY (no extra text).

Expense data:
- Total spent this month: Rs.${Math.round(totalSpent)}
- Top categories: ${catSummary}
- Number of transactions: ${expenses.length}
- ${budgetInfo}

Return this exact JSON structure:
{
  "summary": "2-3 sentence overall analysis of spending in a friendly tone",
  "categoryInsights": [
    { "category": "Food", "change": 15, "message": "specific insight about this category" },
    { "category": "Travel", "change": -10, "message": "specific insight" }
  ],
  "savingsSuggestions": [
    { "category": "Food", "saveable": 500, "message": "specific actionable tip to save money" },
    { "category": "Shopping", "saveable": 800, "message": "specific actionable tip" }
  ],
  "prediction": { "predicted": 12000, "confidence": "medium", "message": "next month prediction explanation" },
  "spendingPattern": "1-2 sentences about when/how they spend (weekdays vs weekends, start vs end of month)"
}

Focus on Indian spending habits, use Rs. for currency, be specific and actionable. Generate insights for ALL categories present.`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 700,
                    temperature: 0.7
                })
            });
            const data = await response.json();
            if (data.error) { console.warn('OpenAI:', data.error.message); return null; }
            const raw = data.choices?.[0]?.message?.content?.trim();
            if (!raw) return null;
            // Parse JSON from GPT response
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return { summary: raw };
            return JSON.parse(jsonMatch[0]);
        } catch (err) {
            console.error('OpenAI API error:', err);
            return null;
        }
    },

    // ── Voice Command Parser ──
    parseVoiceCommand(transcript) {
        const text = transcript.toLowerCase().trim();
        const result = { amount: null, title: null, category: null, date: new Date().toISOString().split('T')[0] };

        // Extract amount
        const amountMatch = text.match(/(?:₹|rs\.?|rupees?)?\s*(\d+(?:\.\d+)?)/i);
        if (amountMatch) result.amount = parseFloat(amountMatch[1]);

        // Extract title
        const titleMatch = text.match(/(?:for|on|spent on|paid for)\s+([a-z\s]+?)(?:\s+(?:at|from|in|worth|of|rs|₹|\d)|\s*$)/i);
        if (titleMatch) result.title = titleMatch[1].trim();

        // Auto-categorize
        if (result.title) result.category = this.autoCategory(result.title);

        return result;
    }
};

// Export
window.AIEngine = AIEngine;
