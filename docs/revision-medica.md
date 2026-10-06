# Paquete de revisión médica de las calculadoras — MedHelp

Generado automáticamente desde el código (`pnpm review:packet`). **Ninguna calculadora está marcada como verificada** hasta que usted firme esta hoja.

## Qué se le pide

Para cada una de las 30 calculadoras:

1. Comparar la fórmula, los puntajes y los puntos de corte con la publicación citada (los DOI ya se comprobaron: existen y coinciden con la cita; lo que **no** se comprobó es el contenido).
2. Comprobar a mano el ejemplo numérico, cuando lo hay.
3. Revisar que los textos de interpretación y las advertencias no induzcan a error en la práctica.
4. Dar un veredicto y anotar los cambios que pida.

Tiempo estimado: unos 10–15 minutos por calculadora (≈ 5–7 horas en total). Se puede repartir por especialidad: **medicina interna/nefrología** (renal, hepático, cardio, laboratorio), **pediatría/neonatología** (Holliday-Segar, Schwartz, Glasgow pediátrico, APGAR, dosis por peso), **obstetricia** (edad gestacional), **cuidados críticos/urgencias** (Glasgow, SOFA, qSOFA, Parkland, balance hídrico, Wells, CURB-65).

## Datos del revisor (se guardan solo las iniciales y la fecha)

- Nombre: ____________________  Especialidad: ____________________
- N.º de registro profesional (JVPM, opcional): ____________
- Iniciales para la app: ______  Fecha: ____/____/________
- Alcance revisado (calculadoras): ______________________________

## Límites de lo revisado

La app es una herramienta de apoyo; no sustituye el juicio clínico. La revisión confirma que **la app calcula lo que la fuente dice**, no que sea adecuada para un paciente concreto.

---

## Índice

1. Índice de masa corporal (IMC)
2. Superficie corporal
3. TFG CKD-EPI 2021 (sin coeficiente de raza)
4. Aclaramiento de creatinina (Cockcroft-Gault)
5. Dosis por peso (mg/kg)
6. Goteo y velocidad de infusión
7. Líquidos de mantenimiento (Holliday-Segar)
8. Escala de Glasgow (adulto)
9. Escala de Glasgow (pediátrica, preverbal)
10. Puntuación de APGAR
11. CHA₂DS₂-VASc
12. Presión arterial media (PAM)
13. Edad gestacional y fecha probable de parto
14. HAS-BLED
15. CURB-65 (neumonía adquirida en la comunidad)
16. Wells para trombosis venosa profunda (TVP)
17. Wells para tromboembolia pulmonar (TEP)
18. Child-Pugh (cirrosis)
19. MELD-Na
20. qSOFA
21. SOFA
22. TFG pediátrica (Schwartz bedside)
23. Parkland (reanimación del gran quemado)
24. Anion gap (brecha aniónica)
25. Sodio corregido por glucosa
26. Calcio corregido por albúmina
27. Osmolaridad sérica calculada
28. Balance hídrico
29. Conversión de unidades de laboratorio
30. Peso ideal (Devine) y peso ajustado

---

### Índice de masa corporal (IMC)

- **Categoría:** Antropometría · **Población:** adulto · **Id:** `imc`

**Entradas que valida la app**

- Peso: 20–500 kg · unidades: kg / lb
- Talla: 100–250 cm · unidades: cm / in

**Fórmula / reglas**

```
IMC = peso (kg) / talla (m)²
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"peso":70,"talla":175}`
- Resultado de la app: **22.9 kg/m²** · Normal

**Referencias citadas**

- World Health Organization. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894. Ginebra: OMS; 2000.

**Advertencias que muestra la app**

- Categorías de la OMS para adultos. No aplica a niños ni adolescentes (usar percentiles).

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Los cortes (18.5 / 25 / 30 / 35 / 40) y los nombres de categoría son los de la OMS para adultos.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Superficie corporal

- **Categoría:** Antropometría · **Población:** todos · **Id:** `bsa`

**Entradas que valida la app**

- Peso: 0.5–500 kg · unidades: kg / lb
- Talla: 30–250 cm · unidades: cm / in
- Fórmula: Mosteller | DuBois

**Fórmula / reglas**

```
Mosteller: SC (m²) = √(talla (cm) × peso (kg) / 3600)
DuBois: SC (m²) = 0.007184 × peso (kg)^0.425 × talla (cm)^0.725
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"peso":70,"talla":170,"metodo":"mosteller"}`
- Resultado de la app: **1.82 m²**

**Referencias citadas**

- Mosteller RD. Simplified calculation of body-surface area. N Engl J Med. 1987;317(17):1098. — https://doi.org/10.1056/NEJM198710223171717
- Du Bois D, Du Bois EF. A formula to estimate the approximate surface area if height and weight be known. Arch Intern Med. 1916;17:863-871.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Fórmulas de Mosteller y DuBois y sus exponentes/constantes.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### TFG CKD-EPI 2021 (sin coeficiente de raza)

- **Categoría:** Renal · **Población:** adulto · **Id:** `ckd-epi-2021`

**Entradas que valida la app**

- Creatinina sérica: 0.2–20 mg/dL · unidades: mg/dL / µmol/L
- Edad: 18–120 años · entero
- Sexo: Mujer | Hombre

**Fórmula / reglas**

```
TFG = 142 × mín(Cr/κ, 1)^α × máx(Cr/κ, 1)^−1.200 × 0.9938^edad × 1.012 [si es mujer]
κ = 0.7 (mujer) · 0.9 (hombre); α = −0.241 (mujer) · −0.302 (hombre)
Cr en mg/dL.
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"creatinina":1.2,"edad":54,"sexo":"f"}`
- Resultado de la app: **54 mL/min/1.73 m²** · G3a

