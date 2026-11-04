import { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { ATTACHED_CSV_PATH } from '../data/surveyQuestions';
import { NavigationTab, SheetConfig, SurveySubmission } from '../types/survey';
import { exportSubmissionsToCsv } from '../utils/htmlExporter';

interface ResponsesLedgerViewProps {
  submissions: SurveySubmission[];
  rawCsvText: string;
  isLoadingCsv: boolean;
  sheetConfig: SheetConfig;
  onNavigateTab: (tab: NavigationTab) => void;
  onResetToInitialCsv: () => void;
}

const ROLE_FILTERS = ['Todos', 'Aprendiz', 'Instructor', 'Administrativo', 'Investigador SENNOVA'];

export function ResponsesLedgerView({
  submissions,
  rawCsvText,
  isLoadingCsv,
  sheetConfig,
  onNavigateTab,
  onResetToInitialCsv,
}: ResponsesLedgerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [showRawCsv, setShowRawCsv] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((row) => {
      const matchesRole =
        roleFilter === 'Todos' || row.rol_usuario.toLowerCase() === roleFilter.toLowerCase();

      if (!matchesRole) return false;
      if (!q) return true;

      const searchable = [
        row.timestamp,
        row.rol_usuario,
        row.frecuencia_uso,
        row.estado_equipos,
        row.conectividad_red,
        row.software_instalado,
        row.ambiente_fisico,
        row.soporte_atencion,
        row.acceso_prestamo,
        row.satisfaccion_general,
        row.sala_utilizada,
        row.sugerencias,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [submissions, searchQuery, roleFilter]);

  const customSubmissionsCount = useMemo(
    () => submissions.filter((s) => s.source === 'formulario_web').length,
    [submissions]
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-7">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-2">
            <span>Libro: {sheetConfig.spreadsheetName || 'GELEN ZAMBRANO (Respuestas)'}</span>
            <span aria-hidden="true">·</span>
            <span>Página activa: {sheetConfig.sheetName || 'Respuestas'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{submissions.length} filas totales</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            Registro de respuestas de la hoja de cálculo
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
            Incluye los registros importados desde su archivo adjunto y las nuevas respuestas
            diligenciadas en la encuesta con encabezados normalizados para las 10 preguntas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRawCsv((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span>{showRawCsv ? 'Ocultar CSV original' : 'Ver CSV adjunto'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportSubmissionsToCsv(submissions, sheetConfig.sheetName)}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Descargar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab(NavigationTab.SURVEY)}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Registrar respuesta</span>
          </button>
        </div>
      </div>

      {/* Optional Raw CSV Attachment Inspector */}
      {showRawCsv ? (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Archivo original cargado: GELEN ZAMBRANO (Respuestas)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                En el CSV original las columnas 3 a 10 aparecían como &quot;Columna 1..Columna 8&quot;.
                Nuestro formulario y el script de Google Sheets asignan automáticamente los 10
                encabezados reales en la fila 1.
              </p>
            </div>
            <a
              href={ATTACHED_CSV_PATH}
              download="GELEN_ZAMBRANO_Respuestas_Original.csv"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Descargar original
            </a>
          </div>
          <pre className="p-3.5 bg-slate-950 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
            {rawCsvText}
          </pre>
        </div>
      ) : null}

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Interactive Segmented Role Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {ROLE_FILTERS.map((role) => {
              const active = roleFilter === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 md:w-64">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por sala, estado, fecha..."
                aria-label="Buscar respuestas"
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-700"
              />
            </div>

            {customSubmissionsCount > 0 ? (
              confirmReset ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onResetToInitialCsv();
                      setConfirmReset(false);
                    }}
                    className="px-2.5 py-1.5 min-h-[38px] text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1.5 min-h-[38px] text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  title="Restaurar únicamente las filas del archivo CSV inicial"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Restaurar CSV base</span>
                </button>
              )
            ) : null}
          </div>
        </div>

        {/* Data Grid States: Loading, Empty, Populated */}
        {isLoadingCsv ? (
          <div className="p-6 space-y-3" aria-busy="true">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-10 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="font-display text-base font-semibold text-slate-900 mb-1">
              No se encontraron respuestas con los criterios actuales
            </p>
            <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
              Ajuste el término de búsqueda o restablezca el filtro de perfil para visualizar los
              registros de la hoja &quot;{sheetConfig.sheetName || 'Respuestas'}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('Todos');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 font-mono text-right w-10">#</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Marca temporal</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">1. Rol</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">2. Frecuencia</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">3. Equipos</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">4. Internet</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">5. Software</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">6. Ambiente</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">7. Soporte</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">8. Acceso</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">9. Nota (1-5)</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">10. Sala y observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredSubmissions.map((row, idx) => {
                  const isLowNet =
                    row.conectividad_red === 'Inestable' || row.conectividad_red === 'Sin conexión';
                  const roomSummary = row.sugerencias.trim()
                    ? `${row.sala_utilizada} — ${row.sugerencias.trim()}`
                    : row.sala_utilizada;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-right text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap tabular-nums">
                        {row.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        {row.rol_usuario}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.frecuencia_uso}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.estado_equipos}</td>
                      <td
                        className={`py-2.5 px-3 whitespace-nowrap ${
                          isLowNet ? 'text-amber-800 font-medium' : ''
                        }`}
                      >
                        {row.conectividad_red}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.software_instalado}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.ambiente_fisico}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.soporte_atencion}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{row.acceso_prestamo}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-right text-slate-900 tabular-nums">
                        {row.satisfaccion_general} / 5
                      </td>
                      <td className="py-2.5 px-3 max-w-[260px] truncate" title={roomSummary}>
                        {roomSummary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
