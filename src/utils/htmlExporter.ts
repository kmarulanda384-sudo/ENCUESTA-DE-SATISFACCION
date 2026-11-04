import { SURVEY_QUESTIONS, ROOM_OPTIONS } from '../data/surveyQuestions';
import { SheetConfig, SurveyFormValues, SurveySubmission } from '../types/survey';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsSingleQuotes(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export async function sendSubmissionToGoogleSheets(
  values: SurveyFormValues,
  timestamp: string,
  config: SheetConfig
): Promise<{ sent: boolean; mode: 'remote' | 'local_only'; message: string }> {
  const cleanUrl = config.scriptUrl.trim();
  if (!cleanUrl) {
    return {
      sent: false,
      mode: 'local_only',
      message: 'Guardado localmente. Configure la URL de Apps Script en "Código HTML" para enviar también en vivo a Google Sheets.',
    };
  }

  const salaYSugerencias = values.sugerencias.trim()
    ? `${values.sala_utilizada} — ${values.sugerencias.trim()}`
    : values.sala_utilizada;

  const params = new URLSearchParams();
  params.append('sheetName', config.sheetName.trim() || 'Respuestas');
  params.append('timestamp', timestamp);
  params.append('rol_usuario', values.rol_usuario);
  params.append('frecuencia_uso', values.frecuencia_uso);
  params.append('estado_equipos', values.estado_equipos);
  params.append('conectividad_red', values.conectividad_red);
  params.append('software_instalado', values.software_instalado);
  params.append('ambiente_fisico', values.ambiente_fisico);
  params.append('soporte_atencion', values.soporte_atencion);
  params.append('acceso_prestamo', values.acceso_prestamo);
  params.append('satisfaccion_general', values.satisfaccion_general);
  params.append('sala_utilizada', values.sala_utilizada);
  params.append('sugerencias', values.sugerencias.trim());
  params.append('sala_y_sugerencias', salaYSugerencias);

  await fetch(cleanUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: params.toString(),
  });

  return {
    sent: true,
    mode: 'remote',
    message: `Enviado correctamente a la hoja "${config.sheetName.trim() || 'Respuestas'}" en Google Sheets.`,
  };
}

