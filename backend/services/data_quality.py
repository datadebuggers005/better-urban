"""Data quality auditing for civic complaint records and users."""
from typing import List, Dict
from services.seed_data import CATEGORIES, STATUS_META

VALID_CATEGORIES = {c["id"] for c in CATEGORIES}
VALID_STATUSES = set(STATUS_META.keys())


def audit_data_quality(incidents: List[Dict], users: List[Dict]) -> Dict:
    user_ids = {u["id"] for u in users}
    issues = []
    missing_photo_count = 0
    invalid_coords_count = 0
    missing_ward_count = 0
    orphan_reporter_count = 0
    invalid_status_count = 0

    for inc in incidents:
        record_issues = []
        if not (inc.get("title") or "").strip():
            record_issues.append("missing_title")
        lat = inc.get("lat")
        lng = inc.get("lng")
        if lat is None or lng is None or not (-90 <= lat <= 90) or not (-180 <= lng <= 180) or (lat == 0 and lng == 0):
            record_issues.append("invalid_coordinates")
            invalid_coords_count += 1
        if not inc.get("wardNumber"):
            record_issues.append("missing_ward_number")
            missing_ward_count += 1
        if not inc.get("photoUrl"):
            missing_photo_count += 1
        rep_id = inc.get("reporterId")
        if rep_id and rep_id not in user_ids:
            record_issues.append("orphan_reporter")
            orphan_reporter_count += 1
        if inc.get("status") not in VALID_STATUSES:
            record_issues.append("invalid_status")
            invalid_status_count += 1
        if inc.get("categoryId") not in VALID_CATEGORIES:
            record_issues.append("non_canonical_category")

        if record_issues:
            issues.append({
                "incidentId": inc.get("id"),
                "code": inc.get("code"),
                "title": inc.get("title"),
                "issues": record_issues,
            })

    total = len(incidents)
    healthy = total - len(issues)
    score = round((healthy / total) * 100, 1) if total > 0 else 100.0
    return {
        "totalIncidents": total,
        "healthyIncidents": healthy,
        "flaggedIncidents": len(issues),
        "qualityScore": score,
        "summary": {
            "invalidCoordinates": invalid_coords_count,
            "missingWardNumber": missing_ward_count,
            "missingPhoto": missing_photo_count,
            "orphanReporter": orphan_reporter_count,
            "invalidStatus": invalid_status_count,
        },
        "flaggedRecords": issues[:50],
    }
