"""Hoja de verificación: cada ficha de una muestra junto a la imagen de su fila en el PDF original.

Genera un único HTML autocontenido (`data/review/verificacion.html`) que se abre en cualquier navegador, sin servidor:
por cada ficha se marca «Correcto / Error / Dudo» y se anota un comentario; el avance queda en el navegador y se
exporta a CSV. Es el criterio de aceptación de la Fase 2 (comparar una muestra contra el PDF).

  python -m medapoyo_pipeline.review_sheet
"""
from __future__ import annotations

import base64
import html
import io
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

from . import fosalud as fosalud_mod
from . import isss as isss_mod
from . import minsal as minsal_mod

DPI = 100
INST_NAMES = {"minsal": "MINSAL", "isss": "ISSS", "fosalud": "FOSALUD"}


def _jpeg_b64(img: Image.Image, quality: int = 72) -> str:
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "JPEG", quality=quality, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


class PdfRows:
    """Recorta la fila de un código en un PDF con tablas (MINSAL, ISSS)."""

    def __init__(self, path: Path, code_col: int, setting: dict | None = None):
        import pdfplumber

        self.pdf = pdfplumber.open(path)
        self.code_col = code_col
        self.setting = setting or {"text_x_tolerance": 1.5}
        self._tables: dict[int, list] = {}

    def crop(self, page_no: int, code: str, with_following_notes: bool = False) -> Image.Image | None:
        page = self.pdf.pages[page_no - 1]
        tables = self._tables.get(page_no)
        if tables is None:
            tables = self._tables[page_no] = page.find_tables(table_settings=self.setting)
        for t in tables:
            data = t.extract(x_tolerance=1.5)
            for i, r in enumerate(data):
                if len(r) > self.code_col and re.sub(r"\s+", "", r[self.code_col] or "") == code:
                    boxes = [t.rows[i].bbox]
                    if with_following_notes:  # filas de «Regulación / Criterio de uso / Especialidad» debajo del medicamento
                        j = i + 1
                        while j < len(data) and not re.fullmatch(r"\d{7}", re.sub(r"\s+", "", data[j][0] or "")) and (data[j][0] or "").strip().lower() in {"regulación", "criterio de uso", "especialidad", "(o)", "c. aware oms"} :
                            boxes.append(t.rows[j].bbox)
                            j += 1
                    x0, top, x1, bottom = min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)
                    pad = 2
                    box = (max(0, x0 - pad), max(0, top - pad), min(page.width, x1 + pad), min(page.height, bottom + pad))
                    return page.crop(box).to_image(resolution=DPI + 40).original
        return None


def _field(label: str, value: str | None) -> str:
    return f'<div class="f"><span>{html.escape(label)}</span>{html.escape(value or "—")}</div>'


def card(idx: int, section: str, med: dict, imgs: list[tuple[str, str, str]]) -> str:
    """imgs: (institución, texto de ubicación, jpeg base64 o '')."""
    inst_html = ""
    for i in med["institutions"]:
        inst_html += (
            f'<div class="inst"><b>{INST_NAMES.get(i["id"], i["id"])}</b> · código {html.escape(i.get("code", "—"))}'
            + (f'<br>{html.escape(i["careLevel"])}' if i.get("careLevel") else "")
            + (f'<br><i>Presentación:</i> {html.escape(i["presentation"])}' if i.get("presentation") else "")
            + (f'<br><i>Notas:</i> {html.escape(i["notes"])}' if i.get("notes") else "")
            + "</div>"
        )
    pics = "".join(
        f'<figure><figcaption>{html.escape(inst)} · {html.escape(where)}</figcaption>'
        + (f'<img loading="lazy" alt="Fila del PDF original" src="data:image/jpeg;base64,{b64}">' if b64 else "<p class='warn'>No se pudo recortar la fila: buscá el código en el PDF.</p>")
        + "</figure>"
        for inst, where, b64 in imgs
    )
    key = f"{section}|{med['id']}"
    return f'''<article class="card" data-key="{html.escape(key)}" data-name="{html.escape(med["genericName"])}" data-section="{section}">
<header><span class="n">{idx}</span><h3>{html.escape(med["genericName"])}</h3><code>{html.escape(med["id"])}</code></header>
<div class="cols"><div class="mine"><h4>Lo que muestra MedHelp</h4>
{_field("Concentración", med["strength"])}{_field("Forma", med["form"])}{_field("Vía", med.get("route"))}{_field("ATC", med.get("atcCode"))}{_field("Grupo", med.get("therapeuticGroup"))}
{inst_html}</div>
<div class="pdf"><h4>El PDF original</h4>{pics}</div></div>
<div class="ctl" role="radiogroup" aria-label="Veredicto de {html.escape(med["genericName"])}">
<label><input type="radio" name="v{section}{idx}" value="ok"> Correcto</label>
<label><input type="radio" name="v{section}{idx}" value="error"> Error</label>
<label><input type="radio" name="v{section}{idx}" value="duda"> Dudo</label>
<input class="cm" type="text" placeholder="Comentario (qué está mal, qué dice el PDF)" aria-label="Comentario"></div></article>'''


