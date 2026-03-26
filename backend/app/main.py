from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ScoreFlow Scoring Engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Import routers after app is created to avoid circular imports
try:
    from app.api import scoring, deals, macro, documents
    app.include_router(scoring.router, prefix="/api/v1/scoring", tags=["scoring"])
    app.include_router(deals.router, prefix="/api/v1/deals", tags=["deals"])
    app.include_router(macro.router, prefix="/api/v1/macro", tags=["macro"])
    app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
except Exception:
    pass  # App still starts with /health even if routers fail
