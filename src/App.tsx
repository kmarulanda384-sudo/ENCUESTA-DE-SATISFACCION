import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { AnalyticsView } from './components/AnalyticsView';
import { HtmlExportView } from './components/HtmlExportView';
import { ResponsesLedgerView } from './components/ResponsesLedgerView';
import { SurveyFormView } from './components/SurveyFormView';
import { TopNav } from './components/TopNav';
import {
  ATTACHED_CSV_PATH,
  FALLBACK_RAW_CSV,
  formatColombiaTimestamp,
  parseAttachedCsvToSubmissions,
} from './data/surveyQuestions';
import {
  googleSignIn,
  initAuth,
  logout,
} from './services/googleAuth';
import { appendSurveyRowToSheet } from './services/googleSheetsApi';
import {
  NavigationTab,
  SheetConfig,
  SurveyFormValues,
  SurveySubmission,
} from './types/survey';
import {
  downloadTextFile,
  generateStandaloneHtml,
  sendSubmissionToGoogleSheets,
} from './utils/htmlExporter';

const STORAGE_CUSTOM_SUBMISSIONS_KEY = 'cab_buga_custom_submissions_v1';
const STORAGE_SHEET_CONFIG_KEY = 'cab_buga_sheet_config_v1';

const DEFAULT_SHEET_CONFIG: SheetConfig = {
  spreadsheetName: 'GELEN ZAMBRANO (Respuestas)',
  sheetName: 'Respuestas',
  scriptUrl: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.SURVEY);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [rawCsvText, setRawCsvText] = useState<string>(FALLBACK_RAW_CSV);
  const [baseCsvSubmissions, setBaseCsvSubmissions] = useState<SurveySubmission[]>(() =>
    parseAttachedCsvToSubmissions(FALLBACK_RAW_CSV)
  );
  const [isLoadingCsv, setIsLoadingCsv] = useState<boolean>(true);

  const [customSubmissions, setCustomSubmissions] = useState<SurveySubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOM_SUBMISSIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
    return [];
  });

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SHEET_CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_SHEET_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_SHEET_CONFIG;
  });

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  async function handleSignIn() {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleSignOut() {
    await logout();
    setUser(null);
    setAccessToken(null);
  }

  useEffect(() => {
    let active = true;
    async function loadAttachedCsv() {
      try {
        const response = await fetch(ATTACHED_CSV_PATH);
        if (response.ok) {
          const text = await response.text();
          if (active && text.trim().length > 0) {
            setRawCsvText(text.trim());
            setBaseCsvSubmissions(parseAttachedCsvToSubmissions(text));
          }
        }
      } catch {
        // Fallback already initialized
      } finally {
        if (active) {
          setIsLoadingCsv(false);
        }
      }
    }
    loadAttachedCsv();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_SUBMISSIONS_KEY, JSON.stringify(customSubmissions));
    } catch {
      // Ignore storage errors
    }
  }, [customSubmissions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SHEET_CONFIG_KEY, JSON.stringify(sheetConfig));
    } catch {
      // Ignore storage errors
    }
  }, [sheetConfig]);

  const allSubmissions = [...baseCsvSubmissions, ...customSubmissions];

  function handleUpdateSheetConfig(patch: Partial<SheetConfig>) {
    setSheetConfig((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmitSurvey(values: SurveyFormValues) {
    const timestamp = formatColombiaTimestamp();
    let sentDirectlyToSheets = false;
    let message = '';

    // 1. Direct write to Google Sheets via official API if user connected with OAuth
    if (accessToken && sheetConfig.spreadsheetId) {
      try {
        const res = await appendSurveyRowToSheet(
          accessToken,
          sheetConfig.spreadsheetId,
          sheetConfig.sheetName || 'Respuestas',
          values,
          timestamp
        );
        sentDirectlyToSheets = true;
        message = `Guardado directamente en Google Sheets ("${sheetConfig.sheetName || 'Respuestas'}" en ${sheetConfig.spreadsheetName || 'su hoja'}). Fila insertada: ${res.updatedRange}.`;
      } catch (err: unknown) {
        const error = err as Error;
        console.warn('Fallo guardado directo con Google Sheets API:', error);
        message = `Aviso: No se pudo escribir directo (${error.message || 'error de permisos'}).`;
      }
    }

    // 2. If Apps Script URL is configured, also send via webhook
    if (!sentDirectlyToSheets && sheetConfig.scriptUrl.trim()) {
      const remoteResult = await sendSubmissionToGoogleSheets(values, timestamp, sheetConfig);
      sentDirectlyToSheets = remoteResult.sent;
      message = remoteResult.message;
    }

    if (!message) {
      message = 'Respuesta guardada en la base de datos local del navegador. Vincule su hoja en "Código HTML" para envío en vivo a Google Drive.';
    }

    const newEntry: SurveySubmission = {
      id: `web-${Date.now()}`,
      timestamp,
      ...values,
      source: 'formulario_web',
      syncedToSheets: sentDirectlyToSheets,
    };

    setCustomSubmissions((prev) => [...prev, newEntry]);

    return {
      submission: newEntry,
      remoteMessage: message,
      sentRemotely: sentDirectlyToSheets,
    };
  }

  function handleResetToInitialCsv() {
    setCustomSubmissions([]);
  }

  function handleQuickDownloadHtml() {
    const html = generateStandaloneHtml(sheetConfig);
    downloadTextFile('encuesta_cab_buga.html', html, 'text/html;charset=utf-8');
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        responseCount={allSubmissions.length}
        onQuickDownloadHtml={handleQuickDownloadHtml}
      />

      <main className="flex-1">
        {activeTab === NavigationTab.SURVEY ? (
          <SurveyFormView
            sheetConfig={sheetConfig}
            onUpdateSheetConfig={handleUpdateSheetConfig}
            onSubmitSurvey={handleSubmitSurvey}
            onNavigateTab={setActiveTab}
          />
        ) : null}

        {activeTab === NavigationTab.RESPONSES ? (
          <ResponsesLedgerView
            submissions={allSubmissions}
            rawCsvText={rawCsvText}
            isLoadingCsv={isLoadingCsv}
            sheetConfig={sheetConfig}
            onNavigateTab={setActiveTab}
            onResetToInitialCsv={handleResetToInitialCsv}
          />
        ) : null}

        {activeTab === NavigationTab.ANALYTICS ? (
          <AnalyticsView
            submissions={allSubmissions}
            sheetName={sheetConfig.sheetName}
          />
        ) : null}

        {activeTab === NavigationTab.HTML_CODE ? (
          <HtmlExportView
            sheetConfig={sheetConfig}
            onUpdateSheetConfig={handleUpdateSheetConfig}
            user={user}
            accessToken={accessToken}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            isLoggingIn={isLoggingIn}
          />
        ) : null}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Centro Agropecuario de Buga · SENA Regional Valle · Encuesta de Satisfacción Áreas
            Computacionales
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab(NavigationTab.HTML_CODE)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Conector Google Sheets
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleQuickDownloadHtml}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Descargar formulario HTML
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