export function generateAppsScriptCode(config: SheetConfig): string {
  const targetSheet = escapeJsSingleQuotes(config.sheetName.trim() || 'Respuestas');
  const docTitle = escapeJsSingleQuotes(config.spreadsheetName.trim() || 'GELEN ZAMBRANO (Respuestas)');

  return `/**
 * Google Apps Script — Receptor de Encuesta de Satisfacción (10 preguntas)
 * Centro Agropecuario de Buga (SENA) — Uso de Áreas Computacionales
 * Libro sugerido: "${docTitle}"
 * Página / pestaña destino por defecto: "${targetSheet}"
 *
 * INSTRUCCIONES:
 * 1. Abra su hoja de cálculo de Google y vaya a Extensiones > Apps Script.
 * 2. Pegue este código reemplazando el contenido actual y guarde (Ctrl+S).
 * 3. Haga clic en "Implementar" > "Nueva implementación" > Tipo: "Aplicación web".
 * 4. Ejecutar como: "Yo" | Quién tiene acceso: "Cualquier persona".
 * 5. Copie la URL generada (.../exec) y péguela en el formulario HTML.
 */

const DEFAULT_SHEET_NAME = '${targetSheet}';

const HEADERS = [
  'Marca temporal',
  '1. Rol en el Centro',
  '2. Frecuencia de uso',
  '3. Estado de equipos (incl. Sala F3)',
  '4. Conectividad a Internet',
  '5. Software disponible',
  '6. Ambiente físico y ergonomía',
  '7. Atención y soporte técnico',
  '8. Agilidad de acceso / préstamo',
  '9. Satisfacción general (1-5)',
  '10. Sala utilizada y sugerencias'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const params = (e && e.parameter) ? e.parameter : {};
    const sheetName = (params.sheetName || DEFAULT_SHEET_NAME).trim();

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Si la pestaña está vacía o tenía columnas sin título ("Columna 1..."), escribe los encabezados
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    } else {
      const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
      if (!currentHeaders[2] || String(currentHeaders[2]).indexOf('Columna') === 0) {
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
      }
    }

    const timestamp = Utilities.formatDate(new Date(), 'America/Bogota', 'dd/MM/yyyy HH:mm:ss');
    const salaDetalle = params.sala_y_sugerencias ||
      (params.sugerencias
        ? (params.sala_utilizada || 'Sala de Sistemas F3') + ' — ' + params.sugerencias
        : (params.sala_utilizada || 'Sala de Sistemas F3'));

    sheet.appendRow([
      timestamp,
      params.rol_usuario || '',
      params.frecuencia_uso || '',
      params.estado_equipos || '',
      params.conectividad_red || '',
      params.software_instalado || '',
      params.ambiente_fisico || '',
      params.soporte_atencion || '',
      params.acceso_prestamo || '',
      params.satisfaccion_general || '',
      salaDetalle
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, sheet: sheetName, timestamp: timestamp }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;
}

export function generateStandaloneHtml(config: SheetConfig): string {
  const sheetName = config.sheetName.trim() || 'Respuestas';
  const spreadsheetName = config.spreadsheetName.trim() || 'GELEN ZAMBRANO (Respuestas)';
  const scriptUrl = config.scriptUrl.trim() || 'PEGA_AQUI_TU_URL_DE_GOOGLE_APPS_SCRIPT_EXEC';

  const radioQuestionsHtml = SURVEY_QUESTIONS.filter((q) => q.type === 'radio_grid')
    .map((q) => {
      const optionsHtml = (q.options || [])
        .map(
          (opt) => `            <label class="option-card">
              <input type="radio" name="${q.field}" value="${escapeHtml(opt.value)}" required />
              <span>${escapeHtml(opt.label)}</span>
            </label>`
        )
        .join('\n');

      return `        <fieldset class="question-block">
          <legend class="question-title"><span class="q-num">${q.number}.</span> ${escapeHtml(q.title)}</legend>
          <p class="question-desc">${escapeHtml(q.description)}</p>
          <div class="options-grid">
${optionsHtml}
          </div>
        </fieldset>`;
    })
    .join('\n\n');

  const roomOptionsHtml = ROOM_OPTIONS.map(
    (room) => `              <option value="${escapeHtml(room)}">${escapeHtml(room)}</option>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Encuesta de Satisfacción — Áreas Computacionales | Centro Agropecuario de Buga</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@600;700&family=Public+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --text: #0f172a;
      --muted: #475569;
      --border: #e2e8f0;
      --accent: #15803d;
      --accent-hover: #166534;
      --accent-soft: #f0fdf4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Public Sans', system-ui, -apple-system, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem 4rem;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 1.75rem;
    }
    .kicker {
      font-size: 0.8125rem;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
    h1 {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: clamp(1.6rem, 3vw, 2.25rem);
      line-height: 1.2;
      margin-bottom: 0.65rem;
      text-wrap: balance;
    }
    .subtitle {
      color: var(--muted);
      font-size: 0.95rem;
    }
    .survey-surface {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
    }
    .question-block {
      border: none;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--border);
    }
    .question-block:first-of-type { padding-top: 0; }
    .question-block:last-of-type { border-bottom: none; padding-bottom: 0.5rem; }
    .question-title {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-weight: 600;
      font-size: 1.02rem;
      margin-bottom: 0.25rem;
      display: block;
    }
    .q-num {
      font-family: 'IBM Plex Mono', monospace;
      color: var(--accent);
      margin-right: 0.35rem;
    }
    .question-desc {
      font-size: 0.875rem;
      color: var(--muted);
      margin-bottom: 0.9rem;
    }
    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.6rem;
    }
    .option-card {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      min-height: 44px;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: border-color 150ms ease, background-color 150ms ease;
    }
    .option-card:hover {
      border-color: #94a3b8;
      background-color: #f8fafc;
    }
    .option-card:has(input:checked) {
      border-color: var(--accent);
      background-color: var(--accent-soft);
      font-weight: 500;
    }
    .option-card input {
      accent-color: var(--accent);
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .scale-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.6rem;
    }
    .scale-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 56px;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 500;
      transition: border-color 150ms ease, background-color 150ms ease;
    }
    .scale-item input { display: none; }
    .scale-item:hover { border-color: #94a3b8; }
    .scale-item:has(input:checked) {
      border-color: var(--accent);
      background-color: var(--accent);
      color: #ffffff;
    }
    .scale-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--muted);
      margin-top: 0.4rem;
    }
    select, textarea {
      width: 100%;
      font-family: inherit;
      font-size: 0.925rem;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #ffffff;
      color: var(--text);
    }
    select:focus, textarea:focus {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
      border-color: var(--accent);
    }
    .field-stack {
      display: grid;
      gap: 0.75rem;
    }
    .actions {
      margin-top: 1.75rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .btn-submit {
      background-color: var(--accent);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 44px;
      transition: background-color 150ms ease;
    }
    .btn-submit:hover { background-color: var(--accent-hover); }
    .btn-submit:disabled { opacity: 0.65; cursor: wait; }
    .btn-reset {
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1.15rem;
      font-size: 0.9rem;
      cursor: pointer;
      min-height: 44px;
    }
    .status-box {
      display: none;
      margin-top: 1.25rem;
      padding: 1rem 1.15rem;
      border-radius: 8px;
      font-size: 0.9rem;
      border: 1px solid var(--border);
    }
    .status-box.ok {
      display: block;
      background-color: #f0fdf4;
      border-color: #86efac;
      color: #14532d;
    }
    .status-box.err {
      display: block;
      background-color: #fef2f2;
      border-color: #fecaca;
      color: #7f1d1d;
    }
    footer {
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: var(--muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <main class="container">
    <header class="header">
      <p class="kicker">SENA Regional Valle · Centro Agropecuario de Buga · Libro: ${escapeHtml(spreadsheetName)} · Página: ${escapeHtml(sheetName)}</p>
      <h1>Encuesta de satisfacción sobre el uso de las áreas computacionales</h1>
      <p class="subtitle">Sus respuestas permiten fortalecer el estado de los equipos, la conectividad y el soporte técnico en los ambientes de formación.</p>
    </header>

    <section class="survey-surface">
      <form id="cabSurveyForm">
        <input type="hidden" name="sheetName" value="${escapeHtml(sheetName)}" />

${radioQuestionsHtml}

        <fieldset class="question-block">
          <legend class="question-title"><span class="q-num">09.</span> ¿Cuál es su calificación general de satisfacción con las áreas computacionales?</legend>
          <p class="question-desc">Seleccione un valor del 1 (Muy insatisfecho) al 5 (Totalmente satisfecho).</p>
          <div class="scale-row">
            <label class="scale-item"><input type="radio" name="satisfaccion_general" value="1" required /><span>1</span></label>
            <label class="scale-item"><input type="radio" name="satisfaccion_general" value="2" required /><span>2</span></label>
            <label class="scale-item"><input type="radio" name="satisfaccion_general" value="3" required /><span>3</span></label>
            <label class="scale-item"><input type="radio" name="satisfaccion_general" value="4" required /><span>4</span></label>
            <label class="scale-item"><input type="radio" name="satisfaccion_general" value="5" required /><span>5</span></label>
          </div>
          <div class="scale-labels">
            <span>1 · Muy insatisfecho</span>
            <span>5 · Totalmente satisfecho</span>
          </div>
        </fieldset>

        <fieldset class="question-block">
          <legend class="question-title"><span class="q-num">10.</span> ¿Qué área computacional utilizó principalmente y qué aspecto sugiere mejorar?</legend>
          <p class="question-desc">Indique la sala evaluada y agregue opcionalmente observaciones o requerimientos.</p>
          <div class="field-stack">
            <select name="sala_utilizada" required>
${roomOptionsHtml}
            </select>
            <textarea name="sugerencias" rows="3" placeholder="Observaciones adicionales sobre equipos, red o software (opcional)..."></textarea>
          </div>
        </fieldset>

        <div class="actions">
          <button type="reset" class="btn-reset">Limpiar respuestas</button>
          <button type="submit" id="submitBtn" class="btn-submit">Enviar encuesta a Google Sheets</button>
        </div>

        <div id="statusMessage" class="status-box" role="status" aria-live="polite"></div>
      </form>
    </section>

    <footer>
      Centro Agropecuario de Buga · Evaluación de Ambientes TIC · Destino de datos: página "${escapeHtml(sheetName)}"
    </footer>
  </main>

  <script>
    // URL de implementación Web App de Google Apps Script (.../exec)
    const GOOGLE_SCRIPT_URL = '${escapeJsSingleQuotes(scriptUrl)}';
    const TARGET_SHEET_NAME = '${escapeJsSingleQuotes(sheetName)}';

    const form = document.getElementById('cabSurveyForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusBox = document.getElementById('statusMessage');

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      statusBox.className = 'status-box';
      statusBox.textContent = '';

      if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf('PEGA_AQUI') !== -1) {
        statusBox.className = 'status-box err';
        statusBox.textContent = 'Configure primero la constante GOOGLE_SCRIPT_URL en el archivo HTML con la URL .../exec de su Google Apps Script.';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando respuesta...';

      try {
        const formData = new FormData(form);
        const sala = formData.get('sala_utilizada') || '';
        const nota = (formData.get('sugerencias') || '').toString().trim();
        formData.set('sheetName', TARGET_SHEET_NAME);
        formData.set('sala_y_sugerencias', nota ? sala + ' — ' + nota : sala.toString());

        const encoded = new URLSearchParams();
        for (const pair of formData.entries()) {
          encoded.append(pair[0], pair[1].toString());
        }

        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: encoded.toString()
        });

        statusBox.className = 'status-box ok';
        statusBox.textContent = 'Gracias. Su respuesta fue enviada correctamente a la hoja "' + TARGET_SHEET_NAME + '" en Google Sheets.';
        form.reset();
      } catch (error) {
        statusBox.className = 'status-box err';
        statusBox.textContent = 'No fue posible enviar la respuesta. Verifique su conexión a Internet y la URL del script.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar encuesta a Google Sheets';
      }
    });
  </script>
</body>
</html>
`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportSubmissionsToCsv(submissions: SurveySubmission[], sheetName: string): void {
  const headers = [
    'Marca temporal',
    '1. Rol en el Centro',
    '2. Frecuencia de uso',
    '3. Estado de equipos',
    '4. Conectividad a Internet',
    '5. Software disponible',
    '6. Ambiente físico',
    '7. Soporte técnico',
    '8. Facilidad de acceso',
    '9. Satisfacción general (1-5)',
    '10. Sala utilizada y sugerencias',
  ];

  const rows = submissions.map((item) => {
    const combinedRoom = item.sugerencias.trim()
      ? `${item.sala_utilizada} — ${item.sugerencias.trim()}`
      : item.sala_utilizada;

    return [
      item.timestamp,
      item.rol_usuario,
      item.frecuencia_uso,
      item.estado_equipos,
      item.conectividad_red,
      item.software_instalado,
      item.ambiente_fisico,
      item.soporte_atencion,
      item.acceso_prestamo,
      item.satisfaccion_general,
      combinedRoom,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const safeSlug = (sheetName || 'respuestas')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_');

  downloadTextFile(`cab_buga_${safeSlug}.csv`, csvContent, 'text/csv;charset=utf-8;');
}
