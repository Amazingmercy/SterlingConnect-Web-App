import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface SystemLinks {
  supportEmail: string;
  privacyNoticeUrl: string;
  termsUrl: string;
  academyUrl: string;
  corporateUrl: string;
}

const DEFAULT_LINKS: SystemLinks = {
  supportEmail: 'support@sterlingconnect.org',
  privacyNoticeUrl: '/privacy',
  termsUrl: '/terms',
  academyUrl: 'https://learn.sterlinglrs.com',
  corporateUrl: 'https://sterlinglrs.com',
};

const STORAGE_KEY = 'sterling_public_links';

interface SystemLinksContextType {
  links: SystemLinks;
  refreshLinks: () => Promise<void>;
}

const SystemLinksContext = createContext<SystemLinksContextType>({
  links: DEFAULT_LINKS,
  refreshLinks: async () => {},
});

export const SystemLinksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [links, setLinks] = useState<SystemLinks>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_LINKS, ...JSON.parse(stored) };
      }
    } catch {}
    return DEFAULT_LINKS;
  });

  const fetchLinks = useCallback(async () => {
    try {
      const res = await api.get('/settings/public');
      if (res.data) {
        const fresh: SystemLinks = {
          supportEmail: res.data.supportEmail || DEFAULT_LINKS.supportEmail,
          privacyNoticeUrl: res.data.privacyNoticeUrl || DEFAULT_LINKS.privacyNoticeUrl,
          termsUrl: res.data.termsUrl || DEFAULT_LINKS.termsUrl,
          academyUrl: res.data.academyUrl || DEFAULT_LINKS.academyUrl,
          corporateUrl: res.data.corporateUrl || DEFAULT_LINKS.corporateUrl,
        };
        setLinks(fresh);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      }
    } catch {
      // Keep cached or default links
    }
  }, []);

  useEffect(() => {
    fetchLinks();

    const handleSettingsUpdated = () => {
      fetchLinks();
    };

    window.addEventListener('sterling_settings_updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('sterling_settings_updated', handleSettingsUpdated);
    };
  }, [fetchLinks]);

  return (
    <SystemLinksContext.Provider value={{ links, refreshLinks: fetchLinks }}>
      {children}
    </SystemLinksContext.Provider>
  );
};

export const useSystemLinks = () => useContext(SystemLinksContext);
