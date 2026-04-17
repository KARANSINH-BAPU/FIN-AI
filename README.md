# FinAI – AI Smart Expense Tracker 🤖💰

> **Final Year Computer Engineering Project**  
> A production-ready, AI-powered expense tracker with real-time Firebase sync, smart insights, voice entry, and beautiful glassmorphism UI.

---

## 🚀 Live Demo
Open `index.html` in a browser — no server required! Works fully offline using localStorage.

---

## 📁 Project Structure

```
expense.io/
├── index.html          # Landing page (animated hero, features, pricing, testimonials)
├── auth.html           # Authentication (Sign In / Sign Up / Google / Forgot Password)
├── dashboard.html      # Main app dashboard
├── assets/
│   └── favicon.svg     # App icon
├── css/
│   ├── landing.css     # Landing page styles (glassmorphism, blobs, animations)
│   ├── auth.css        # Auth page styles
│   └── dashboard.css   # Dashboard styles (sidebar, cards, modals, charts)
├── js/
│   ├── landing.js      # Landing page: loader, counters, hero chart, scroll animations
│   ├── auth.js         # Auth: sign-in/up, Google, forgot password, demo data seeding
│   ├── firebase-config.js  # Firebase setup + localStorage fallback services
│   ├── ai-engine.js    # AI Insight Engine (auto-categorize, insights, predictions, voice)
│   ├── pdf-report.js   # PDF report generator (jsPDF)
│   ├── dashboard.js    # Dashboard controller (state, modals, navigation)
│   ├── render.js       # Page render functions (dashboard, expenses, budget, AI, health)
│   └── charts.js       # Chart.js initialization (line, pie, bar, doughnut)
└── README.md
```

---

## ✨ Features

### 🔐 Authentication
- Email/Password Sign Up & Sign In
- Google OAuth Login
- Password Reset via email
- Password strength meter
- Secure session handling (Firebase Auth / localStorage fallback)

### 💰 Expense Tracking
- Add / Edit / Delete expenses
- Fields: Title, Amount, Category, Date, Payment Mode, Notes
- Real-time sync with Firestore (or localStorage in demo mode)
- Auto-categorization via AI (type "Dominos" → Food detected)

### 📊 Budgeting
- Set monthly total budget
- Set per-category budgets (Food, Travel, Shopping, Bills, Health, Entertainment, Education, Other)
- Visual progress bars with color-coded alerts (green/yellow/red)
- Auto-alerts at 80% and 100% usage

### 📈 Reports & Charts
- **Line chart**: 7-day spending trend
- **Pie/Doughnut chart**: Category breakdown
- **Bar chart**: 6-month comparison
- **30-day trend line**: Daily spending pattern
- Month-over-month % change indicator

### 📄 PDF Export
- Download monthly report as PDF
- Includes: summary cards, budget progress, category breakdown, AI insights, health score, full transaction table
- Auto-generated with jsPDF

### 🤖 AI Insight Engine
- Spending pattern detection
- Category-wise comparison (month-over-month)
- Weekday vs Weekend analysis
- Next month spending prediction (moving average)
- Savings suggestions with specific amounts
- Risk alerts for budget overruns
- Financial Health Score (0–100)
- **OpenAI API ready** — add your API key in Settings

### 🎙️ Voice Expense Entry
- Web Speech API integration
- Say: *"Add 500 for Dominos"* or *"Spent 200 on auto"*
- Auto-parses amount, title, and category
- Confirm before saving

### 🏆 Financial Health Score
- Animated circular progress bar
- Scored on: budget discipline, spending trend, savings rate, consistency
- Breakdown with improvement tips

### 🌙 Dark / Light Mode
- Smooth animated transition
- Preference saved in localStorage
- Available on all pages

### 📱 Fully Responsive
- Mobile-first design
- Collapsible sidebar on mobile
- Touch-friendly modals and buttons

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Structure |
| CSS3 (Vanilla) | Glassmorphism, animations, responsive layout |
| JavaScript (ES6+) | All logic, no framework |
| Firebase Auth | User authentication |
| Cloud Firestore | Real-time database |
| Chart.js | Interactive charts |
| jsPDF | PDF report generation |
| Web Speech API | Voice expense entry |
| Google Fonts (Inter, Space Grotesk) | Typography |

---

## 🔧 Setup & Configuration

### Option A: Demo Mode (No Firebase needed)
Just open `index.html` in any browser. Everything works with localStorage.

### Option B: Firebase Integration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database** → Start in test mode
5. Go to Project Settings → Your Apps → Add Web App
6. Copy the config and replace in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

7. Add Firebase CDN scripts to HTML files (before `</body>`):
```html
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-firestore-compat.js"></script>
```

### Option C: OpenAI API (Optional)
1. Get API key from [platform.openai.com](https://platform.openai.com)
2. In the app: Settings → AI Settings → Enter API Key
3. GPT-3.5 powered insights will activate automatically

---

## 🔐 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
    match /budgets/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🌐 Hosting on Firebase

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to: . (current folder)
# Configure as single-page app: No
firebase deploy
```

---

## 🎓 Viva Preparation

### Key Concepts to Explain

**1. Architecture**
- Single Page Application (SPA) pattern with vanilla JS
- Module pattern for code organization
- Service layer abstraction (Firebase ↔ localStorage fallback)

**2. AI Engine**
- Rule-based NLP for auto-categorization using keyword matching
- Statistical analysis for spending patterns
- Moving average algorithm for predictions
- Composite scoring for Financial Health Score
- Modular design allows OpenAI API drop-in replacement

**3. Firebase Integration**
- Authentication with JWT tokens
- Firestore real-time NoSQL database
- Security rules for data isolation
- Offline-first with localStorage fallback

**4. Voice Entry**
- Web Speech API (SpeechRecognition)
- Regex-based amount extraction
- Keyword matching for title/category parsing

**5. PDF Generation**
- jsPDF library for client-side PDF creation
- Custom layout with gradients, tables, charts
- No server required

---

## 🔮 Future Scope

- [ ] Receipt scanning with OCR (Tesseract.js or Google Vision API)
- [ ] Bank statement import (CSV/PDF parsing)
- [ ] Multi-currency support
- [ ] Recurring expense tracking
- [ ] Expense sharing / split bills
- [ ] Investment portfolio tracking
- [ ] Tax report generation
- [ ] PWA with offline support and push notifications
- [ ] React Native mobile app
- [ ] Machine learning model for personalized predictions
- [ ] WhatsApp bot integration for expense entry

---


## 👨‍💻 Author

**Karansinh Solanki**
Computer Engineering Student

🔗 GitHub: https://github.com/KARANSINH-BAPU
📧 Email:karansolanki565656@gmail.com
💼 LinkedIn:www.linkedin.com/in/karansinh-solanki-78754b277

Built as a **Final Year Project**
Powered by FinAI Engine v1.0

