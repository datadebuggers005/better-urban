from fastapi import APIRouter
from core.config import get_settings
from db.store import is_local, get_store
from services.seed_data import CITIES, SECTORS, CATEGORIES, SUB_CATEGORIES

router = APIRouter()


@router.get("/cities")
def list_cities():
    if is_local():
        return get_store().cities()
    return CITIES


@router.get("/cities/{city_id}/sectors")
def list_sectors(city_id: str):
    if is_local():
        return get_store().sectors(city_id)
    return [s for s in SECTORS if s["cityId"] == city_id]


@router.get("/categories")
def list_categories():
    if is_local():
        return get_store().categories()
    return CATEGORIES


@router.get("/categories/{category_id}/sub")
def list_sub_categories(category_id: str):
    if is_local():
        return get_store().sub_categories(category_id)
    return [s for s in SUB_CATEGORIES if s["categoryId"] == category_id]


@router.get("/sectors/{sector_id}")
def get_sector(sector_id: str):
    from services.seed_data import SECTORS
    for s in SECTORS:
        if s["id"] == sector_id:
            return s
    from fastapi import HTTPException
    raise HTTPException(404, "Sector not found")