**Referencias citadas**

- Inker LA, et al. New creatinine- and cystatin C–based equations to estimate GFR without race. N Engl J Med. 2021;385(19):1737-1749. — https://doi.org/10.1056/NEJMoa2102953

**Advertencias que muestra la app**

- Solo para adultos (≥ 18 años).
- Supone función renal estable: no es válida en lesión renal aguda.
- Estadios G según KDIGO; para clasificar la ERC también hace falta la albuminuria.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Constantes: κ 0.7/0.9, α −0.241/−0.302, −1.200, 0.9938, 1.012 (mujer).
- [ ] Los estadios G1–G5 y sus cortes (90/60/45/30/15).

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Aclaramiento de creatinina (Cockcroft-Gault)

- **Categoría:** Renal · **Población:** adulto · **Id:** `cockcroft-gault`

**Entradas que valida la app**

- Edad: 18–120 años · entero
- Peso: 20–400 kg · unidades: kg / lb
- Creatinina sérica: 0.2–20 mg/dL · unidades: mg/dL / µmol/L
- Sexo: Mujer | Hombre

**Fórmula / reglas**

```
ClCr (mL/min) = (140 − edad) × peso (kg) / (72 × Cr (mg/dL))   × 0.85 si es mujer
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"edad":60,"peso":80,"creatinina":1,"sexo":"m"}`
- Resultado de la app: **89 mL/min**

**Referencias citadas**

- Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16(1):31-41. — https://doi.org/10.1159/000180580

**Advertencias que muestra la app**

- Usa el peso real; en obesidad o desnutrición evaluá usar peso ideal o ajustado.
- Supone función renal estable. Verificá la ficha del fármaco para saber qué estimación usa para ajustar la dosis.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Factor 0.85 en mujeres y uso del peso real. ¿Conviene advertir peso ideal/ajustado en obesidad?

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Dosis por peso (mg/kg)

- **Categoría:** Farmacología · **Población:** todos · **Id:** `dosis-por-peso`

**Entradas que valida la app**

- Peso: 0.3–400 kg · unidades: kg / lb
- Dosis indicada: 0.0001–10000 mg/kg
- Concentración (opcional) (opcional): 0.0001–10000 mg/mL
- Dosis máxima (opcional) (opcional): 0.0001–1000000 mg

**Fórmula / reglas**

```
Dosis (mg) = peso (kg) × dosis (mg/kg)
Volumen (mL) = dosis (mg) / concentración (mg/mL)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"peso":20,"dosisKg":15,"concentracion":24,"tope":500}`
- Resultado de la app: **300.00 mg** · Volumen: 12.50 mL · Dentro de la dosis máxima

**Referencias citadas**

- Cálculo aritmético; no requiere referencia bibliográfica.

**Advertencias que muestra la app**

- Verificá siempre la dosis con el protocolo vigente y la ficha del producto.
- El tope lo ingresás vos: si la dosis lo supera, se avisa en rojo pero no se limita el resultado.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] La advertencia en rojo al superar el tope ingresado y que NO limite el resultado: ¿es el comportamiento seguro?

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Goteo y velocidad de infusión

- **Categoría:** Líquidos y goteo · **Población:** todos · **Id:** `goteo-infusion`

**Entradas que valida la app**

- Qué querés calcular: Gotas/min y mL/h a partir de un volumen y un tiempo | mL/h a partir de una dosis en mcg/kg/min
- Volumen: 1–20000 mL
- Tiempo: 1–14400 min · unidades: min / h
- Equipo: Macrogoteo (20 gotas/mL) | Microgoteo (60 gotas/mL)
- Dosis: 0.0001–1000 mcg/kg/min
- Peso: 0.3–400 kg · unidades: kg / lb
- Concentración de la mezcla: 0.0001–1000000 mcg/mL

**Fórmula / reglas**

```
Gotas/min = volumen (mL) × gotas/mL / tiempo (min)   (macro 20 · micro 60)
mL/h = volumen (mL) × 60 / tiempo (min)
mL/h = dosis (mcg/kg/min) × peso (kg) × 60 / concentración (mcg/mL)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"modo":"volumen","volumen":500,"tiempo":480,"gotero":20}`
- Resultado de la app: **20.8 gotas/min** · Velocidad: 62.5 mL/h

**Referencias citadas**

- Cálculo aritmético; no requiere referencia bibliográfica.

**Advertencias que muestra la app**

- Confirmá el factor de goteo en el empaque del equipo y verificá la programación de la bomba.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Factores 20 gotas/mL (macro) y 60 (micro); conversión mcg/kg/min → mL/h.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Líquidos de mantenimiento (Holliday-Segar)

- **Categoría:** Líquidos y goteo · **Población:** pediatrico · **Id:** `holliday-segar`

**Entradas que valida la app**

- Peso: 3–200 kg · unidades: kg / lb

**Fórmula / reglas**

```
Primeros 10 kg: 100 mL/kg/día
Siguientes 10 kg (10–20): 50 mL/kg/día
Por cada kg sobre 20: 20 mL/kg/día
(equivale a la regla 4-2-1 en mL/h)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"peso":25}`
- Resultado de la app: **1600 mL/día** · Velocidad: 66.7 mL/h

**Referencias citadas**

- Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics. 1957;19(5):823-832. — https://doi.org/10.1542/peds.19.5.823

**Advertencias que muestra la app**

