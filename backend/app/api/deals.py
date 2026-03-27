from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SimulationRequest(BaseModel):
    deal_id: str
    mois_defaut: int
    delai_recuperation_mois: int = 2
    taux_frais_recuperation: float = 0.12


@router.post("/simulate-incident")
async def simulate_incident(request: SimulationRequest):
    from app.scoring.simulator import IncidentSimulator

    simulator = IncidentSimulator()
    try:
        result = await simulator.simulate(
            deal_id=request.deal_id,
            mois_defaut=request.mois_defaut,
            delai_recuperation=request.delai_recuperation_mois,
            taux_frais=request.taux_frais_recuperation,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/risk-curve")
async def compute_risk_curve(deal_id: str):
    from app.scoring.risk_curve import RiskCurveCalculator

    calculator = RiskCurveCalculator()
    try:
        result = await calculator.compute(deal_id=deal_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{deal_id}/score")
async def get_deal_score(deal_id: str):
    # Will be implemented with Supabase queries
    return {"deal_id": deal_id, "message": "Not yet implemented"}


@router.post("/{deal_id}/analyze")
async def analyze_deal(deal_id: str):
    """Lance l'analyse complète d'un deal : scoring sur les 5 dimensions."""
    from app.scoring.engine import ScoringEngine
    from app.core.config import get_supabase

    supabase = get_supabase()
    # Récupérer l'organization_id du deal
    deal = supabase.table("deals").select("organization_id").eq("id", deal_id).single().execute()
    if not deal.data:
        raise HTTPException(status_code=404, detail="Deal not found")

    organization_id = deal.data["organization_id"]

    # Passer le statut à analyzing
    supabase.table("deals").update({"status": "analyzing"}).eq("id", deal_id).execute()

    engine = ScoringEngine()
    try:
        result = await engine.compute_full_score(
            deal_id=deal_id,
            organization_id=organization_id,
            force=True,
        )
        # Passer le statut à completed
        supabase.table("deals").update({"status": "completed"}).eq("id", deal_id).execute()
        return result
    except Exception as e:
        # En cas d'erreur, repasser en draft
        supabase.table("deals").update({"status": "draft"}).eq("id", deal_id).execute()
        raise HTTPException(status_code=500, detail=str(e))
