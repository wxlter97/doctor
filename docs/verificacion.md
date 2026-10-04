# Verificación de calculadoras (pendiente §14.2)

Los valores esperados de los tests se **calcularon a mano con la fórmula**; ninguna calculadora está marcada como verificada contra una publicación ni revisada por un médico. Antes de publicar, cada fila debe cotejarse con la fuente original.

| Calculadora | Referencia en código | Pendiente |
|---|---|---|
| IMC | OMS TRS 894 (2000) | Cotejar cortes con la publicación |
| Superficie corporal | Mosteller 1987; DuBois 1916 | Cotejar fórmulas y ejemplo publicado |
| CKD-EPI 2021 | Inker 2021, NEJM | Cotejar constantes (κ, α, 0.9938, 1.012) y un caso publicado |
| Cockcroft-Gault | Cockcroft & Gault 1976 | Cotejar fórmula |
| Dosis por peso / Goteo | Aritmética | Revisión médica de advertencias |
| Holliday-Segar | Holliday & Segar 1957 | Cotejar tramos |
| Glasgow adulto | Teasdale & Jennett 1974 | Cotejar descriptores |
| Glasgow pediátrico | `TODO(fuente)` | Citar la adaptación pediátrica y verificar descriptores |
| APGAR | Apgar 1953 | Cotejar descriptores y cortes |
| CHA₂DS₂-VASc | Lip 2010, Chest | Cotejar puntajes y categorías |
| PAM | `TODO(fuente)` | Citar texto de referencia |
| Edad gestacional / FPP | `TODO(fuente)` | Citar referencia de la regla de Naegele |

Los DOI están en el código y deben abrirse y confirmarse uno por uno.

## Fase 5

| Calculadora | Referencia en código | Pendiente de verificar |
|---|---|---|
| HAS-BLED | Pisters 2010, Chest | Criterios y umbrales de renal/hepática; cortes 0–1 / 2 / ≥ 3 |
| CURB-65 | Lim 2003, Thorax | Cortes de urea y PA; texto de las categorías |
| Wells TVP | Wells 1997, Lancet | Los criterios incluyen "TVP previa" (versión 2003): citar y cotejar |
| Wells TEP | Wells 2000, Thromb Haemost | Puntajes (3/3/1.5/1.5/1.5/1/1) y cortes (< 2, 2–6, > 6; ≤ 4 / > 4) |
| qSOFA | Seymour 2016, JAMA | Criterios |
| SOFA | Vincent 1996; Singer 2016 | Tabla completa; bordes "≥ 5.0" de creatinina y "≥ 12.0" de bilirrubina (la fuente usa "> 5.0" y "> 12.0") |
| Child-Pugh | Pugh 1973, Br J Surg | Cortes de bilirrubina, albúmina e INR; descriptores de ascitis y encefalopatía |
| MELD-Na | Kim 2008, NEJM | Constantes y acotamientos (Cr 4.0, Na 125–137); la fórmula es la de UNOS 2016, no MELD 3.0 |
| Schwartz bedside | Schwartz 2009, JASN | Constante 0.413 |
| Parkland | Baxter & Shires 1968 | Cita exacta; 4 mL/kg/%SCQ y reparto 8 h / 16 h |
| Anion gap | Emmett & Narins 1977 | Factor 2.5 de corrección por albúmina (`TODO(fuente)`) |
| Sodio corregido | Katz 1973; Hillier 1999 | Factores 1.6 y 2.4 |
| Calcio corregido | Payne 1973 | Factor 0.8 |
| Osmolaridad | `TODO(fuente)` | Citar referencia |
| Conversión de unidades | `TODO(fuente)` | Citar tabla; factores 18.016, 88.4, 38.67, 2.8 |
| Balance hídrico | Aritmética | Revisión médica |
| Peso ideal (Devine) | Devine 1974 | Factor 0.4 del peso ajustado (`TODO(fuente)`) |

Decisiones tomadas por falta de fuente: el MELD-Na y el balance hídrico no colorean la interpretación (no se inventaron umbrales).

## Verificación de referencias contra Crossref (2026-10-03)

Se comprobó que los 22 DOI del código **existen y su título coincide con la cita**, y que año, volumen, número y páginas coinciden, salvo cuatro diferencias que son de metadatos de Crossref y no de la cita (Lancet 1974 figura como vol. 304 en Crossref y como 2(7872) en PubMed; Wells 2000 figura "83(03)"; Cockcroft-Gault figura con el año de la reedición digital, 2008; Apgar figura como 32(1) en Crossref y 32(4) en PubMed).

Se corrigió el DOI de Lim 2003 (CURB-65): era `10.1136/thx.58.5.377` y el correcto es `10.1136/thorax.58.5.377`. Se añadieron DOI a Wells TEP, Wells TVP modificado (NEJM 2003), Holliday-Segar, Baxter, Katz, Payne, Emmett y Apgar.

Esto confirma que las **fuentes existen**; no confirma que las fórmulas, constantes ni puntos de corte del código coincidan con su contenido. Eso sigue pendiente (columna "Pendiente" de las tablas de arriba) y requiere leer cada artículo.

Sin DOI confirmado: Hillier 1999 (Am J Med 106:399), Devine 1974 (Drug Intell Clin Pharm 8:650), DuBois 1916, OMS TRS 894 y las marcadas `TODO(fuente)`.
