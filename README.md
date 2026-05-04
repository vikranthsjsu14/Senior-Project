# HealthAI — AI-Powered Personal Health & Fitness App

A full-stack web application that combines digital health tracking with artificial intelligence to provide personalized fitness and nutrition recommendations. Built as a Senior Project exploring the integration of AI in preventative healthcare.

## Problem

Fitness trackers and health apps generate vast amounts of raw data (step counts, calories, heart rate) but fail to provide actionable, personalized insights. Generic recommendations don't account for individual differences like age, health conditions, dietary restrictions, or fitness goals — leading to user disengagement and abandoned health plans.

## Solution

HealthAI bridges this gap by:
- Tracking health metrics, activities, nutrition, and sleep in one place
- Providing a default workout and nutrition plan that's immediately available
- Using Claude AI to personalize plans based on the user's real data and profile
- Offering an AI chat coach that can answer health questions using the user's actual metrics
- Scanning food photos with AI to estimate calories, macros, and suggest healthier swaps
- **Reviewing exercise videos with Gemini** to give specific form critique, then letting the user follow up by typing or speaking
- Visualizing trends with interactive charts (including a daily-progress goal ring and step-streak counter)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Recharts |
| Backend | Python FastAPI, SQLModel ORM |
| Database | SQLite |
| Text + Vision AI | Claude API (claude-haiku-4-5) — chat, recommendations, food photo analysis |
| Video + Audio AI | Google Gemini (gemini-2.5-flash) — exercise form review and voice transcription |
| Auth | JWT (python-jose) + bcrypt password hashing |
| Rate Limiting | slowapi (per-user when authed, per-IP otherwise) |
| Export | jsPDF for PDF generation |

## Features

### Health Dashboard
- **Goal ring** — radial progress for today's step goal, updates live as you log
- **Streak counter** — consecutive days hitting your daily-steps goal (🔥 badge with day count)
- Today's stats: steps, calories burned, water intake, active minutes, sleep
- 7-day trend charts (steps, calories, sleep) — fully theme-aware (charts retint on light/dark toggle)
- Recent activities and active goal progress

### Onboarding Wizard
- 3-step flow shown to new users right after registration
- Step 1: basics (age, weight, height, gender)
- Step 2: fitness goal + activity level
- Step 3: optional one-tap "sync demo data" to populate 7 days of metrics so the dashboard isn't empty on first visit
- Existing users with incomplete profiles (no `age`) are auto-redirected to onboarding from the root

### Metrics Logging
- **Daily Metrics** — steps, calories, water, active minutes (manual or from wearable data)
- **Sleep Tracking** — sleep start/end times, duration, quality score
- **Heart Rate** — BPM readings with context (resting/active/peak)
- Includes guides for finding data on Apple Watch, Fitbit, Garmin, Google Fit, Samsung Health

### Activity Tracking
- Log workouts with type (cardio, strength, flexibility, sports), duration, calories, distance
- View and delete activity history

### Nutrition Logging
- Log meals by type (breakfast, lunch, dinner, snack) with calories and macros
- Daily totals for calories, protein, carbs, fat
- Meals grouped by type for easy viewing

### Goal Setting
- Set goals: daily steps, target weight, weekly calories, sleep hours, workout frequency
- Track progress with visual progress bars
- Update progress inline, auto-complete when target reached

### AI Food Scanner
- **Photo Upload** — upload a food photo or take one with your camera (drag & drop supported)
- **AI Analysis** — Claude vision identifies the food and estimates calories, protein, carbs, fat, and fiber
- **Meal Quality Score** — 1-10 rating with color-coded label (Poor → Excellent)
- **Item Breakdown** — each component listed separately with individual calories
- **Healthier Swaps** — "Instead of X, try Y — save ~N kcal" suggestions
- **Positives & Improvements** — what's good about the meal and what could be better
- **Key Nutrients** — vitamins and minerals present in the meal
- **Correction Flow** — if the AI misidentifies something, users can type a correction (e.g. "That's lamb not beef") and the analysis updates in place
- **Quick Log** — one tap to log the scanned meal directly to the Nutrition page

### AI Form Coach (Gemini Video Review)
- **Video Upload** — upload a 5-30s clip of any exercise (MP4, MOV, WebM, up to 100 MB)
- **Form Analysis** — Gemini 2.5 Flash detects the exercise, counts reps, and rates form 1-10 with a color-coded label (Needs Work → Excellent)
- **Specific Feedback** — flags form issues with severity (minor/moderate/major), the timestamp where it's most visible, and a concrete fix cue
- **Positives + Key Cues** — what the user's already doing right and what to focus on next session
- **Voice-to-Text Follow-up** — built-in 🎙 button records the user's question via the browser MediaRecorder API, ships it to Gemini for transcription, and drops the transcript into the chat input
- **Conversational Chat** — keep asking the coach questions about your form; each reply is grounded in the original video analysis