- Calcula mantenimiento, no déficit ni pérdidas continuas.
- No aplica a recién nacidos en los primeros días de vida.
- En pacientes de mayor peso, verificá el protocolo: el total diario suele limitarse.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Tramos 100/50/20 mL/kg/día; advertencias para neonatos y adultos grandes.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Escala de Glasgow (adulto)

- **Categoría:** Neurología · **Población:** adulto · **Id:** `glasgow`

**Entradas que valida la app**

- Apertura ocular: 4 · Espontánea | 3 · Al hablarle | 2 · Al dolor | 1 · Ninguna
- Respuesta verbal: 5 · Orientada | 4 · Confusa | 3 · Palabras inapropiadas | 2 · Sonidos incomprensibles | 1 · Ninguna
- Respuesta motora: 6 · Obedece órdenes | 5 · Localiza el dolor | 4 · Retira al dolor | 3 · Flexión anormal (decorticación) | 2 · Extensión anormal (descerebración) | 1 · Ninguna

**Fórmula / reglas**

```
Total = apertura ocular (1–4) + respuesta verbal (1–5) + respuesta motora (1–6). Rango 3–15.
```

**Referencias citadas**

- Teasdale G, Jennett B. Assessment of coma and impaired consciousness: a practical scale. Lancet. 1974;2(7872):81-84. — https://doi.org/10.1016/S0140-6736(74)91639-0

**Advertencias que muestra la app**

- Evaluá con el mejor estado alcanzado tras estabilizar. Sedación, intubación o edema palpebral limitan la escala.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Descriptores y puntajes de apertura ocular, verbal y motora; cortes de gravedad 13–15 / 9–12 / 3–8.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Escala de Glasgow (pediátrica, preverbal)

- **Categoría:** Neurología · **Población:** pediatrico · **Id:** `glasgow-pediatrico`

**Entradas que valida la app**

- Apertura ocular: 4 · Espontánea | 3 · Al hablarle | 2 · Al dolor | 1 · Ninguna
- Respuesta verbal: 5 · Balbucea, sonríe, llora normal | 4 · Llora, se consuela | 3 · Irritable persistente | 2 · Inquieto, agitado | 1 · Ninguna
- Respuesta motora: 6 · Movimiento espontáneo normal | 5 · Retira al tacto | 4 · Retira al dolor | 3 · Flexión anormal | 2 · Extensión anormal | 1 · Ninguna

**Fórmula / reglas**

```
Total = apertura ocular (1–4) + respuesta verbal (1–5) + respuesta motora (1–6). Rango 3–15.
```

**Referencias citadas**

- Adaptación pediátrica de la escala de Teasdale G, Jennett B. Lancet. 1974;2(7872):81-84. TODO(fuente): citar la publicación de la adaptación pediátrica y verificar los descriptores.

**Advertencias que muestra la app**

- Descriptores verbales y motores para niños que aún no hablan. Verificar contra la fuente (pendiente).

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Descriptores verbales y motores para preverbales (la fuente pediátrica está pendiente de citar: TODO(fuente)).

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Puntuación de APGAR

- **Categoría:** Neonatal · **Población:** neonatal · **Id:** `apgar`

**Entradas que valida la app**

- Frecuencia cardíaca: 2 · ≥ 100 lpm | 1 · < 100 lpm | 0 · Ausente
- Esfuerzo respiratorio: 2 · Llanto fuerte | 1 · Lento o irregular | 0 · Ausente
- Tono muscular: 2 · Movimiento activo | 1 · Flexión leve de extremidades | 0 · Flácido
- Irritabilidad refleja: 2 · Llanto o tos | 1 · Mueca | 0 · Sin respuesta
- Color: 2 · Todo rosado | 1 · Cuerpo rosado, extremidades azules | 0 · Azul o pálido

**Fórmula / reglas**

```
Total = FC + esfuerzo respiratorio + tono + irritabilidad refleja + color (0–2 cada uno). Rango 0–10.
```

**Referencias citadas**

- Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg. 1953;32(4):260-267. — https://doi.org/10.1213/00000539-195301000-00041

**Advertencias que muestra la app**

- Se registra al minuto 1 y al minuto 5. No reemplaza la decisión de reanimar, que no espera al puntaje.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Descriptores y puntajes de los 5 criterios; cortes 7–10 / 4–6 / 0–3.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### CHA₂DS₂-VASc

- **Categoría:** Cardiovascular · **Población:** adulto · **Id:** `cha2ds2-vasc`

**Entradas que valida la app**

- Insuficiencia cardíaca / disfunción del VI: 0 · No | +1 · Sí
- Hipertensión: 0 · No | +1 · Sí
- Edad: 0 · < 65 años | 1 · 65–74 años | 2 · ≥ 75 años
- Diabetes mellitus: 0 · No | +1 · Sí
- ACV / AIT / tromboembolia previa: 0 · No | +2 · Sí
- Enfermedad vascular (IAM previo, enfermedad arterial periférica, placa aórtica): 0 · No | +1 · Sí
- Sexo femenino: 0 · No | +1 · Sí

**Fórmula / reglas**

```
IC 1 · HTA 1 · Edad ≥ 75: 2 · DM 1 · ACV/AIT/TE previa 2 · Enf. vascular 1 · Edad 65–74: 1 · Sexo femenino 1. Rango 0–9.
```

**Referencias citadas**

- Lip GYH, et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation using a novel risk factor-based approach (Euro Heart Survey). Chest. 2010;137(2):263-272. — https://doi.org/10.1378/chest.09-1584

**Advertencias que muestra la app**

