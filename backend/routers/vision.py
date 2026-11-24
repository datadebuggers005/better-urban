from fastapi import APIRouter, UploadFile, File, Depends
from core.auth import get_current_user
from services.vision import analyze_image

router = APIRouter()


@router.post("/vision/analyze")
async def analyze(file: UploadFile = File(...), user=Depends(get_current_user)):
    data = await file.read()
    if not data:
        from fastapi import HTTPException
        raise HTTPException(400, "Empty file")
    result = await analyze_image(data)
    result["filename"] = file.filename
    result["size"] = len(data)
    return result


@router.post("/vision/analyze-public")
async def analyze_public(file: UploadFile = File(...)):
    """No-auth variant for the demo/report flow."""
    data = await file.read()
    if not data:
        from fastapi import HTTPException
        raise HTTPException(400, "Empty file")
    result = await analyze_image(data)
    result["filename"] = file.filename
    result["size"] = len(data)
    return result
