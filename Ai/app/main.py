import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers.extract import router as extract_router
from app.routers.chat import router as chat_router
from app.routers.forecast import router as forecast_router
from app.routers.presentation import router as presentation_router

app = FastAPI(
    title="Enterprise AI Service",
    version="1.0.0"
)

# CORS: Giới hạn các origin được phép gọi trực tiếp
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

INTERNAL_SECRET = os.getenv("INTERNAL_AI_SECRET", "enterprise-ai-secret-key-2026")


@app.middleware("http")
async def verify_internal_secret(request: Request, call_next):
    # Cho phép OPTIONS preflight, Swagger UI và health check
    if request.method == "OPTIONS" or request.url.path in ["/", "/docs", "/redoc", "/openapi.json", "/health"]:
        return await call_next(request)

    # Bảo vệ toàn bộ endpoint /api/v1/ bằng internal secret header
    if request.url.path.startswith("/api/v1"):
        secret_header = request.headers.get("X-Internal-Secret")
        auth_header = request.headers.get("Authorization", "")
        bearer_secret = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else ""

        if secret_header != INTERNAL_SECRET and bearer_secret != INTERNAL_SECRET:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "status": "error",
                    "message": "Truy cập bị từ chối: Thiếu hoặc sai khóa xác thực nội bộ (X-Internal-Secret)."
                }
            )

    return await call_next(request)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Enterprise AI Service"}


app.include_router(extract_router)
app.include_router(chat_router)
app.include_router(forecast_router)
app.include_router(presentation_router)
