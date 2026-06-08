# 🚀 How to Deploy TeenMed — Step by Step (All Free)

---

## STEP 1 — Install Git (if you don't have it)

Download from: https://git-scm.com/downloads
Install it. Then open a terminal (Command Prompt or Terminal on Mac).

---

## STEP 2 — Create a GitHub Account

Go to https://github.com and sign up for free.

---

## STEP 3 — Create a New GitHub Repository

1. On GitHub, click the **"+"** in the top right → **"New repository"**
2. Name it: `teenmed`
3. Set it to **Public** (required for free Render)
4. Do NOT check "Add README" (we already have one)
5. Click **"Create repository"**

---

## STEP 4 — Upload Your Code to GitHub

Open terminal, navigate to your teenmed folder:

```bash
cd path/to/teenmed        # example: cd Desktop/teenmed

git init
git add .
git commit -m "Initial TeenMed commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/teenmed.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.
GitHub will ask for your username and password (use a Personal Access Token as password — create one at github.com/settings/tokens).

---

## STEP 5 — Create a Render Account

Go to https://render.com and sign up for free using your GitHub account.

---

## STEP 6 — Deploy on Render

1. On Render dashboard → click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"** → select your `teenmed` repo
3. Fill in these settings:
   - **Name**: `teenmed`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free
4. Under **Environment Variables**, add:
   - Key: `SECRET_KEY` → Value: (any long random string, like `teenmed-super-secret-2025-xyz`)
5. Click **"Create Web Service"**

Render will build and deploy automatically. It takes about 2-3 minutes.

---

## STEP 7 — Your Site is Live! 🎉

Render gives you a free URL like:
`https://teenmed.onrender.com`

That's your live website! Share it with anyone.

---

## STEP 8 — Making Changes Later

Whenever you update your code:

```bash
git add .
git commit -m "Updated something"
git push
```

Render will automatically redeploy in 2-3 minutes.

---

## OPTIONAL — Custom Domain

If you buy a domain (like `teenmed.org` from Namecheap ~$10/year):
1. In Render → your service → **Settings** → **Custom Domains**
2. Follow the instructions to point your domain to Render

---

## NOTES

- The free Render plan **spins down after 15 minutes of inactivity**. The first visit after inactivity takes ~30 seconds to wake up. This is normal for the free tier.
- Your SQLite database resets on Render free tier if the service restarts. For permanent user data, upgrade to Render's paid tier ($7/mo) or switch to Supabase (free PostgreSQL database). That's a future upgrade — not needed to launch.

---

## Need Help?

- Render docs: https://render.com/docs
- Flask docs: https://flask.palletsprojects.com
- GitHub docs: https://docs.github.com
