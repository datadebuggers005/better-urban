import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from core.config import get_settings

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@router.post("/uploads")
async def upload_file(file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(settings.upload_dir, fname)
    with open(dest, "wb") as f:
        f.write(data)
    return {
        "url": f"/uploads/{fname}",
        "filename": fname,
        "originalFilename": file.filename,
        "size": len(data),
    }
