"""Extracción del LOM/MINSAL (Acuerdo n.º 1201, 14/05/2026) → filas → catálogo.

Fuente: `data/sources/listadooficialdemedicamentosdelministeriodesalud-Acuerdo-Ejecutivo-1201-14052026_v2.pdf`.
Las tablas (págs. 10–140) traen: n.º, código SINAB, código ATC, descripción (nombre + concentración + forma + vía +
presentación en una sola celda), U/M, prioridad, nivel de uso y regulación de prescripción.

Principio: **no adivinar**. Cada fila lleva una confianza; lo que no se puede separar con seguridad se publica con la
descripción oficial completa en `presentation` y se lista en el CSV de revisión humana.

Requiere: pip install -e '.[extract]'   (pdfplumber)
"""
from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

PDF_NAME = "listadooficialdemedicamentosdelministeriodesalud-Acuerdo-Ejecutivo-1201-14052026_v2.pdf"
FIRST_PAGE, LAST_PAGE = 10, 140  # tablas de datos; el anexo (pág. 141+) tiene otra disposición de columnas

ATC_GROUPS = {
    "A": "Tracto alimentario y metabolismo", "B": "Sangre y órganos hematopoyéticos", "C": "Sistema cardiovascular",
    "D": "Dermatológicos", "G": "Sistema genitourinario y hormonas sexuales",
    "H": "Preparados hormonales sistémicos", "J": "Antiinfecciosos para uso sistémico",
    "L": "Antineoplásicos e inmunomoduladores", "M": "Sistema musculoesquelético", "N": "Sistema nervioso",
    "P": "Antiparasitarios, insecticidas y repelentes", "R": "Sistema respiratorio", "S": "Órganos de los sentidos",
    "V": "Varios",
}

FORM_START = re.compile(
    r"\b(Sólido|Líquido|Semisólido|Suspensión|Solución|Emulsión|Cápsula|Tableta|Supositorio|Óvulo|Parche|Concentrado|"
    r"Aerosol|Implante|Gas|Dispersión|Polvo|Crema|Gel|Ungüento|Pomada|Espuma|Inyectable|Gotas|Jarabe|Elixir|Spray|"
    r"Granulado|Sistema|Dispositivo|Colutorio|Enema|Shampoo|Champú)\b"
)
ROUTE_WORDS = {
    "oral", "parenteral", "tópico", "tópica", "oftálmico", "oftálmica", "ótico", "ótica", "rectal", "vaginal", "nasal",
    "inhalatorio", "inhalatoria", "transdérmico", "subdérmico", "instilación", "sublingual", "lingual",
}
CONC_START = re.compile(r"(?:(?<=\s)|^)\(?\s?\d")
ATC_FULL = re.compile(r"[A-Z]\d{2}[A-Z]{2}\d{2}")
ATC_PART = re.compile(r"[A-Z]\d{2}(?:[A-Z]{1,2})?")
FOOT = re.compile(r"\*\s?\((\d)\)")


@dataclass
class RawRow:
    page: int
    no: str
    sinab: str
    atc_raw: str
    desc: str
    um: str
    prioridad: str
    nivel: str
    regulacion: str


@dataclass
class Parsed:
    name: str
    ingredients: list[str]
    search_terms: list[str]
    strength: str
    form: str
    presentation: str
    route: str | None
    confidence: str  # 'alta' | 'baja'
    flags: list[str] = field(default_factory=list)


def _c(s: str | None) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


# ── Extracción ───────────────────────────────────────────────────────────
def extract_rows(pdf_path: Path) -> tuple[list[RawRow], dict[str, str]]:
    """Filas de las tablas y mapa grupo → nombre oficial (de los encabezados «GRUPO NN …»)."""
    import pdfplumber  # dependencia opcional

    rows: list[RawRow] = []
    groups: dict[str, str] = {}
    with pdfplumber.open(pdf_path) as pdf:
        for pn in range(FIRST_PAGE, min(LAST_PAGE, len(pdf.pages)) + 1):
            page = pdf.pages[pn - 1]
            for m in re.finditer(r"GRUPO\s+(\d{2})\s+([^\n]+)", page.extract_text(x_tolerance=1.5) or ""):
                groups.setdefault(m.group(1), _c(m.group(2)))
            for table in page.extract_tables(table_settings={"text_x_tolerance": 1.5}):
                for r in table:
                    if len(r) >= 7 and re.fullmatch(r"\d{8}", _c(r[1])):
                        rows.append(RawRow(pn, _c(r[0]), _c(r[1]), _c(r[2]), _c(r[3]), _c(r[4]), _c(r[5]), _c(r[6]), _c(r[7]) if len(r) > 7 else ""))
    return rows, groups


