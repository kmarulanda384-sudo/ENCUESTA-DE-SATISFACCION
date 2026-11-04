import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, RotateCcw, Send, Table2 } from 'lucide-react';
import {
  INITIAL_FORM_VALUES,
  ROOM_OPTIONS,
  SURVEY_QUESTIONS,
} from '../data/surveyQuestions';
import {
  NavigationTab,
  SheetConfig,
  SurveyFormValues,
  SurveySubmission,
} from '../types/survey';

interface SurveyFormViewProps {
  sheetConfig: SheetConfig;
  onUpdateSheetConfig: (patch: Partial<SheetConfig>) => void;
  onSubmitSurvey: (values: SurveyFormValues) => Promise<{
    submission: SurveySubmission;
    remoteMessage: string;
    sentRemotely: boolean;
  }>;
  onNavigateTab: (tab: NavigationTab) => void;
}

const SCALE_LABELS: { value: string; caption: string }[] = [
  { value: '1', caption: 'Muy baja' },
  { value: '2', caption: 'Baja' },
  { value: '3', caption: 'Aceptable' },
  { value: '4', caption: 'Alta' },
  { value: '5', caption: 'Excelente' },
];

export function SurveyFormView({
  sheetConfig,
  onUpdateSheetConfig,
  onSubmitSurvey,
  onNavigateTab,
}: SurveyFormViewProps) {
  const [values, setValues] = useState<SurveyFormValues>(INITIAL_FORM_VALUES);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    submission: SurveySubmission;
    remoteMessage: string;
    sentRemotely: boolean;
  } | null>(null);

  const answeredCount = useMemo(() => {
    let count = 0;
    if (values.rol_usuario) count++;
    if (values.frecuencia_uso) count++;
    if (values.estado_equipos) count++;
    if (values.conectividad_red) count++;
    if (values.software_instalado) count++;
    if (values.ambiente_fisico) count++;
    if (values.soporte_atencion) count++;
    if (values.acceso_prestamo) count++;
    if (values.satisfaccion_general) count++;
    if (values.sala_utilizada) count++;
    return count;
  }, [values]);

  const progressPercent = Math.round((answeredCount / 10) * 100);

  function updateField<K extends keyof SurveyFormValues>(key: K, val: SurveyFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setMissingFields((prev) => prev.filter((f) => f !== key));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const requiredKeys: (keyof SurveyFormValues)[] = [
      'rol_usuario',
      'frecuencia_uso',
      'estado_equipos',
      'conectividad_red',
      'software_instalado',
      'ambiente_fisico',
      'soporte_atencion',
      'acceso_prestamo',
      'satisfaccion_general',
      'sala_utilizada',
    ];

    const missing = requiredKeys.filter((k) => !values[k] || values[k].trim() === '');
    if (missing.length > 0) {
      setMissingFields(missing);
      const firstEl = document.getElementById(`question-${missing[0]}`);
      if (firstEl) {
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmitSurvey(values);
      setLastResult(result);
      setMissingFields([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setValues(INITIAL_FORM_VALUES);
    setMissingFields([]);
    setLastResult(null);
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
      {/* Editorial Header — Clean unboxed metadata, zero pills */}
      <div className="max-w-3xl mb-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-2.5">
          <span>SENA Regional Valle</span>
          <span aria-hidden="true">·</span>
          <span>Centro Agropecuario de Buga</span>
          <span aria-hidden="true">·</span>
          <span>10 preguntas</span>
          <span aria-hidden="true">·</span>
          <span>Página destino: {sheetConfig.sheetName || 'Respuestas'}</span>
        </div>

        <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance] mb-3">
          Encuesta de satisfacción sobre el uso de las áreas computacionales
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          Evalúe el funcionamiento de las salas de sistemas, equipos de cómputo, conectividad a
          Internet y soporte técnico del Centro Agropecuario de Buga. Cada envío registra la marca
          temporal y las 10 respuestas en la hoja de cálculo configurada.
        </p>
      </div>

      {/* Confirmation State Banner when just submitted */}
      {lastResult ? (
        <div
          role="status"
          aria-live="polite"
          className="mb-8 bg-white border border-emerald-300 rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 font-display font-semibold text-base">
                <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Respuesta registrada correctamente ({lastResult.submission.timestamp})</span>
              </div>
              <p className="text-sm text-slate-600">{lastResult.remoteMessage}</p>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                Perfil: {lastResult.submission.rol_usuario} · Sala: {lastResult.submission.sala_utilizada} · Calificación: {lastResult.submission.satisfaccion_general}/5
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Nueva respuesta
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab(NavigationTab.RESPONSES)}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Table2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ver hoja de respuestas</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main 8-column Survey Form Surface — Single elevation, divided by subtle hairlines */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
        >
          {missingFields.length > 0 ? (
            <div
              role="alert"
              className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-900"
            >
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">
                  Faltan <span className="tabular-nums">{missingFields.length}</span> preguntas por
                  responder antes de enviar.
                </p>
                <p className="text-xs text-red-800 mt-0.5">
                  Revise los campos señalados con aviso de respuesta requerida.
                </p>
              </div>
            </div>
          ) : null}

          <div className="divide-y divide-slate-200">
            {SURVEY_QUESTIONS.map((q) => {
              const isMissing = missingFields.includes(q.field);

              return (
                <fieldset
                  key={q.field}
                  id={`question-${q.field}`}
                  className="py-7 first:pt-0 last:pb-2 border-0 min-w-0"
                >
                  <div className="flex items-baseline justify-between gap-4 mb-1.5">
                    <legend className="font-display text-base sm:text-[17px] font-semibold text-slate-900 leading-snug">
                      <span className="font-mono text-sm text-emerald-700 tabular-nums mr-2">
                        {q.number}.
                      </span>
                      {q.title}
                    </legend>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 mb-4">{q.description}</p>

                  {isMissing ? (
                    <p className="text-xs font-medium text-red-700 mb-3 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>Seleccione una opción para esta pregunta.</span>
                    </p>
                  ) : null}

                  {q.type === 'radio_grid' && q.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {q.options.map((opt) => {
                        const checked = values[q.field] === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`flex items-start gap-2.5 min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm transition-colors duration-150 cursor-pointer ${
                              checked
                                ? 'border-emerald-700 bg-emerald-50/70 text-slate-950 font-medium'
                                : isMissing
                                ? 'border-red-300 bg-white hover:border-slate-400 text-slate-700'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.field}
                              value={opt.value}
                              checked={checked}
                              onChange={() => updateField(q.field, opt.value)}
                              className="mt-1 w-4 h-4 accent-emerald-700 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                            />
                            <span className="leading-snug">
                              <span className="block">{opt.label}</span>
                              {opt.helper ? (
                                <span className="block text-xs font-normal text-slate-500 mt-0.5">
                                  {opt.helper}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}

                  {q.type === 'scale_1_5' ? (
                    <div>
                      <div className="grid grid-cols-5 gap-2.5">
                        {SCALE_LABELS.map((item) => {
                          const selected = values.satisfaccion_general === item.value;
                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => updateField('satisfaccion_general', item.value)}
                              aria-pressed={selected}
                              className={`flex flex-col items-center justify-center min-h-[60px] px-2 py-2.5 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                                selected
                                  ? 'border-emerald-700 bg-emerald-700 text-white'
                                  : isMissing
                                  ? 'border-red-300 bg-white text-slate-800 hover:border-slate-400'
                                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span className="font-mono text-lg font-semibold tabular-nums">
                                {item.value}
                              </span>
                              <span
                                className={`text-[11px] mt-0.5 hidden sm:block whitespace-nowrap ${
                                  selected ? 'text-emerald-50' : 'text-slate-500'
                                }`}
                              >
                                {item.caption}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                        <span>1 · Muy insatisfecho</span>
                        <span>5 · Totalmente satisfecho</span>
                      </div>
                    </div>
                  ) : null}

                  {q.type === 'room_and_notes' ? (
                    <div className="space-y-3.5">
                      <div>
                        <label
                          htmlFor="sala_utilizada_select"
                          className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                          Ambiente o sala computacional principal
                        </label>
                        <select
                          id="sala_utilizada_select"
                          value={values.sala_utilizada}
                          onChange={(e) => updateField('sala_utilizada', e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                        >
                          {ROOM_OPTIONS.map((room) => (
                            <option key={room} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="sugerencias_textarea"
                          className="block text-xs font-medium text-slate-700 mb-1.5"
                        >
                          Sugerencias u observaciones de mejora (opcional)
                        </label>
                        <textarea
                          id="sugerencias_textarea"
                          rows={3}
                          value={values.sugerencias}
                          onChange={(e) => updateField('sugerencias', e.target.value)}
                          placeholder="Ej. Revisar estabilidad de red en equipos de la fila 2 en Sala F3 o actualizar entorno de desarrollo..."
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                        />
                      </div>
                    </div>
                  ) : null}
                </fieldset>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Limpiar formulario</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isSubmitting ? 'Enviando respuesta...' : 'Enviar respuesta'}</span>
            </button>
          </div>
        </form>

        {/* Right 4-column Contextual Destination & Live Row Preview */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 bg-white border border-slate-200 rounded-xl p-6 divide-y divide-slate-200">
          {/* Section 1: Progress */}
          <div className="pb-5">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Progreso del formulario
              </h2>
              <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                {answeredCount} / 10 ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-700 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${answeredCount / 10})` }}
              />
            </div>
          </div>

          {/* Section 2: Target Google Sheet & Page Name ("en la página llamada...") */}
          <div className="py-5 space-y-3">
            <h2 className="font-display text-sm font-semibold text-slate-900">
              Destino en Google Sheets
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Defina el nombre exacto de la pestaña (página) donde se insertarán las filas al enviar
              el formulario.
            </p>

            <div>
              <label
                htmlFor="sidebar_sheet_name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nombre de la página / pestaña
              </label>
              <input
                id="sidebar_sheet_name"
                type="text"
                value={sheetConfig.sheetName}
                onChange={(e) => onUpdateSheetConfig({ sheetName: e.target.value })}
                placeholder="Ej. Respuestas"
                className="w-full min-h-[40px] px-3 py-1.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-xs text-slate-500">
                {sheetConfig.spreadsheetId
                  ? `Google Sheets: "${sheetConfig.spreadsheetName || 'Hoja vinculada'}"`
                  : sheetConfig.scriptUrl.trim()
                  ? 'Envío remoto activo (Apps Script)'
                  : 'Modo local (vincule su Google Sheet)'}
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab(NavigationTab.HTML_CODE)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer self-start"
              >
                <span>{sheetConfig.spreadsheetId ? 'Gestionar hoja de cálculo' : 'Vincular Google Sheet'}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Section 3: Live Row Preview */}
          <div className="pt-5">
            <h2 className="font-display text-sm font-semibold text-slate-900 mb-2.5">
              Vista previa de fila a registrar
            </h2>
            <dl className="space-y-1.5 text-xs">
              {SURVEY_QUESTIONS.map((q) => {
                const rawVal =
                  q.field === 'sala_utilizada'
                    ? values.sugerencias.trim()
                      ? `${values.sala_utilizada} — ${values.sugerencias.trim()}`
                      : values.sala_utilizada
                    : values[q.field];

                return (
                  <div key={q.field} className="flex items-baseline justify-between gap-3 py-0.5">
                    <dt className="text-slate-500 truncate">{q.shortHeader}</dt>
                    <dd
                      className={`font-mono text-right truncate max-w-[155px] tabular-nums ${
                        rawVal ? 'text-slate-900 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {rawVal || 'Pendiente'}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
