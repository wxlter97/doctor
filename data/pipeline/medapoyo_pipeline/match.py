"""Cruce entre listados: coincidencia exacta de clave normalizada; lo dudoso va a revisión humana."""
from __future__ import annotations

import csv
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from pathlib import Path

from .normalize import medication_key, norm_text

SIMILARITY_THRESHOLD = 0.92  # por debajo, NO se fusiona automáticamente


@dataclass
class Row:
    institution: str
    name: str
    ingredients: list[str]
    form: str
    strength: str
    code: str = ""
    care_level: str = ""
    presentation: str = ""


@dataclass
class Merged:
    key: tuple
    name: str
    rows: list[Row] = field(default_factory=list)


@dataclass
class ReviewItem:
    row: Row
    candidate: Merged
    similarity: float


def _label(key: tuple) -> str:
    ing, form, strength = key
    return f"{' + '.join(ing)} | {form} | {strength}"


def merge_rows(rows: list[Row], threshold: float = SIMILARITY_THRESHOLD) -> tuple[list[Merged], list[ReviewItem]]:
    """Devuelve (medicamentos seguros, filas pendientes de revisión).

    Misma clave normalizada → mismo medicamento (la presentación queda por institución).
    Misma forma y concentración pero principio activo parecido sin ser igual → revisión.
    """
    merged: dict[tuple, Merged] = {}
    for r in rows:
        key = medication_key(r.ingredients, r.form, r.strength)
        if key in merged:
            merged[key].rows.append(r)
        else:
            merged[key] = Merged(key=key, name=r.name, rows=[r])
    review: list[ReviewItem] = []
    keys = list(merged)
    drop: set[tuple] = set()
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            if a in drop or b in drop or a[1:] != b[1:]:
                continue
            sim = SequenceMatcher(None, " ".join(a[0]), " ".join(b[0])).ratio()
            if sim >= 0.6:  # parecidos pero distintos: nunca se fusionan solos
                for r in merged[b].rows:
                    review.append(ReviewItem(row=r, candidate=merged[a], similarity=sim))
                drop.add(b)
    safe = [m for k, m in merged.items() if k not in drop]
    return safe, review


def write_review_csv(items: list[ReviewItem], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["institucion", "nombre", "forma", "concentracion", "candidato", "similitud", "decision"])
        for it in items:
            w.writerow([it.row.institution, it.row.name, it.row.form, it.row.strength, _label(it.candidate.key), f"{it.similarity:.2f}", ""])


__all__ = ["Row", "Merged", "ReviewItem", "merge_rows", "write_review_csv", "norm_text"]
