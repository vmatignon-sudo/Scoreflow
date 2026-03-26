from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import scoring, deals, macro, documents, health

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(scoring.router, prefix="/api/v1/scoring", tags=["scoring"])
app.include_router(deals.router, prefix="/api/v1/deals", tags=["deals"])
app.include_router(macro.router, prefix="/api/v1/macro", tags=["macro"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