- Categorías de riesgo según la publicación original. Las guías vigentes pueden recomendar umbrales distintos según el sexo; la decisión de anticoagular es clínica.
- Se evalúa junto con el riesgo de sangrado.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Puntajes (IC 1, HTA 1, edad ≥75 2, DM 1, ACV 2, vascular 1, edad 65–74 1, mujer 1) y categorías 0 / 1 / ≥2 de la publicación original.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Presión arterial media (PAM)

- **Categoría:** Cardiovascular · **Población:** todos · **Id:** `pam`

**Entradas que valida la app**

- Presión sistólica: 40–300 mmHg · entero
- Presión diastólica: 20–200 mmHg · entero

**Fórmula / reglas**

```
PAM = (PAS + 2 × PAD) / 3
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"pas":120,"pad":80}`
- Resultado de la app: **93 mmHg**

**Referencias citadas**

- Fórmula estándar de hemodinámica. TODO(fuente): citar un texto de referencia verificable.

**Advertencias que muestra la app**

- Estimación a partir de presiones no invasivas; la medición invasiva puede diferir.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Fórmula (PAS + 2·PAD)/3. La fuente está pendiente de citar: TODO(fuente).

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Edad gestacional y fecha probable de parto

- **Categoría:** Obstetricia · **Población:** adulto · **Id:** `edad-gestacional`

**Entradas que valida la app**

- Fecha de última menstruación (FUM) (fecha)
- Calcular a la fecha (fecha)

**Fórmula / reglas**

```
FPP = FUM + 280 días (equivale a FUM + 1 año − 3 meses + 7 días)
Edad gestacional = fecha de cálculo − FUM, en semanas y días
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"fum":"2026-01-01","referencia":"2026-04-11"}`
- Resultado de la app: **14 sem + 2 d** · FPP: 8 de octubre de 2026 · Pretérmino (< 37 semanas)

**Referencias citadas**

- Regla de Naegele. TODO(fuente): citar la referencia original o un texto de obstetricia verificable.

**Advertencias que muestra la app**

- Supone ciclos regulares de 28 días y FUM confiable. Si hay discrepancia, confirmá con ecografía temprana.
- Las categorías (pretérmino, término) son orientativas.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] FPP = FUM + 280 días; categorías pretérmino (<37) y término. Fuente pendiente: TODO(fuente).

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### HAS-BLED

- **Categoría:** Cardiovascular · **Población:** adulto · **Id:** `has-bled`

**Entradas que valida la app**

- Hipertensión no controlada (PAS > 160 mmHg): 0 · No | +1 · Sí
- Función renal anormal (diálisis, trasplante o creatinina > 2.26 mg/dL): 0 · No | +1 · Sí
- Función hepática anormal (cirrosis o bilirrubina > 2× y AST/ALT/FA > 3× lo normal): 0 · No | +1 · Sí
- ACV previo: 0 · No | +1 · Sí
- Antecedente de sangrado o predisposición (anemia, trombocitopenia): 0 · No | +1 · Sí
- INR lábil (poco tiempo en rango terapéutico): 0 · No | +1 · Sí
- Edad > 65 años: 0 · No | +1 · Sí
- Fármacos que predisponen (antiagregantes, AINE): 0 · No | +1 · Sí
- Alcohol (≥ 8 bebidas por semana): 0 · No | +1 · Sí

**Fórmula / reglas**

```
Un punto por cada criterio: H, A (renal y hepática, 1 cada una), S, B, L, E, D (fármacos y alcohol, 1 cada uno). Rango 0–9.
```

**Referencias citadas**

- Pisters R, et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-1100. — https://doi.org/10.1378/chest.10-0134

**Advertencias que muestra la app**

- Un puntaje alto señala factores de riesgo a corregir; no es por sí solo una razón para no anticoagular.
- Herramienta de apoyo: la decisión clínica final es del médico tratante.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Umbrales de función renal (creatinina > 2.26 mg/dL) y hepática; cortes 0–1 / 2 / ≥3.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### CURB-65 (neumonía adquirida en la comunidad)

- **Categoría:** Respiratorio · **Población:** adulto · **Id:** `curb-65`

**Entradas que valida la app**

- Confusión de inicio reciente: 0 · No | +1 · Sí
- Urea > 7 mmol/L (BUN > 19 mg/dL): 0 · No | +1 · Sí
- Frecuencia respiratoria ≥ 30/min: 0 · No | +1 · Sí
- PA sistólica < 90 o diastólica ≤ 60 mmHg: 0 · No | +1 · Sí
- Edad ≥ 65 años: 0 · No | +1 · Sí

**Fórmula / reglas**

```
Un punto por cada criterio: Confusión, Urea, Respiratoria (FR), Blood pressure, edad ≥ 65. Rango 0–5.
```

**Referencias citadas**

- Lim WS, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-382. — https://doi.org/10.1136/thorax.58.5.377

**Advertencias que muestra la app**

- No contempla comorbilidades, hipoxemia ni contexto social: complementá con el criterio clínico.
- Herramienta de apoyo: la decisión clínica final es del médico tratante.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Cortes de urea (> 7 mmol/L; BUN > 19 mg/dL) y PA; el texto de cada categoría de manejo.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Wells para trombosis venosa profunda (TVP)

- **Categoría:** Cardiovascular · **Población:** adulto · **Id:** `wells-tvp`

**Entradas que valida la app**

