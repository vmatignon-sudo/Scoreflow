from fastapi import APIRouter

router = APIRouter()


@router.get("/indicators")
async def get_macro_indicators():
    from app.services.macro_service import MacroService

    service = MacroService()
    return await service.get_current_indicators()


@router.get("/sector/{code_naf}")
async def get_sector_data(code_naf: str):
    from app.services.sector_service import SectorService

    service = SectorService()
    return await service.get_sector_data(code_naf)
