"""Normalización de nombres, formas y concentraciones (PLAN §6, reglas de cruce)."""
from __future__ import annotations

import csv
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

SYNONYMS_CSV = Path(__file__).resolve().parent.parent / "synonyms.csv"


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm_text(s: str) -> str:
    """Minúsculas, sin tildes, espacios colapsados."""
    return re.sub(r"\s+", " ", strip_accents(s).lower()).strip()


@lru_cache(maxsize=1)
def load_synonyms(path: Path = SYNONYMS_CSV) -> dict[str, str]:
    with open(path, newline="", encoding="utf-8") as f:
        return {norm_text(r["term"]): norm_text(r["canonical"]) for r in csv.DictReader(f)}


def canonical_ingredient(name: str, synonyms: dict[str, str] | None = None) -> str:
    syn = load_synonyms() if synonyms is None else synonyms
    n = norm_text(name)
    return syn.get(n, n)


_UNIT_ALIASES = {
    "mg": "mg", "miligramo": "mg", "miligramos": "mg", "mgs": "mg",
    "g": "g", "gr": "g", "gramo": "g", "gramos": "g",
    "mcg": "mcg", "µg": "mcg", "ug": "mcg", "microgramo": "mcg", "microgramos": "mcg",
    "ui": "UI", "u.i.": "UI", "iu": "UI", "unidades": "UI",
    "ml": "mL", "cc": "mL", "mililitro": "mL", "mililitros": "mL",
    "l": "L",
    "%": "%",
}
_QTY = re.compile(r"(\d+(?:[.,]\d+)?)\s*([a-zA-Zµ%.]+)")


def normalize_strength(s: str) -> str:
    """'500 MG' → '500 mg'; '1 gr / 10 cc' → '1 g/10 mL'; 'c/u' y 'por' se unifican a '/'."""
    text = s.lower().replace(",", ".")
    text = re.sub(r"\bc/u\b|\bpor\b", "/", text)
    text = re.sub(r"\s*/\s*", "/", text).strip("/ ")
    parts = []
    for chunk in text.split("/"):
        chunk = chunk.strip()
        m = _QTY.fullmatch(chunk)
        if m:
            qty, unit = m.groups()
            unit = _UNIT_ALIASES.get(unit, unit)
            qty = qty.rstrip("0").rstrip(".") if "." in qty else qty
            parts.append(f"{qty} {unit}")
        else:
            u = _UNIT_ALIASES.get(chunk)
            parts.append(u if u else chunk)
    return "/".join(parts).replace(" /", "/")


_FORMS = {
    "tab": "tableta", "tabs": "tableta", "tableta": "tableta", "tabletas": "tableta", "comprimido": "tableta", "comprimidos": "tableta",
    "cap": "cápsula", "caps": "cápsula", "capsula": "cápsula", "capsulas": "cápsula",
    "sol. iny.": "solución inyectable", "solucion inyectable": "solución inyectable", "inyectable": "solución inyectable",
    "susp. oral": "suspensión oral", "suspension oral": "suspensión oral", "jarabe": "jarabe",
}


def normalize_form(s: str) -> str:
    key = norm_text(s)
    return _FORMS.get(key, s.strip().lower())


def medication_key(ingredients: list[str], form: str, strength: str) -> tuple[tuple[str, ...], str, str]:
    """Identidad de un medicamento: principio(s) activo(s) + forma + concentración normalizados."""
    ing = tuple(sorted(canonical_ingredient(i) for i in ingredients))
    return ing, norm_text(normalize_form(form)), normalize_strength(strength)
