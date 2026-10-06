"""Extracción por OCR del Listado Institucional de Medicamentos de FOSALUD (2.ª edición, PDF escaneado).

El PDF no tiene texto: son imágenes de tablas con rejilla. Se detectan las líneas de la rejilla (horizontales → filas,
verticales → columnas) y se hace OCR celda por celda (tesseract `spa`), lo que evita mezclar columnas. Columnas: ATC,
código SINAB (8 dígitos, el mismo sistema que el LOM/MINSAL), DCI, concentración, forma, presentación, nivel de uso,
cantidad máxima por consulta. Debajo de algunos medicamentos hay una fila «REGULACIÓN» con texto libre.

Como es OCR, **nada de esto se da por correcto**: cada fila se contrasta con el LOM/MINSAL por código SINAB y lo que no
coincide va a revisión humana (ver `combine.py`).

Requiere: tesseract (con idioma `spa`) y poppler (`pdftoppm`), Pillow.
"""
from __future__ import annotations

import os
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

PDF_NAME = "fosalud_lim_2.pdf"
DPI = 300
DEFAULT_VLINES = [105, 404, 647, 1003, 1364, 1681, 2080, 2215, 2458]  # calibradas con la pág. 30 (2530 px de ancho)
CODE = re.compile(r"\d{8}")
NIVEL_USO = {"G": "Médico general", "GR": "Médico general (restringido)", "E": "Especialista", "ER": "Especialista (restringido)"}


@dataclass
class FosRow:
    page: int
    sinab: str
    atc: str
    name: str
    strength: str
    form: str
    presentation: str
    nivel: str
    notes: dict[str, str] = field(default_factory=dict)
    flags: list[str] = field(default_factory=list)


def fix_atc(raw: str) -> str:
    """Código ATC (A00AA00) con las confusiones típicas del OCR corregidas según la posición (letra/dígito)."""
    t = re.sub(r"[^A-Z0-9]", "", raw.upper())
    if len(t) != 7:
        return t
    to_digit = {"O": "0", "G": "6", "I": "1", "L": "1", "S": "5", "B": "8", "Z": "2", "Q": "0"}
    to_letter = {"0": "O", "6": "G", "1": "I", "5": "S", "8": "B", "2": "Z"}
    kinds = "LDDLLDD"
    return "".join((to_digit.get(ch, ch) if k == "D" else to_letter.get(ch, ch)) for ch, k in zip(t, kinds, strict=True))


def _clean(s: str) -> str:
    """Quita restos de líneas de la rejilla que el OCR lee como «|», «—» sueltos."""
    return _c(re.sub(r"(^|\s)[|—\-_]+(?=\s|$)", " ", s.replace("|", " ")))


