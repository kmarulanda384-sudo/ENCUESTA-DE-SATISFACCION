import { Download } from 'lucide-react';
import { NavigationTab } from '../types/survey';

interface TopNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  responseCount: number;
  onQuickDownloadHtml: () => void;
}

const NAV_ITEMS: { id: NavigationTab; label: string; showCount?: boolean }[] = [
  { id: NavigationTab.SURVEY, label: 'Encuesta' },
  { id: NavigationTab.RESPONSES, label: 'Respuestas', showCount: true },
  { id: NavigationTab.ANALYTICS, label: 'Indicadores' },
  { id: NavigationTab.HTML_CODE, label: 'Código HTML' },
];

export function TopNav({
  activeTab,
  onSelectTab,
  responseCount,
  onQuickDownloadHtml,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab(NavigationTab.SURVEY)}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 cursor-pointer"
        >
          CAB Buga · Áreas TIC
        </button>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 ${
                  isActive
                    ? 'text-slate-950 font-semibold after:absolute after:left-0 after:right-0 after:-bottom-[15px] after:h-[2px] after:bg-emerald-700'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
                {item.showCount ? (
                  <span className="ml-1.5 font-mono text-xs text-slate-500 tabular-nums">
                    ({responseCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onQuickDownloadHtml}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Descargar HTML</span>
          </button>
        </div>
      </div>

      {/* Compact mobile navigation bar below md */}
      <nav
        aria-label="Navegación móvil"
        className="flex md:hidden items-center gap-5 overflow-x-auto px-6 py-2 border-t border-slate-100 text-xs font-medium text-slate-600"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive ? 'text-emerald-800 font-semibold underline underline-offset-4' : 'hover:text-slate-900'
              }`}
            >
              {item.label}
              {item.showCount ? ` (${responseCount})` : ''}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
