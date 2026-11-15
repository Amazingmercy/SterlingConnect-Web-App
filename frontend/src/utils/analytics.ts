/**
 * SterlingConnect Google Analytics 4 (GA4) Integration Engine
 * Provides route tracking, custom candidate event dispatching,
 * and a live in-session event stream for super admin verification.
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface AnalyticsEventRecord {
  id: string;
  name: string;
  timestamp: string;
  params: Record<string, any>;
  status: 'DISPATCHED' | 'QUEUED' | 'SIMULATED';
}

const STORAGE_EVENTS_KEY = 'sterling_analytics_recent_events';
const DEFAULT_MEASUREMENT_ID = 'G-8V6ZJ2E9X1';

let isInitialized = false;
let currentMeasurementId: string | null = null;

/**
 * Initializes the Google Analytics 4 (gtag.js) script dynamically.
 */
export const initGA = (measurementId?: string): void => {
  if (typeof window === 'undefined') return;

  const id =
    measurementId ||
    import.meta.env.VITE_GA_MEASUREMENT_ID ||
    DEFAULT_MEASUREMENT_ID;

  if (!id) return;
  currentMeasurementId = id;

  // Set up dataLayer and gtag caller
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  // Inject script tag if not already on the page
  const existingScript = document.getElementById('sterling-ga-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'sterling-ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);
  }

  // Initialize timestamp
  window.gtag('js', new Date());

  // Disable automatic page view so React Router handles it deterministically
  window.gtag('config', id, {
    send_page_view: false,
    anonymize_ip: true,
  });

  isInitialized = true;
  console.info(`[Analytics] Google Analytics 4 initialized for SterlingConnect (${id})`);
};

export const getActiveMeasurementId = (): string => {
  return currentMeasurementId || import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_MEASUREMENT_ID;
};

/**
 * Log event to local storage buffer so Super Admin can observe in real-time
 */
const recordLocalEvent = (
  name: string,
  params: Record<string, any> = {},
  status: 'DISPATCHED' | 'QUEUED' | 'SIMULATED' = 'DISPATCHED',
): AnalyticsEventRecord => {
  const eventRecord: AnalyticsEventRecord = {
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    timestamp: new Date().toISOString(),
    params,
    status,
  };

  try {
    const existing = getRecentAnalyticsEvents();
    const updated = [eventRecord, ...existing].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sterling_analytics_event', { detail: eventRecord }));
  } catch (err) {
    console.debug('Failed to buffer analytics event locally', err);
  }

  return eventRecord;
};

/**
 * Retrieve recent events captured during this session
 */
export const getRecentAnalyticsEvents = (): AnalyticsEventRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Clear local analytics event log
 */
export const clearRecentAnalyticsEvents = (): void => {
  try {
    localStorage.removeItem(STORAGE_EVENTS_KEY);
    window.dispatchEvent(new CustomEvent('sterling_analytics_event_cleared'));
  } catch {}
};

/**
 * Tracks a Single Page Application route navigation
 */
export const trackPageView = (path: string, title?: string): void => {
  if (typeof window === 'undefined') return;

  const pageTitle = title || document.title || 'Sterling Connect';
  const id = getActiveMeasurementId();

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: pageTitle,
      send_to: id,
    });
    recordLocalEvent('page_view', { path, title: pageTitle }, 'DISPATCHED');
  } else {
    recordLocalEvent('page_view', { path, title: pageTitle }, 'SIMULATED');
  }
};

/**
 * Dispatches a custom GA4 event
 */
export const trackEvent = (
  eventName: string,
  params: Record<string, any> = {},
): AnalyticsEventRecord => {
  if (typeof window === 'undefined') {
    return {
      id: 'server_env',
      name: eventName,
      timestamp: new Date().toISOString(),
      params,
      status: 'SIMULATED',
    };
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
    return recordLocalEvent(eventName, params, 'DISPATCHED');
  } else {
    return recordLocalEvent(eventName, params, 'SIMULATED');
  }
};

// ==========================================
// STERLING CONNECT DOMAIN-SPECIFIC EVENTS
// ==========================================

export const trackUserRegistered = (pathway?: string, method: string = 'email') => {
  return trackEvent('user_registered', {
    pathway: pathway || 'UNASSIGNED',
    method,
  });
};

export const trackPathwaySelected = (pathway: string, primaryGoal?: string) => {
  return trackEvent('pathway_selected', {
    pathway,
    primary_goal: primaryGoal || 'NONE',
  });
};

export const trackAssessmentStarted = (pathway: string) => {
  return trackEvent('assessment_started', {
    pathway,
  });
};

export const trackAssessmentCompleted = (
  pathway: string,
  score: number,
  readinessBand: string,
) => {
  return trackEvent('assessment_completed', {
    pathway,
    score,
    readiness_band: readinessBand,
  });
};

export const trackOpportunityViewed = (
  opportunityId: string,
  title: string,
  type: string,
) => {
  return trackEvent('opportunity_viewed', {
    opportunity_id: opportunityId,
    title,
    type,
  });
};

export const trackOpportunitySaved = (opportunityId: string, title: string) => {
  return trackEvent('opportunity_saved', {
    opportunity_id: opportunityId,
    title,
  });
};

export const trackOpportunityApplied = (
  opportunityId: string,
  title: string,
  type: string,
) => {
  return trackEvent('opportunity_applied', {
    opportunity_id: opportunityId,
    title,
    type,
  });
};

export const dispatchTestEvent = (): AnalyticsEventRecord => {
  return trackEvent('superadmin_test_ping', {
    source: 'SuperAdmin Analytics Console',
    verified_at: new Date().toISOString(),
    client_agent: navigator.userAgent,
  });
};
