# 🩺 TeenMed

**Empowering the next generation of healers.**

TeenMed is a free web platform for teens interested in medicine — covering Future Doctor resources, Health Literacy, CPR & First Aid, Medical Research, Equipment Donations, and Mental Health.

---

## Tech Stack

- **Backend**: Python / Flask
- **Database**: SQLite (via Flask-SQLAlchemy)
- **Auth**: Email/password + optional Google (Firebase)
- **Hosting**: Render (free tier)

---

## Local Development

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/teenmed.git
cd teenmed

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run locally
python app.py
```

Visit `http://localhost:5000`

---

## Deploying to Render (Free)

See DEPLOY.md for step-by-step instructions.

---

## Google Sign-In Setup (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Enable Authentication → Enable Google
3. Copy your Firebase config into `static/js/auth.js`
4. Download your service account JSON → save as `firebase-credentials.json`
5. Set `FIREBASE_CREDENTIALS` env var in Render to the path

---

## Project Structure

```
teenmed/
├── app.py                  # Flask app + routes + auth API
├── requirements.txt
├── render.yaml             # Render deployment config
├── Procfile
├── templates/
│   ├── base.html           # Shared layout + navbar + auth modal
│   ├── index.html          # Homepage
│   ├── dashboard.html      # User dashboard
│   ├── future_doctor.html
│   ├── health_literacy.html
│   ├── cpr_firstaid.html
│   ├── research.html
│   ├── equipment.html
│   └── mental_health.html
└── static/
    ├── css/main.css        # Full design system
    └── js/auth.js          # Auth logic
```
