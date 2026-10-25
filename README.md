# MARKS Offline — Question & Solution PDF Generator 🖨️📚

A full-stack web application designed for JEE & NEET students with **MARKS App Premium** who need to practice sums during offline college study hours where electronic devices (phones, tablets, laptops) are strictly prohibited.

---

## 🌟 Key Features

1. **MARKS App Account Sync**:
   - Securely connect your MARKS App account using your auth token.
   - Built-in **1-Click Bookmarklet** that extracts and copies your token from `web.getmarks.app` in 1 second.
   - Displays your student profile, exam target (JEE Main, Advanced, NEET), and active Premium status.
   - Includes **Instant Demo Mode** with real JEE PYQs so you can test and print worksheets immediately without logging in first.

2. **Category / Bucket Selection**:
   - Matches the exact question categories from MARKS App:
     - ⭐ **Must Do**
     - 🔥 **Most Relevant**
     - 🚀 **Rank Boosters**
     - 📚 **All Previous Year Questions (PYQs)**
   - Select Exam (JEE Main, JEE Advanced, NEET, BITSAT, etc.)
   - Select Subject (Physics, Chemistry, Mathematics, Biology)
   - Select Chapter (Rotational Motion, Thermodynamics, Electrostatics, etc.)

3. **🍃 Zero-Waste Paper Saver Flow**:
   - **Continuous Flow**: Questions, compact Answer Key, and step-by-step Solutions flow naturally across page breaks without leaving half-page blank voids.
   - **2-Column Newspaper Layout**: Dual-column flow with dividing rules, cutting paper usage by over 50%.
   - **Practice OMR Bubble Sheet**: Printable OMR grid to practice bubbling under realistic exam conditions.
   - **Custom Rough Work Margins**: Optional scratch space below questions.

4. **🛡️ Universal Self-Healing KaTeX Engine**:
   - Renders complex multi-line math (`\begin{aligned}`, matrices, integrals) and chemistry formulas (`\Delta_{\mathrm{o}} \lt \mathrm{P}`, coordinate compounds) with pixel-perfect KaTeX vectors.
   - Automatically repairs broken LaTeX, strips stray symbols, unescapes HTML entities, and balances braces and environments.

5. **Single-Click Export Options**:
   - **Print / Save PDF**: Native A4 print pre-configured with 8mm margins for maximum printable area.
   - **Offline Standalone HTML**: Download a portable, single-file HTML worksheet to carry on a USB thumb drive.

---

## ⚡ Deploying to Vercel (1-Click)

This repository is pre-configured with `vercel.json` and a serverless API proxy (`api/index.js`).

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: complete marks offline generator ready for vercel"
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in with GitHub.
3. Click **"Add New Project"** and import your repository.
4. Keep the default settings (Framework preset: **Vite**, Root directory: `./`).
5. Click **"Deploy"**! Vercel will build both the frontend and backend automatically.

---

## 🚀 Running Locally

```bash
# Install root dependencies
npm install

# Start Express Backend (Port 5000)
node server.js

# In a second terminal, start Vite Frontend (Port 5173)
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔑 How to Connect Your MARKS App Account

### Method 1: The 1-Click Bookmarklet (Fastest)
1. In the app, open the **"Connect MARKS App Account"** modal.
2. Drag the **"Drag to Bookmark Bar"** button to your browser bookmarks bar (or click "Copy Bookmarklet Code").
3. Go to your open [web.getmarks.app](https://web.getmarks.app) tab where you are logged in.
4. Click the bookmark on your bookmarks bar—your token is copied to your clipboard instantly!
5. Paste it in the app and click **"Verify & Connect"**.

### Method 2: DevTools Console (10 seconds)
1. Open [web.getmarks.app](https://web.getmarks.app) in Chrome/Edge.
2. Press `F12` (or right click → Inspect).
3. Click the **Console** tab and run:
   ```javascript
   copy(localStorage.getItem('token'))
   ```
4. Paste the copied token into the app.
