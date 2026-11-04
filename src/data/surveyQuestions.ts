import { QuestionDefinition, SurveyFormValues, SurveySubmission } from '../types/survey';

export const ATTACHED_CSV_PATH = '/assets/aistudio/GELEN_ZAMBRANO___Respuestas__aacb4f47';

export const FALLBACK_RAW_CSV = `Marca temporal,¿Cómo califica su satisfacción con el uso del equipo F3?,Columna 1,Columna 2,Columna 3,Columna 4,Columna 5,Columna 6,Columna 7,Columna 8
27/10/2026 20:22:24,3,,,,,,,,
27/10/2026 20:22:30,5,,,,,,,,
27/10/2026 21:04:32,Aprendiz,Semanalmente,Bueno,Inestable,Aceptable,Bueno,Excelente,Muy Fácil / Ágil,4`;

export const ROOM_OPTIONS = [
  'Sala de Sistemas F3',
  'Ambiente ADSO / Desarrollo de Software',
  'Biblioteca y Consulta Digital',
  'Laboratorio TIC Agropecuario',
  'Sala de Bilingüismo',
  'Otro ambiente computacional',
];

export const SURVEY_QUESTIONS: QuestionDefinition[] = [
  {
    number: '01',
    field: 'rol_usuario',
    shortHeader: '1. Rol en el Centro',
    title: '¿Cuál es su rol o vínculo actual en el Centro Agropecuario de Buga?',
    description: 'Seleccione el perfil con el que hace uso de los recursos informáticos del centro.',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Aprendiz', label: 'Aprendiz', helper: 'Formación titulada o complementaria' },
      { value: 'Instructor', label: 'Instructor', helper: 'Orientación académica y práctica' },
      { value: 'Administrativo', label: 'Administrativo', helper: 'Gestión institucional y apoyo' },
      { value: 'Investigador SENNOVA', label: 'Investigador SENNOVA', helper: 'Proyectos aplicados e innovación' },
      { value: 'Visitante / Externo', label: 'Visitante / Externo', helper: 'Eventos o extensión agropecuaria' },
    ],
  },
  {
    number: '02',
    field: 'frecuencia_uso',
    shortHeader: '2. Frecuencia de uso',
    title: '¿Con qué frecuencia utiliza las áreas computacionales del centro?',
    description: 'Indique la regularidad habitual con la que ingresa a las salas de sistemas.',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Diariamente', label: 'Diariamente', helper: '4 a 6 días por semana' },
      { value: 'Semanalmente', label: 'Semanalmente', helper: '1 a 3 sesiones por semana' },
      { value: 'Quincenalmente', label: 'Quincenalmente', helper: 'Cada dos semanas' },
      { value: 'Mensualmente', label: 'Mensualmente', helper: 'Al menos una vez al mes' },
      { value: 'Ocasionalmente', label: 'Ocasionalmente', helper: 'Uso puntual o primera vez' },
    ],
  },
  {
    number: '03',
    field: 'estado_equipos',
    shortHeader: '3. Estado de equipos',
    title: '¿Cómo califica el estado físico y rendimiento de los equipos de cómputo?',
    description: 'Evalúe velocidad de arranque, monitores, teclados, mouse y funcionamiento general (incluyendo Sala F3).',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Excelente', label: 'Excelente' },
      { value: 'Bueno', label: 'Bueno' },
      { value: 'Aceptable', label: 'Aceptable' },
      { value: 'Regular', label: 'Regular' },
      { value: 'Deficiente', label: 'Deficiente' },
    ],
  },
  {
    number: '04',
    field: 'conectividad_red',
    shortHeader: '4. Conectividad Internet',
    title: '¿Cómo evalúa la estabilidad y velocidad de la conexión a Internet en las salas?',
    description: 'Considere tanto la red cableada de los equipos de escritorio como la cobertura Wi-Fi institucional.',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Estable / Rápida', label: 'Estable / Rápida' },
      { value: 'Buena', label: 'Buena' },
      { value: 'Aceptable', label: 'Aceptable' },
      { value: 'Inestable', label: 'Inestable' },
      { value: 'Sin conexión', label: 'Sin conexión' },
    ],
  },
  {
    number: '05',
    field: 'software_instalado',
    shortHeader: '5. Software disponible',
    title: '¿Cómo califica la disponibilidad y actualización del software instalado?',
    description: 'Herramientas ofimáticas, entornos de programación, software agropecuario, diseño y navegadores.',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Excelente', label: 'Excelente' },
      { value: 'Bueno', label: 'Bueno' },
      { value: 'Aceptable', label: 'Aceptable' },
      { value: 'Desactualizado', label: 'Desactualizado' },
      { value: 'Insuficiente', label: 'Insuficiente' },
    ],
  },
  {
    number: '06',
    field: 'ambiente_fisico',
    shortHeader: '6. Ambiente físico',
    title: '¿Cómo califica las condiciones físicas y ergonómicas del aula computacional?',
    description: 'Iluminación, ventilación o aire acondicionado, aseo, sillas, mesas de trabajo y tomacorrientes.',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Excelente', label: 'Excelente' },
      { value: 'Bueno', label: 'Bueno' },
      { value: 'Aceptable', label: 'Aceptable' },
      { value: 'Regular', label: 'Regular' },
      { value: 'Deficiente', label: 'Deficiente' },
    ],
  },
  {
    number: '07',
    field: 'soporte_atencion',
    shortHeader: '7. Soporte técnico',
    title: '¿Cómo evalúa la atención y el soporte técnico del personal encargado?',
    description: 'Disposición de ayuda, tiempos de respuesta ante fallas en equipos y acompañamiento en sala.',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Excelente', label: 'Excelente' },
      { value: 'Bueno', label: 'Bueno' },
      { value: 'Aceptable', label: 'Aceptable' },
      { value: 'Regular', label: 'Regular' },
      { value: 'Deficiente', label: 'Deficiente' },
    ],
  },
  {
    number: '08',
    field: 'acceso_prestamo',
    shortHeader: '8. Facilidad de acceso',
    title: '¿Qué tan ágil resulta el proceso de asignación, ingreso o préstamo de salas?',
    description: 'Disponibilidad de horarios, registro de entrada y facilidad para reservar o utilizar un equipo.',
    type: 'radio_grid',
    required: true,
    options: [
      { value: 'Muy Fácil / Ágil', label: 'Muy Fácil / Ágil' },
      { value: 'Fácil', label: 'Fácil' },
      { value: 'Aceptable', label: 'Aceptable' },
      { value: 'Lento / Complejo', label: 'Lento / Complejo' },
      { value: 'Muy Difícil', label: 'Muy Difícil' },
    ],
  },
  {
    number: '09',
    field: 'satisfaccion_general',
    shortHeader: '9. Satisfacción (1-5)',
    title: '¿Cuál es su calificación general de satisfacción con las áreas computacionales?',
    description: 'Seleccione en escala numérica de 1 (Muy insatisfecho) a 5 (Totalmente satisfecho).',
    type: 'scale_1_5',
    required: true,
  },
  {
    number: '10',
    field: 'sala_utilizada',
    shortHeader: '10. Sala y sugerencias',
    title: '¿Qué área computacional utilizó principalmente y qué aspecto sugiere mejorar?',
    description: 'Seleccione el ambiente principal evaluado y agregue opcionalmente observaciones para el Centro Agropecuario de Buga.',
    type: 'room_and_notes',
    required: true,
  },
];