- Cáncer activo (tratamiento en los últimos 6 meses o paliativo): 0 · No | +1 · Sí
- Parálisis, paresia o inmovilización con yeso de una pierna: 0 · No | +1 · Sí
- Encamado ≥ 3 días o cirugía mayor en las últimas 12 semanas: 0 · No | +1 · Sí
- Dolor localizado a lo largo del sistema venoso profundo: 0 · No | +1 · Sí
- Toda la pierna inflamada: 0 · No | +1 · Sí
- Pantorrilla inflamada ≥ 3 cm más que la otra (10 cm bajo la tuberosidad tibial): 0 · No | +1 · Sí
- Edema con fóvea limitado a la pierna sintomática: 0 · No | +1 · Sí
- Venas superficiales colaterales (no varicosas): 0 · No | +1 · Sí
- TVP previa documentada: 0 · No | +1 · Sí
- Diagnóstico alternativo al menos tan probable como la TVP: 0 · No | -2 · Sí

**Fórmula / reglas**

```
Suma de criterios (+1 cada uno; −2 si hay un diagnóstico alternativo igual o más probable). Rango −2 a 9.
```

**Referencias citadas**

- Wells PS, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. Lancet. 1997;350(9094):1795-1798. — https://doi.org/10.1016/S0140-6736(97)08140-3
- Wells PS, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis (versión modificada, incluye "TVP previa"). N Engl J Med. 2003;349(13):1227-1235. — https://doi.org/10.1056/NEJMoa023153

**Advertencias que muestra la app**

- La probabilidad pretest orienta la estrategia diagnóstica (dímero D, ecografía); no confirma ni descarta por sí sola.
- Herramienta de apoyo: la decisión clínica final es del médico tratante.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] El criterio "TVP previa" es de la versión modificada (2003); ¿se prefiere la original de 1997 sin ese criterio?
- [ ] Cortes: ≤0 baja / 1–2 moderada / ≥3 alta.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Wells para tromboembolia pulmonar (TEP)

- **Categoría:** Respiratorio · **Población:** adulto · **Id:** `wells-tep`

**Entradas que valida la app**

- Signos clínicos de TVP (inflamación de la pierna y dolor a la palpación): 0 · No | +3 · Sí
- TEP es el diagnóstico más probable o alternativas menos probables: 0 · No | +3 · Sí
- Frecuencia cardíaca > 100 lpm: 0 · No | +1.5 · Sí
- Inmovilización ≥ 3 días o cirugía en las últimas 4 semanas: 0 · No | +1.5 · Sí
- TEP o TVP previos: 0 · No | +1.5 · Sí
- Hemoptisis: 0 · No | +1 · Sí
- Cáncer (en tratamiento, tratado en los últimos 6 meses o paliativo): 0 · No | +1 · Sí

**Fórmula / reglas**

```
Suma de criterios (3 · 3 · 1.5 · 1.5 · 1.5 · 1 · 1). Rango 0–12.5. Tres niveles: < 2 baja, 2–6 moderada, > 6 alta. Dicotómica: ≤ 4 improbable, > 4 probable.
```

**Referencias citadas**

- Wells PS, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. Thromb Haemost. 2000;83(3):416-420. — https://doi.org/10.1055/s-0037-1613830

**Advertencias que muestra la app**

- Orienta la estrategia diagnóstica (dímero D, angiotomografía); no confirma ni descarta por sí sola.
- Herramienta de apoyo: la decisión clínica final es del médico tratante.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Puntajes (3/3/1.5/1.5/1.5/1/1) y cortes: <2, 2–6, >6 y la dicotomía ≤4 / >4.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Child-Pugh (cirrosis)

- **Categoría:** Hepático · **Población:** adulto · **Id:** `child-pugh`

**Entradas que valida la app**

- Bilirrubina total: 0.1–60 mg/dL · unidades: mg/dL / µmol/L
- Albúmina: 1–6 g/dL · unidades: g/dL / g/L
- INR: 0.5–10
- Ascitis: 1 · Ausente | 2 · Leve o controlada con diuréticos | 3 · Moderada a severa o refractaria
- Encefalopatía hepática: 1 · Ninguna | 2 · Grado 1–2 o controlada con medicación | 3 · Grado 3–4 o refractaria

**Fórmula / reglas**

```
Bilirrubina (mg/dL): < 2 → 1 · 2–3 → 2 · > 3 → 3
Albúmina (g/dL): > 3.5 → 1 · 2.8–3.5 → 2 · < 2.8 → 3
INR: < 1.7 → 1 · 1.7–2.3 → 2 · > 2.3 → 3
Ascitis y encefalopatía: 1–3 según gravedad.
Clase A 5–6 · B 7–9 · C 10–15.
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"bili":2.5,"alb":3,"inr":2,"ascitis":2,"enc":2}`
- Resultado de la app: **10 puntos · clase C** · Clase C (10–15)

**Referencias citadas**

- Pugh RNH, et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-649. — https://doi.org/10.1002/bjs.1800600817

**Advertencias que muestra la app**

- Ascitis y encefalopatía son valoraciones clínicas subjetivas. Verificá los puntos de corte con la fuente (pendiente).

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Cortes de bilirrubina (<2 / 2–3 / >3), albúmina (>3.5 / 2.8–3.5 / <2.8), INR (<1.7 / 1.7–2.3 / >2.3) y las clases A 5–6, B 7–9, C 10–15.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### MELD-Na

- **Categoría:** Hepático · **Población:** adulto · **Id:** `meld-na`

**Entradas que valida la app**

- Creatinina: 0.1–20 mg/dL · unidades: mg/dL / µmol/L
- Bilirrubina total: 0.1–60 mg/dL · unidades: mg/dL / µmol/L
- INR: 0.5–10
- Sodio sérico: 100–170 mmol/L · entero
- Diálisis ≥ 2 veces en la última semana: No | Sí

