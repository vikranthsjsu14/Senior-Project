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
- Visualizing trends with interactive charts so users understand their progress

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Recharts |
| Backend | Python FastAPI, SQLModel ORM |
| Database | SQLite |
| AI | Claude API (claude-haiku-4-5) via Anthropic SDK |
| Auth | JWT (python-jose) + bcrypt password hashing |
| Export | jsPDF for PDF generation |

## Features

### Health Dashboard
- Today's stats: steps, calories burned, water intake, active minutes, sleep
- 7-day trend charts (steps, calories, sleep)
- Recent activities and active goal progress

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
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py          # Register, login, JWT
│   │   │   ├── users.py         # Profile CRUD
│   │   │   ├── health_metrics.py
│   │   │   ├── activities.py
│   │   │   ├── nutrition.py
│   │   │   ├── goals.py
│   │   │   ├── dashboard.py     # Aggregated summary
│   │   │   ├── wearable.py      # Simulated sync
│   │   │   ├── recommendations.py # AI plan generation
│   │   │   ├── chat.py          # AI chat endpoint
│   │   │   └── food_scan.py     # AI food image analysis
│   │   └── services/
│   │       └── ai_service.py    # Claude API integration
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios API client wrappers
│   │   ├── context/             # React auth context
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── MetricsPage.tsx
│   │   │   ├── ActivitiesPage.tsx
│   │   │   ├── NutritionPage.tsx
│   │   │   ├── GoalsPage.tsx
│   │   │   ├── RecommendationsPage.tsx  # Chat + Plan
│   │   │   ├── FoodScanPage.tsx        # AI food photo analysis
│   │   │   ├── ProfilePage.tsx
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
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

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
# Edit .env and add your ANTHROPIC_API_KEY

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

1. Open http://localhost:5173 and **Register** a new account
2. Go to **Profile** and fill in your details (age, weight, fitness goal, etc.)
3. Go to **Dashboard** and click **Sync Wearable** to populate demo data
4. Check the **AI Coach** page — a starter plan is already available
5. Click **Personalize with AI** to get a plan tailored to your data
6. Chat with the AI Coach to ask questions about your health
7. Try **Food Scan** — upload a food photo to get instant calorie and macro estimates

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, get JWT |
| GET/PATCH | `/users/me` | Get/update profile |
| GET/POST | `/metrics/daily` | Daily health metrics |
| GET/POST | `/metrics/sleep` | Sleep logs |
| GET/POST | `/metrics/heart-rate` | Heart rate readings |
| GET/POST/DELETE | `/activities` | Workout activities |
| GET/POST/DELETE | `/nutrition` | Food/meal logs |
| GET/POST/PATCH/DELETE | `/goals` | Fitness goals |
| GET | `/dashboard/summary` | Aggregated dashboard data |
| POST | `/wearable/sync` | Simulate wearable data |
| POST | `/ai/recommendations` | Generate AI plan |
| GET | `/ai/recommendations` | Get cached plans |
| POST | `/chat` | Chat with AI coach |
| POST | `/food-scan/analyze` | Analyze food photo (upload image) |
| POST | `/food-scan/correct` | Correct a food analysis |

## Database Schema

7 tables: `users`, `daily_metrics`, `sleep_logs`, `heart_rate_logs`, `activities`, `nutrition_logs`, `goals`, `ai_recommendations`

All user data is scoped by `user_id` foreign key. SQLite database is auto-created on first run.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Claude API key (required for AI features) |
| `SECRET_KEY` | JWT signing secret (any random string) |
| `DATABASE_URL` | SQLite path (default: `sqlite:///./health_fitness.db`) |

## Authors

Senior Project Team

## Acknowledgments

- [Anthropic Claude API](https://docs.anthropic.com) — AI recommendations and chat
- [FastAPI](https://fastapi.tiangolo.com) — Backend framework
- [React](https://react.dev) — Frontend framework
- [Recharts](https://recharts.org) — Data visualization
- [SQLModel](https://sqlmodel.tiangolo.com) — Database ORM