PAGE = """<!doctype html><html lang="es-SV"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>MedHelp · Verificación de datos</title><style>
:root{--bg:#F4F3EF;--fg:#111;--mut:#6B6B63;--line:#111;--faro:#FFDB00;--ok:#0B7A45;--bad:#D92B0C}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.45 Archivo,system-ui,sans-serif}
header.top{position:sticky;top:0;background:var(--fg);color:var(--bg);padding:10px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;z-index:5}
header.top b{font-size:18px}.bar{flex:1;min-width:140px;height:10px;background:#444}.bar i{display:block;height:100%;background:var(--faro);width:0}
button{font:inherit;font-weight:700;border:2px solid var(--fg);background:var(--faro);color:var(--fg);padding:8px 14px;cursor:pointer;min-height:44px}
main{max-width:1100px;margin:0 auto;padding:16px}.intro{border:2px solid var(--line);background:#fff;padding:14px;margin-bottom:16px}
h2{font-size:22px;margin:28px 0 8px}.card{border:2px solid var(--line);background:#fff;margin:14px 0;padding:12px}
.card header{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}.card h3{margin:0;font-size:19px}.n{background:var(--fg);color:var(--bg);padding:1px 8px;font-weight:700}
code{color:var(--mut);font-size:13px}.cols{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:14px;margin-top:8px}
@media(max-width:760px){.cols{grid-template-columns:1fr}}
h4{margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut)}
.f{margin:2px 0}.f span{display:inline-block;min-width:104px;color:var(--mut);font-size:14px}.inst{border:2px solid var(--line);padding:6px 8px;margin:6px 0;font-size:14px}
figure{margin:0 0 8px}figcaption{font-size:13px;color:var(--mut)}img{max-width:100%;border:1px solid #bbb;display:block}.warn{color:var(--bad);font-weight:700}
.ctl{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:10px;border-top:2px solid var(--line);padding-top:10px}
.ctl label{display:inline-flex;align-items:center;gap:6px;min-height:44px;font-weight:700}.ctl input[type=radio]{width:22px;height:22px}
.cm{flex:1;min-width:200px;font:inherit;padding:10px;border:2px solid var(--line);min-height:44px}
.card[data-v=ok]{border-left:10px solid var(--ok)}.card[data-v=error]{border-left:10px solid var(--bad)}.card[data-v=duda]{border-left:10px solid var(--faro)}
</style></head><body>
<header class="top"><b>MedHelp · Verificación</b><div class="bar" aria-hidden="true"><i id="bar"></i></div><span id="count" aria-live="polite"></span>
<button id="export">Exportar CSV</button></header>
<main><div class="intro"><p><b>Qué hacer.</b> En cada ficha compará lo que muestra MedHelp (izquierda) con la imagen del PDF oficial (derecha) y marcá <b>Correcto</b>, <b>Error</b> o <b>Dudo</b>.
Fijate en: nombre, concentración, forma farmacéutica y el código. Si hay un error, anotá qué dice el PDF.</p>
<p>Tu avance se guarda solo en este navegador. Al terminar (o cuando quieras parar) tocá <b>Exportar CSV</b> y mandámelo.
Una ficha con un solo error de concentración ya es motivo de corregirla; no hace falta revisar si el resto de campos está bien.</p></div>
%SECTIONS%
</main><script>
const cards=[...document.querySelectorAll('.card')];const KEY='medhelp-verificacion-v1';
let st={};try{st=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}};
function paint(){const done=cards.filter(c=>st[c.dataset.key]&&st[c.dataset.key].v).length;
document.getElementById('count').textContent=done+' de '+cards.length;document.getElementById('bar').style.width=(100*done/cards.length)+'%';}
cards.forEach(c=>{const k=c.dataset.key,s=st[k]||{};if(s.v){c.dataset.v=s.v;const r=c.querySelector('input[value="'+s.v+'"]');if(r)r.checked=true}
c.querySelector('.cm').value=s.c||'';
c.addEventListener('change',e=>{if(e.target.type==='radio'){st[k]={...st[k],v:e.target.value};c.dataset.v=e.target.value}save();paint()});
c.querySelector('.cm').addEventListener('input',e=>{st[k]={...st[k],c:e.target.value};save()});});
paint();
document.getElementById('export').onclick=()=>{const q=s=>'"'+String(s||'').replace(/"/g,'""')+'"';
const rows=[['seccion','id','nombre','veredicto','comentario']].concat(cards.map(c=>{const s=st[c.dataset.key]||{};return [c.dataset.section,c.dataset.key.split('|')[1],c.dataset.name,s.v||'',s.c||'']}));
const blob=new Blob(['\\ufeff'+rows.map(r=>r.map(q).join(',')).join('\\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='verificacion-medhelp.csv';a.click();};
</script></body></html>"""


