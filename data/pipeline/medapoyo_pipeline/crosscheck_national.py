"""Verificación cruzada del catálogo contra el LOM nacional de la Superintendencia de Regulación Sanitaria (2026).

El LOM nacional (23 págs.) trae por fila: código ATC, n.º, nombre, concentración, forma y vía. No es un listado
institucional, pero sirve de **segunda opinión independiente**: si MINSAL (que declara un ATC por medicamento) y el
nacional discrepan en nombre o concentración para el mismo ATC, alguno de los dos extractores/documentos tiene un error.
No sustituye la verificación humana: solo encuentra dónde mirar primero.

  python -m medapoyo_pipeline.crosscheck_national   → data/review/cruce_nacional.csv
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from .combine import ingredient_key

PDF_NAME = "LISTADO-OFICIAL-DE-MEDICAMENTOS-2026.pdf"
ATC7 = re.compile(r"[A-Z]\d{2}[A-Z]{2}\d{2}")


def _c(s: str | None) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def extract_national(pdf_path: Path) -> list[dict]:
    import pdfplumber

    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for pn, pg in enumerate(pdf.pages, 1):
            for t in pg.extract_tables(table_settings={"text_x_tolerance": 1.5}):
                for r in t:
                    if r and len(r) >= 5 and ATC7.fullmatch(_c(r[0])) and re.fullmatch(r"\d+", _c(r[1])):
                        rows.append({"pagina": pn, "atc": _c(r[0]), "n": _c(r[1]), "nombre": _c(r[2]), "concentracion": _c(r[3]), "forma": _c(r[4]), "via": _c(r[5]) if len(r) > 5 else ""})
    return rows


def _nums(s: str) -> set[float]:
    """Números de una concentración, comparables entre notaciones: «0.50%» = «0.5%», «1,500» = «1500», «0.5 g» ≠ «500 mg» (no se convierte unidad)."""
    return {float(x) for x in re.findall(r"\d+(?:\.\d+)?", re.sub(r"(?<=\d),(?=\d{3})", "", s))}


def _sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def name_score(national_name: str, ingredients: list[str], contain: bool = True) -> float:
    """Parecido entre el nombre nacional y los ingredientes de una ficha. El nacional suele traer sinónimos entre paréntesis
    («Vitamina B1 (Tiamina)»): se prueba cada variante y también la inclusión de palabras («Calcio (gluconato)» ⊂ «Calcio Gluconato»)."""
    inner = [i for i in re.findall(r"\(([^)]*)\)", national_name)]
    variants = [re.sub(r"\([^)]*\)", "", national_name), national_name.replace("(", " ").replace(")", " "), *inner]
    target = " ".join(ingredient_key(ingredients))
    best = 0.0
    for v in variants:
        key = " ".join(ingredient_key([v]))
        if not key:
            continue
        a, b = set(key.split()), set(target.split())
        best = max(best, _sim(key, target), 1.0 if contain and a and (a <= b or b <= a) else 0.0)
    return best


def compare(national: list[dict], meds: list[dict]) -> list[dict]:
    by_atc: dict[str, list[dict]] = defaultdict(list)
    for m in meds:
        if m.get("atcCode"):
            by_atc[m["atcCode"]].append(m)
    out = []
    for r in national:
        cands = by_atc.get(r["atc"], [])
        if not cands:
            near = max(meds, key=lambda m: name_score(r["nombre"], m["activeIngredients"], contain=False), default=None)
            sim0 = name_score(r["nombre"], near["activeIngredients"], contain=False) if near else 0
            if near and sim0 >= 0.8:
                out.append({**r, "resultado": "FICHA_SIN_ATC", "detalle": f"Existe «{near['genericName']}» ({near['id']}) pero sin ese ATC (ISSS/FOSALUD no lo traen, o MINSAL usa otro)"})
            else:
                out.append({**r, "resultado": "POSIBLE_FALTANTE", "detalle": "No hay ficha con ese ATC ni con un nombre parecido"})
            continue
        best_name = max(cands, key=lambda m: name_score(r["nombre"], m["activeIngredients"]))
        s_name = name_score(r["nombre"], best_name["activeIngredients"])
        if s_name < 0.6:
            out.append({**r, "resultado": "NOMBRE_DISTINTO", "detalle": f"Mismo ATC pero el catálogo dice «{best_name['genericName']}» ({best_name['id']})"})
            continue
        nums = _nums(r["concentracion"])
        have = set().union(*(_nums(m["strength"]) for m in cands))
        if nums and not (nums & have):  # ninguna cifra del nacional aparece en ninguna ficha de ese ATC
            out.append({**r, "resultado": "CONCENTRACION_NO_ENCONTRADA", "detalle": "El catálogo tiene para ese ATC: " + " | ".join(f"{m['strength']} ({m['id']})" for m in cands[:4])})
            continue
        out.append({**r, "resultado": "COINCIDE", "detalle": ""})
    return out


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent.parent
    national = extract_national(root / "data/sources" / PDF_NAME)
    meds = json.loads((root / "data/processed/catalog.minsal-isss.json").read_text(encoding="utf-8"))["medications"]
    res = compare(national, meds)
    out = root / "data/review/cruce_nacional.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["resultado", "atc", "nombre", "concentracion", "forma", "via", "pagina", "detalle", "decision"])
        w.writeheader()
        for r in sorted(res, key=lambda r: (r["resultado"] == "COINCIDE", r["resultado"], r["atc"])):
            w.writerow({k: r.get(k, "") for k in w.fieldnames})
    counts: dict[str, int] = defaultdict(int)
    for r in res:
        counts[r["resultado"]] += 1
    print(f"filas del LOM nacional con ATC completo: {len(res)} → {dict(counts)}  ({out})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
