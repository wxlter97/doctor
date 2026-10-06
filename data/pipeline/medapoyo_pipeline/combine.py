"""Cruce MINSAL + ISSS → catálogo de varias instituciones.

Regla: dos filas son el mismo medicamento solo si coinciden **principio(s) activo(s), concentración y vía** y sus estados
físicos son compatibles (sólido/líquido/semisólido; «sólido o líquido» es comodín). Nunca se fusiona por parecido.
Las filas del ISSS sin pareja exacta quedan como ficha propia (puede haber duplicados aparentes, nunca fusiones falsas);
las que se parecen a una ficha de otra institución se listan en `data/review/cruce_posibles.csv` para decidir a mano.

  python -m medapoyo_pipeline.combine
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from . import isss as isss_mod
from . import minsal as minsal_mod
from .normalize import norm_text, normalize_strength

STOP = {"de", "del", "la", "el", "y", "o", "en", "con", "sin", "para", "por"}
ISSS_INSTITUTION = {
    "id": "isss", "name": "Instituto Salvadoreño del Seguro Social (ISSS)", "listName": "LOM/ISSS",
    "listEdition": "19.ª edición (29/10/2024)", "sourceDate": "2024-10-29",
    "sourceUrl": "https://www.transparencia.gob.sv/descarga_archivo.php?id=NjA2NTM4&inst=606538",
}


def ingredient_key(ings: list[str]) -> tuple[str, ...]:
    """Ingredientes sin paréntesis/sales entre paréntesis, sin tildes, palabras ordenadas (Gluconato de Calcio = Calcio Gluconato)."""
    out = []
    for i in ings:
        words = [w for w in re.findall(r"[a-z0-9]+", norm_text(re.sub(r"\([^)]*\)", " ", i))) if w not in STOP]
        out.append(" ".join(sorted(words)))
    return tuple(sorted(out))


def strength_key(s: str) -> str:
    t = s.lower().replace("µg", "mcg").replace("μg", "mcg")
    t = re.sub(r"(?<=\d),(?=\d{3})", "", t)  # 1,500 → 1500
    t = t.replace("(", "").replace(")", "")
    t = re.sub(r"\s*\+\s*", "+", t)
    t = re.sub(r"\s+", " ", t).strip()
    try:
        t = normalize_strength(t)
    except Exception:  # noqa: BLE001
        pass
    prev = None
    while prev != t:  # «150 mg+150 mg» = «(150 + 150) mg»
        prev = t
        t = re.sub(r"(\d[\d.]*) ([^\s+/]+)\+(\d[\d.]*) \2\b", r"\1+\3 \2", t)
    return t


def route_class(route: str | None, form: str) -> str | None:
    r = (route or "").lower()
    f = form.lower()
    if "i.v" in r or "i.m" in r or "s.c" in r or "parenteral" in r or "parenteral" in f or "inyectable" in f:
        return "parenteral"
    for w in ("oral", "oftálmic", "tópic", "vaginal", "rectal", "nasal", "ótic", "inhalatori", "transdérmic", "sublingual"):
        if w in r or w in f:
            return w
    return r or None


def physical_state(form: str) -> str | None:
    """'sólido' | 'líquido' | 'semisólido' | 'suspensión' | None (desconocido/comodín)."""
    f = form.lower()
    if re.search(r"sólido o líquido|solido o liquido|inyectable o polvo|polvo.* o solución|solución.* o polvo|polvo.* o suspensión", f):
        return None
    if f.startswith("semisólido") or re.search(r"crema|ungüento|pomada|gel\b|pasta", f):
        return "semisólido"
    if "suspensión" in f and "polvo" not in f and "sólido" not in f:
        return "suspensión"
    if f.startswith("sólido") or re.search(r"tableta|cápsula|capsula|comprimido|polvo|liofilizado|granulado|supositorio|óvulo|parche|implante", f):
        return "sólido"
    if f.startswith("líquido") or re.search(r"solución|jarabe|elixir|gotas|aceite|emulsión|colutorio", f):
        return "líquido"
    return None


def compatible(a: str | None, b: str | None) -> bool:
    return a is None or b is None or a == b


def combine(minsal_catalog: dict, isss_rows: list[dict], version: int = 3) -> tuple[dict, list[dict], dict]:
    meds = [dict(m) for m in minsal_catalog["medications"]]
    index: dict[tuple, list[int]] = defaultdict(list)
    for n, m in enumerate(meds):
        index[(ingredient_key(m["activeIngredients"]), strength_key(m["strength"]), route_class(m.get("route"), m["form"]))].append(n)
    by_ficha: dict[int, list[dict]] = defaultdict(list)
    own: dict[tuple, list[dict]] = defaultdict(list)  # fichas solo ISSS: misma clave → una ficha
    own_order: list[tuple] = []
    for r in isss_rows:
        key = (ingredient_key(r["ingredients"]), strength_key(r["strength"]), route_class(r["route"], r["form"]))
        state = physical_state(r["form"])
        hit = next((n for n in index.get(key, []) if compatible(physical_state(meds[n]["form"]), state)), None) if r["strength"] != minsal_mod.NO_STRENGTH else None
        if hit is not None:
            by_ficha[hit].append(r)
            continue
        okey = key + (state,)
        if okey not in own:
            own_order.append(okey)
        own[okey].append(r)

    def inst_entry(rows: list[dict]) -> dict:
        uniq = lambda xs: list(dict.fromkeys(x for x in xs if x))  # noqa: E731
        pres = [" · ".join(x for x in (f"Forma: {r['form']}" if r["form"] != "No especificada" else None, r["presentation"]) if x) for r in rows]
        e = {
            "id": "isss", "code": ", ".join(uniq(r["code"] for r in rows)), "careLevel": " / ".join(uniq(r["careLevel"] for r in rows)) or None,
            "presentation": " | ".join(uniq(pres)) or None, "notes": " ".join(uniq(r["notes"] for r in rows)) or None,
        }
        return {k: v for k, v in e.items() if v}

    for n, rows in by_ficha.items():
        meds[n]["institutions"] = meds[n]["institutions"] + [inst_entry(rows)]
    review: list[dict] = []
    minsal_by_ing: dict[tuple, list[dict]] = defaultdict(list)
    for m in meds:
        minsal_by_ing[ingredient_key(m["activeIngredients"])].append(m)
    used = {m["id"] for m in meds}
    for okey in own_order:
        rows = own[okey]
        r = rows[0]
        mid = "isss-" + r["code"]
        n = 2
        while mid in used:
            mid, n = f"isss-{r['code']}-{n}", n + 1
        used.add(mid)
        med = {
            "id": mid, "genericName": r["name"], "activeIngredients": r["ingredients"], "form": r["form"], "strength": r["strength"],
            "searchTerms": r["terms"], "institutions": [inst_entry(rows)],
        }
        if r["route"]:
            med["route"] = r["route"]
        if r["group"]:
            med["therapeuticGroup"] = r["group"]
        meds.append(med)
        # ¿se parece a una ficha MINSAL con el mismo principio activo? → decisión humana, no fusión
        cands = minsal_by_ing.get(okey[0], [])
        for c in cands[:3]:
            review.append({"isss_codigo": inst_entry(rows).get("code"), "isss_nombre": r["name"], "isss_concentracion": r["strength"], "isss_forma": r["form"],
                           "minsal_id": c["id"], "minsal_concentracion": c["strength"], "minsal_forma": c["form"], "motivo": "mismo principio activo, distinta concentración/vía/forma", "decision": ""})
        if not cands:
            best = max(((SequenceMatcher(None, " ".join(okey[0]), " ".join(ingredient_key(m["activeIngredients"]))).ratio(), m) for m in meds[: len(minsal_catalog["medications"])]), key=lambda x: x[0], default=(0, None))
            if best[1] and best[0] >= 0.85 and okey[1] == strength_key(best[1]["strength"]):
                review.append({"isss_codigo": inst_entry(rows).get("code"), "isss_nombre": r["name"], "isss_concentracion": r["strength"], "isss_forma": r["form"],
                               "minsal_id": best[1]["id"], "minsal_concentracion": best[1]["strength"], "minsal_forma": best[1]["form"], "motivo": f"nombre parecido ({best[0]:.2f}), misma concentración", "decision": ""})
    catalog = {
        **minsal_catalog, "version": version, "institutions": minsal_catalog["institutions"] + [ISSS_INSTITUTION],
        "medications": sorted(meds, key=lambda x: x["genericName"].lower()),
    }
    stats = {
        "minsal_fichas": len(minsal_catalog["medications"]), "isss_filas": len(isss_rows), "isss_en_ficha_minsal": sum(len(v) for v in by_ficha.values()),
        "fichas_con_ambas": len(by_ficha), "isss_fichas_propias": len(own_order), "total_fichas": len(meds), "para_revision": len(review),
    }
    return catalog, review, stats


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent.parent
    src = root / "data/sources"
    rows, groups = minsal_mod.extract_rows(src / minsal_mod.PDF_NAME)
    minsal_catalog, _ = minsal_mod.build_catalog(rows, groups)
    isss_rows = [isss_mod.parse(r) for r in isss_mod.extract_rows(src / isss_mod.PDF_NAME)]
    catalog, review, stats = combine(minsal_catalog, isss_rows)
    out = root / "data/processed"
    out.mkdir(parents=True, exist_ok=True)
    (out / "catalog.minsal-isss.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1), encoding="utf-8")
    rev = root / "data/review"
    rev.mkdir(parents=True, exist_ok=True)
    with open(rev / "cruce_posibles.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["isss_codigo", "isss_nombre", "isss_concentracion", "isss_forma", "minsal_id", "minsal_concentracion", "minsal_forma", "motivo", "decision"])
        w.writeheader()
        w.writerows(review)
    flagged = [r for r in isss_rows if r["flags"]]
    with open(rev / "isss_revision.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["codigo", "pagina", "motivo", "nombre", "concentracion", "forma", "decision"])
        for r in flagged:
            w.writerow([r["code"], r["page"], "; ".join(r["flags"]), r["name"], r["strength"], r["form"], ""])
    sample = minsal_mod.sample_for_checking({"medications": [m for m in catalog["medications"] if any(i["id"] == "isss" for i in m["institutions"])]}, 50, "medhelp-isss")
    with open(rev / "isss_muestra_50.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "codigo_isss", "nombre", "concentracion", "forma", "instituciones", "correcto_si_no", "comentario"])
        for m in sample:
            code = next(i["code"] for i in m["institutions"] if i["id"] == "isss")
            w.writerow([m["id"], code, m["genericName"], m["strength"], m["form"], "+".join(i["id"] for i in m["institutions"]), "", ""])
    print(json.dumps(stats, ensure_ascii=False, indent=1), f"| ISSS con indicador de revisión: {len(flagged)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
