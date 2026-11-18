import type { SiteSettings } from '../types/bakery';

interface FooterProps {
  siteSettings: SiteSettings;
  isMobileMode?: boolean;
}

export function Footer({ siteSettings, isMobileMode = false }: FooterProps) {
  return (
    <footer
      className={`border-t border-[#5C3A21]/10 bg-[#FFFDF9] py-10 ${
        isMobileMode ? 'pb-44' : 'pb-24'
      }`}
    >
      <div className="mode-stack-col max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="font-display text-lg font-bold text-[#5C3A21]">
            {siteSettings.brandName}
          </p>
          <p className="mt-1 text-xs text-[#7C604C]">
            {siteSettings.footerServiceText}
            {siteSettings.operatingHours ? ` · ${siteSettings.operatingHours}` : ''}
          </p>
          {siteSettings.footerAddress && (
            <p className="mt-1 text-xs text-[#6E5644]">{siteSettings.footerAddress}</p>
          )}
        </div>

        <div
          className={`text-xs text-[#6E5644] space-y-1 ${
            isMobileMode ? 'text-left' : 'sm:text-right'
          }`}
        >
          <p>
            Rekening Resmi: {siteSettings.bankName} {siteSettings.bankAccountNumber} a.n.{' '}
            {siteSettings.bankAccountHolder}
          </p>
          <p className="text-[#7C604C]">
            © {new Date().getFullYear()} {siteSettings.brandName}. {siteSettings.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
