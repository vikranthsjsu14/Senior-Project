from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from .database import create_db_and_tables
from .limiter import limiter
from .routers import auth, users, health_metrics, activities, nutrition, goals, dashboard, wearable, recommendations, chat, food_scan, exercise_review

# Import all models so SQLModel registers them before create_all
from .models import user, health_metrics as hm_model, activity, nutrition as nut_model, goals as goals_model, ai_recommendation  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Health Fitness AI API",
    description="AI-powered personal health and fitness tracking API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(health_metrics.router)
app.include_router(activities.router)
app.include_router(nutrition.router)
app.include_router(goals.router)
app.include_router(dashboard.router)
app.include_router(wearable.router)
app.include_router(recommendations.router)
app.include_router(chat.router)
app.include_router(food_scan.router)
app.include_router(exercise_review.router)


@app.get("/")
def root():
    return {"message": "Health Fitness AI API is running", "docs": "/docs"}