### AI Health Coach
- **Chat Interface** — conversational AI coach with access to the user's real health data
- **Default Plan** — a balanced starter workout and nutrition plan available immediately
- **AI Personalization** — one-click to generate a plan tailored to the user's exact profile and data
- **Regenerate After Chat** — update the plan based on conversation with the coach
- Quick question buttons for common health queries

### Plan Export
- Download as PDF (styled dark theme)
- Download as plain text
- Download as JSON (raw data)
- Copy to clipboard

### User Profile
- Personal info: age, weight, height, gender
- Fitness goal: weight loss, muscle gain, endurance, general wellness
- Activity level: sedentary to very active
- Health conditions: diabetes, hypertension, heart disease, etc.
- Dietary restrictions: vegetarian, vegan, gluten-free, keto, etc.
- Auto-calculated BMI

### Wearable Simulation
- "Sync Wearable" button generates realistic mock data for 7 days
- Simulates steps, calories, sleep, and heart rate based on user's activity level

### Privacy & Data Controls
- **Medical disclaimer footer** sitewide ("Not medical advice — consult a doctor")
- **Dedicated `/privacy` page** explaining what's stored, what's sent to AI providers, and the academic/non-commercial context
- **Export my data** — one-click download of every record tied to the user as a JSON file (profile, metrics, sleep, heart-rate, activities, nutrition, goals, AI recommendations)
- **Delete my account** — permanent, cascades across all 8 tables; requires typing "DELETE" to confirm

## Project Structure

