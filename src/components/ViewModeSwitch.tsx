import { Download, Monitor, Smartphone } from 'lucide-react';
import type { ViewMode } from '../types/bakery';

interface ViewModeSwitchProps {
  viewMode: ViewMode;
  onChangeMode: (mode: ViewMode) => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  compact?: boolean;
}

export function ViewModeSwitch({
  viewMode,
  onChangeMode,
  canInstallPwa = false,
  onInstallPwa,
  compact = false,
}: ViewModeSwitchProps) {
  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <div
        role="group"
        aria-label="Ubah mode tampilan Desktop atau Mobile"
        className="inline-flex items-center p-0.5 bg-[#FAF5EC] border border-[#5C3A21]/15 rounded-lg"
      >
        <button
          type="button"
          onClick={() => onChangeMode('desktop')}
          aria-pressed={viewMode === 'desktop'}
          title="Mode Tampilan Desktop"
          className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
            viewMode === 'desktop'
              ? 'bg-[#5C3A21] text-white shadow-xs'
              : 'text-[#7C604C] hover:text-[#5C3A21]'
          }`}
        >
          <Monitor className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {!compact && <span className="hidden lg:inline">Desktop</span>}
        </button>
        <button
          type="button"
          onClick={() => onChangeMode('mobile')}
          aria-pressed={viewMode === 'mobile'}
          title="Mode Tampilan Mobile / PWA"
          className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
            viewMode === 'mobile'
              ? 'bg-[#5C3A21] text-white shadow-xs'
              : 'text-[#7C604C] hover:text-[#5C3A21]'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {!compact && <span className="hidden lg:inline">Mobile</span>}
        </button>
      </div>

      {canInstallPwa && onInstallPwa && (
        <button
          type="button"
          onClick={onInstallPwa}
          title="Install Aplikasi (PWA)"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#5C3A21] bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#D97706]/30 rounded-lg transition-colors whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-[#B45309] shrink-0" aria-hidden="true" />
          <span className={compact ? 'hidden' : 'hidden xl:inline'}>Install App</span>
        </button>
      )}
    </div>
  );
}
