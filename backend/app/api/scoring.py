from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.scoring.engine import ScoringEngine

router = APIRouter()


class ScoreRequest(BaseModel):
    deal_id: str
    organization_id: str
    force_recalculate: bool = False


class NegotiationRequest(BaseModel):
    deal_id: str
    apport_initial: Optional[float] = None
    depot_garantie: Optional[float] = None
    duree_mois: Optional[int] = None
    valeur_residuelle_ajustement: Optional[float] = None
    caution_personnelle: Optional[bool] = None


@router.post("/compute")
async def compute_score(request: ScoreRequest):
    engine = ScoringEngine()
    try:
        result = await engine.compute_full_score(
            deal_id=request.deal_id,
            organization_id=request.organization_id,
            force=request.force_recalculate,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate-negotiation")
async def simulate_negotiation(request: NegotiationRequest):
    engine = ScoringEngine()
    try:
        result = await engine.simulate_negotiation(
            deal_id=request.deal_id,
            params=request.model_dump(exclude={"deal_id"}, exclude_none=True),
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deal-optimizer")
async def deal_optimizer(request: ScoreRequest):
    engine = ScoringEngine()
    try:
        suggestions = await engine.optimize_deal(
            deal_id=request.deal_id,
            organization_id=request.organization_id,
        )
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
