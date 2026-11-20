import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';
import { useSystemLinks } from '../context/SystemLinksContext';

export const Footer: React.FC = () => {
  const { links } = useSystemLinks();
  return (
    <footer className="bg-white border-t border-[#edf0f3] mt-auto">
      <div className="max-w-7xl mx-auto px-[max(5vw,24px)] py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <Link
              to="/"
              className="inline-flex items-baseline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#90cfc0] rounded-md transition-opacity hover:opacity-95"
              aria-label="Sterling Connect Home"
            >
              <BrandLogo size="md" animated={true} withConnect={true} />
            </Link>
            <p className="text-[12px] text-[#627086] leading-relaxed max-w-[240px]">
              From readiness to opportunity. Guiding students, researchers, and professionals to verified opportunities worldwide.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-[11px] font-bold text-[#102641] uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2.5 text-[13px] font-medium text-[#42516a]">
              <li>
                <Link to="/opportunities" className="hover:text-[#087b63] transition-colors">
                  Browse Opportunities
                </Link>
              </li>
              <li>
                <Link to="/assessment" className="hover:text-[#087b63] transition-colors">
                  Readiness Assessment
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="text-[11px] font-bold text-[#102641] uppercase tracking-wider mb-3">
              Ecosystem
            </h4>
            <ul className="space-y-2.5 text-[13px] font-medium text-[#42516a]">
              <li>
                <a
                  href={links.academyUrl || 'https://learn.sterlinglrs.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Sterling Academy in a new tab"
                  className="inline-flex items-center gap-1 hover:text-[#087b63] transition-colors"
                >
                  Sterling Academy
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#087b63] transition-colors">
                  About Sterling
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${links.supportEmail || 'support@sterlingconnect.org'}`}
                  className="hover:text-[#087b63] transition-colors"
                >
                  Help
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-bold text-[#102641] uppercase tracking-wider mb-3">
              Legal
            </h4>
            <ul className="space-y-2.5 text-[13px] font-medium text-[#42516a]">
              <li>
                {links.termsUrl && links.termsUrl.startsWith('http') ? (
                  <a
                    href={links.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#087b63] transition-colors"
                  >
                    Terms of Use
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <Link to={links.termsUrl || '/terms'} className="hover:text-[#087b63] transition-colors">
                    Terms of Use
                  </Link>
                )}
              </li>
              <li>
                {links.privacyNoticeUrl && links.privacyNoticeUrl.startsWith('http') ? (
                  <a
                    href={links.privacyNoticeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#087b63] transition-colors"
                  >
                    Privacy Notice
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <Link to={links.privacyNoticeUrl || '/privacy'} className="hover:text-[#087b63] transition-colors">
                    Privacy Notice
                  </Link>
                )}
              </li>
              <li>
                <span className="text-[11px] text-[#627086]">
                  Version 1.0 &bull; Prototype
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Exact Specification Boundary Disclaimer */}
        <div className="mt-8 pt-6 border-t border-[#edf0f3]">
          <p className="text-[12px] text-[#526078] leading-relaxed max-w-4xl">
            <strong className="text-[#102641] font-semibold">Boundary notice: </strong>
            Sterling Connect supports preparation and opportunity discovery. It does not guarantee eligibility, selection, employment or scholarship awards.
          </p>
        </div>

        {/* Bottom copyright */}
        <div className="pt-4 mt-4 border-t border-[#f1f4f6] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#627086]">
          <p>&copy; {new Date().getFullYear()} Sterling Learning &amp; Research Solutions.</p>
          <p className="text-[11px]">
            Opportunity listings must be verified on official provider websites.
          </p>
        </div>
      </div>
    </footer>
  );
};
