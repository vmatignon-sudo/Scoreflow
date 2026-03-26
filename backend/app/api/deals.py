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