# ── Análisis de la descripción ───────────────────────────────────────────
def clean_atc(raw: str) -> tuple[str | None, str | None]:
    """(código ATC, nota al pie *(n)). Corrige la O por 0 de «JO1DD08»."""
    note = None
    m = FOOT.search(raw)
    if m:
        note = m.group(1)
    code = FOOT.sub("", raw).strip().upper()
    code = re.sub(r"^([A-Z])O(\d)", r"\g<1>0\2", code)
    m = ATC_FULL.search(code) or ATC_PART.search(code)
    return (m.group(0) if m else None), note


def _split_ingredients(name: str) -> tuple[list[str], list[str]]:
    """Ingredientes (sin paréntesis) y términos de búsqueda (lo que va entre paréntesis)."""
    terms: list[str] = []
    for inner in re.findall(r"\(([^)]*)\)", name):
        for t in re.split(r"\s+o\s+|,|;", inner):
            t = _c(t).lower()
            if t and not re.fullmatch(r"[\d\s.,+%-]+", t):
                terms.append(t)
    base = re.sub(r"\([^)]*\)", " ", name)
    ings = [_c(p) for p in re.split(r"\s\+\s?|\s?\+\s", base) if _c(p)]
    return ings, list(dict.fromkeys(terms))


def _mask_parens(s: str) -> str:
    """Reemplaza por espacios lo que va entre paréntesis (no cambia las posiciones)."""
    out, depth = [], 0
    for ch in s:
        if ch == "(":
            depth += 1
            out.append(" ")
        elif ch == ")" and depth:
            depth -= 1
            out.append(" ")
        else:
            out.append(" " if depth else ch)
    return "".join(out)


NO_STRENGTH = "Sin concentración"


def parse_description(desc: str) -> Parsed:
    d = _c(desc)
    masked = _mask_parens(d)
    flags: list[str] = []
    conc = CONC_START.search(d, 1)
    form_any = FORM_START.search(masked)
    if form_any and form_any.start() > 0 and (not conc or form_any.start() < conc.start()):
        # La forma aparece antes de cualquier cifra: el producto no declara concentración
        name, strength, rest = _c(d[: form_any.start()]), NO_STRENGTH, d[form_any.start():]
    elif conc:
        name = _c(d[: conc.start()])
        after, after_masked = d[conc.start():], masked[conc.start():]
        f = FORM_START.search(after_masked)
        if not f or not name:
            return _fallback(d, ["sin forma farmacéutica reconocible" if not f else "sin nombre"])
        strength = _c(after[: f.start()]).rstrip(",;. ")
        rest = after[f.start():]
        if not strength:
            return _fallback(d, ["concentración vacía"])
    else:
        return _fallback(d, ["sin concentración ni forma reconocible"])
    words = rest.split()
    end = None
    for i, w in enumerate(words[:9]):
        if re.sub(r"[^\wáéíóúñ]", "", w.lower()) in ROUTE_WORDS:
            end = i + 1
            break
    if end is None:
        end = 2
        flags.append("vía no identificada en la forma")
    form = _c(" ".join(words[:end])).rstrip(",;. ")
    presentation = _c(" ".join(words[end:])).lstrip(",;. ")
    ings, terms = _split_ingredients(name)
    if len(strength) > 70:
        flags.append("concentración larga (mezcla/composición)")
    if len(name) > 110:
        flags.append("nombre muy largo")
    if not ings:
        flags.append("sin ingrediente")
        ings = [name]
    return Parsed(name, ings, terms, strength, form[:1].upper() + form[1:], presentation, _route(form, presentation), "baja" if flags else "alta", flags)


