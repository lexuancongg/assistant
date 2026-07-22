from fastapi import FastAPI
from app.routers.extract import router as extract_router
from  app.routers.chat import router as chat_router
app = FastAPI(
    title="Enterprise AI Service",
    version="1.0.0"
)


app.include_router(extract_router)
app.include_router(
    chat_router,
)