**Fórmula / reglas**

```
MELD = 10 × (0.957·ln(Cr) + 0.378·ln(bili) + 1.120·ln(INR) + 0.643)
Valores < 1 se toman como 1; Cr máx. 4.0 (y 4.0 si hay diálisis).
Si MELD > 11: MELD-Na = MELD + 1.32·(137 − Na) − 0.033·MELD·(137 − Na), con Na entre 125 y 137.
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"cr":2,"bili":3,"inr":1.5,"na":130,"dialisis":0}`
- Resultado de la app: **26 MELD-Na** · MELD: 22 · MELD 22 · MELD-Na 26

**Referencias citadas**

- Kim WR, et al. Hyponatremia and mortality among patients on the liver-transplant waiting list. N Engl J Med. 2008;359(10):1018-1026. — https://doi.org/10.1056/NEJMoa0801209

**Advertencias que muestra la app**

- Es la versión MELD-Na; existe MELD 3.0, que añade sexo y albúmina y se usa en la asignación actual de algunos programas.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Fórmula UNOS 2016: constantes, valores mínimos en 1, Cr máx. 4.0, diálisis, Na acotado 125–137. ¿Se debería ofrecer MELD 3.0?

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### qSOFA

- **Categoría:** Infeccioso · **Población:** adulto · **Id:** `qsofa`

**Entradas que valida la app**

- Alteración del estado mental (Glasgow < 15): 0 · No | +1 · Sí
- Frecuencia respiratoria ≥ 22/min: 0 · No | +1 · Sí
- PA sistólica ≤ 100 mmHg: 0 · No | +1 · Sí

**Fórmula / reglas**

```
Un punto por cada criterio: estado mental alterado, FR ≥ 22, PAS ≤ 100. Rango 0–3.
```

**Referencias citadas**

- Seymour CW, et al. Assessment of clinical criteria for sepsis (Sepsis-3). JAMA. 2016;315(8):762-774. — https://doi.org/10.1001/jama.2016.0288

**Advertencias que muestra la app**

- Es una herramienta de tamizaje, no un diagnóstico de sepsis.
- Herramienta de apoyo: la decisión clínica final es del médico tratante.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Criterios (estado mental, FR ≥22, PAS ≤100) y que ≥2 es positivo.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### SOFA

- **Categoría:** Infeccioso · **Población:** adulto · **Id:** `sofa`

**Entradas que valida la app**

- Respiración: PaO₂/FiO₂ (mmHg): 0 · ≥ 400 | 1 · < 400 | 2 · < 300 | 3 · < 200 con soporte ventilatorio | 4 · < 100 con soporte ventilatorio
- Coagulación: plaquetas (×10³/µL): 0 · ≥ 150 | 1 · < 150 | 2 · < 100 | 3 · < 50 | 4 · < 20
- Hígado: bilirrubina (mg/dL): 0 · < 1.2 | 1 · 1.2–1.9 | 2 · 2.0–5.9 | 3 · 6.0–11.9 | 4 · ≥ 12.0
- Cardiovascular: 0 · PAM ≥ 70 mmHg | 1 · PAM < 70 mmHg | 2 · Dopamina ≤ 5 o dobutamina (cualquier dosis) | 3 · Dopamina > 5, adrenalina ≤ 0.1 o noradrenalina ≤ 0.1 µg/kg/min | 4 · Dopamina > 15, adrenalina > 0.1 o noradrenalina > 0.1 µg/kg/min
- Sistema nervioso: Glasgow: 0 · 15 | 1 · 13–14 | 2 · 10–12 | 3 · 6–9 | 4 · < 6
- Riñón: creatinina (mg/dL) o diuresis: 0 · < 1.2 | 1 · 1.2–1.9 | 2 · 2.0–3.4 | 3 · 3.5–4.9 o diuresis < 500 mL/día | 4 · ≥ 5.0 o diuresis < 200 mL/día

**Fórmula / reglas**

```
Suma de seis sistemas (respiratorio, coagulación, hepático, cardiovascular, neurológico, renal), 0–4 cada uno. Rango 0–24.
```

**Referencias citadas**

- Vincent JL, et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707-710. — https://doi.org/10.1007/BF01709751
- Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810. — https://doi.org/10.1001/jama.2016.0287

**Advertencias que muestra la app**

- Usá los peores valores de las últimas 24 h. El cambio respecto al basal es lo que define disfunción orgánica.
- Herramienta de apoyo: la decisión clínica final es del médico tratante.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Tabla completa de los 6 sistemas.
- [ ] En creatinina y bilirrubina usé "≥ 5.0" y "≥ 12.0" para no dejar huecos; la fuente escribe "> 5.0" y "> 12.0".

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### TFG pediátrica (Schwartz bedside)

- **Categoría:** Renal · **Población:** pediatrico · **Id:** `schwartz-bedside`

**Entradas que valida la app**

- Talla: 40–200 cm · unidades: cm / in
- Creatinina sérica: 0.2–20 mg/dL · unidades: mg/dL / µmol/L

**Fórmula / reglas**

```
TFG (mL/min/1.73 m²) = 0.413 × talla (cm) / creatinina sérica (mg/dL)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"talla":140,"creatinina":1}`
- Resultado de la app: **57.8 mL/min/1.73 m²**

**Referencias citadas**

- Schwartz GJ, et al. New equations to estimate GFR in children with CKD. J Am Soc Nephrol. 2009;20(3):629-637. — https://doi.org/10.1681/ASN.2008030287

**Advertencias que muestra la app**

