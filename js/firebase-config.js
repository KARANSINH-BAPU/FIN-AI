/**
 * FinAI – Firebase Configuration
 * Replace with your actual Firebase project credentials
 * Get these from: Firebase Console → Project Settings → Your Apps → Web App
 */

// ── Firebase Config ──
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAqfMAbJywFYFg0ULXXQCm4W8Ptowgl9WA",
    authDomain: "ai-expense-206e4.firebaseapp.com",
    projectId: "ai-expense-206e4",
    storageBucket: "ai-expense-206e4.firebasestorage.app",
    messagingSenderId: "415740875738",
    appId: "1:415740875738:web:de086c64bf36abdc0966e3",
    measurementId: "G-7T3JEY1FP2"

};

// ── Initialize Firebase ──
// Import these in your HTML before this script:
// <script type="module" src="js/firebase-config.js"></script>

// For CDN usage (non-module):
let db, auth, googleProvider;

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            // Avoid "already initialized" error on page re-loads
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            auth = firebase.auth();
            db = firebase.firestore();
            googleProvider = new firebase.auth.GoogleAuthProvider();
            console.log('✅ Firebase initialized successfully');
            return true;
        } else {
            console.warn('⚠️ Firebase SDK not loaded. Running in localStorage mode.');
        }
    } catch (err) {
        console.warn('⚠️ Firebase init error. Running in localStorage mode.', err.message);
    }
    return false;
}

// ── Firestore Collections ──
const COLLECTIONS = {
    USERS: 'users',
    EXPENSES: 'expenses',
    BUDGETS: 'budgets',
    INSIGHTS: 'insights'
};

// ── Auth Helpers ──
const AuthService = {
    async signUp(email, password, displayName) {
        if (!auth) return this._demoSignUp(email, displayName);
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName });
        await db.collection(COLLECTIONS.USERS).doc(cred.user.uid).set({
            displayName,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            theme: 'dark'
        });
        return cred.user;
    },

    async signIn(email, password) {
        if (!auth) return this._demoSignIn(email);
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return cred.user;
    },

    async signInWithGoogle() {
        if (!auth) return this._demoSignIn('demo@finai.app');
        const cred = await auth.signInWithPopup(googleProvider);
        // Create user doc if first time
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(cred.user.uid).get();
        if (!userDoc.exists) {
            await db.collection(COLLECTIONS.USERS).doc(cred.user.uid).set({
                displayName: cred.user.displayName,
                email: cred.user.email,
                photoURL: cred.user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                theme: 'dark'
            });
        }
        return cred.user;
    },

    async resetPassword(email) {
        if (!auth) { alert('Password reset email sent (demo mode)'); return; }
        await auth.sendPasswordResetEmail(email);
    },

    async signOut() {
        if (!auth) {
            localStorage.removeItem('finai-user');
            window.location.href = 'index.html';
            return;
        }
        await auth.signOut();
        localStorage.removeItem('finai-user');
        window.location.href = 'index.html';
    },

    onAuthStateChanged(callback) {
        if (!auth) {
            const user = this._getDemoUser();
            callback(user);
            return () => { };
        }
        return auth.onAuthStateChanged(callback);
    },

    getCurrentUser() {
        if (!auth) return this._getDemoUser();
        return auth.currentUser;
    },

    // Demo mode (no Firebase)
    _demoSignUp(email, displayName) {
        const user = { uid: 'demo-user-' + Date.now(), email, displayName, emailVerified: true };
        localStorage.setItem('finai-user', JSON.stringify(user));
        return user;
    },
    _demoSignIn(email) {
        const user = { uid: 'demo-user-001', email, displayName: 'Demo User', emailVerified: true };
        localStorage.setItem('finai-user', JSON.stringify(user));
        return user;
    },
    _getDemoUser() {
        const stored = localStorage.getItem('finai-user');
        return stored ? JSON.parse(stored) : null;
    }
};