def _route(form: str, presentation: str) -> str | None:
    f = form.lower()
    if "parenteral" in f:
        vias = re.findall(r"I\.\s?V\.|I\.\s?M\.|S\.\s?C\.", presentation)
        return "/".join(dict.fromkeys(v.replace(" ", "") for v in vias)) or "parenteral"
    for w in ("oral", "tópic", "oftálmic", "ótic", "rectal", "vaginal", "nasal", "inhalatori", "transdérmic", "subdérmic", "sublingual"):
        if w in f:
            return {"tópic": "tópica", "oftálmic": "oftálmica", "ótic": "ótica", "inhalatori": "inhalatoria", "transdérmic": "transdérmica", "subdérmic": "subdérmica"}.get(w, w)
    return None


def _fallback(d: str, flags: list[str]) -> Parsed:
    """No se pudo separar: se conserva la descripción oficial completa y se marca para revisión."""
    cut = re.split(r"[.,;]| Contiene| Cada ", d, maxsplit=1)[0]
    name = _c(cut)[:110] or d[:110]
    ings, terms = _split_ingredients(name)
    return Parsed(name, ings or [name], terms, "Ver descripción oficial", "No especificada", d, None, "baja", flags)


# ── Catálogo ─────────────────────────────────────────────────────────────
def _group_name(sinab: str, atc: str | None, groups: dict[str, str]) -> str | None:
    heading = groups.get(sinab[1:3])
    if heading:
        h = heading.strip().rstrip(".")
        return h[:1].upper() + h[1:].lower()
    return ATC_GROUPS.get(atc[0]) if atc else None


def build_catalog(rows: list[RawRow], groups: dict[str, str], version: int = 2, published_at: str = "2026-10-05T00:00:00Z") -> tuple[dict, list[dict]]:
    """Catálogo (solo MINSAL) y filas para revisión humana."""
    merged: dict[tuple, dict] = {}
    review: list[dict] = []
    for r in rows:
        p = parse_description(r.desc)
        atc, note = clean_atc(r.atc_raw)
        prio = r.prioridad.replace("NoEsencial", "No esencial")
        nivel = r.nivel or None
        care = " · ".join(x for x in ((f"Nivel {nivel}" if nivel else None), prio or None) if x) or None
        # La nota al pie *(n) no se publica: el PDF no trae la leyenda que la explique y mostrarla sola confunde.
        notes = [x for x in (r.regulacion,) if x]
        key = (p.name.lower(), p.form.lower(), p.strength.lower())
        entry = {"code": r.sinab, "careLevel": care, "presentation": (p.presentation + (f" (U/M: {r.um})" if r.um else "")).strip() or None, "notes": " ".join(notes) or None}
        if key in merged:  # misma publicación con otra presentación/código: una sola ficha, varios códigos
            m = merged[key]
            m["_entries"].append(entry)
            m["_atc"] = m["_atc"] or atc
            continue
        merged[key] = {"_p": p, "_entries": [entry], "_atc": atc, "_sinab": r.sinab, "_page": r.page}
    meds = []
    used_ids: set[str] = set()
    for key, m in merged.items():
        p: Parsed = m["_p"]
        es = m["_entries"]
        uniq = lambda xs: list(dict.fromkeys(x for x in xs if x))  # noqa: E731
        inst = {
            "id": "minsal",
            "code": ", ".join(uniq(e["code"] for e in es)),
            "careLevel": " / ".join(uniq(e["careLevel"] for e in es)) or None,
            "presentation": " | ".join(uniq(e["presentation"] for e in es)) or None,
            "notes": " ".join(uniq(e["notes"] for e in es)) or None,
        }
        mid = "minsal-" + m["_sinab"]
        dup_code = mid in used_ids
        n = 2
        while mid in used_ids:  # el PDF repite algún código SINAB para fichas distintas
            mid = f"minsal-{m['_sinab']}-{n}"
            n += 1
        used_ids.add(mid)
        med = {
            "id": mid, "genericName": p.name, "activeIngredients": p.ingredients, "form": p.form, "strength": p.strength,
            "searchTerms": p.search_terms, "institutions": [{k: v for k, v in inst.items() if v}],
        }
        if p.route:
            med["route"] = p.route
        if m["_atc"]:
            med["atcCode"] = m["_atc"]
        g = _group_name(m["_sinab"], m["_atc"], groups)
        if g:
            med["therapeuticGroup"] = g
        meds.append(med)
        if p.confidence != "alta" or len(es) > 1 or dup_code:
            motivo = "; ".join(p.flags + (["código SINAB repetido en el PDF para fichas distintas"] if dup_code else [])) or "varios códigos para la misma ficha"
            review.append({"sinab": inst["code"], "pagina": m["_page"], "motivo": motivo, "nombre": p.name, "concentracion": p.strength, "forma": p.form, "descripcion_oficial": rows_desc(rows, m["_sinab"])})
    catalog = {
        "version": version, "publishedAt": published_at, "source": "PARCIAL",
        "institutions": [{
            "id": "minsal", "name": "Ministerio de Salud (MINSAL)", "listName": "LOM/MINSAL",
            "listEdition": "2026 (Acuerdo n.º 1201, 14/05/2026)", "sourceDate": "2026-05-14",
            "sourceUrl": "https://asp.salud.gob.sv/regulacion/default.asp",
        }],
        "synonyms": {"paracetamol": "acetaminofén", "dipirona": "metamizol", "aspirina": "ácido acetilsalicílico", "albuterol": "salbutamol"},
        "medications": sorted(meds, key=lambda x: x["genericName"].lower()),
    }
    return catalog, review


