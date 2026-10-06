# Fuentes de los listados oficiales

Última revisión: 2026-10-05. Los PDF están en `data/sources/` (ignorados por git por su peso). No inventar ediciones ni fechas.

## Archivos recibidos y su estado

| Archivo | Qué es | Páginas | Estado |
|---|---|---|---|
| `listadooficialdemedicamentosdelministeriodesalud-Acuerdo-Ejecutivo-1201-14052026_v2.pdf` | **LOM/MINSAL 2026** — Listado Oficial de Medicamentos del Ministerio de Salud. Acuerdo n.º 1201 de 14/05/2026 (deroga el Acuerdo n.º 800 de 27/01/2025). PDF creado el 14/08/2026. | 180 | **Usable.** Texto extraíble; tablas limpias con `pdfplumber`. 834 filas con código SINAB (págs. 10–140) + anexo de medicamentos de alto riesgo. |
| `LISTADO-OFICIAL-DE-MEDICAMENTOS-2026.pdf` | **LOM 2026 de la Superintendencia de Regulación Sanitaria** (acuerdo n.º SI.2026.02.06-02 de 06/02/2026). Es un listado **nacional**: no indica institución, ni nivel de atención, ni código SINAB. Incluye vacunas y la clasificación AWaRe. | 23 | Usable como **referencia cruzada**; **no** es el listado del ISSS ni de FOSALUD. ~324 filas con ATC + correlativo. |
| `listado_institucional_de_medicamentos_esenciales_lime_pliegos_v2.pdf` | LIME 1.ª versión, MINSAL, mayo de 2016. | 210 | **Obsoleto**: lo reemplazó el LOM/MINSAL (Acuerdo 800 de 2025, hoy el 1201 de 2026). Solo valor histórico. No ingerir. |

## Pendientes

| Institución | Listado | Estado |
|---|---|---|
| ISSS | LOM ISSS (la búsqueda web indicó 19.ª edición, 2024; **no confirmado**) | **Falta el PDF.** |
| FOSALUD | LIM (la búsqueda web indicó 2.ª edición, 2019; **no confirmado**; puede haber una más nueva) | **Falta el PDF.** |

## Condiciones de uso (importante)

El LOM/MINSAL 2026 (pág. 3) dice: «Está permitida la reproducción parcial o total de esta obra por cualquier medio o formato, siempre que se cite la fuente y **que no sea para la venta u otro fin de carácter comercial**. Debe dar crédito de manera adecuada. […] pero no de forma tal que sugiera que usted o su uso tienen apoyo de la licencia.»

Consecuencias para MedHelp:
1. Citar siempre «Ministerio de Salud de El Salvador — LOM/MINSAL 2026 (Acuerdo n.º 1201, 14/05/2026)» en la ficha y en la página de fuentes.
2. **Uso no comercial**: la app debe seguir siendo gratuita y sin anuncios ni venta. Si algún día se monetiza, hay que pedir autorización a MINSAL.
3. No sugerir que MINSAL respalda la app (el aviso legal ya dice que no sustituye el criterio médico; falta añadir que no es una publicación oficial).
4. Los PDF de ISSS, FOSALUD y de la Superintendencia no traen cláusula de licencia visible: pendiente revisar sus condiciones.