// ── Firestore / LocalStorage Expense Service ──
// localStorage is ALWAYS used as the primary store (works on file://, no rules needed).
// Firestore sync is attempted as a bonus when available, but never blocks the UI.
const ExpenseService = {
    _getLocalExpenses(uid) {
        const key = `finai-expenses-${uid}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    },
    _saveLocalExpenses(uid, expenses) {
        localStorage.setItem(`finai-expenses-${uid}`, JSON.stringify(expenses));
    },

    async add(uid, expense) {
        const newExpense = {
            ...expense,
            id: 'exp-' + Date.now(),
            createdAt: new Date().toISOString(),
            uid
        };
        // Always save to localStorage first (guaranteed to work)
        const expenses = this._getLocalExpenses(uid);
        expenses.unshift(newExpense);
        this._saveLocalExpenses(uid, expenses);

        // Optionally sync to Firestore (best-effort, never blocks)
        if (db) {
            try {
                const ref = await db.collection(COLLECTIONS.EXPENSES).add({
                    ...newExpense,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                // Update the localStorage id to match Firestore doc id
                newExpense.id = ref.id;
                expenses[0].id = ref.id;
                this._saveLocalExpenses(uid, expenses);
            } catch (e) {
                console.warn('Firestore sync failed (using localStorage):', e.message);
            }
        }
        return newExpense;
    },

    async update(uid, id, updates) {
        // Always update localStorage
        const expenses = this._getLocalExpenses(uid);
        const idx = expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], ...updates, updatedAt: new Date().toISOString() };
            this._saveLocalExpenses(uid, expenses);
        }
        // Optionally sync to Firestore
        if (db) {
            try {
                await db.collection(COLLECTIONS.EXPENSES).doc(id).update({
                    ...updates,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } catch (e) {
                console.warn('Firestore update sync failed:', e.message);
            }
        }
    },

    async delete(uid, id) {
        // Always delete from localStorage
        const expenses = this._getLocalExpenses(uid).filter(e => e.id !== id);
        this._saveLocalExpenses(uid, expenses);
        // Optionally sync to Firestore
        if (db) {
            try {
                await db.collection(COLLECTIONS.EXPENSES).doc(id).delete();
            } catch (e) {
                console.warn('Firestore delete sync failed:', e.message);
            }
        }
    },

    async getAll(uid) {
        // Always read from localStorage (fast, reliable)
        return this._getLocalExpenses(uid);
    },

    async getByMonth(uid, year, month) {
        const all = await this.getAll(uid);
        return all.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    }
};

// ── Budget Service ──
const BudgetService = {
    _getKey(uid) { return `finai-budgets-${uid}`; },

    async get(uid) {
        // Always read from localStorage (fast, reliable)
        const stored = localStorage.getItem(this._getKey(uid));
        return stored ? JSON.parse(stored) : this._defaultBudgets();
    },

    async save(uid, budgets) {
        // Always save to localStorage
        localStorage.setItem(this._getKey(uid), JSON.stringify(budgets));
        // Optionally sync to Firestore
        if (db) {
            try {
                await db.collection(COLLECTIONS.BUDGETS).doc(uid).set(budgets, { merge: true });
            } catch (e) {
                console.warn('Firestore budget sync failed:', e.message);
            }
        }
    },

    _defaultBudgets() {
        return {
            monthly: 20000,
            categories: {
                Food: 5000, Travel: 3000, Shopping: 4000,
                Bills: 3000, Health: 2000, Entertainment: 2000,
                Education: 1000, Other: 1000
            }
        };
    }
};

// ── Data Transfer Service (Export / Import for cross-device sync) ──
const DataTransferService = {
    /**
     * Export all expenses + budgets for a user as a JSON file download.
     */
    async exportData(uid) {
        const expenses = await ExpenseService.getAll(uid);
        const budgets = await BudgetService.get(uid);
        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            uid,
            expenses,
            budgets
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finai-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return payload;
    },

    /**
     * Import expenses + budgets from a JSON backup file.
     * Merges with existing data (skips duplicates by title+date+amount).
     */
    async importData(uid, jsonText) {
        let payload;
        try {
            payload = JSON.parse(jsonText);
        } catch (e) {
            throw new Error('Invalid backup file. Please use a valid FinAI export.');
        }
        if (!payload.expenses || !Array.isArray(payload.expenses)) {
            throw new Error('Backup file does not contain valid expense data.');
        }

        // Get existing expenses to avoid duplicates
        const existing = await ExpenseService.getAll(uid);
        const existingKeys = new Set(
            existing.map(e => `${e.title}|${e.date}|${e.amount}`)
        );

        let imported = 0;
        for (const exp of payload.expenses) {
            const key = `${exp.title}|${exp.date}|${exp.amount}`;
            if (!existingKeys.has(key)) {
                // Strip old id so a new one is generated
                const { id, uid: _uid, createdAt, ...expData } = exp;
                await ExpenseService.add(uid, expData);
                existingKeys.add(key);
                imported++;
            }
        }

        // Restore budgets if present
        if (payload.budgets) {
            await BudgetService.save(uid, payload.budgets);
        }

        return { imported, total: payload.expenses.length };
    }
};

// ── Export ──
window.FinAI = {
    config: firebaseConfig,
    initFirebase,
    AuthService,
    ExpenseService,
    BudgetService,
    DataTransferService,
    COLLECTIONS
};