def _c(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def _ocr(img: Image.Image, psm: int = 6, whitelist: str | None = None) -> str:
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        path = f.name
    try:
        img.save(path)
        cmd = ["tesseract", path, "-", "-l", "spa", "--psm", str(psm)]
        if whitelist:
            cmd += ["-c", f"tessedit_char_whitelist={whitelist}"]
        out = subprocess.run(cmd, capture_output=True, text=True, env={**os.environ, "OMP_THREAD_LIMIT": "1"}, check=False).stdout
        return _c(out)
    finally:
        os.unlink(path)


def _runs(values: list[float], thr: float) -> list[tuple[int, int]]:
    out, i, n = [], 0, len(values)
    while i < n:
        if values[i] > thr:
            s = i
            while i < n and values[i] > thr:
                i += 1
            out.append((s, i - 1))
        i += 1
    return out


def _dark_profile(b: Image.Image, axis: str) -> list[float]:
    w, h = b.size
    small = b.resize((1, h), Image.BOX) if axis == "rows" else b.resize((w, 1), Image.BOX)
    n = h if axis == "rows" else w
    return [1 - (small.getpixel((0, i)) if axis == "rows" else small.getpixel((i, 0))) / 255 for i in range(n)]


def _vlines(b: Image.Image, y0: int, y1: int) -> list[int]:
    band = b.crop((0, y0 + 8, b.size[0], y1 - 8))
    return [(s + e) // 2 for s, e in _runs(_dark_profile(band, "cols"), 0.8)]


def _bands(b: Image.Image) -> list[tuple[int, int, bool]]:
    """(y0, y1, es_banda_negra) entre líneas horizontales de la rejilla."""
    raw = _runs(_dark_profile(b, "rows"), 0.3)  # umbral bajo: algunas hojas salieron torcidas o con líneas tenues
    lines: list[tuple[int, int]] = []
    for s, e in raw:  # líneas a menos de 40 px son restos de la misma línea (o ruido)
        if lines and s - lines[-1][1] < 40 and (e - s) < 30 and (lines[-1][1] - lines[-1][0]) < 30:
            continue
        lines.append((s, e))
    out = []
    for (s0, e0), (s1, _e1) in zip(lines, lines[1:], strict=False):
        if s1 - e0 > 30:
            out.append((e0 + 1, s1 - 1, (e0 - s0) > 30))
    return out


def process_page(png: Path, page: int) -> list[FosRow]:
    im = Image.open(png).convert("L")
    w, _h = im.size
    b = im.point(lambda v: 255 if v > 150 else 0)
    bands = _bands(b)
    # columnas de la página: la fila con más líneas verticales
    best: list[int] = []
    for y0, y1, black in bands:
        if not black and y1 - y0 > 60:
            v = _vlines(b, y0, y1)
            if len(v) > len(best):
                best = v
    if len(best) != 9:
        best = [round(x * w / 2530) for x in DEFAULT_VLINES]
    rows: list[FosRow] = []
    last: FosRow | None = None
    for y0, y1, black in bands:
        if black or y1 - y0 < 40:
            continue
        pad = 10
        own = _vlines(b, y0, y1)
        cols = own if len(own) == 9 else best  # hojas torcidas: las columnas de esta fila, si se ven completas

        def cell(i: int, psm: int = 6, wl: str | None = None, y0=y0, y1=y1, cols=cols) -> str:
            return _clean(_ocr(im.crop((cols[i] + pad, y0 + pad, cols[i + 1] - pad, y1 - pad)), psm, wl))

        sinab = _read_code(im, cols, y0, y1)
        if CODE.fullmatch(sinab):
            atc = fix_atc(cell(0, 7, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"))
            last = FosRow(page, sinab, atc, cell(2), cell(3), cell(4), cell(5), _read_nivel(im, cols, y0, y1))
            rows.append(last)
        elif len(sinab) >= 6 and re.fullmatch(r"\d+", sinab):  # código mal leído: no se pierde la fila
            last = FosRow(page, sinab, "", cell(2), cell(3), cell(4), cell(5), _read_nivel(im, cols, y0, y1), flags=["código SINAB ilegible por OCR"])
            rows.append(last)
        else:
            label = _c(cell(0))
            if re.match(r"(?i)^regula", label) and last is not None:
                text = _clean(_ocr(im.crop((cols[1] + pad, y0 + pad, cols[-1] - pad, y1 - pad)), 6))
                if text:
                    last.notes["Regulación"] = (last.notes.get("Regulación", "") + " " + text).strip()
    return rows


def _read_code(im: Image.Image, cols: list[int], y0: int, y1: int) -> str:
    """Código SINAB de 8 dígitos: se reintenta con otros recortes/modos antes de rendirse (el OCR a veces pierde un dígito)."""
    best = ""
    for pad_x, pad_y, psm, wl in ((10, 10, 7, "0123456789"), (4, 10, 7, "0123456789"), (4, 14, 8, "0123456789"), (2, 12, 7, None), (-6, 12, 7, "0123456789")):
        box = (cols[1] + pad_x, y0 + pad_y, cols[2] - pad_x, y1 - pad_y)
        txt = re.sub(r"\D", "", _ocr(im.crop(box), psm, wl))
        if CODE.fullmatch(txt):
            return txt
        if len(txt) > len(best):
            best = txt
    return best


def _read_nivel(im: Image.Image, cols: list[int], y0: int, y1: int) -> str:
    """Nivel de uso (G, GR, E, ER…): una o dos letras en una celda ancha; se agranda y se reintenta."""
    for scale, psm in ((2, 7), (2, 8), (3, 10), (1, 7)):
        crop = im.crop((cols[6] + 8, y0 + 8, cols[7] - 8, y1 - 8))
        crop = crop.resize((crop.size[0] * scale, crop.size[1] * scale), Image.LANCZOS)
        txt = re.sub(r"[^A-Z]", "", _ocr(crop, psm, "GREHR").upper())
        if txt in NIVEL_USO or (txt and re.fullmatch(r"H?[GE]R?", txt)):
            return txt
    return ""


def render(pdf: Path, out: Path, first: int = 1, last: int | None = None) -> list[Path]:
    cmd = ["pdftoppm", "-r", str(DPI), "-gray", "-png", "-f", str(first)] + (["-l", str(last)] if last else []) + [str(pdf), str(out / "p")]
    subprocess.run(cmd, check=True)
    return sorted(out.glob("p-*.png"))


def extract_rows(pdf: Path, workers: int = 6, first: int = 1, last: int | None = None) -> list[FosRow]:
    with tempfile.TemporaryDirectory() as tmp:
        pngs = render(pdf, Path(tmp), first, last)
        jobs = [(p, int(p.stem.split("-")[1])) for p in pngs]
        with ThreadPoolExecutor(workers) as ex:
            pages = list(ex.map(lambda j: process_page(*j), jobs))
    return [r for page in pages for r in page]


# ── De filas a fichas ─────────────────────────────────────────────────────
NIVEL_CONOCIDO = {"G": "Médico general", "GR": "Médico general (restringido)"}  # la leyenda de la edición solo define estos (+ ODON, CPTA)


def _fix_unit_typos(s: str) -> str:
    t = re.sub(r"(?<=\d)\s?(my|mq|ma)\b", " mg", s)
    t = re.sub(r"(?<=\d)\s?(ml|mi|mL\.)\b", " mL", t) if re.search(r"\d\s?(ml|mi)\b", t) else t
    return _c(t).rstrip(".,; ")


def parse(row: FosRow) -> dict:
    """Ficha (una institución) en el formato del catálogo. El OCR puede equivocarse: todo queda marcado como tal en `flags`."""
    from .isss import infer_route
    from .minsal import ATC_GROUPS, NO_STRENGTH, _split_ingredients

    flags = list(row.flags)
    name = _c(re.sub(r"[.,;:]+$", "", row.name))
    strength = _fix_unit_typos(row.strength) or NO_STRENGTH
    form = _c(row.form).rstrip(".,; ") or "No especificada"
    if not name or sum(ch.isalpha() for ch in name) < 4:
        flags.append("nombre ilegible por OCR")
    if not re.search(r"[A-Za-z]", form):
        flags.append("forma ilegible por OCR")
    nivel = NIVEL_CONOCIDO.get(row.nivel)
    if row.nivel and not nivel:
        flags.append(f"nivel de uso «{row.nivel}» no está en la leyenda de la edición (se omite)")
    ings, terms = _split_ingredients(name)
    atc = row.atc if re.fullmatch(r"[A-Z]\d{2}[A-Z]{2}\d{2}", row.atc or "") else None
    return {
        "name": name, "ingredients": ings or [name], "terms": terms, "strength": strength, "form": form[:1].upper() + form[1:],
        "route": infer_route(form, row.presentation), "code": row.sinab, "careLevel": f"Prescripción: {nivel}" if nivel else None,
        "presentation": _c(row.presentation) or None, "notes": ("Regulación: " + row.notes["Regulación"]) if row.notes.get("Regulación") else None,
        "group": ATC_GROUPS.get(atc[0]) if atc else None, "atc": atc, "flags": flags, "page": row.page,
    }
