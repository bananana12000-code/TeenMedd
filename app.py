from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import timedelta
try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth
    _firebase_available = True
except ImportError:
    _firebase_available = False

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'teenmed-secret-key-change-in-production')
app.permanent_session_lifetime = timedelta(days=30)

# Database config
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///teenmed.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Firebase Admin (for verifying Google tokens)
# In production, set FIREBASE_CREDENTIALS env var with your service account JSON path
try:
    if _firebase_available:
        cred_path = os.environ.get('FIREBASE_CREDENTIALS', 'firebase-credentials.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            FIREBASE_ENABLED = True
        else:
            FIREBASE_ENABLED = False
    else:
        FIREBASE_ENABLED = False
except Exception:
    FIREBASE_ENABLED = False


# ─── Models ───────────────────────────────────────────────────────────────────

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=True)  # null for Google-only users
    country = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=True)  # only for USA
    google_uid = db.Column(db.String(200), nullable=True, unique=True)
    auth_method = db.Column(db.String(20), default='email')  # 'email' or 'google'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'country': self.country,
            'state': self.state
        }


with app.app_context():
    db.create_all()


# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    country = data.get('country', '').strip()
    state = data.get('state', '').strip()

    if not all([username, email, password, country]):
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        country=country,
        state=state if country.lower() == 'united states' else None,
        auth_method='email'
    )
    db.session.add(user)
    db.session.commit()

    session.permanent = True
    session['user_id'] = user.id
    return jsonify({'success': True, 'user': user.to_dict()})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid email or password'}), 401

    session.permanent = True
    session['user_id'] = user.id
    return jsonify({'success': True, 'user': user.to_dict()})


@app.route('/api/google-auth', methods=['POST'])
def google_auth():
    data = request.get_json()
    id_token = data.get('idToken')
    username = data.get('username', '').strip()
    country = data.get('country', '').strip()
    state = data.get('state', '').strip()

    if not id_token:
        return jsonify({'error': 'No token provided'}), 400

    if FIREBASE_ENABLED:
        try:
            decoded = firebase_auth.verify_id_token(id_token)
            google_uid = decoded['uid']
            email = decoded.get('email', '')
        except Exception as e:
            return jsonify({'error': 'Invalid Google token'}), 401
    else:
        # Dev mode: trust client-side data (replace with real Firebase in production)
        google_uid = data.get('uid')
        email = data.get('email', '').strip().lower()

    existing = User.query.filter_by(google_uid=google_uid).first()
    if existing:
        session.permanent = True
        session['user_id'] = existing.id
        return jsonify({'success': True, 'user': existing.to_dict(), 'existing': True})

    # New Google user — needs username + country
    if not username or not country:
        return jsonify({'needs_profile': True})

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        username=username,
        email=email,
        country=country,
        state=state if country.lower() == 'united states' else None,
        google_uid=google_uid,
        auth_method='google'
    )
    db.session.add(user)
    db.session.commit()

    session.permanent = True
    session['user_id'] = user.id
    return jsonify({'success': True, 'user': user.to_dict()})


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/api/me')
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 401
    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({'authenticated': False}), 401
    return jsonify({'authenticated': True, 'user': user.to_dict()})


@app.route('/api/check-username')
def check_username():
    username = request.args.get('username', '').strip()
    taken = User.query.filter_by(username=username).first() is not None
    return jsonify({'taken': taken})


# ─── Page Routes ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/future-doctor')
def future_doctor():
    return render_template('future_doctor.html')

@app.route('/health-literacy')
def health_literacy():
    return render_template('health_literacy.html')

@app.route('/cpr-firstaid')
def cpr_firstaid():
    return render_template('cpr_firstaid.html')

@app.route('/research')
def research():
    return render_template('research.html')

@app.route('/equipment')
def equipment():
    return render_template('equipment.html')

@app.route('/mental-health')
def mental_health():
    return render_template('mental_health.html')

@app.route('/shadowing-guide')
def shadowing_guide():
    return render_template('shadowing_guide.html')

if __name__ == '__main__':
    app.run(debug=True)
