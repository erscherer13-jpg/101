# Jeff's BookMatch

A personalised book recommendation tool for picking gifts.

---

## How to deploy to Vercel (step by step)

### What you'll need before starting
- A free [Vercel account](https://vercel.com) (sign up with GitHub)
- A free [GitHub account](https://github.com)
- Your Anthropic API key (from [console.anthropic.com](https://console.anthropic.com))

---

### Step 1 — Push this project to GitHub

1. Go to [github.com](https://github.com) and click **New repository**
2. Name it `jeffs-bookmatch`, leave it **Private**, click **Create repository**
3. Follow the "push an existing repository" instructions GitHub shows you — it'll be two or three commands you paste into your terminal in this project folder

---

### Step 2 — Import the project into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Find your `jeffs-bookmatch` repository and click **Import**
4. Leave all the build settings as they are — Vercel detects Next.js automatically
5. **Before clicking Deploy**, continue to Step 3

---

### Step 3 — Add your API key

On the same Vercel import screen, scroll down to **Environment Variables** and add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | your key from console.anthropic.com |

Then click **Deploy**.

---

### Step 4 — Your app is live

Vercel gives you a URL like `https://jeffs-bookmatch.vercel.app`. That's your app.

- **Share `/profile-form`** with your dad — e.g. `https://jeffs-bookmatch.vercel.app/profile-form`
- **Go to `/setup`** yourself to upload the profile he downloads
- **Use `/`** (the homepage) every time you want recommendations

---

### Updating the app later

Any time you push new code to GitHub, Vercel automatically redeploys. No extra steps.

---

## Local development

```bash
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