- Para niños con enfermedad renal crónica estable. Requiere creatinina medida con método estandarizado (IDMS).
- No usar en recién nacidos ni en lesión renal aguda.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Constante 0.413 y que aplica a niños con ERC estable.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Parkland (reanimación del gran quemado)

- **Categoría:** Líquidos y goteo · **Población:** todos · **Id:** `parkland`

**Entradas que valida la app**

- Peso: 3–300 kg · unidades: kg / lb
- Superficie corporal quemada (quemaduras de 2.º y 3.er grado): 1–100 %

**Fórmula / reglas**

```
Total 24 h (mL) = 4 mL × peso (kg) × % de superficie corporal quemada
Mitad en las primeras 8 h (contadas desde la hora de la quemadura) y mitad en las 16 h siguientes.
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"peso":70,"sct":20}`
- Resultado de la app: **5600 mL en 24 h** · Primeras 8 h: 2800 mL (350.0 mL/h) · Siguientes 16 h: 2800 mL (175.0 mL/h)

**Referencias citadas**

- Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci. 1968;150(3):874-894. — https://doi.org/10.1111/j.1749-6632.1968.tb14738.x

**Advertencias que muestra la app**

- Es una estimación inicial con solución cristaloide: ajustá según la diuresis y la respuesta clínica.
- Si ya pasó tiempo desde la quemadura, las primeras 8 h se cuentan desde ese momento, no desde la llegada.
- En niños se suma el líquido de mantenimiento; verificá el protocolo.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] 4 mL × kg × %SCQ y reparto 8 h / 16 h; advertencias sobre niños y hora de la quemadura.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Anion gap (brecha aniónica)

- **Categoría:** Laboratorio · **Población:** todos · **Id:** `anion-gap`

**Entradas que valida la app**

- Sodio: 90–190 mmol/L
- Cloro: 60–150 mmol/L
- Bicarbonato: 2–60 mmol/L
- Albúmina (opcional, para corregir) (opcional): 0.5–6 g/dL · unidades: g/dL / g/L

**Fórmula / reglas**

```
Anion gap = Na − (Cl + HCO₃)
Corregido = AG + 2.5 × (4.0 − albúmina en g/dL)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"na":140,"cl":104,"hco3":24,"alb":2}`
- Resultado de la app: **12.0 mmol/L** · Corregido por albúmina: 17.0 mmol/L

**Referencias citadas**

- Emmett M, Narins RG. Clinical use of the anion gap. Medicine (Baltimore). 1977;56(1):38-54. — https://doi.org/10.1097/00005792-197756010-00002
- TODO(fuente): verificar el factor 2.5 de la corrección por albúmina con una referencia.

**Advertencias que muestra la app**

- El rango de referencia depende del laboratorio: compará con el del tuyo.
- No incluye potasio.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Corrección por albúmina (+2.5 por cada g/dL bajo 4.0): factor pendiente de fuente.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Sodio corregido por glucosa

- **Categoría:** Laboratorio · **Población:** todos · **Id:** `sodio-corregido`

**Entradas que valida la app**

- Sodio medido: 90–190 mmol/L
- Glucosa: 20–2000 mg/dL · unidades: mg/dL / mmol/L
- Factor de corrección: 1.6 mmol/L por cada 100 mg/dL (clásico) | 2.4 mmol/L por cada 100 mg/dL

**Fórmula / reglas**

```
Na corregido = Na medido + factor × (glucosa − 100) / 100   (glucosa en mg/dL; factor 1.6 o 2.4)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"na":130,"glucosa":400,"factor":1.6}`
- Resultado de la app: **134.8 mmol/L**

**Referencias citadas**

- Katz MA. Hyperglycemia-induced hyponatremia — calculation of expected serum sodium depression. N Engl J Med. 1973;289(16):843-844. — https://doi.org/10.1056/NEJM197310182891607
- Hillier TA, et al. Hyperglycemia and hyponatremia: the corrected sodium. Am J Med. 1999;106(4):399-403.

**Advertencias que muestra la app**

- Ambos factores se usan en la práctica; confirmá cuál usa tu protocolo.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Factores 1.6 y 2.4 por cada 100 mg/dL de glucosa sobre 100: ¿cuál debe ser el predeterminado?

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Calcio corregido por albúmina

- **Categoría:** Laboratorio · **Población:** todos · **Id:** `calcio-corregido`

**Entradas que valida la app**

- Calcio total: 3–20 mg/dL · unidades: mg/dL / mmol/L
- Albúmina: 0.5–6 g/dL · unidades: g/dL / g/L

**Fórmula / reglas**

```
Ca corregido (mg/dL) = Ca total + 0.8 × (4.0 − albúmina en g/dL)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"ca":8,"alb":2.5}`
- Resultado de la app: **9.2 mg/dL**

**Referencias citadas**

- Payne RB, et al. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-646. — https://doi.org/10.1136/bmj.4.5893.643

**Advertencias que muestra la app**

- No sustituye la medición de calcio iónico, sobre todo en pacientes críticos.
- El rango de referencia depende del laboratorio: compará con el del tuyo.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Factor 0.8 mg/dL por cada g/dL de albúmina bajo 4.0.

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Osmolaridad sérica calculada

- **Categoría:** Laboratorio · **Población:** todos · **Id:** `osmolaridad`

**Entradas que valida la app**

- Sodio: 90–190 mmol/L
- Glucosa: 20–2000 mg/dL · unidades: mg/dL / mmol/L
- Nitrógeno ureico (BUN): 1–300 mg/dL
- Osmolalidad medida (opcional, para la brecha) (opcional): 150–600 mOsm/kg

