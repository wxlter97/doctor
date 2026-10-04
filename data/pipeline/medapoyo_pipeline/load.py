"""Carga a Supabase con service_role (solo local/CI; NUNCA en el frontend)."""
from __future__ import annotations

import json
import os
import urllib.request

from .match import Merged


def to_payload(m: Merged) -> tuple[dict, list[dict]]:
    ingredients, form, strength = m.key
    med = {"generic_name": m.name, "active_ingredients": list(ingredients), "pharmaceutical_form": form, "strength": strength}
    links = [
        {"institution_id": r.institution, "institutional_code": r.code or None, "care_level": r.care_level or None, "presentation": r.presentation or None}
        for r in m.rows
    ]
    return med, links


def _post(path: str, body: list[dict] | dict, prefer: str) -> list[dict]:
    url, key = os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    req = urllib.request.Request(
        f"{url}/rest/v1/{path}", data=json.dumps(body).encode(), method="POST",
        headers={"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": prefer},
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read() or "[]")


def load(merged: list[Merged]) -> None:
    for m in merged:
        med, links = to_payload(m)
        saved = _post("medications?on_conflict=generic_name,pharmaceutical_form,strength", med, "resolution=merge-duplicates,return=representation")
        mid = saved[0]["id"]
        _post("medication_institutions?on_conflict=medication_id,institution_id", [{**l, "medication_id": mid} for l in links], "resolution=merge-duplicates")
