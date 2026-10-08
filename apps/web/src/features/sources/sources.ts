/** Fuentes de los listados de medicamentos. Mantener alineado con data/sources/fuentes.md y con las instituciones del catálogo. */
export interface Source {
  id: string;
  name: string;
  list: string;
  edition: string;
  date: string;
  url: string;
  urlLabel: string;
  license: string;
  processing: string;
  caveats: string[];
}

export const sources: Source[] = [
  {
    id: 'minsal',
    name: 'Ministerio de Salud de El Salvador (MINSAL)',
    list: 'Listado Oficial de Medicamentos (LOM/MINSAL)',
    edition: '2026 (Acuerdo n.º 1201)',
    date: '14 de mayo de 2026',
    url: 'https://asp.salud.gob.sv/regulacion/default.asp',
    urlLabel: 'Regulación del MINSAL',
    license: 'El documento permite su reproducción citando la fuente y sin fines de venta ni comerciales, y sin dar a entender respaldo del Ministerio.',
    processing: 'Extraído por software de las tablas del PDF oficial (código SINAB, ATC, nivel de uso, prioridad y regulación de prescripción).',
    caveats: [
      'Cerca del 9 % de las filas (vacunas, kits, mezclas) no se pudieron separar con seguridad: se muestran con la descripción oficial completa.',
      'El PDF repite el código SINAB 02301010 para dos insulinas distintas; se conservaron ambas.',
      'La nota al pie «*(n)» del documento no se muestra porque el PDF no incluye su explicación.',
    ],
  },
  {
    id: 'isss',
    name: 'Instituto Salvadoreño del Seguro Social (ISSS)',
    list: 'Listado Oficial de Medicamentos (LOM/ISSS)',
    edition: '19.ª edición',
    date: '29 de octubre de 2024',
    url: 'https://www.transparencia.gob.sv/descarga_archivo.php?id=NjA2NTM4&inst=606538',
    urlLabel: 'Portal de transparencia',
    license: 'Versión pública publicada en el portal de transparencia del Estado. El documento no trae una cláusula de licencia visible: se cita la fuente y se aclara que MedHelp no es una publicación oficial ni cuenta con respaldo del ISSS.',
    processing: 'Extraído por software de las tablas del PDF oficial (código ISSS, concentración, forma, presentación, nivel de prescripción, prioridad, clave de despacho y notas).',
    caveats: [
      'Se une a un medicamento de otra institución solo si coinciden principio activo, concentración y vía. Por eso un mismo medicamento puede aparecer como dos fichas si los listados lo nombran distinto.',
      'La cantidad a dispensar por receta no se muestra.',
    ],
  },
  {
    id: 'fosalud',
    name: 'Fondo Solidario para la Salud (FOSALUD)',
    list: 'Listado Institucional de Medicamentos (LIM-FOSALUD)',
    edition: '2.ª edición',
    date: '2019',
    url: 'https://www.transparencia.gob.sv/descarga_archivo.php?id=MzQ3MDM4&inst=347038',
    urlLabel: 'Portal de transparencia',
    license: 'El documento permite su reproducción citando la fuente y sin fines de venta ni comerciales.',
    processing: 'El PDF es un escaneo: se leyó con reconocimiento óptico de caracteres (OCR) y se asoció a los medicamentos de MINSAL por código SINAB, nombre y concentración.',
    caveats: [
      'Es una edición de 2019: puede estar desactualizada.',
      'Solo se muestran los medicamentos que se pudieron comprobar contra MINSAL; el resto no se publica hasta transcribirlo a mano.',
      'Se muestra únicamente el código, el nivel de uso y la regulación, esta última leída por OCR y sin verificar.',
    ],
  },
];