```
Senior Project 1/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # SQLite engine + session
│   │   ├── models/              # SQLModel database models
│   │   │   ├── user.py
│   │   │   ├── health_metrics.py
│   │   │   ├── activity.py
│   │   │   ├── nutrition.py
│   │   │   ├── goals.py
│   │   │   └── ai_recommendation.py
│   │   ├── limiter.py           # slowapi rate limiter (per-user / per-IP)
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py          # Register, login, JWT
│   │   │   ├── users.py         # Profile CRUD + data export + account deletion
│   │   │   ├── health_metrics.py
│   │   │   ├── activities.py
│   │   │   ├── nutrition.py
│   │   │   ├── goals.py
│   │   │   ├── dashboard.py     # Aggregated summary + streak counter
│   │   │   ├── wearable.py      # Simulated sync
│   │   │   ├── recommendations.py  # Claude AI plan generation
│   │   │   ├── chat.py          # Claude chat coach (rate-limited)
│   │   │   ├── food_scan.py     # Claude food image analysis (rate-limited)
│   │   │   └── exercise_review.py  # Gemini video form review + voice transcription (rate-limited)
│   │   └── services/
│   │       ├── ai_service.py    # Claude API integration
│   │       ├── ai_errors.py     # Anthropic error → HTTP translation
│   │       └── gemini_service.py  # Google Gemini integration (video, audio, chat)
│   ├── tests/                   # Pytest suite (in-memory SQLite, Anthropic mocked)
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_metrics.py
│   │   ├── test_ai_errors.py
│   │   └── test_ai_routes.py
│   ├── pytest.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API client wrappers
│   │   ├── context/             # React auth context
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   │   ├── DashboardPage.tsx       # Goal ring + streak + charts
│   │   │   ├── MetricsPage.tsx
│   │   │   ├── ActivitiesPage.tsx
│   │   │   ├── NutritionPage.tsx
│   │   │   ├── GoalsPage.tsx
│   │   │   ├── RecommendationsPage.tsx # Claude chat + plan
│   │   │   ├── FoodScanPage.tsx        # Claude food photo analysis
│   │   │   ├── ExerciseReviewPage.tsx  # Gemini form coach (video upload + voice chat)
│   │   │   ├── OnboardingPage.tsx      # 3-step new-user wizard
│   │   │   ├── ProfilePage.tsx         # Profile + Data export/delete
│   │   │   ├── PrivacyPage.tsx         # Medical disclaimer + privacy notice
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com)) — chat, recommendations, food scanner
- A Google AI Studio API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) — Form Coach video review and voice transcription. The free tier is fine for demos (~5 requests/min on `gemini-2.5-flash`).

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY and GOOGLE_API_KEY

# Start the server
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**
API docs at **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at **http://localhost:5173**

### 3. Getting Started

1. Open http://localhost:5173 and **Register** a new account — you'll be sent straight into the **Onboarding wizard**
2. Walk through the 3 steps (basics → fitness goal → optional demo-data sync)
3. Land on the **Dashboard** with your goal ring, streak, and charts populated
4. Check the **AI Coach** — a starter plan is already there; hit **Personalize with AI** for one tailored to your data
5. Try **Food Scan** — upload a food photo for instant calorie + macro estimates
6. Try **Form Coach** — upload a 5-30s clip of any exercise; Gemini analyzes your form, then ask follow-ups by typing **or with the 🎙 mic button**
7. Visit **Profile → Your Data** to export everything as JSON or delete your account

## Testing

The backend ships with a pytest suite that runs against an in-memory SQLite database and mocks the Anthropic client, so no API key or network access is needed to run it.

```bash
cd backend
source venv/bin/activate
pytest
```

**What's covered (33 tests):**
- **Auth** — registration, duplicate-email rejection, login success/failure, JWT guard on protected routes
- **Metrics CRUD** — create/read, same-day upsert, cross-user isolation, 404 handling
- **AI error translation** (`ai_errors.py`) — rate limits → 429, network failures → 503, timeouts → 504, malformed JSON → 502, markdown-fenced responses parsed correctly
- **AI routes** — chat happy path + input validation + rate-limit fallback, food-scan non-image rejection + malformed-JSON handling, recommendations profile guard + happy path

## Error Handling

AI endpoints translate SDK exceptions (Anthropic + Gemini) to appropriate HTTP responses instead of leaking raw stack traces:

| Failure | Response |
|---------|----------|
| Rate limit hit | `429` — "AI service is busy. Please try again in a moment." |
| Network unreachable | `503` — "Cannot reach AI service." |
| Request timeout | `504` — "AI service timed out." |
| Provider 5xx | `503` — "AI service is temporarily unavailable." |
| Malformed AI response | `502` — "AI returned an unexpected response." |
| Bad API key (server-side) | `500` — generic "misconfigured" message (no internals leaked) |
| Gemini file-processing > 90s | `504` — "AI service took too long to process the file. Try a shorter clip." |

Chat also validates input: `role` must be `user` or `assistant`, message content is 1–4000 chars, and the conversation must end on a user turn.

### Rate limits

Rate limiting is keyed per authenticated user when a JWT is present, otherwise per IP.

| Endpoint | Limit |
|----------|-------|
| `POST /chat` | 20 / minute |
| `POST /food-scan/analyze` | 10 / minute |
| `POST /food-scan/correct` | 10 / minute |
| `POST /ai/recommendations` | 5 / minute |
| `POST /exercise-review/analyze-video` | 4 / minute |
| `POST /exercise-review/transcribe` | 20 / minute |
| `POST /exercise-review/chat` | 20 / minute |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, get JWT |
| GET/PATCH | `/users/me` | Get/update profile |
| GET | `/users/me/export` | Download all user data as JSON |
| DELETE | `/users/me` | Permanently delete account + all records |
| GET/POST | `/metrics/daily` | Daily health metrics |
| GET/POST | `/metrics/sleep` | Sleep logs |
| GET/POST | `/metrics/heart-rate` | Heart rate readings |
| GET/POST/DELETE | `/activities` | Workout activities |
| GET/POST/DELETE | `/nutrition` | Food/meal logs |
| GET/POST/PATCH/DELETE | `/goals` | Fitness goals |
| GET | `/dashboard/summary` | Aggregated dashboard data (incl. streak + step goal) |
| POST | `/wearable/sync` | Simulate wearable data |
| POST | `/ai/recommendations` | Generate AI plan (Claude) |
| GET | `/ai/recommendations` | Get cached plans |
| POST | `/chat` | Chat with AI health coach (Claude) |
| POST | `/food-scan/analyze` | Analyze food photo (Claude vision) |
| POST | `/food-scan/correct` | Correct a food analysis |
| POST | `/exercise-review/analyze-video` | Analyze exercise form from a video clip (Gemini) |
| POST | `/exercise-review/transcribe` | Transcribe a recorded audio clip (Gemini) |
| POST | `/exercise-review/chat` | Follow-up chat about a previous form analysis (Gemini) |

## Database Schema

7 tables: `users`, `daily_metrics`, `sleep_logs`, `heart_rate_logs`, `activities`, `nutrition_logs`, `goals`, `ai_recommendations`

All user data is scoped by `user_id` foreign key. SQLite database is auto-created on first run.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key — required for chat, recommendations, food scan |
| `GOOGLE_API_KEY` | Google AI Studio key — required for Form Coach (video review + voice transcription) |
| `SECRET_KEY` | JWT signing secret (any random string) |
| `DATABASE_URL` | SQLite path (default: `sqlite:///./health_fitness.db`) |
| `GEMINI_VIDEO_MODEL` | Gemini model used for video form review (default: `gemini-2.5-flash`) |
| `GEMINI_AUDIO_MODEL` | Gemini model used for audio transcription (default: `gemini-2.5-flash`) |
| `GEMINI_CHAT_MODEL` | Gemini model used for follow-up chat (default: `gemini-2.5-flash`) |

## Authors

Senior Project Team

## Acknowledgments

- [Anthropic Claude API](https://docs.anthropic.com) — AI recommendations, chat, food image analysis
- [Google Gemini API](https://ai.google.dev) — exercise video form review, audio transcription
- [FastAPI](https://fastapi.tiangolo.com) — Backend framework
- [React](https://react.dev) — Frontend framework
- [Recharts](https://recharts.org) — Data visualization
- [SQLModel](https://sqlmodel.tiangolo.com) — Database ORM
- [slowapi](https://github.com/laurentS/slowapi) — Rate limiting
