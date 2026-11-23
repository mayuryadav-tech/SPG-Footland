import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Category, SiteInfo } from '../types';
import { DEFAULT_SITE_INFO } from '../utils/formatters';
import { getCategories, getSiteInfo } from '../services/catalogueService';

interface SiteContextValue {
  siteInfo: SiteInfo;
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshSiteData: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(DEFAULT_SITE_INFO);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSiteData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [info, cats] = await Promise.all([getSiteInfo(), getCategories()]);
      setSiteInfo(info);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load store details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSiteData();
  }, [refreshSiteData]);

  return (
    <SiteContext.Provider value={{ siteInfo, categories, loading, error, refreshSiteData }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
