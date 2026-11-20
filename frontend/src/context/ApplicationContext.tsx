import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserApplication, ApplicationStatus } from '../types/application';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { mapBackendOpportunity } from './OpportunityContext';

const getUserApplicationsKey = (userId?: string) =>
  userId ? `sterling_connect_user_applications_${userId}` : 'sterling_connect_user_applications_guest';

const LEGACY_APPLICATIONS_KEY = 'sterling_connect_user_applications_v2';

interface ApplicationContextType {
  applications: UserApplication[];
  addOrUpdateApplication: (
    opportunityId: string,
    status: ApplicationStatus,
    notes?: string,
    appliedAt?: string
  ) => Promise<void>;
  updateStatus: (
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string,
    interviewDate?: string
  ) => Promise<void>;
  getApplicationByOppId: (opportunityId: string) => UserApplication | undefined;
  removeApplication: (applicationId: string) => Promise<void>;
  refreshApplications: () => Promise<void>;
  metrics: {
    total: number;
    preparing: number;
    applied: number;
    inProgress: number; // Shortlisted + Interview
    outcomes: number; // Successful/Awarded/Unsuccessful
  };
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

const mapBackendApp = (item: any): UserApplication => ({
  id: item.id,
  opportunityId: item.opportunityId,
  status: item.status,
  appliedAt: item.appliedAt ? item.appliedAt.split('T')[0] : undefined,
  outcomeAt: item.outcomeAt ? item.outcomeAt.split('T')[0] : undefined,
  notes: item.notes || '',
  createdAt: item.createdAt || new Date().toISOString(),
  updatedAt: item.updatedAt || new Date().toISOString(),
  opportunity: item.opportunity ? mapBackendOpportunity(item.opportunity) : undefined,
  history: (item.statusHistory || []).map((h: any) => ({
    id: h.id,
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    notes: h.notes,
    changedAt: h.changedAt,
  })),
});

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<UserApplication[]>([]);

  // Clean legacy unscoped application keys
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_APPLICATIONS_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Wipe state whenever the active user account changes
  useEffect(() => {
    setApplications([]);
  }, [user?.id]);

  const fetchApplications = useCallback(async () => {
    if (!user) {
      setApplications([]);
      return;
    }

    const appKey = getUserApplicationsKey(user.id);

    // Initial local read for this user
    try {
      const stored = localStorage.getItem(appKey);
      if (stored) {
        setApplications(JSON.parse(stored));
      } else {
        setApplications([]);
      }
    } catch {
      setApplications([]);
    }

    try {
      const res = await api.get('/applications');
      if (res.data?.applications) {
        const mapped = res.data.applications.map(mapBackendApp);
        // Server state for THIS user is the authoritative source
        setApplications(mapped);
        localStorage.setItem(appKey, JSON.stringify(mapped));
      }
    } catch {
      // Keep cached applications on offline
    }
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    if (!user) return;
    try {
      const appKey = getUserApplicationsKey(user.id);
      localStorage.setItem(appKey, JSON.stringify(applications));
    } catch {
      // ignore
    }
  }, [applications, user]);

  const addOrUpdateApplication = async (
    opportunityId: string,
    status: ApplicationStatus,
    notes?: string,
    appliedAt?: string
  ) => {
    const now = new Date().toISOString();

    // Optimistic local update
    setApplications((prev) => {
      const existingIndex = prev.findIndex((a) => a.opportunityId === opportunityId);

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const updatedApp: UserApplication = {
          ...existing,
          status,
          notes: notes !== undefined ? notes : existing.notes,
          appliedAt: appliedAt || existing.appliedAt,
          updatedAt: now,
          history: [
            ...existing.history,
            {
              id: 'h_' + Math.random().toString(36).substring(2, 9),
              fromStatus: existing.status,
              toStatus: status,
              notes,
              changedAt: now,
            },
          ],
        };
        const next = [...prev];
        next[existingIndex] = updatedApp;
        return next;
      }

      // Create new application record
      const newApp: UserApplication = {
        id: 'app_' + Math.random().toString(36).substring(2, 9),
        opportunityId,
        status,
        notes: notes || '',
        appliedAt,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: 'h_' + Math.random().toString(36).substring(2, 9),
            toStatus: status,
            notes: notes || 'Opportunity added to tracking pipeline.',
            changedAt: now,
          },
        ],
      };
      return [newApp, ...prev];
    });

    if (user) {
      try {
        const res = await api.post('/applications', {
          opportunityId,
          status,
          notes,
          appliedAt,
        });
        if (res.data?.id) {
          const mapped = mapBackendApp(res.data);
          setApplications((prev) => {
            const idx = prev.findIndex((a) => a.opportunityId === opportunityId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = mapped;
              return next;
            }
            return [mapped, ...prev];
          });
        }
      } catch {
        // silent fallback
      }
    }
  };

  const updateStatus = async (
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string,
    interviewDate?: string
  ) => {
    const now = new Date().toISOString();

    // Optimistic local update
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== applicationId) return app;

        return {
          ...app,
          status: newStatus,
          notes: notes !== undefined ? notes : app.notes,
          interviewDate: interviewDate || app.interviewDate,
          outcomeAt:
            ['OFFER_SUCCESSFUL', 'AWARDED', 'UNSUCCESSFUL', 'WITHDRAWN'].includes(newStatus)
              ? now
              : app.outcomeAt,
          updatedAt: now,
          history: [
            ...app.history,
            {
              id: 'h_' + Math.random().toString(36).substring(2, 9),
              fromStatus: app.status,
              toStatus: newStatus,
              notes,
              changedAt: now,
            },
          ],
        };
      })
    );

    if (user) {
      try {
        if (applicationId.startsWith('app_')) {
          const targetApp = applications.find((a) => a.id === applicationId);
          if (targetApp) {
            const res = await api.post('/applications', {
              opportunityId: targetApp.opportunityId,
              status: newStatus,
              notes,
            });
            if (res.data?.id) {
              const mapped = mapBackendApp(res.data);
              setApplications((prev) => {
                const idx = prev.findIndex((a) => a.id === applicationId || a.opportunityId === targetApp.opportunityId);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = mapped;
                  return next;
                }
                return [mapped, ...prev];
              });
            }
          }
        } else {
          await api.patch(`/applications/${applicationId}/status`, {
            status: newStatus,
            notes,
          });
        }
      } catch {
        // silent fallback
      }
    }
  };

  const getApplicationByOppId = (opportunityId: string) => {
    return applications.find((a) => a.opportunityId === opportunityId);
  };

  const removeApplication = async (applicationId: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));

    if (user) {
      try {
        await api.delete(`/applications/${applicationId}`);
        fetchApplications();
      } catch {
        // silent fallback
      }
    }
  };

  const metrics = {
    total: applications.length,
    preparing: applications.filter((a) => a.status === 'PREPARING' || a.status === 'SAVED').length,
    applied: applications.filter((a) => a.status === 'APPLIED').length,
    inProgress: applications.filter((a) => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW').length,
    outcomes: applications.filter((a) =>
      ['OFFER_SUCCESSFUL', 'AWARDED', 'UNSUCCESSFUL', 'WITHDRAWN'].includes(a.status)
    ).length,
  };

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        addOrUpdateApplication,
        updateStatus,
        getApplicationByOppId,
        removeApplication,
        refreshApplications: fetchApplications,
        metrics,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplications = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
};
