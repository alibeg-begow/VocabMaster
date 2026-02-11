# 📖 VocabMaster — English-Turkmen Vocabulary Learning App

> **Step-by-step setup guide from scratch to live site**

---

## 📑 Table of Contents

- [1. About the Project](#1--about-the-project)
- [2. Prerequisites](#2--prerequisites)
- [3. Step 1: Getting a Gemini API Key](#3--step-1-getting-a-gemini-api-key)
- [4. Step 2: Creating a Cloudflare Worker (API Proxy)](#4--step-2-creating-a-cloudflare-worker-api-proxy)
  - [Method A: Via Cloudflare Dashboard (Easy Way)](#method-a-via-cloudflare-dashboard-easy-way)
  - [Method B: Using Wrangler CLI (Advanced Way)](#method-b-using-wrangler-cli-advanced-way)
- [5. Step 3: Adding the API Key to the Worker](#5--step-3-adding-the-api-key-to-the-worker)
- [6. Step 4: Connecting a Custom Domain (en-api.yourdomain.com)](#6--step-4-connecting-a-custom-domain-en-apiyourdomaincom)
- [7. Step 5: Updating the API URL in the Project Code](#7--step-5-updating-the-api-url-in-the-project-code)
- [8. Step 6: Local Testing (Localhost)](#8--step-6-local-testing-localhost)
- [9. Step 7: Publishing the Site to Cloudflare Pages](#9--step-7-publishing-the-site-to-cloudflare-pages)
  - [Method A: Automatic Deploy with Git (Recommended)](#method-a-automatic-deploy-with-git-recommended)
  - [Method B: Direct Upload](#method-b-direct-upload)
- [10. Step 8: Connecting a Custom Domain (yourdomain.com)](#10--step-8-connecting-a-custom-domain-yourdomaincom)
- [11. Step 9: Final Checks](#11--step-9-final-checks)
- [12. Troubleshooting](#12--troubleshooting)
- [13. Security Notes](#13--security-notes)
- [14. Project Structure](#14--project-structure)
- [15. How to Update](#15--how-to-update)

---

## 1. 📌 About the Project

**VocabMaster** is a modern web application designed for learning English-Turkmen vocabulary. You can upload words from an Excel file, automatically categorize them with AI (Google Gemini), study with flashcards, test yourself, and track your learning progress through a dashboard.

### ✨ Features

| Feature | Description |
|---------|-------------|
| 📤 **Excel Upload** | Upload vocabulary files in `.xlsx` or `.xls` format. Smart column detection — automatically identifies which column is English, Transcription, and Turkmen. Automatically skips Russian, Japanese, and number columns. |
| 🤖 **Gemini Categorization** | Automatically categorizes uploaded words using Google Gemini 2.5 Flash AI (Nouns, Verbs, Adjectives, Daily Life, Emotions, etc.) and generates 5 example sentences for each word. |
| 📚 **Word Table** | View all words with advanced filtering (search, category, learned status, word length), sorting (A-Z, Z-A, shortest, longest, by category, etc.), and pagination features. |
| 🃏 **Flashcards** | Learn words by flipping cards. Category-based filtering, keyboard shortcuts (← → Space), mark as learned. |
| 📝 **Test Mode** | Two-way testing: English→Turkmen or Turkmen→English. Incorrectly answered words are automatically marked as "not learned". |
| 🤖 **AI Feedback** | Test results are sent to Gemini AI and you receive personalized feedback, advice, and analysis in Turkmen language. |
| 📊 **Dashboard** | Total word count, learned word ratio, test history, category-based progress bars, score graph, day streak, and words that need review. |
| 🌙 **Theme Support** | Switch between Light and Dark themes. |
| 💾 **Data Management** | Export/import data as JSON, clear all data. |
| ⌨️ **Keyboard Shortcuts** | Alt+U (Upload), Alt+T (Test), Alt+D (Dashboard). |

### 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **HTML5 / CSS3 / Vanilla JavaScript** | Frontend — no framework used, pure JavaScript |
| **IndexedDB** | Client-side data storage (words, tests, settings) |
| **Google Gemini 2.5 Flash API** | Word categorization and test feedback |
| **SheetJS (xlsx)** | Reading and parsing Excel files (via CDN) |
| **Cloudflare Pages** | Frontend hosting |
| **Cloudflare Workers** | API proxy — hiding the Gemini API key |

---

## 2. 📋 Prerequisites

Make sure the following are ready before starting the setup:

| # | Requirement | Description |
|---|-------------|-------------|
| 1 | 🔑 **Google Account** | Required to get a Gemini API key. If you have a Gmail account, you already have one. |
| 2 | ☁️ **Cloudflare Account** | The `yourdomain.com` domain is already managed on Cloudflare. You should be able to log in at [dash.cloudflare.com](https://dash.cloudflare.com). |
| 3 | 💻 **VS Code** | Code editor. Download from [code.visualstudio.com](https://code.visualstudio.com/). |
| 4 | 🌐 **Live Server Extension** | For local testing in VS Code. Installation instructions are explained below. |
| 5 | 🔧 **Git** | Version control. Download from [git-scm.com](https://git-scm.com/). Accept all default settings during installation. |
| 6 | 📦 **Node.js and npm** | Required for Wrangler CLI. Download the **LTS** version from [nodejs.org](https://nodejs.org/). npm comes bundled automatically. |
| 7 | 🌍 **Browser** | Google Chrome is recommended. It's the best option for debugging with DevTools. |

### Verifying Installations

Open the terminal (in VS Code with `` Ctrl+` ``) and run the following commands:

```bash
git --version
# Expected output: git version 2.x.x

node --version
# Expected output: v18.x.x or higher

npm --version
# Expected output: 9.x.x or higher
```

> ⚠️ **Note:** If any of these commands returns a "command not found" error, install the relevant program and restart the terminal.

---

## 3. 🔑 Step 1: Getting a Gemini API Key

The Google Gemini API key is required for the application to use AI features. This key is used for word categorization and test feedback.

### Step by Step:

1. Open the following address in your browser: **https://aistudio.google.com/apikey**

2. Sign in with your Google account.
   - [The Google sign-in screen will appear — enter your email and password]

3. The API Keys page will open. Click the **"Create API Key"** button.
   - [You will see a blue "Create API Key" button at the top of the page]

4. In the popup window, you will see two options:
   - **"Create API key in new project"** — Creates a new Google Cloud project (recommended)
   - **Select an existing project** — You can select an existing project if you have one
   - Click **"Create API key in new project"**.

5. Wait a few seconds. Your API key will be generated and displayed on the screen.
   - The key is a long string of characters starting with `AIza`.
   - Example: `AIzaSyD_XXXXXXXXXXXXXXXXXXXXXXXXXXXX`

6. Click the **"Copy"** icon to copy the key.

7. Temporarily save the copied key in a safe place (Notepad or Notes app).

> 🔴 **CRITICAL SECURITY WARNING**
>
> - **NEVER** write this API key in frontend JavaScript code.
> - **NEVER** commit this API key to Git.
> - **NEVER** share this API key with anyone.
> - **NEVER** share this API key in a public place (forums, social media, etc.).
> - The key will only be added to the Cloudflare Worker's secret variables (Secrets).
> - If your key is leaked, others can make API calls through your account and incur costs for you.

> 💡 **Tip:** If you lose your API key, you can create a new one from the same page. Don't forget to revoke (delete) the old key.

---

## 4. 🔧 Step 2: Creating a Cloudflare Worker (API Proxy)

The Cloudflare Worker acts as a secure bridge (proxy) between the frontend and the Gemini API. This ensures your API key is never visible in the user's browser.

**Choose one of two methods:**

---

### Method A: Via Cloudflare Dashboard (Easy Way)

This method is done entirely through the browser without using a terminal. Recommended for beginners.

#### Step by Step:

**1.** Open **https://dash.cloudflare.com** in your browser and log in.

**2.** Click **"Workers & Pages"** in the left menu.
   - [You will see a worker icon with "Workers & Pages" text in the left sidebar]

**3.** Click the **"Create"** button in the top right.
   - [The blue "Create" button is located in the top right corner of the page]

**4.** Click **"Create Worker"**.
   - [You will see a card labeled "Create Worker" in the "Workers" tab]

**5.** Type `gemini-proxy` in the **Name** field.
   - [You are asked to name your Worker — type `gemini-proxy`]

**6.** Click the **"Deploy"** button.
   - This creates the worker with default "Hello World" code. Don't worry, we'll change the code right away.

**7.** After deployment succeeds, click the **"Edit Code"** button.
   - [You will see an "Edit Code" button next to the green success message]

**8.** In the code editor that opens, **delete all existing code** (select all with Ctrl+A, delete with Delete key).

**9.** **Copy and paste** the following code **entirely**:

```javascript
export default {
  async fetch(request, env) {
    const allowedOrigins = [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!allowedOrigins.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.text();
    if (body.length > 1_000_000) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      const responseBody = await geminiResponse.text();

      return new Response(responseBody, {
        status: geminiResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'API request failed' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    }
  },
};
```

**10.** Click the **"Save and Deploy"** button in the top right.
   - [The blue "Save and Deploy" button is in the top right corner of the editor]

**11.** Wait for the deployment success message.

**12.** Note your Worker URL. It will look like this:
   ```
   https://gemini-proxy.USERNAME.workers.dev
   ```
   - `USERNAME` here is your Cloudflare username.

> ✅ **Test:** Open `https://gemini-proxy.USERNAME.workers.dev` in your browser. You should see the message `{"error":"Method not allowed"}`. This is **correct** — because the browser sends a GET request, but the Worker only accepts POST.

---

### Method B: Using Wrangler CLI (Advanced Way)

This method creates the Worker using the terminal. It's faster but requires command line knowledge.

#### Step by Step:

**1.** Open the terminal in VS Code (with `` Ctrl+` ``).

**2.** Install Wrangler CLI globally:

```bash
npm install -g wrangler
```

**3.** Log in with your Cloudflare account:

```bash
wrangler login
```

   - The browser will open automatically.
   - [The Cloudflare authorization page will open — click the "Allow" button]
   - You should see the message "Successfully logged in" in the terminal.

**4.** Create a folder named `worker/` in the project directory (if it doesn't exist):

```bash
mkdir worker
```

**5.** Create the `worker/wrangler.toml` file with the following content:

```toml
name = "gemini-proxy"
main = "index.js"
compatibility_date = "2024-01-01"
```

**6.** Create the `worker/index.js` file and paste the **same code** from [Method A, Step 9](#method-a-via-cloudflare-dashboard-easy-way).

**7.** Navigate to the `worker` folder in the terminal:

```bash
cd worker
```

**8.** Deploy the Worker:

```bash
wrangler deploy
```

   - You will see a success message and the Worker URL.

**9.** Add the API key as a secret variable:

```bash
wrangler secret put GEMINI_API_KEY
```

   - The terminal will ask "Enter a secret value:".
   - Paste the API key you saved in [Step 1](#3--step-1-getting-a-gemini-api-key) and press Enter.
   - You should see the message "Success! Uploaded secret GEMINI_API_KEY".

> 💡 **Tip:** Values added with the `wrangler secret put` command are encrypted and can never be read again. Only the Worker code can access them via `env.GEMINI_API_KEY`.

---

## 5. 🔐 Step 3: Adding the API Key to the Worker

> ⚠️ **Note:** If you used [Method B](#method-b-using-wrangler-cli-advanced-way) and ran the `wrangler secret put` command, you have already completed this step. This section is for those who used **Method A**.

Adding the API key to the Worker's secret variables (Secrets) ensures the key is stored securely. Encrypted values cannot be viewed again, even in the Cloudflare Dashboard.

### Step by Step:

**1.** Go to **https://dash.cloudflare.com** and log in.

**2.** Click **"Workers & Pages"** in the left menu.

**3.** Click on the **`gemini-proxy`** worker from the worker list.
   - [You will see "gemini-proxy" in the worker list — click on it]

**4.** Click the **"Settings"** tab in the top menu.
   - [There are tabs like "Deployments", "Metrics", "Logs", "Settings" at the top of the page — select "Settings"]

**5.** Click **"Variables and Secrets"** in the left menu.
   - [You will see "Variables and Secrets" in the bottom left menu]

**6.** Click the **"Add"** button.
   - [An "Add" button will appear on the page]

**7.** In the row that opens:
   - Select **"Secret"** from the **Type** dropdown menu (the default may be "Text" — change it).
   - In the **Variable name** field: type `GEMINI_API_KEY` (in uppercase, exactly like this).
   - In the **Value** field: paste the API key you copied in [Step 1](#3--step-1-getting-a-gemini-api-key).

**8.** Click the **"Encrypt"** button.
   - This encrypts the value. After encrypting, you won't be able to see the value again.

**9.** Click the **"Save and Deploy"** button at the bottom of the page.
   - [The blue "Save and Deploy" button will be at the very bottom of the page]

> 💡 **Important Notes:**
> - Encrypted secrets can never be viewed again — even you won't be able to see the value.
> - Your Worker code accesses this value via `env.GEMINI_API_KEY`.
> - If you want to change the key, you need to repeat the same steps and enter the new value (it overwrites the old value).
> - This way, your API key is stored securely on the server side and never reaches the user's browser.

---

## 6. 🌐 Step 4: Connecting a Custom Domain (en-api.yourdomain.com)

We will connect the `en-api.yourdomain.com` subdomain to your Worker. This way, your frontend code will make API calls to `https://en-api.yourdomain.com`.

### Step by Step:

**1.** Go to **https://dash.cloudflare.com**.

**2.** Click **"Workers & Pages"** in the left menu.

**3.** Click on the **`gemini-proxy`** worker from the worker list.

**4.** Click the **"Settings"** tab in the top menu.

**5.** Click **"Domains & Routes"** in the left menu.
   - [You will see "Domains & Routes" in the left menu]

**6.** Click the **"Add"** button.

**7.** Select **"Custom Domain"** from the menu that opens.

**8.** Type the following in the domain field:

```
en-api.yourdomain.com
```

**9.** Click the **"Add Domain"** button.
   - [Cloudflare will automatically create the necessary CNAME record in the DNS settings of your `yourdomain.com` domain]

**10.** Wait for the activation status — it usually takes **1-2 minutes**.
   - The status will change from "Initializing" → "Active".

**11.** Test it: Open the following address in your browser:

```
https://en-api.yourdomain.com
```

> ✅ **Expected Result:** You should see the message `{"error":"Method not allowed"}`. This is **completely normal and correct** — because the browser sends a GET request, but the Worker only accepts POST requests. If you see this message, the Worker is working correctly.

> ⚠️ **If you don't see this message:**
> - DNS propagation may not have completed yet — wait 5 minutes and try again.
> - Check the DNS settings in the Cloudflare Dashboard: `yourdomain.com` → DNS → make sure the `en-api` CNAME record exists.

---

## 7. 📝 Step 5: Updating the API URL in the Project Code

Now we will update the project code to direct API requests to `en-api.yourdomain.com`.

### Step by Step:

**1.** Open the `js/gemini-api.js` file in VS Code.

**2.** Find the API configuration section at the top of the file. There will be lines like this:

```javascript
const PROXY_URL = 'https://api.yourdomain.com/';
```

**3.** Change this line to:

```javascript
const PROXY_URL = 'https://en-api.yourdomain.com/';
```

**4.** Make sure the `DIRECT_KEY` variable is **empty**:

```javascript
const DIRECT_KEY = ''; // Replace with your key for local dev
```

> ⚠️ **Warning:** If you want to use the Gemini API directly during local development, you can temporarily write your key in the `DIRECT_KEY` variable. **BUT** make sure you delete it before committing!

**5.** Make sure no API key remains in any JavaScript file:
   - Press **Ctrl+Shift+F** in VS Code (search all files).
   - Type `AIza` in the search box.
   - **No results should appear.** If a result appears, **immediately delete** the key on that line.

**6.** Save the file (**Ctrl+S**).

> 💡 **Auto-detect Logic:** The application automatically detects the environment:
> - If you're on `localhost` or `127.0.0.1` → `DIRECT_URL` (direct Gemini API) is used.
> - On the live site (`yourdomain.com`) → `PROXY_URL` (Cloudflare Worker) is used.
>
> This allows seamless switching between local development and the live site.

---

## 8. 🧪 Step 6: Local Testing (Localhost)

It's very important to test on your local computer before going live.

### Installing the Live Server Extension

If the Live Server extension is not installed in VS Code:

**1.** Click the **Extensions** icon in the VS Code left sidebar (or **Ctrl+Shift+X**).

**2.** Type **"Live Server"** in the search box.

**3.** Find the **"Live Server"** extension (author: **Ritwick Dey**).
   - [It will appear first in the search results — green icon with "Ritwick Dey"]

**4.** Click the **"Install"** button.

**5.** Restart VS Code after installation is complete (optional but recommended).

### Running the Project

**1.** Open the project folder in VS Code (**File → Open Folder** or **Ctrl+K Ctrl+O**).

**2.** Right-click on the `index.html` file in the left panel.

**3.** Select **"Open with Live Server"** from the context menu.
   - [You will see "Open with Live Server" in the right-click menu]

**4.** The browser will open automatically:
   ```
   http://127.0.0.1:5500
   ```
   or
   ```
   http://localhost:5500
   ```

### Full Functionality Testing

Test the following steps in order:

#### ✅ 1. Excel File Upload
- Click **"📤 Upload Words"** from the left menu.
- Upload an Excel file with at least 10 words.
- File format (at least 2 columns required):

| Column A | Column B | Column C |
|----------|----------|----------|
| apple | [ˈæpəl] | alma |
| book | [bʊk] | kitap |
| ... | ... | ... |

- Drag and drop the file or click the "Browse Files" button.

#### ✅ 2. Gemini Categorization
- After the file is uploaded, a preview table will appear.
- Click the **"✨ Confirm & Categorize with AI"** button.
- The loading bar will blink — wait until the Gemini API responds.
- If successful, words will be automatically categorized and displayed in the table.

#### ✅ 3. Word Table
- Test the search box.
- Test category filters.
- Test sorting options.
- Click the ✅/❌ button next to a word to change its learned/not learned status.

#### ✅ 4. Flashcards
- Click **"🃏 Flashcards"** from the left menu.
- Click a card to flip it.
- Navigate with ← → arrow keys.
- Flip a card with the Space key.

#### ✅ 5. Test Mode
- First, mark at least a few words as "learned" (in Flashcards or the Word Table).
- Click **"📝 Tests"** from the left menu.
- Select **"English → Turkmen"** or **"Turkmen → English"** mode.
- Answer all questions.
- Check the score, word details, and Gemini feedback on the results page.

#### ✅ 6. Dashboard
- Click **"📊 Dashboard"** from the left menu.
- Check that the statistics are correct.
- Make sure the test history is visible.

#### ✅ 7. Theme
- Click the 🌙/☀️ button in the top right to change the theme.

### Troubleshooting (Local Testing)

If Gemini API calls fail:

**1.** Is the Worker running? Open `https://en-api.yourdomain.com` in the browser.
   - If you see `{"error":"Method not allowed"}` → Worker is running ✅
   - If the page doesn't open → Worker is not deployed or domain is not connected ❌

**2.** Is the API key added? Check [Step 3](#5--step-3-adding-the-api-key-to-the-worker).

**3.** Is `localhost:5500` in the allowed origins list? The `allowedOrigins` array in the Worker code should have these lines:
   ```javascript
   'http://localhost:5500',
   'http://127.0.0.1:5500',
   ```

**4.** Open the browser DevTools (**F12** key):
   - **Console** tab: Check for red error messages.
   - **Network** tab: Check the status of the API request (Status Code, Response).

> 💡 **Tip:** Find the POST request in the Network tab and look at the "Response" section. The error message from Gemini will help you understand the issue.

---

## 9. 🚀 Step 7: Publishing the Site to Cloudflare Pages

After local tests are successful, we can go live. There are two methods:

---

### Method A: Automatic Deploy with Git (Recommended)

In this method, Cloudflare automatically updates the site when you push code to GitHub. This is the most practical method.

#### Step by Step:

**1.** Open the terminal in VS Code (`` Ctrl+` ``).

**2.** Make sure you are in the project folder:

```bash
cd c:\Users\Alybeg\Desktop\english
```

**3.** Initialize the Git repo (if not already initialized):

```bash
git init
```

**4.** Add all files to staging:

```bash
git add .
```

> ⚠️ **Warning:** Before running `git add .`, make sure no API key remains in the project! The `DIRECT_KEY` in `js/gemini-api.js` should be empty.

**5.** Create the first commit:

```bash
git commit -m "VocabMaster initial release"
```

**6.** Set the main branch to `main`:

```bash
git branch -M main
```

**7.** Add the GitHub remote:

```bash
git remote add origin https://github.com/alibeg-begow/VocabMaster.git
```

> 💡 **Note:** If the remote is already added, you'll get a `fatal: remote origin already exists` error. In that case, skip this step.

**8.** Push the code to GitHub:

```bash
git push -u origin main
```

   - Your GitHub username and password (or personal access token) may be requested.
   - After a successful push, your code will be visible on GitHub.

**9.** Go to the Cloudflare Dashboard: **https://dash.cloudflare.com**

**10.** Click **"Workers & Pages"** in the left menu.

**11.** Click the **"Create"** button.

**12.** Click the **"Pages"** tab.
   - [There are "Workers" and "Pages" tabs at the top of the page — select "Pages"]

**13.** Click the **"Connect to Git"** option.

**14.** Authorize your GitHub account (if doing this for the first time):
   - [You will be redirected to GitHub — click the "Authorize Cloudflare" button]
   - Choose which repos to make accessible (all repos or only selected ones).

**15.** Select the **`alibeg-begow/VocabMaster`** repo from the repository list.
   - [Find and select the "VocabMaster" repo in the repository list]

**16.** Click the **"Begin setup"** button.

**17.** Configure the build settings:
   - **Project name:** `vocabmaster` (or any name you prefer)
   - **Production branch:** `main`
   - **Framework preset:** `None` (select "None" from the dropdown)
   - **Build command:** Leave empty (clear it).
   - **Build output directory:** Type `/` (root directory).

**18.** Click the **"Save and Deploy"** button.

**19.** Wait for the deployment to complete (usually 30-60 seconds).
   - [You will see a progress bar and log messages]

**20.** After deployment succeeds, Cloudflare will give you a URL:
   ````
   https://vocabmaster-xxx.pages.dev
   ````
   - You can test your site by opening this URL in the browser.

> ✅ **Automatic Deploy:** From now on, every time you push to the `main` branch, Cloudflare will automatically update the site. No manual action required!

---

### Method B: Direct Upload

This method uploads files directly to Cloudflare without using Git.

#### Step by Step:

**1.** Go to **https://dash.cloudflare.com**.

**2.** Click **"Workers & Pages"** in the left menu.

**3.** Click the **"Create"** button.

**4.** Click the **"Pages"** tab.

**5.** Click the **"Direct Upload"** option.
   - [Click the "Direct Upload" link instead of "Connect to Git"]

**6.** Type `vocabmaster` in the **Project name** field.

**7.** Click the **"Create Project"** button.

**8.** On the upload page that opens:
   - Select **all files** from your project folder (index.html, css/, js/ folders).
   - Drag and drop or select with "Select Files".

> ⚠️ **Warning:** Do **not** upload the `worker/` folder — it was deployed as a separate Worker. Only upload frontend files: `index.html`, `css/`, `js/`.

**9.** Click the **"Deploy Site"** button.

**10.** When deployment is complete, you will see your URL:
   ````
   https://vocabmaster-xxx.pages.dev
   ````

> 💡 **Note:** With the direct upload method, you need to re-upload files each time you make an update. The Git method is more practical.

---

## 10. 🔗 Step 8: Connecting a Custom Domain (yourdomain.com)

We will connect the `yourdomain.com` domain to your Cloudflare Pages project.

### Step by Step:

**1.** Go to the **"Workers & Pages"** page in the Cloudflare Dashboard.

**2.** Click on the **`vocabmaster`** project from your Pages projects.

**3.** Click the **"Custom domains"** tab in the top menu.
   - [There are "Deployments", "Custom domains", "Settings" tabs — select "Custom domains"]

**4.** Click the **"Set up a custom domain"** button.

**5.** Type the following in the domain field:

```
yourdomain.com
```

**6.** Click the **"Continue"** button.
   - [Cloudflare will automatically configure the DNS settings]

**7.** Click the **"Activate domain"** button.

**8.** Repeat the same process for `www.yourdomain.com`:
   - Click the **"Set up a custom domain"** button again.
   - Type `www.yourdomain.com`.
   - Click **"Continue"** → **"Activate domain"** buttons.

**9.** Wait for the SSL certificate to become active (usually **1-5 minutes**).
   - The status will change from "Initializing" → "Active".

**10.** Set up www → root redirect (optional but recommended):
   - Go to your `yourdomain.com` domain in the Cloudflare Dashboard.
   - Click **Rules** → **"Redirect Rules"** → **"Create Rule"**.
   - Rule name: `www to root`
   - When: Hostname equals `www.yourdomain.com`
   - Then: Dynamic redirect → `https://yourdomain.com${http.request.uri.path}` (Status: 301)
   - Click **"Deploy"**.

**11.** Test your site:

```
https://yourdomain.com
```

> ✅ **Expected Result:** The VocabMaster application should open and work fully!

---

## 11. ✅ Step 9: Final Checks

Check the following checklist one by one and mark each item:

### Functionality Checks

- [ ] Does `https://yourdomain.com` open?
- [ ] Does the page load properly (no spinning loader)?
- [ ] Can an Excel file be uploaded?
- [ ] Does Gemini categorization work (are words categorized)?
- [ ] Do the word table and filters work?
- [ ] Are flashcards displayed properly (flip animation, etc.)?
- [ ] Does test mode work (do questions appear, can they be answered)?
- [ ] Does Gemini feedback appear in test results?
- [ ] Are dashboard statistics correct?
- [ ] Does Dark/Light theme work?
- [ ] Is data preserved after refreshing the page (F5)?
- [ ] Does data export work?
- [ ] Does data import work?

### Security Checks

- [ ] Is there **NO** API key in the `js/gemini-api.js` file?
- [ ] Does the API key NOT appear in Browser DevTools → **Sources** tab?
- [ ] Does searching for `AIza` across all files in VS Code return no results? (**Ctrl+Shift+F** → type `AIza`)
- [ ] Does a GET request to `https://en-api.yourdomain.com` return "Method not allowed"?

### Performance Checks

- [ ] Does the page open in less than 3 seconds?
- [ ] Does it display properly on mobile devices?
- [ ] Does it work in different browsers (Chrome, Firefox, Edge)?

---

## 12. 🔧 Troubleshooting

Common problems you may encounter and their solutions:

| Problem | Possible Cause | Solution |
|---------|---------------|----------|
| `API error: 403 Forbidden` | Worker origin check, domain not in allowed list | Add your domain to the `allowedOrigins` array in the Worker code and redeploy |
| `API error: 401 Unauthorized` | API key is incorrect or missing | Check the `GEMINI_API_KEY` value in Cloudflare Dashboard → Worker → Settings → Variables and Secrets. Re-add if necessary |
| `API error: 429 Too Many Requests` | Gemini API rate limit exceeded | Wait a few minutes and try again. The free plan has a limited number of requests per minute |
| `Failed to fetch` | Worker URL is wrong or Worker is not running | Check the `PROXY_URL` value in `js/gemini-api.js`. It should be `https://en-api.yourdomain.com/` |
| `Network Error` | No internet connection or Worker is unreachable | Check your internet connection. Try opening `https://en-api.yourdomain.com` in the browser |
| Words disappearing | Browser data cleared (IndexedDB deleted) | Don't delete site data from browser settings. Be careful when clearing "all history" |
| Excel not uploading | File format is wrong or file is too large | Use `.xlsx` or `.xls` format. Maximum file size is 5 MB. At least 2 columns (English and Turkmen) are required |
| Gemini returning empty response | Token limit exceeded or too many words | Reduce the word count (maximum 200). Try shorter words |
| Site not opening (DNS error) | DNS propagation not completed | Wait 5-10 minutes. Check DNS records in the Cloudflare Dashboard |
| CSS looks broken | Browser cache issue | Do a hard refresh with **Ctrl+Shift+R**. Or check "Disable cache" in DevTools → Network |
| Worker editor not opening | Browser block or extension issue | Try a different browser. Temporarily disable ad blocker extensions |
| `git push` failed | GitHub authentication error | Create a Personal Access Token (PAT): GitHub → Settings → Developer Settings → Personal Access Tokens → Generate New Token |
| Flashcard flip not working | JavaScript error | Check the error message in DevTools Console. Refresh the page (F5) |
| AI feedback not appearing in test results | Worker timeout or API error | Check the error message in Console. Make sure the Worker is running |

### Debugging with DevTools

When you encounter any issue:

**1.** Press **F12** in the browser to open DevTools.

**2.** **Console** tab: Read the red error messages. It shows which file the error originates from.

**3.** **Network** tab: Filter API requests:
   - Type `en-api` in the filter box.
   - Check the status of POST requests:
     - **200** = Success ✅
     - **403** = Origin blocked (domain not added to Worker) ❌
     - **401** = API key is wrong ❌
     - **429** = Rate limit exceeded ⚠️
     - **500** = Server error ❌
   - Click on a request and examine the response in the **Response** tab.

---

## 13. 🛡️ Security Notes

### API Key Security

| ❌ DON'T DO | ✅ DO |
|------------|------|
| Don't write the API key in JavaScript files | Add the API key to Cloudflare Worker Secrets |
| Don't commit the API key to Git | Add sensitive files to `.gitignore` |
| Don't share the API key in a public place | Temporarily store the key in Notepad, then delete it |
| Don't send the API key as a URL parameter | Use the Worker proxy to send it |

### Worker Security

- The Worker **only** accepts requests from sites in the `allowedOrigins` list.
- Sites in the list:
  - `https://yourdomain.com` — live site
  - `https://www.yourdomain.com` — www version
  - `http://localhost:5500` — local development (Live Server)
  - `http://127.0.0.1:5500` — local development (alternative)
  - `http://localhost:3000` — local development (alternative port)
  - `http://127.0.0.1:3000` — local development (alternative port)
- Other sites **cannot** use your Worker — CORS protection is active.
- The Worker only accepts **POST** requests — GET, PUT, DELETE are blocked.
- Request size is limited to **1 MB** — large malicious requests are blocked.

### Changing the API Key

If you need to change your API key:

1. **Google AI Studio** → [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → Delete (Revoke) the old key.
2. Create a new key.
3. **Cloudflare Dashboard** → Workers & Pages → `gemini-proxy` → Settings → Variables and Secrets.
4. Update the `GEMINI_API_KEY` value → "Encrypt" → "Save and Deploy".

### Git Security

If the API key was accidentally committed to Git history:

> ⚠️ **Warning:** `git push --force` changes the existing history. Use with caution.

```bash
# Completely remove the sensitive file from Git history
git filter-branch --force --tree-filter "sed -i 's/AIza[A-Za-z0-9_-]*/REMOVED/g' js/gemini-api.js" HEAD
git push --force
```

In this case, **immediately revoke the old API key** and create a new one.

---

## 14. 📁 Project Structure

```
vocabmaster/
├── index.html              # Main HTML file — app shell (header, sidebar, main)
├── README.md               # This file — setup guide
│
├── css/
│   ├── style.css           # Main stylesheet — color themes, layout, tables, cards
│   └── animations.css      # Animations — transitions, hover effects, spinner
│
├── js/
│   ├── utils.js            # Constants, helper functions (formatTime, escapeHtml, showToast, etc.)
│   ├── storage.js          # IndexedDB CRUD operations — word, test, settings management
│   ├── gemini-api.js       # Gemini API integration — categorization and feedback
│   ├── excel-parser.js     # Excel file reading — smart column detection and parsing
│   ├── learning-panel.js   # Word table — filtering, sorting, pagination, bulk operations
│   ├── flashcards.js       # Flashcard view — flip animation, keyboard shortcuts
│   ├── test-engine.js      # Test engine — question display, answer checking, timer
│   ├── results.js          # Test results — score donut chart, word details
│   ├── user-dashboard.js   # Dashboard — statistics, test history, data management
│   └── app.js              # Main app — hash-based routing, theme, sidebar, initialization
│
└── worker/
    ├── index.js            # Cloudflare Worker code — Gemini API proxy
    └── wrangler.toml       # Worker configuration file (for Wrangler CLI)
```

### Script Loading Order (Important!)

The `<script>` tags in the `index.html` file are loaded in a specific order. This order reflects the **dependency chain**:

```
1. SheetJS (CDN) — Excel reading library
2. utils.js      — Constants and helper functions (used by all modules)
3. storage.js    — Database layer (used by other modules)
4. gemini-api.js — API layer (used by excel-parser and test-engine)
5. excel-parser.js
6. learning-panel.js
7. flashcards.js
8. test-engine.js
9. results.js
10. user-dashboard.js
11. app.js        — Loaded last, initializes everything
```

---

## 15. 🔄 How to Update

### If You're Deploying with Git (Method A)

After making your code changes:

```bash
# 1. Check changes
git status

# 2. Add changes to staging
git add .

# 3. Create a commit (write a descriptive message)
git commit -m "New feature: added word deletion"

# 4. Push to GitHub
git push
```

**That's it!** Cloudflare will automatically detect the changes and update the site. The deployment process usually takes 30-60 seconds.

To check the deployment status:
- Cloudflare Dashboard → Workers & Pages → `vocabmaster` → Deployments tab.
- [You will see the latest deployment in "Success" status]

### If You're Deploying with Direct Upload (Method B)

1. Go to Cloudflare Dashboard → Workers & Pages → `vocabmaster` project.
2. Click the **"Create new deployment"** button.
3. Re-upload the updated files.
4. Click the **"Deploy Site"** button.

> 💡 **Recommendation:** If you update frequently, we strongly recommend switching to the Git method (Method A). All you need to do for each update is the `git push` command.

---

## 📌 Quick Reference

Frequently used links and commands:

| Resource | URL / Command |
|----------|---------------|
| 🌐 Live Site | `https://yourdomain.com` |
| 🔧 API Proxy | `https://en-api.yourdomain.com` |
| 📊 Cloudflare Dashboard | `https://dash.cloudflare.com` |
| 🔑 Gemini API Keys | `https://aistudio.google.com/apikey` |
| 📦 GitHub Repo | `https://github.com/alibeg-begow/VocabMaster` |
| 💻 Local Development | `http://127.0.0.1:5500` |
| 🚀 Deploy (Git) | `git add . && git commit -m "message" && git push` |
| 🔐 Secret Update | `wrangler secret put GEMINI_API_KEY` |

---

> 📖 **This guide covers all the steps needed to take the VocabMaster project from scratch to a live site. If you encounter any issues, check the [Troubleshooting](#12--troubleshooting) section.**