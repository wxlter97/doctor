# Fuentes de los listados oficiales

Última revisión: 2026-10-05. Los PDF están en `data/sources/` (ignorados por git por su peso). No inventar ediciones ni fechas.

## Archivos recibidos y su estado

| Archivo | Qué es | Páginas | Estado |
|---|---|---|---|
| `listadooficialdemedicamentosdelministeriodesalud-Acuerdo-Ejecutivo-1201-14052026_v2.pdf` | **LOM/MINSAL 2026** — Listado Oficial de Medicamentos del Ministerio de Salud. Acuerdo n.º 1201 de 14/05/2026 (deroga el Acuerdo n.º 800 de 27/01/2025). PDF creado el 14/08/2026. | 180 | **Usable.** Texto extraíble; tablas limpias con `pdfplumber`. 834 filas con código SINAB (págs. 10–140) + anexo de medicamentos de alto riesgo. |
| `LISTADO-OFICIAL-DE-MEDICAMENTOS-2026.pdf` | **LOM 2026 de la Superintendencia de Regulación Sanitaria** (acuerdo n.º SI.2026.02.06-02 de 06/02/2026). Es un listado **nacional**: no indica institución, ni nivel de atención, ni código SINAB. Incluye vacunas y la clasificación AWaRe. | 23 | Usable como **referencia cruzada**; **no** es el listado del ISSS ni de FOSALUD. ~324 filas con ATC + correlativo. |
| `listado_institucional_de_medicamentos_esenciales_lime_pliegos_v2.pdf` | LIME 1.ª versión, MINSAL, mayo de 2016. | 210 | **Obsoleto**: lo reemplazó el LOM/MINSAL (Acuerdo 800 de 2025, hoy el 1201 de 2026). Solo valor histórico. No ingerir. |

## Pendientes (ubicados el 2026-10-05, aún sin descargar)

Se localizaron en el portal de transparencia (https://www.transparencia.gob.sv). Los enlaces de descarga usan el ID del documento en base64: `https://www.transparencia.gob.sv/descarga_archivo.php?id=<base64(ID)>&inst=<ID>`.

| Institución | Listado | Archivo | Tamaño | Notas |
|---|---|---|---|---|
| ISSS | Listado Oficial de Medicamentos, **19.ª edición** (publicado 29/10/2024, «Vigente»; no hay otra más nueva en el portal) | `LOM_-_19a_Edicion_redacted.pdf` (ID 606538) | 3.2 MB | **Descargado** como `isss_lom_19.pdf` (gitignored). 198 pp.; lista general pp. 57–150 (836 códigos de 7 dígitos con tablas limpias); el índice alfabético (pp. 151+) repite los códigos y se ignora. Extractor: `isss.py`. Sin cláusula de licencia visible: es una versión pública publicada en el portal de transparencia (LAIP); se cita la fuente y se aclara que no es publicación oficial. |
| FOSALUD | Listado Institucional de Medicamentos, **2.ª edición** (la más reciente encontrada) | `LISTADO_INSTITUCIONAL_DE_MEDICAMENTOS-FOSALUD_2a._EDICIONescaneada.pdf` (ID 347038) | 15.2 MB | **Escaneado**: necesita OCR. Existe una 1.ª edición (ID 280043, 8.2 MB) que no se necesita. Falta confirmar que no haya una edición posterior no publicada en el portal. |

## Estado de la extracción de MINSAL

`python -m medapoyo_pipeline.minsal` (en `data/pipeline`) genera `data/processed/catalog.minsal.json` (792 fichas desde 834 filas), `data/review/minsal_revision.csv` (filas dudosas) y `data/review/minsal_muestra_50.csv` (muestra reproducible para verificar a mano contra el PDF). El PDF repite el código SINAB `02301010` para dos insulinas distintas (cristalina y NPH): probable error de la fuente.

## Condiciones de uso (importante)

El LOM/MINSAL 2026 (pág. 3) dice: «Está permitida la reproducción parcial o total de esta obra por cualquier medio o formato, siempre que se cite la fuente y **que no sea para la venta u otro fin de carácter comercial**. Debe dar crédito de manera adecuada. […] pero no de forma tal que sugiera que usted o su uso tienen apoyo de la licencia.»

Consecuencias para MedHelp:
1. Citar siempre «Ministerio de Salud de El Salvador — LOM/MINSAL 2026 (Acuerdo n.º 1201, 14/05/2026)» en la ficha y en la página de fuentes.
2. **Uso no comercial**: la app debe seguir siendo gratuita y sin anuncios ni venta. Si algún día se monetiza, hay que pedir autorización a MINSAL.
3. No sugerir que MINSAL respalda la app (el aviso legal ya dice que no sustituye el criterio médico; falta añadir que no es una publicación oficial).
4. Los PDF de ISSS, FOSALUD y de la Superintendencia no traen cláusula de licencia visible: pendiente revisar sus condiciones.
