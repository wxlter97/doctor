# Licencia de uso de datos de CIMA / AEMPS (§14.1)

## Lo que se encontró (2026-10-05)

- **Datos abiertos de AEMPS** (https://sede.aemps.gob.es/datos-abiertos/): incluye «CIMA — Nomenclátor y Servicios REST». Declara que son datos que «cualquiera es libre de utilizar, reutilizar y redistribuir, con el único límite, en su caso, del requisito de atribución de su fuente o reconocimiento de su autoría».
- **Aviso legal de AEMPS** (https://www.aemps.gob.es/avisoLegal/): autoriza la reproducción total o parcial de los contenidos citando expresamente el origen y **mencionando la fecha de la última actualización** de los documentos reutilizados.
- Marco legal: Ley 37/2007 sobre reutilización de la información del sector público y RD 1591/2009.
- **Lo que no aparece escrito:** una licencia concreta (CC-BY u otra), una declaración expresa sobre uso comercial, ni nada específico sobre el texto de las **fichas técnicas** (que redactan los laboratorios y autoriza AEMPS). La documentación de la API (`CIMA_REST_API.pdf`) no contiene cláusula de licencia ni límites de peticiones.

## Conclusión práctica

Se puede usar CIMA con atribución y fecha de actualización sin pedir permiso. Para una app **pública y de uso profesional** conviene tener la confirmación **por escrito**, sobre todo para el texto de las fichas técnicas. Es una consulta de un correo, sin costo.

## Cómo obtener la confirmación

1. Escribir a AEMPS. El único contacto que figura en el aviso legal es el delegado de protección de datos (`delegado_protecciondatos@aemps.es`), que puede reenviarlo; también existe el formulario de consultas de la sede electrónica (https://sede.aemps.gob.es). Dirección postal: C/ Campezo n.º 1, 28022 Madrid.
2. Pedir una respuesta que diga explícitamente: (a) que la reutilización de CIMA, incluido el texto de las fichas técnicas, está permitida con atribución; (b) si cubre uso desde fuera de España; (c) si hay límite de peticiones; (d) la fórmula de atribución que prefieren.
3. Guardar la respuesta en `data/sources/` (fuera de git si trae datos personales) y citarla en la página de fuentes de la app.

## Borrador del correo (sin enviar)

> **Asunto:** Consulta sobre reutilización de datos de CIMA (fichas técnicas) en una aplicación gratuita
>
> Buenos días:
>
> Soy Walter Castillo, desarrollador en El Salvador. Estoy construyendo una aplicación web gratuita (MedHelp), sin anuncios ni recolección de datos, de apoyo a médicos, que mostraría —con atribución a AEMPS/CIMA y la fecha de la última actualización— secciones de las fichas técnicas (indicaciones, posología, contraindicaciones, advertencias, interacciones, embarazo y lactancia) obtenidas del servicio REST de CIMA.
>
> Según la página de datos abiertos de AEMPS, estos datos pueden reutilizarse citando la fuente. Les agradecería que me confirmaran por escrito:
> 1. Que esta reutilización, incluido el texto de las fichas técnicas, está permitida con atribución.
> 2. Si la autorización cubre su uso desde fuera de España.
> 3. Si existen límites de peticiones al servicio REST, y si recomiendan descargar y conservar una copia local.
> 4. La fórmula de atribución que prefieren.
>
> La aplicación advertirá a los usuarios que la información corresponde a la ficha técnica autorizada en España y puede diferir del producto registrado en El Salvador.
>
> Muchas gracias.
> Walter Castillo · wxlter.dev