**Fórmula / reglas**

```
Osm calculada = 2 × Na + glucosa (mg/dL) / 18 + BUN (mg/dL) / 2.8
Brecha osmolar = osm medida − osm calculada
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"na":140,"glucosa":90,"bun":14}`
- Resultado de la app: **290.0 mOsm/kg**

**Referencias citadas**

- Fórmula estándar. TODO(fuente): citar una referencia verificable.

**Advertencias que muestra la app**

- El rango de referencia depende del laboratorio: compará con el del tuyo.
- No incluye etanol ni otros osmoles.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Fórmula 2·Na + glucosa/18 + BUN/2.8 y la brecha osmolar. Fuente pendiente: TODO(fuente).

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Balance hídrico

- **Categoría:** Líquidos y goteo · **Población:** todos · **Id:** `balance-hidrico`

**Entradas que valida la app**

- Ingreso oral: 0–50000 mL
- Ingreso parenteral: 0–50000 mL
- Otros ingresos: 0–50000 mL
- Diuresis: 0–50000 mL
- Drenajes: 0–50000 mL
- Vómitos, deposiciones y otros egresos: 0–50000 mL
- Pérdidas insensibles (opcional) (opcional): 0–50000 mL
- Horas del período (opcional) (opcional): 0.5–72 h
- Peso (opcional) (opcional): 0.3–400 kg · unidades: kg / lb

**Fórmula / reglas**

```
Balance = ingresos − egresos (mL)
Diuresis (mL/kg/h) = diuresis / peso / horas del período
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"oral":1000,"parenteral":1000,"otrosIngresos":0,"diuresis":1000,"drenajes":300,"otrosEgresos":200,"insensibles":500}`
- Resultado de la app: **0 mL** · Ingresos: 2000 mL · Egresos: 2000 mL · Balance neutro

**Referencias citadas**

- Cálculo aritmético; no requiere referencia bibliográfica.

**Advertencias que muestra la app**

- El balance depende de que los registros estén completos y del período elegido.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] ¿Es útil mostrar la diuresis en mL/kg/h sin umbrales de oliguria? (no se inventaron cortes).

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Conversión de unidades de laboratorio

- **Categoría:** Laboratorio · **Población:** todos · **Id:** `conversion-unidades`

**Entradas que valida la app**

- Conversión: Glucosa: mg/dL → mmol/L | Glucosa: mmol/L → mg/dL | Creatinina: mg/dL → µmol/L | Creatinina: µmol/L → mg/dL | Colesterol: mg/dL → mmol/L | Colesterol: mmol/L → mg/dL | BUN → urea (mg/dL) | Urea → BUN (mg/dL) | BUN (mg/dL) → urea (mmol/L) | Urea (mmol/L) → BUN (mg/dL)
- Valor: 0–100000

**Fórmula / reglas**

```
Glucosa: 1 mmol/L = 18.016 mg/dL · Creatinina: 1 mg/dL = 88.4 µmol/L · Colesterol: 1 mmol/L = 38.67 mg/dL
Urea (mg/dL) = BUN × 60/28 · Urea (mmol/L) = BUN (mg/dL) / 2.8
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"conversion":"cr-mgdl-umol","valor":1}`
- Resultado de la app: **88 µmol/L**

**Referencias citadas**

- Factores de conversión estándar (SI). TODO(fuente): citar una tabla de referencia verificable.

**Advertencias que muestra la app**

- El colesterol aplica a total, LDL y HDL; los triglicéridos usan otro factor (no incluido).

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Factores 18.016 (glucosa), 88.4 (creatinina), 38.67 (colesterol), 2.8 (BUN → urea mmol/L), 60/28 (BUN → urea mg/dL).

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---

### Peso ideal (Devine) y peso ajustado

- **Categoría:** Antropometría · **Población:** adulto · **Id:** `peso-ideal`

**Entradas que valida la app**

- Sexo: Mujer | Hombre
- Talla: 152.4–230 cm · unidades: cm / in
- Peso real (opcional, para el ajustado) (opcional): 20–500 kg · unidades: kg / lb

**Fórmula / reglas**

```
Peso ideal (kg) = 50 (hombre) o 45.5 (mujer) + 2.3 × (talla en pulgadas − 60)
Peso ajustado = ideal + 0.4 × (peso real − ideal)
```

**Ejemplo para comprobar a mano**

- Entradas (unidades base): `{"sexo":"m","talla":175,"peso":100}`
- Resultado de la app: **70.5 kg (ideal)** · Peso ajustado: 82.3 kg · Peso real: 142 % del ideal

**Referencias citadas**

- Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974;8:650-655.
- TODO(fuente): el factor 0.4 del peso ajustado varía según la fuente (0.25–0.4); verificar el que usa tu institución.

**Advertencias que muestra la app**

- No usar con tallas menores a 152.4 cm: la fórmula extrapola.
- Qué peso usar (real, ideal o ajustado) depende del fármaco; verificá la ficha.

**Confirmar (marque cada punto)**

- [ ] La fórmula / los puntajes coinciden con la publicación citada.
- [ ] Los puntos de corte y los textos de interpretación son correctos y no inducen a error.
- [ ] Unidades por defecto y rangos válidos razonables para El Salvador.
- [ ] Las advertencias son suficientes (población, límites de uso).
- [ ] Factor 0.4 del peso ajustado (la literatura va de 0.25 a 0.4): ¿cuál usa su institución?

**Veredicto:** ☐ Aprobada · ☐ Aprobada con cambios · ☐ Rechazada

**Cambios pedidos / comentarios:** 

---