def main(argv: list[str]) -> int:
    root = Path(__file__).resolve().parent.parent.parent.parent
    src = root / "data/sources"
    catalog = json.loads((root / "data/processed/catalog.minsal-isss.json").read_text(encoding="utf-8"))
    meds = catalog["medications"]
    page_of_minsal = {r.sinab: r.page for r in minsal_mod.extract_rows(src / minsal_mod.PDF_NAME)[0]}
    isss_rows = {r.code: r for r in isss_mod.extract_rows(src / isss_mod.PDF_NAME)}
    fos_rows = {r["sinab"]: r for r in json.loads((root / "data/processed/fosalud.ocr.json").read_text(encoding="utf-8")) if 22 <= r["page"] <= 38}

    minsal_pdf = PdfRows(src / minsal_mod.PDF_NAME, code_col=1)
    isss_pdf = PdfRows(src / isss_mod.PDF_NAME, code_col=0)

    sections: list[tuple[str, str, list[dict]]] = []
    only = lambda inst: [m for m in meds if any(i["id"] == inst for i in m["institutions"])]  # noqa: E731
    sections.append(("minsal", "Listado MINSAL (LOM 2026)", minsal_mod.sample_for_checking({"medications": only("minsal")}, 50, "medhelp")))
    sections.append(("isss", "Listado ISSS (LOM, 19.ª edición)", minsal_mod.sample_for_checking({"medications": only("isss")}, 50, "medhelp-isss")))
    sections.append(("fosalud", "Listado FOSALUD (2019, leído por OCR: el más propenso a errores)", minsal_mod.sample_for_checking({"medications": only("fosalud")}, 30, "medhelp-fos")))

    fos_pages: dict[int, Image.Image] = {}

    def fos_image(page: int, y0: int, y1: int, pdf=src / fosalud_mod.PDF_NAME) -> Image.Image | None:
        if page not in fos_pages:
            with tempfile.TemporaryDirectory() as tmp:
                subprocess.run(["pdftoppm", "-r", str(fosalud_mod.DPI), "-gray", "-png", "-f", str(page), "-l", str(page), str(pdf), f"{tmp}/p"], check=True)
                fos_pages[page] = Image.open(next(Path(tmp).glob("p-*.png"))).convert("L").copy()
        im = fos_pages[page]
        w, h = im.size
        crop = im.crop((60, max(0, y0 - 6), w - 60, min(h, y1 + 6)))
        scale = (DPI + 20) / fosalud_mod.DPI
        return crop.resize((max(1, int(crop.size[0] * scale)), max(1, int(crop.size[1] * scale))), Image.LANCZOS)

    out_sections = []
    missing = 0
    total = 0
    for key, title, sample in sections:
        cards = []
        for n, med in enumerate(sample, 1):
            imgs: list[tuple[str, str, str]] = []
            for i in med["institutions"]:
                if i["id"] != key:
                    continue
                for code in [c.strip() for c in i["code"].split(",")][:3]:
                    img = None
                    where = f"código {code}"
                    if key == "minsal" and code in page_of_minsal:
                        where += f" · pág. {page_of_minsal[code]} del PDF"
                        img = minsal_pdf.crop(page_of_minsal[code], code)
                    elif key == "isss" and code in isss_rows:
                        where += f" · pág. {isss_rows[code].page} del PDF"
                        img = isss_pdf.crop(isss_rows[code].page, code, with_following_notes=True)
                    elif key == "fosalud" and (code in fos_rows or any(sum(a != b for a, b in zip(code, c, strict=False)) == 1 for c in fos_rows if len(c) == len(code))):
                        # un código corregido por OCR (distancia 1) se busca por el que se leyó en el escaneo
                        r = fos_rows.get(code) or next(fos_rows[c] for c in fos_rows if len(c) == len(code) and sum(a != b for a, b in zip(code, c, strict=False)) == 1)
                        where += f" · pág. {r['page']} del PDF"
                        img = fos_image(r["page"], r["y0"], r["y1"]) if r.get("y1") else None
                    if img is None:
                        missing += 1
                    imgs.append((INST_NAMES[key], where, _jpeg_b64(img) if img is not None else ""))
            cards.append(card(n, key, med, imgs))
            total += 1
        out_sections.append(f'<h2>{html.escape(title)} · {len(sample)} fichas</h2>' + "\n".join(cards))
    out = root / "data/review/verificacion.html"
    out.write_text(PAGE.replace("%SECTIONS%", "\n".join(out_sections)), encoding="utf-8")
    print(f"{out} · {total} fichas · {out.stat().st_size / 1e6:.1f} MB · filas sin imagen: {missing}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
