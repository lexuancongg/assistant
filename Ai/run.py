import os
from pathlib import Path

from dotenv import load_dotenv
import uvicorn


def main():
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("DEV", "false").lower() in {"1", "true", "yes"},
    )


if __name__ == "__main__":
    main()