def rows_desc(rows: list[RawRow], sinab: str) -> str:
    return next((r.desc for r in rows if r.sinab == sinab), "")


def sample_for_checking(catalog: dict, n: int = 50, seed: str = "medhelp") -> list[dict]:
    """Muestra reproducible para verificar a mano contra el PDF (criterio de aceptación de la Fase 2)."""
    ranked = sorted(catalog["medications"], key=lambda m: hashlib.sha256((seed + m["id"]).encode()).hexdigest())
    return ranked[:n]


def main(argv: list[str]) -> int:
    here = Path(__file__).resolve().parent.parent
    root = here.parent.parent
    pdf = root / "data/sources" / PDF_NAME
    if not pdf.exists():
        print(f"No está el PDF: {pdf}", file=sys.stderr)
        return 1
    rows, groups = extract_rows(pdf)
    catalog, review = build_catalog(rows, groups)
    out = root / "data/processed"
    out.mkdir(parents=True, exist_ok=True)
    (out / "catalog.minsal.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1), encoding="utf-8")
    rev = root / "data/review"
    rev.mkdir(parents=True, exist_ok=True)
    with open(rev / "minsal_revision.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["sinab", "pagina", "motivo", "nombre", "concentracion", "forma", "descripcion_oficial", "decision"])
        w.writeheader()
        for r in review:
            w.writerow({**r, "decision": ""})
    by_id = {m["id"]: m for m in catalog["medications"]}
    with open(rev / "minsal_muestra_50.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "sinab", "nombre", "concentracion", "forma", "atc", "nivel_prioridad", "grupo", "correcto_si_no", "comentario"])
        for m in sample_for_checking(catalog):
            i = m["institutions"][0]
            w.writerow([m["id"], i.get("code"), m["genericName"], m["strength"], m["form"], m.get("atcCode", ""), i.get("careLevel", ""), m.get("therapeuticGroup", ""), "", ""])
    by_conf = defaultdict(int)
    for r in review:
        by_conf[r["motivo"].split(";")[0]] += 1
    print(f"filas del PDF: {len(rows)} | fichas en el catálogo: {len(by_id)} | para revisión: {len(review)} | grupos oficiales: {len(groups)}")
    for k, v in sorted(by_conf.items(), key=lambda kv: -kv[1])[:8]:
        print(f"  {v:4d}  {k}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
