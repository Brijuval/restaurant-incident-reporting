---
title: Restaurant Incident Reporting Backend
emoji: 🚨
colorFrom: red
colorTo: blue
sdk: docker
pinned: false
---

# CrispyBites Ops - Restaurant Incident Reporting Tool

CrispyBites Ops is a modern, high-fidelity, web-based Incident Reporting Tool designed for store staff to log operational issues (POS failures, food shortages, customer complaints) and managers/admins to triage, review, and resolve them.

The application features **AI-Assisted Operations** powered by the **Groq API** (Llama 3.1), which dynamically categorizes issues, gauges severity, provides instant staff remediation steps, and generates executive summaries and long-term action plans for managers.

---

## 🚀 Key Features

### 1. Staff Incident Submission Form
- Sleek, single-page interface with responsive layout and micro-animations.
- **Groq AI Auto-Fill**: Real-time analysis of incident descriptions to suggest the appropriate Category and Severity, reducing staff entry friction.
- Immediate action suggestions (e.g., "AI Suggestion: Switch to paper ordering tickets and reboot Lane 1 POS").

### 2. Manager & Administrator Dashboard
- **Operations Analytics**: Real-time KPI counters tracking total, pending, resolved, and critical incidents.
- **Robust Searching & Filtering**: Filter list by category, severity level, or ticket status, combined with text search (for Title, Location, and Details).
- **Groq Triage panel**: Interactive sidebar details panel featuring:
  - An AI-generated **Executive Summary** (1-2 sentences) of the incident.
  - An AI-proposed **Manager Action Plan** (preventative long-term steps).
- **Resolution Operations**: Managers can update ticket status (`Open` ➡️ `In Progress` ➡️ `Resolved`) and log operational notes.

### 3. Graceful Fallback System
- **No API Keys Required to run**: If the `GROQ_API_KEY` is not provided (or the API request fails), the application automatically engages a local **Rule-Based NLP Keyword Classifier** utilizing boundary-checked regular expressions to determine categories/severities and action recommendations, preventing app crashes.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite)
  - Styling: Vanilla CSS (CSS Modules) utilizing a custom HSL variables color theme and fluid animations.
  - Iconography: Lucide React.
- **Backend**: Python + Django + Django REST Framework (DRF)
  - Database: **SQLite** (local development, default) / **PostgreSQL** (production, dynamic fallback).
  - AI Triage: **Groq API** (Llama 3.1) via standard HTTP REST requests.
  - Production WSGI: `gunicorn` + `whitenoise` (efficient static file delivery).

---

## 📦 Project Structure

```text
restaurant-incident-reporting/
├── backend/                  # Django backend service
│   ├── config/               # Django project settings
│   ├── incidents/            # Django app for incidents model, views, serializers, tests, and AI helpers
│   ├── requirements.txt      # Python package list
│   └── manage.py
├── frontend/                 # Vite + React frontend
│   ├── src/
│   │   ├── components/       # Dashboard and Form React components
│   │   ├── App.jsx           # Main navigation and router layout
│   │   ├── index.css         # Global design system & theme vars
│   │   └── main.jsx
│   └── package.json          # React dependencies
├── package.json              # Root package.json for concurrently running dev servers
├── render.yaml               # Render Blueprint one-click deployment spec
├── .gitignore
└── README.md
```

---

## 💻 Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### Quick Start (Launch Both Frontend and Backend Concurrently)
1. Clone this repository and enter the folder:
   ```bash
   cd restaurant-incident-reporting
   ```
2. Copy the environment template and configure keys if desired:
   ```bash
   cp .env.example .env
   # Open .env and add your GROQ_API_KEY for the bonus AI features (optional)
   ```
3. Initialize the backend virtual environment and install packages:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate       # On Linux/macOS use: source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Run migrations and create the default admin account:
   ```bash
   python manage.py migrate
   # Instantly registers a default superuser account:
   # Username: admin | Password: adminpass
   echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')" | python manage.py shell
   ```
5. Install root dependencies (which packages `concurrently` for launch):
   ```bash
   cd ..
   npm install
   npm run install-frontend
   ```
6. Run both development servers with a single command:
   ```bash
   npm run dev
   ```
   - Frontend runs on: **`http://localhost:5173`**
   - Django API runs on: **`http://localhost:8000`**
   - Django Admin runs on: **`http://localhost:8000/admin`** (Username: `admin`, Password: `adminpass`)

---

## 🧪 Automated Testing
Run the Django API validation test suite:
```bash
cd backend
python manage.py test
```
The suite runs 5 tests verifying model creation, input validations (e.g. empty strings, future date errors), database filtering options, and the AI analysis fallback endpoint.

---

## 🌐 Production Deployment Guide

### 1. Database Setup (Supabase / Render Postgres)
1. Spin up a free PostgreSQL database on **Supabase** or **Render**.
2. Copy the connection string.

### 2. Backend Deployment (Render / Railway)
1. Create a new **Web Service** on Render connected to your GitHub repository.
2. Select environment: **Python**.
3. Set the directory path root to `backend/`.
4. Configure Build Command:
   ```bash
   pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
   ```
5. Configure Start Command:
   ```bash
   gunicorn incident_project.wsgi:application
   ```
6. Under Environment Variables, add:
   - `SECRET_KEY`: *[Insert secure string]*
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*` (or your Render URL)
   - `DATABASE_URL`: *[Insert your database connection string]*
   - `GROQ_API_KEY`: *[Insert your Groq API key]*

### 3. Frontend Deployment (Vercel / Netlify)
1. Create a new **Static Site** on Vercel/Netlify.
2. Point it to your repository and set the root directory to `frontend/`.
3. Configure Build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_API_URL`: *[URL of your deployed backend, e.g. `https://your-backend-app.onrender.com`]*

---

## 📝 Assumptions & Operational Decisions
1. **SQLite Default**: Designed to boot with zero config using SQLite locally to ensure evaluators can inspect and verify execution with one command.
2. **Dynamic DB Switching**: Checks for `DATABASE_URL` in Django settings, switching to PostgreSQL automatically if detected.
3. **CORS Configuration**: CORS headers are open (`CORS_ALLOW_ALL_ORIGINS = True`) for the api routes to allow multi-tenant setups and seamless local/cloud frontend communication.
4. **Front-End Fallbacks**: Handles missing API response gracefully and provides keyword matching, preventing form locks if Groq has server errors.
