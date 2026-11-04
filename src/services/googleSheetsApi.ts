import { SurveyFormValues } from '../types/survey';

export interface GoogleDriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
}

export interface GoogleSheetTab {
  sheetId: number;
  title: string;
  index: number;
}

export const SURVEY_HEADERS = [
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
  '10. Sala utilizada y sugerencias',
];

/**
 * Searches user Google Drive for spreadsheets matching query or recent sheets
 */
export async function listUserSpreadsheets(
  accessToken: string,
  queryName?: string
): Promise<GoogleDriveSpreadsheet[]> {
  let q = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
  if (queryName && queryName.trim().length > 0) {
    const escaped = queryName.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Error al listar hojas de cálculo (${res.status})`);
  }

  const data = await res.json();
  return (data.files as GoogleDriveSpreadsheet[]) || [];
}

/**
 * Gets sheet tabs metadata for a given spreadsheet ID
 */
export async function getSpreadsheetDetails(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheets: GoogleSheetTab[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=properties.title,sheets.properties(sheetId,title,index)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Error al abrir la hoja de cálculo (${res.status})`);
  }

  const data = await res.json();
  const sheets: GoogleSheetTab[] = (data.sheets || []).map(
    (s: { properties: { sheetId: number; title: string; index: number } }) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
    })
  );

  return {
    title: data.properties?.title || 'Hoja de Cálculo',
    sheets,
  };
}

/**
 * Ensures headers exist in sheet tab and appends row
 */
export async function appendSurveyRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTabTitle: string,
  values: SurveyFormValues,
  timestamp: string
): Promise<{ updatedRange: string; rowCount: number }> {
  // 1. Read first row to see if headers exist
  const getHeaderUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(`'${sheetTabTitle}'!A1:K1`)}`;

  const headerRes = await fetch(getHeaderUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let existingHeaders: string[] = [];
  if (headerRes.ok) {
    const headerData = await headerRes.json();
    if (headerData.values && headerData.values.length > 0) {
      existingHeaders = headerData.values[0];
    }
  }

  // If first row is empty or has generic "Columna 1", write proper headers
  if (
    existingHeaders.length === 0 ||
    !existingHeaders[1] ||
    String(existingHeaders[2] || '').startsWith('Columna')
  ) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${encodeURIComponent(`'${sheetTabTitle}'!A1:K1`)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SURVEY_HEADERS],
        }),
      }
    );
  }

  // 2. Format row data according to survey fields
  const salaDetalle = values.sugerencias.trim()
    ? `${values.sala_utilizada} — ${values.sugerencias.trim()}`
    : values.sala_utilizada;

  const rowData = [
    timestamp,
    values.rol_usuario,
    values.frecuencia_uso,
    values.estado_equipos,
    values.conectividad_red,
    values.software_instalado,
    values.ambiente_fisico,
    values.soporte_atencion,
    values.acceso_prestamo,
    values.satisfaccion_general,
    salaDetalle,
  ];

  // 3. Append row
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(`'${sheetTabTitle}'!A:K`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });

  if (!appendRes.ok) {
    const errData = await appendRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Error al guardar respuesta en Google Sheets (${appendRes.status})`);
  }

  const resData = await appendRes.json();
  return {
    updatedRange: resData.updates?.updatedRange || `${sheetTabTitle}!A:K`,
    rowCount: resData.updates?.updatedRows || 1,
  };
}

/**
 * Creates a new tab if it doesn't exist
 */
export async function createSheetTabIfNotExists(
  accessToken: string,
  spreadsheetId: string,
  targetTitle: string
): Promise<void> {
  const details = await getSpreadsheetDetails(accessToken, spreadsheetId);
  const exists = details.sheets.some((s) => s.title.toLowerCase() === targetTitle.toLowerCase());
  if (exists) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}:batchUpdate`;

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: {
              title: targetTitle,
            },
          },
        },
      ],
    }),
  });
}
