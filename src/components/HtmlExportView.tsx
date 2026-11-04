import { useMemo, useState } from 'react';
import { Check, Copy, Download, Send } from 'lucide-react';
import { formatColombiaTimestamp } from '../data/surveyQuestions';
import { SheetConfig, SurveyFormValues } from '../types/survey';
import {
  downloadTextFile,
  generateAppsScriptCode,
  generateStandaloneHtml,
  sendSubmissionToGoogleSheets,
} from '../utils/htmlExporter';
import { GoogleSheetsConnector } from './GoogleSheetsConnector';

interface HtmlExportViewProps {
  sheetConfig: SheetConfig;
  onUpdateSheetConfig: (patch: Partial<SheetConfig>) => void;
  user: any;
  accessToken: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
}

const SHEET_TAB_PRESETS = [
  'Respuestas',
  'Respuestas de formulario 1',
  'Hoja 1',
  'Encuesta_CAB_Buga',
];

export function HtmlExportView({
  sheetConfig,
  onUpdateSheetConfig,
  user,
  accessToken,
  onSignIn,
  onSignOut,
  isLoggingIn,
}: HtmlExportViewProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'gs'>('html');
  const [copiedId, setCopiedId] = useState<'html' | 'gs' | null>(null);
  const [testState, setTestState] = useState<{
    status: 'idle' | 'sending' | 'ok' | 'missing_url' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const htmlSource = useMemo(() => generateStandaloneHtml(sheetConfig), [sheetConfig]);
  const gsSource = useMemo(() => generateAppsScriptCode(sheetConfig), [sheetConfig]);

  async function handleCopy(target: 'html' | 'gs') {
    const content = target === 'html' ? htmlSource : gsSource;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(target);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      downloadTextFile(
        target === 'html' ? 'encuesta_cab_buga.html' : 'Codigo.gs',
        content,
        'text/plain;charset=utf-8'
      );
    }
  }

  async function handleTestWebhook() {
    if (!sheetConfig.scriptUrl.trim()) {
      setTestState({
        status: 'missing_url',
        message:
          'Pegue primero la URL de su aplicación web de Google Apps Script (.../exec) para enviar una fila de prueba.',
      });
      return;
    }

    setTestState({ status: 'sending', message: 'Enviando fila de prueba a Google Sheets...' });

    const samplePayload: SurveyFormValues = {
      rol_usuario: 'Aprendiz',
      frecuencia_uso: 'Semanalmente',
      estado_equipos: 'Bueno',
      conectividad_red: 'Aceptable',
      software_instalado: 'Bueno',
      ambiente_fisico: 'Bueno',
      soporte_atencion: 'Excelente',
      acceso_prestamo: 'Muy Fácil / Ágil',
      satisfaccion_general: '5',
      sala_utilizada: 'Sala de Sistemas F3',
      sugerencias: 'Fila de prueba enviada desde el configurador web CAB Buga',
    };

    try {
      const res = await sendSubmissionToGoogleSheets(
        samplePayload,
        formatColombiaTimestamp(),
        sheetConfig
      );
      setTestState({ status: 'ok', message: res.message });
    } catch {
      setTestState({
        status: 'error',
        message: 'No se pudo conectar con la URL indicada. Verifique que termine en /exec.',
      });
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="max-w-3xl mb-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-2">
          <span>Exportación HTML5 Autónoma</span>
          <span aria-hidden="true">·</span>
          <span>Integración Google Apps Script</span>
          <span aria-hidden="true">·</span>
          <span>Centro Agropecuario de Buga</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
          Formulario HTML conectado a su hoja de cálculo de Google
        </h1>

        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
          Escriba el nombre exacto de la página (pestaña) de su Google Sheet y la URL del script web.
          El código HTML y el receptor <code className="font-mono text-xs">Codigo.gs</code> se
          actualizan al instante listos para copiar o descargar.
        </p>
      </div>
      <div className="mb-8">
        <GoogleSheetsConnector
          user={user}
          accessToken={accessToken}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          isLoggingIn={isLoggingIn}
          sheetConfig={sheetConfig}
          onUpdateSheetConfig={onUpdateSheetConfig}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 columns: Configuration & 3-Step Guide */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 divide-y divide-slate-200">
          <div className="pb-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              1. Parámetros de la hoja de Google
            </h2>

            <div>
              <label
                htmlFor="config_spreadsheet_name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nombre del archivo en Google Sheets (referencia)
              </label>
              <input
                id="config_spreadsheet_name"
                type="text"
                value={sheetConfig.spreadsheetName}
                onChange={(e) => onUpdateSheetConfig({ spreadsheetName: e.target.value })}
                placeholder="GELEN ZAMBRANO (Respuestas)"
                className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label
                htmlFor="config_sheet_tab_name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nombre exacto de la página / pestaña destino
              </label>
              <input
                id="config_sheet_tab_name"
                type="text"
                value={sheetConfig.sheetName}
                onChange={(e) => onUpdateSheetConfig({ sheetName: e.target.value })}
                placeholder="Ej. Respuestas"
                className="w-full min-h-[42px] px-3.5 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 mr-1">Nombres frecuentes:</span>
                {SHEET_TAB_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onUpdateSheetConfig({ sheetName: preset })}
                    className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer whitespace-nowrap ${
                      sheetConfig.sheetName === preset
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-medium'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="config_script_url"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                URL de implementación de Apps Script (.../exec)
              </label>
              <input
                id="config_script_url"
                type="url"
                value={sheetConfig.scriptUrl}
                onChange={(e) => onUpdateSheetConfig({ scriptUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full min-h-[42px] px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Al pegar esta URL aquí, tanto esta aplicación como el archivo{' '}
                <code className="font-mono">.html</code> descargado enviarán cada respuesta
                directamente a la página{' '}
                <strong className="font-medium text-slate-700">
                  {sheetConfig.sheetName || 'Respuestas'}
                </strong>
                .
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testState.status === 'sending'}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {testState.status === 'sending'
                    ? 'Enviando prueba...'
                    : 'Probar envío a Google Sheets'}
                </span>
              </button>

              {testState.message ? (
                <p
                  role="status"
                  className={`text-xs mt-2.5 leading-relaxed ${
                    testState.status === 'ok'
                      ? 'text-emerald-800 font-medium'
                      : 'text-amber-800'
                  }`}
                >
                  {testState.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Concise 3-step instructions */}
          <div className="pt-6 space-y-3">
            <h2 className="font-display text-base font-semibold text-slate-900">
              2. Cómo conectarlo en 3 pasos
            </h2>
            <ol className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <li>
                <span className="font-mono font-semibold text-emerald-700 mr-1.5">01.</span>
                Abra su hoja de cálculo en Google Sheets y entre en{' '}
                <strong className="font-semibold text-slate-800">
                  Extensiones &gt; Apps Script
                </strong>
                .
              </li>
              <li>
                <span className="font-mono font-semibold text-emerald-700 mr-1.5">02.</span>
                Copie la pestaña <strong className="font-semibold text-slate-800">Codigo.gs</strong>{' '}
                de la derecha, péguela allí, guarde y pulse{' '}
                <strong className="font-semibold text-slate-800">
                  Implementar &gt; Nueva implementación &gt; Aplicación web
                </strong>{' '}
                (acceso: <em>Cualquier persona</em>).
              </li>
              <li>
                <span className="font-mono font-semibold text-emerald-700 mr-1.5">03.</span>
                Pegue la URL <code className="font-mono text-xs">.../exec</code> en el campo
                superior y descargue el archivo{' '}
                <strong className="font-semibold text-slate-800">
                  encuesta_cab_buga.html
                </strong>{' '}
                listo para usar en cualquier computador del centro.
              </li>
            </ol>
          </div>
        </div>

        {/* Right 7 columns: Code Viewer & Downloaders */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {/* Segmented Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveCodeTab('html')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCodeTab === 'html'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                formulario.html (10 preguntas)
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('gs')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCodeTab === 'gs'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Codigo.gs (Google Sheets)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(activeCodeTab)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedId === activeCodeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span className="text-emerald-800 font-semibold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copiar código</span>
                  </>
                )}
              </button>

              {activeCodeTab === 'html' ? (
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'encuesta_cab_buga.html',
                      htmlSource,
                      'text/html;charset=utf-8'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Descargar .html</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile('Codigo.gs', gsSource, 'text/plain;charset=utf-8')
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Descargar .gs</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-950 text-slate-100 p-5 overflow-x-auto max-h-[620px] overflow-y-auto">
            <pre className="text-xs font-mono leading-relaxed">
              <code>{activeCodeTab === 'html' ? htmlSource : gsSource}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
