import { useState } from 'react';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  GoogleDriveSpreadsheet,
  GoogleSheetTab,
  getSpreadsheetDetails,
  listUserSpreadsheets,
} from '../services/googleSheetsApi';
import { SheetConfig } from '../types/survey';

interface GoogleSheetsConnectorProps {
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  sheetConfig: SheetConfig;
  onUpdateSheetConfig: (patch: Partial<SheetConfig>) => void;
}

export function GoogleSheetsConnector({
  user,
  accessToken,
  onSignIn,
  onSignOut,
  isLoggingIn,
  sheetConfig,
  onUpdateSheetConfig,
}: GoogleSheetsConnectorProps) {
  const [spreadsheets, setSpreadsheets] = useState<GoogleDriveSpreadsheet[]>([]);
  const [availableTabs, setAvailableTabs] = useState<GoogleSheetTab[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);
  const [manualIdInput, setManualIdInput] = useState(sheetConfig.spreadsheetId || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load user spreadsheets from Drive
  async function handleLoadSpreadsheets() {
    if (!accessToken) return;
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const files = await listUserSpreadsheets(accessToken);
      setSpreadsheets(files);

      // Try to auto-match 'GELEN' or 'Respuestas'
      const match = files.find(
        (f) =>
          f.name.toLowerCase().includes('gelen') ||
          f.name.toLowerCase().includes('respuestas') ||
          f.name.toLowerCase().includes('buga')
      );
      if (match && !sheetConfig.spreadsheetId) {
        handleSelectSpreadsheet(match.id, match.name);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'No se pudieron listar las hojas de cálculo.');
    } finally {
      setIsLoadingFiles(false);
    }
  }

  // Load tabs for selected spreadsheet
  async function handleSelectSpreadsheet(fileId: string, fileName: string) {
    if (!accessToken) return;
    setIsLoadingTabs(true);
    setErrorMsg(null);
    try {
      const details = await getSpreadsheetDetails(accessToken, fileId);
      setAvailableTabs(details.sheets);

      // Check if current sheetName exists or default to first tab
      const hasTab = details.sheets.some(
        (s) => s.title.toLowerCase() === (sheetConfig.sheetName || 'respuestas').toLowerCase()
      );
      const chosenTab = hasTab ? sheetConfig.sheetName : details.sheets[0]?.title || 'Respuestas';

      onUpdateSheetConfig({
        spreadsheetId: fileId,
        spreadsheetName: fileName,
        sheetName: chosenTab,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${fileId}/edit`,
        directSyncEnabled: true,
      });
      setManualIdInput(fileId);
      setSuccessMsg(`Vinculado con éxito a "${fileName}".`);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'No se pudo leer la estructura de la hoja seleccionada.');
    } finally {
      setIsLoadingTabs(false);
    }
  }

  // Handle manual spreadsheet ID or URL paste
  function handleConnectManualId() {
    const raw = manualIdInput.trim();
    if (!raw) return;

    // Extract ID if full URL pasted
    let id = raw;
    const match = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }

    handleSelectSpreadsheet(id, sheetConfig.spreadsheetName || 'Hoja de Cálculo Vinculada');
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-semibold text-base text-slate-900">
              Conexión directa con Google Sheets
            </span>
            {user && sheetConfig.spreadsheetId ? (
              <span className="text-xs text-emerald-800 font-medium">· Conectado</span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 max-w-xl">
            Permite que cada encuesta enviada desde este formulario se guarde inmediatamente como
            una nueva fila en su hoja de cálculo de Google Drive.
          </p>
        </div>

        <div>
          {!user ? (
            <button
              type="button"
              onClick={onSignIn}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2.5 px-4 py-2 min-h-[42px] text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-xs hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoggingIn ? 'Iniciando...' : 'Iniciar sesión con Google'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900">{user.displayName || user.email}</p>
                <p className="text-[11px] text-slate-500 font-mono">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                title="Cerrar sesión"
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* When signed in: File picker and tab selection */}
      {user ? (
        <div className="pt-6 space-y-6">
          {errorMsg ? (
            <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
              {errorMsg}
            </p>
          ) : null}
          {successMsg ? (
            <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          ) : null}

          {/* Current Connected Target */}
          {sheetConfig.spreadsheetId ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-sm font-semibold text-slate-900">
                    {sheetConfig.spreadsheetName || 'Hoja vinculada'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {sheetConfig.spreadsheetId} · Página activa:{' '}
                  <span className="font-semibold text-slate-800 font-mono">
                    &quot;{sheetConfig.sheetName}&quot;
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {sheetConfig.spreadsheetUrl ? (
                  <a
                    href={sheetConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Choose from user's Drive */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Seleccionar hoja de cálculo de su Google Drive:
              </label>
              <button
                type="button"
                onClick={handleLoadSpreadsheets}
                disabled={isLoadingFiles}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>{isLoadingFiles ? 'Buscando hojas...' : 'Explorar mis hojas'}</span>
              </button>
            </div>

            {spreadsheets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {spreadsheets.map((file) => {
                  const isSelected = sheetConfig.spreadsheetId === file.id;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => handleSelectSpreadsheet(file.id, file.name)}
                      className={`text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50 text-slate-900 font-medium'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{file.id}</p>
                      </div>
                      {isSelected ? <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* Tab selector if tabs are loaded */}
          {availableTabs.length > 0 ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Pestaña / Página destino dentro de la hoja:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {availableTabs.map((tab) => {
                  const isTabSelected = sheetConfig.sheetName === tab.title;
                  return (
                    <button
                      key={tab.sheetId}
                      type="button"
                      onClick={() => onUpdateSheetConfig({ sheetName: tab.title })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                        isTabSelected
                          ? 'border-emerald-700 bg-emerald-700 text-white font-medium'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {tab.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Or Paste Link/ID manually */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label htmlFor="manual_sheet_id_input" className="block text-xs font-semibold text-slate-700">
              O pegue el enlace / ID directo de su hoja de cálculo:
            </label>
            <div className="flex gap-2">
              <input
                id="manual_sheet_id_input"
                type="text"
                value={manualIdInput}
                onChange={(e) => setManualIdInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/... o ID directo"
                className="flex-1 min-h-[40px] px-3.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700"
              />
              <button
                type="button"
                onClick={handleConnectManualId}
                disabled={isLoadingTabs || !manualIdInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 min-h-[40px] text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                {isLoadingTabs ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
                <span>Vincular</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            Haga clic en <strong>&quot;Iniciar sesión con Google&quot;</strong> arriba para otorgar
            permiso de escritura en su hoja de cálculo. También puede usar la opción por URL de Apps
            Script o descargar el archivo HTML independiente para distribución.
          </p>
        </div>
      )}
    </div>
  );
}
