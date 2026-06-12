# Jeff's BookMatch — Build & Debug Log

A plain-language record of how this project was built and deployed, what went
wrong, and what fixed it. Written so you can review the journey and avoid
repeating the same snags next time.

---

## 1. What we built

**Jeff's BookMatch** — a personalized book recommendation web app for picking
book gifts for your dad.

- **Framework:** Next.js (App Router) + Tailwind CSS, TypeScript
- **AI:** Anthropic API (`claude-sonnet-4-6`) with web search for critic quotes
- **Storage:** localStorage only — no database, no accounts
- **Hosting:** Vercel, deployed from GitHub repo `erscherer13-jpg/101`,
  branch `claude/lucid-rubin-9i2k2f`

### Pages & structure
| Path | Purpose |
|------|---------|
| `/profile-form` | Warm form your dad fills out → downloads `dad-profile.json` |
| `/setup` | You upload that JSON; it's saved to localStorage |
| `/` | Homepage intake (mood, avoid, length) → AI book recommendations |
| `/api/recommend` | Backend route: Anthropic + web search → structured JSON |

Key files: `app/page.tsx`, `app/profile-form/page.tsx`, `app/setup/page.tsx`,
`app/api/recommend/route.ts`, `components/BookCard.tsx`,
`components/ResultsGrid.tsx`, `lib/types.ts`, `lib/storage.ts`.

---

## 2. The build order (what went smoothly)

1. ✅ Scaffolded Next.js project, confirmed file structure
2. ✅ Built `/profile-form` with dynamic add/remove fields + JSON download
3. ✅ Built `/setup` upload page storing profile in localStorage
4. ✅ Built `/` homepage intake form
5. ✅ Built the AI backend route
6. ✅ Built the results cards
7. ✅ Built the "Not for me" replacement feature

The **front-end and design worked on the first try** — the warm bookshop
aesthetic, serif headings, and all three pages rendered correctly. The first
production build passed with zero TypeScript errors.

---

## 3. The deployment saga (what went wrong & how it was fixed)

This is where most of the time went. The code was fine early; the problems were
all **deployment plumbing** and one **API integration bug**.

### Problem A — Couldn't push to GitHub from the cloud session
- **Symptom:** `git push` returned `403 Permission denied`. The GitHub MCP
  integration was read-only for this repo, and the repo started empty.
- **What didn't work:** GitHub MCP `push_files`, `create_branch`,
  `create_or_update_file` — all 403. Granting the GitHub App access didn't
  apply (the app wasn't installed on the account).
- **What worked:** Creating a **Personal Access Token (classic)** with `repo`
  scope on GitHub, then pushing with the token in the remote URL. The token was
  removed from git config immediately after each push for safety.
- **Takeaway:** In this cloud setup, code pushes need a GitHub PAT. Tokens
  starting with `ghp_` are GitHub; `vcp_` are Vercel — don't mix them up.

### Problem B — Vercel kept serving old code
- **Symptom:** Fixes were pushed but the live site didn't change; the
  deployment ID stayed the same and the error response lacked new fields.
- **Cause:** Vercel wasn't connected to the GitHub repo at first, so pushes
  didn't trigger deploys. Early deploys were also "Vercel Drop" uploads of
  stale code, and the production branch wasn't the one we were pushing to.
- **What worked:** Connecting the GitHub repo in Vercel → Settings → Git, and
  making sure the deployment was building from branch
  `claude/lucid-rubin-9i2k2f`. After that, every push auto-deployed.
- **Takeaway:** Confirm Vercel → Settings → Git shows the repo connected AND
  the right production branch. Watch for a NEW deployment ID after each push.

### Problem C — The API kept returning "Something went wrong"
This was the real application bug, uncovered in stages once deploys were live:

1. **Outdated model ID** — code used `claude-sonnet-4-20250514`, which the API
   rejected. Fixed → `claude-sonnet-4-6`.
2. **No visible error detail** — added a `detail` field to the error response
   and per-stage `console.error` logging so we could finally see the cause in
   the browser Network tab.
3. **Tool-loop bug** — when the AI called the search tool multiple times in one
   turn, the code only returned one `tool_result`, so Anthropic rejected the
   next request (`tool_use ids were found without tool_result blocks`). Fixed
   by handling ALL tool calls per turn in parallel.
4. **Broken search dependency** — the custom Brave search had no API key, so
   every search returned "Search unavailable" and the model replied with an
   apology instead of JSON (`Unexpected token 'I', "I'm sorry"...`).
   **Fixed by switching to Anthropic's native server-side `web_search` tool** —
   no separate key, no manual loop.
5. **Hardening** — pinned `export const runtime = "nodejs"`, moved the Anthropic
   client init inside the handler with a missing-key guard, added a no-search
   fallback so the app degrades gracefully, and made JSON extraction robust
   (pull everything between the first `{` and last `}`).

**Result:** "Find books" works. 🎉

---

## 4. Lessons for going forward

- **Deploy plumbing first.** Get GitHub → Vercel auto-deploy working before
  debugging app logic, or you'll debug against stale code.
- **Always surface error detail.** The single most useful fix was adding a
  `detail` field + per-stage logging. Until then we were guessing.
- **Read the actual error in the Network tab** (click `recommend` → Response),
  not just the generic UI message.
- **Prefer Anthropic's native `web_search` tool** over a custom search API —
  fewer moving parts, no extra key.
- **Model IDs matter** — use current IDs (`claude-sonnet-4-6`).
- **Keep secrets out of commits** — PATs were used transiently and stripped
  from git config; the API key lives only in Vercel env vars.

---

## 5. Current status

- ✅ App deployed and functional on Vercel
- ✅ All four planned pages working
- ✅ AI recommendations returning with web-search-backed critic quotes
- ⏭️ Next up: further editing/refinements (TBD)

---

## 6. Environment notes

- **Env var:** `ANTHROPIC_API_KEY` (set in Vercel → Settings → Environment
  Variables, Production + Preview, marked Sensitive). A `.env.local.example`
  is included for local dev.
- **Repo:** `erscherer13-jpg/101`, branch `claude/lucid-rubin-9i2k2f`
- **Deploy:** push to the branch → Vercel auto-deploys