export const INITIAL_FORM_VALUES: SurveyFormValues = {
  rol_usuario: '',
  frecuencia_uso: '',
  estado_equipos: '',
  conectividad_red: '',
  software_instalado: '',
  ambiente_fisico: '',
  soporte_atencion: '',
  acceso_prestamo: '',
  satisfaccion_general: '',
  sala_utilizada: 'Sala de Sistemas F3',
  sugerencias: '',
};

export function formatColombiaTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseAttachedCsvToSubmissions(csvText: string): SurveySubmission[] {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const dataRows = lines.slice(1);
  return dataRows.map((rowText, index) => {
    const cols = splitCsvLine(rowText);
    const timestamp = cols[0] || formatColombiaTimestamp();
    const col1 = cols[1] || '';
    const hasExtendedColumns = cols.slice(2).some((val) => val.length > 0);

    // En el archivo adjunto, las filas 1 y 2 registraron una calificación numérica (3 y 5) para Equipo F3,
    // mientras que la fila 3 registró la encuesta completa de 9 respuestas.
    if (!hasExtendedColumns && /^[1-5]$/.test(col1)) {
      return {
        id: `csv-row-${index + 1}`,
        timestamp,
        rol_usuario: 'Aprendiz',
        frecuencia_uso: 'Sin especificar (prueba inicial F3)',
        estado_equipos: Number(col1) >= 4 ? 'Bueno' : 'Aceptable',
        conectividad_red: 'Sin dato',
        software_instalado: 'Sin dato',
        ambiente_fisico: 'Sin dato',
        soporte_atencion: 'Sin dato',
        acceso_prestamo: 'Sin dato',
        satisfaccion_general: col1,
        sala_utilizada: 'Sala de Sistemas F3',
        sugerencias: 'Registro inicial de calificación directa Equipo F3',
        source: 'csv_inicial',
        syncedToSheets: true,
        legacyNote: 'Prueba inicial de 1 pregunta (Equipo F3)',
      };
    }

    return {
      id: `csv-row-${index + 1}`,
      timestamp,
      rol_usuario: cols[1] || 'Aprendiz',
      frecuencia_uso: cols[2] || 'Semanalmente',
      estado_equipos: cols[3] || 'Bueno',
      conectividad_red: cols[4] || 'Aceptable',
      software_instalado: cols[5] || 'Aceptable',
      ambiente_fisico: cols[6] || 'Bueno',
      soporte_atencion: cols[7] || 'Excelente',
      acceso_prestamo: cols[8] || 'Muy Fácil / Ágil',
      satisfaccion_general: cols[9] || '4',
      sala_utilizada: cols[10] || 'Sala de Sistemas F3',
      sugerencias: cols[11] || '',
      source: 'csv_inicial',
      syncedToSheets: true,
    };
  });
}
