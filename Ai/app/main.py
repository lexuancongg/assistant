from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from app.routers.extract import router as extract_router
from app.routers.chat import router as chat_router
from app.routers.forecast import router as forecast_router
from app.routers.compare import router as compare_router

app = FastAPI(
    title="Enterprise AI Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract_router)
app.include_router(chat_router)
app.include_router(forecast_router)
app.include_router(compare_router)