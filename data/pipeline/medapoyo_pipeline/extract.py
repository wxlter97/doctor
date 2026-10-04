"""Extracción de listados oficiales (PDF → filas).

TODO(fuente): los formatos de LIME (MINSAL), LOM (ISSS) y LIM (FOSALUD) no se han descargado (§14.3),
así que aquí solo hay el volcado genérico de tablas para inspeccionarlas. Cada institución necesitará
su parser, con tests sobre un fragmento real. No inventes columnas.
Requiere: pip install -e '.[extract]'
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path


def dump_tables(pdf_path: Path, out_csv: Path) -> int:
    import pdfplumber  # import perezoso: dependencia opcional

    n = 0
    with pdfplumber.open(pdf_path) as pdf, open(out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        for page_no, page in enumerate(pdf.pages, 1):
            for table in page.extract_tables():
                for row in table:
                    w.writerow([page_no, *[(c or "").strip() for c in row]])
                    n += 1
    return n


if __name__ == "__main__":
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    print(f"{dump_tables(src, dst)} filas → {dst}")
