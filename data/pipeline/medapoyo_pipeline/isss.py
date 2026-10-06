"""Extracción del LOM/ISSS, 19.ª edición (29/10/2024) → filas → fichas.

Fuente: `data/sources/isss_lom_19.pdf` (versión pública). La lista general (págs. 57–150) trae tablas con columnas
separadas: código ISSS (7 dígitos), nombre genérico, concentración, forma farmacéutica, presentación, N (nivel de
prescripción), P (prioridad 1/2/3 = vital/esencial/no esencial), C (cantidad) y clave de despacho. Debajo de cada
medicamento pueden venir filas de «Regulación», «Criterio de Uso» y «Especialidad».
El índice alfabético (pág. 151+) repite los mismos códigos y se ignora.

Principio: no adivinar. Lo que no se puede separar con seguridad se publica con el texto oficial y se lista para revisión.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from .minsal import NO_STRENGTH, _c, _route, _split_ingredients

PDF_NAME = "isss_lom_19.pdf"
FIRST_PAGE = 57
PRIORIDAD = {"1": "Vital", "2": "Esencial", "3": "No esencial"}
NIVEL_PRESC = {
    "G": "Médico general", "GR": "Médico general (restringido)", "E": "Especialista", "ER": "Especialista (restringido)",
    "HG": "Hospitalario general", "HGR": "Hospitalario general (restringido)", "HE": "Hospitalario, especialistas",
    "HER": "Hospitalario, especialistas (restringido)", "R": "Restringido", "HR": "Hospitalario (restringido)",
}
NOTE_LABELS = {"regulación": "Regulación", "criterio de uso": "Criterio de uso", "especialidad": "Especialidad"}
GROUP_HEAD = re.compile(r"(\d{2})\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ,.()/-]+)")


@dataclass
class IsssRow:
    page: int
    code: str
    name: str
    strength: str
    form: str
    presentation: str
    nivel: str
    prioridad: str
    despacho: str
    group: str
    notes: dict[str, str] = field(default_factory=dict)
    flags: list[str] = field(default_factory=list)


def extract_rows(pdf_path: Path) -> list[IsssRow]:
    import pdfplumber

    rows: list[IsssRow] = []
    group = ""
    last: IsssRow | None = None
    with pdfplumber.open(pdf_path) as pdf:
        for pn in range(FIRST_PAGE, len(pdf.pages) + 1):
            page = pdf.pages[pn - 1]
            if "ORDEN ALFABETICO" in (page.extract_text() or "")[:300]:
                break
            for table in page.extract_tables(table_settings={"text_x_tolerance": 1.5}):
                for r in table:
                    cell0 = _c(r[0])
                    if re.fullmatch(r"\d{7}", cell0) and len(r) >= 9:
                        last = IsssRow(pn, cell0, _c(r[1]), _c(r[2]), _c(r[3]), _c(r[4]), _c(r[5]), _c(r[6]), _c(r[8]), group)
                        rows.append(last)
                    elif cell0.lower() in NOTE_LABELS and last is not None and len(r) > 1 and _c(r[1]):
                        label = NOTE_LABELS[cell0.lower()]
                        last.notes[label] = (last.notes.get(label, "") + " " + _c(r[1])).strip()
                    elif r and not any(_c(x) for x in r[1:]):
                        m = GROUP_HEAD.fullmatch(cell0)
                        if m and cell0 == cell0.upper():
                            group = _c(m.group(2))
    return rows


def _fix_spaces(s: str) -> str:
    """El PDF pega palabras en los textos largos de regulación («EnlosCentrosdeAtención…»): se deja tal cual."""
    return s


def parse(row: IsssRow) -> dict:
    """Ficha en el formato del catálogo (una institución)."""
    name, strength = row.name, row.strength
    flags: list[str] = []
    m = re.search(r"\s*CONCENTRACI[ÓO]N:?\s*", name, re.I)
    if m and not strength:
        name, strength = _c(name[: m.start()]), _c(name[m.end():])
    if not strength:
        strength = NO_STRENGTH
    form = row.form
    if not form:
        form, flags = "No especificada", flags + ["sin forma farmacéutica"]
    if len(name) > 110:
        flags.append("nombre muy largo (descripción de composición)")
    if len(strength) > 70:
        flags.append("concentración larga (mezcla/composición)")
    ings, terms = _split_ingredients(name)
    nivel = NIVEL_PRESC.get(row.nivel, row.nivel)
    prio = PRIORIDAD.get(row.prioridad)
    care = " · ".join(x for x in (f"Despacho {row.despacho}" if row.despacho else None, prio, f"Prescripción: {nivel}" if nivel else None) if x)
    notes = " ".join(f"{k}: {v}." if not v.endswith(".") else f"{k}: {v}" for k, v in row.notes.items())
    route = _route(form, row.presentation)
    if not route and re.search(r"tableta|cápsula|capsula|comprimido|jarabe|elixir", form, re.I) and not re.search(r"sublingual|vaginal|rectal|bucal", form, re.I):
        route = "oral"
    if not route:
        low = form.lower()
        for w, canon in (("oral", "oral"), ("oftálmic", "oftálmica"), ("tópic", "tópica"), ("vaginal", "vaginal"), ("rectal", "rectal"), ("nasal", "nasal"), ("ótic", "ótica"), ("sublingual", "sublingual")):
            if w in low:
                route = canon
                break
        if not route and re.search(r"I\.\s?[VMS]\.|S\.\s?C\.|inyectable|parenteral", form, re.I):
            vias = re.findall(r"I\.\s?V\.|I\.\s?M\.|S\.\s?C\.", form)
            route = "/".join(dict.fromkeys(v.replace(" ", "") for v in vias)) or "parenteral"
    return {
        "name": name, "ingredients": ings or [name], "terms": terms, "strength": strength, "form": form[:1].upper() + form[1:],
        "route": route, "code": row.code, "careLevel": care or None, "presentation": row.presentation or None,
        "notes": notes or None, "group": (row.group[:1] + row.group[1:].lower()) if row.group else None, "flags": flags, "page": row.page,
    }
