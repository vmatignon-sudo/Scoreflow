from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()


@router.post("/parse-liasse")
async def parse_liasse_fiscale(file: UploadFile = File(...), deal_id: str = ""):
    from app.services.document_parser import DocumentParser

    parser = DocumentParser()
    try:
        result = await parser.parse_liasse(file, deal_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-devis")
async def parse_devis(file: UploadFile = File(...), deal_id: str = ""):
    from app.services.document_parser import DocumentParser

    parser = DocumentParser()
    try:
        result = await parser.parse_devis(file, deal_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-releve-bancaire")
async def parse_releve_bancaire(file: UploadFile = File(...), deal_id: str = ""):
    from app.services.document_parser import DocumentParser

    parser = DocumentParser()
    try:
        result = await parser.parse_releve_bancaire(file, deal_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
