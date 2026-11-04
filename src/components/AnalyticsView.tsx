import { useMemo } from 'react';
import { SurveySubmission } from '../types/survey';

interface AnalyticsViewProps {
  submissions: SurveySubmission[];
  sheetName: string;
}

function qualitativeToScore(val: string): number | null {
  const normalized = val.trim().toLowerCase();
  if (!normalized || normalized === 'sin dato') return null;

  if (
    normalized.includes('excelente') ||
    normalized.includes('muy fácil') ||
    normalized.includes('estable')
  ) {
    return 100;
  }
  if (normalized === 'bueno' || normalized === 'buena' || normalized === 'fácil') {
    return 80;
  }
  if (normalized === 'aceptable') {
    return 60;
  }
  if (
    normalized === 'regular' ||
    normalized.includes('inestable') ||
    normalized.includes('desactualizado') ||
    normalized.includes('lento')
  ) {
    return 35;
  }
  if (
    normalized === 'deficiente' ||
    normalized.includes('sin conexión') ||
    normalized.includes('insuficiente') ||
    normalized.includes('muy difícil')
  ) {
    return 15;
  }
  return null;
}

export function AnalyticsView({ submissions, sheetName }: AnalyticsViewProps) {
  const stats = useMemo(() => {
    const numericRatings = submissions
      .map((s) => Number(s.satisfaccion_general))
      .filter((n) => !Number.isNaN(n) && n >= 1 && n <= 5);

    const avgRating =
      numericRatings.length > 0
        ? numericRatings.reduce((acc, n) => acc + n, 0) / numericRatings.length
        : 0;

    const dimensions: { key: keyof SurveySubmission; label: string }[] = [
      { key: 'soporte_atencion', label: 'Atención y soporte técnico en sala' },
      { key: 'acceso_prestamo', label: 'Agilidad de asignación y préstamo' },
      { key: 'estado_equipos', label: 'Estado físico y rendimiento de equipos (F3 y salas)' },
      { key: 'ambiente_fisico', label: 'Condiciones físicas, iluminación y ergonomía' },
      { key: 'software_instalado', label: 'Disponibilidad y actualización de software' },
      { key: 'conectividad_red', label: 'Estabilidad de conectividad a Internet' },
    ];

    const dimensionScores = dimensions
      .map((dim) => {
        const scores = submissions
          .map((row) => qualitativeToScore(String(row[dim.key] || '')))
          .filter((v): v is number => v !== null);

        const average =
          scores.length > 0
            ? Math.round(scores.reduce((acc, v) => acc + v, 0) / scores.length)
            : 0;

        return {
          label: dim.label,
          average,
          sampleSize: scores.length,
        };
      })
      .sort((a, b) => b.average - a.average);

    const roleCounts: Record<string, number> = {};
    const roomCounts: Record<string, number> = {};

    submissions.forEach((s) => {
      const r = s.rol_usuario || 'Sin especificar';
      roleCounts[r] = (roleCounts[r] || 0) + 1;

      const room = s.sala_utilizada || 'Sala de Sistemas F3';
      roomCounts[room] = (roomCounts[room] || 0) + 1;
    });

    const topDimension = dimensionScores[0];
    const lowestDimension = dimensionScores[dimensionScores.length - 1];

    return {
      total: submissions.length,
      avgRating,
      dimensionScores,
      topDimension,
      lowestDimension,
      roles: Object.entries(roleCounts).sort((a, b) => b[1] - a[1]),
      rooms: Object.entries(roomCounts).sort((a, b) => b[1] - a[1]),
    };
  }, [submissions]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
      <div className="max-w-3xl mb-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-2">
          <span>Centro Agropecuario de Buga</span>
          <span aria-hidden="true">·</span>
          <span>Diagnóstico de Áreas Computacionales</span>
          <span aria-hidden="true">·</span>
          <span>Fuente: {sheetName || 'Respuestas'}</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
          Indicadores consolidados de satisfacción TIC
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Resumen cuantitativo calculado en tiempo real a partir de las respuestas registradas para
          orientar el mantenimiento preventivo de equipos, software y red.
        </p>
      </div>

      {/* 4-column KPI strip — Single flat surface with subtle hairline dividers */}
      <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 mb-8">
        <div className="p-5 sm:p-6">
          <p className="text-xs text-slate-500 mb-1">Satisfacción general promedio</p>
          <p className="font-display text-3xl font-bold text-slate-900 tabular-nums">
            {stats.avgRating.toFixed(1)}{' '}
            <span className="text-base font-normal text-slate-400">/ 5.0</span>
          </p>
          <p className="text-xs text-slate-500 mt-1.5">Escala directa pregunta 09</p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs text-slate-500 mb-1">Encuestas consolidadas</p>
          <p className="font-display text-3xl font-bold text-slate-900 tabular-nums">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 mt-1.5">Registros válidos en hoja activa</p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs text-slate-500 mb-1">Aspecto mejor valorado</p>
          <p className="font-display text-base font-bold text-slate-900 leading-snug line-clamp-2">
            {stats.topDimension ? stats.topDimension.label : 'Sin datos suficientes'}
          </p>
          <p className="font-mono text-xs text-emerald-700 font-medium tabular-nums mt-1.5">
            {stats.topDimension ? `Índice positivo: ${stats.topDimension.average}%` : '—'}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs text-slate-500 mb-1">Prioridad de intervención</p>
          <p className="font-display text-base font-bold text-slate-900 leading-snug line-clamp-2">
            {stats.lowestDimension ? stats.lowestDimension.label : 'Sin alertas'}
          </p>
          <p className="font-mono text-xs text-amber-700 font-medium tabular-nums mt-1.5">
            {stats.lowestDimension ? `Índice actual: ${stats.lowestDimension.average}%` : '—'}
          </p>
        </div>
      </div>

      {/* 2-Column Analytical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-1">
            Desempeño por dimensión evaluada
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Índice de valoración (0 a 100%) ponderado según las calificaciones de las preguntas 03 a
            08.
          </p>

          <div className="space-y-5">
            {stats.dimensionScores.map((dim) => {
              const isAlert = dim.average > 0 && dim.average < 55;
              return (
                <div key={dim.label}>
                  <div className="flex items-baseline justify-between gap-4 text-sm mb-1.5">
                    <span className="font-medium text-slate-800">{dim.label}</span>
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                        isAlert ? 'text-amber-700' : 'text-slate-700'
                      }`}
                    >
                      {dim.sampleSize > 0 ? `${dim.average}%` : 'Sin datos'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-transform duration-200 origin-left ${
                        isAlert ? 'bg-amber-600' : 'bg-emerald-700'
                      }`}
                      style={{ transform: `scaleX(${dim.average / 100})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 divide-y divide-slate-200">
          <div className="pb-6">
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-1">
              Participación por perfil
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Distribución de encuestados en el Centro Agropecuario de Buga.
            </p>
            <dl className="space-y-2.5 text-sm">
              {stats.roles.map(([role, count]) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={role} className="flex items-center justify-between gap-3">
                    <dt className="text-slate-700">{role}</dt>
                    <dd className="font-mono text-xs text-slate-600 tabular-nums">
                      {count} ({pct}%)
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>

          <div className="pt-6">
            <h2 className="font-display text-lg font-semibold text-slate-900 mb-1">
              Ambientes computacionales evaluados
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Frecuencia de reportes según sala o laboratorio TIC.
            </p>
            <dl className="space-y-2.5 text-sm">
              {stats.rooms.map(([room, count]) => (
                <div key={room} className="flex items-center justify-between gap-3">
                  <dt className="text-slate-700 truncate">{room}</dt>
                  <dd className="font-mono text-xs font-medium text-slate-900 tabular-nums shrink-0">
                    {count} {count === 1 ? 'registro' : 'registros'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}
