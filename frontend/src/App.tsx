import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { AssessmentProvider } from './context/AssessmentContext';
import { OpportunityProvider } from './context/OpportunityContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { AppLayout } from './layouts/AppLayout';
// import { LandingPage } from './features/landing/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
// import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyEmailPage } from './features/auth/VerifyEmailPage';
import { SignInPage } from './features/auth/SignInPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { PathwaySelectionPage } from './features/auth/PathwaySelectionPage';
import { ProfileBuilderPage } from './features/profile/ProfileBuilderPage';
import { CareerProfilePage } from './features/profile/CareerProfilePage';
import { ScholarshipProfilePage } from './features/profile/ScholarshipProfilePage';
import { AssessmentGatePage } from './features/assessment/AssessmentGatePage';
import { AssessmentQuestionnairePage } from './features/assessment/AssessmentQuestionnairePage';
import { AssessmentResultsPage } from './features/assessment/AssessmentResultsPage';
import { RecommendedLearningPage } from './features/recommendations';
import { OpportunitiesCatalogPage } from './features/opportunities/OpportunitiesCatalogPage';
import { OpportunityDetailPage } from './features/opportunities/OpportunityDetailPage';
import { SavedOpportunitiesPage } from './features/opportunities/SavedOpportunitiesPage';
import { ApplicationPipelinePage } from './features/applications/ApplicationPipelinePage';
import { OutcomeFollowUpPage } from './features/applications/OutcomeFollowUpPage';
import { UserDashboardPage } from './features/dashboard/UserDashboardPage';
import { SettingsPage } from './features/dashboard/SettingsPage';
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { AdminOpportunitiesPage } from './features/admin/AdminOpportunitiesPage';
import { AdminBulkImportPage } from './features/admin/AdminBulkImportPage';
import { AdminUsersPage } from './features/admin/AdminUsersPage';
import { AdminAuditLogsPage } from './features/admin/AdminAuditLogsPage';
import { AdminAssessmentVersionsPage } from './features/admin/AdminAssessmentVersionsPage';
import { AdminRecommendationRulesPage } from './features/admin/AdminRecommendationRulesPage';
import { AdminTaxonomiesPage } from './features/admin/AdminTaxonomiesPage';
import { AdminApplicationsPage } from './features/admin/AdminApplicationsPage';
import { AdminAnalyticsPage } from './features/admin/AdminAnalyticsPage';
import { AdminEmailTemplatesPage } from './features/admin/AdminEmailTemplatesPage';
import { AdminEmailLogsPage } from './features/admin/AdminEmailLogsPage';
import { AdminStaffAccessPage } from './features/admin/AdminStaffAccessPage';
import { AdminSettingsPage } from './features/admin/AdminSettingsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TaxonomyProvider } from './context/TaxonomyContext';
import { SystemLinksProvider } from './context/SystemLinksContext';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { initGA, trackPageView } from './utils/analytics';
import { api } from './services/api';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const setupGA = async () => {
      try {
        const res = await api.get('/auth/analytics-config');
        if (res.data?.measurementId && res.data?.enabled !== false) {
          initGA(res.data.measurementId);
          return;
        }
      } catch {
        // Fallback to client default or env
      }
      initGA();
    };

    setupGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <SystemLinksProvider>
        <AuthProvider>
        <TaxonomyProvider>
          <ProfileProvider>
            <AssessmentProvider>
              <OpportunityProvider>
                <ApplicationProvider>
                  <Router>
                    <AnalyticsTracker />
                    <Routes>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<Navigate replace to="/sign-in" />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />

                      {/* Feature 2: Auth & Onboarding Flow */}
                      <Route path="/register" element={<Navigate replace to="/sign-in" />} />
                      <Route path="/verify-email" element={<VerifyEmailPage />} />
                      <Route path="/signin" element={<SignInPage />} />
                      <Route path="/sign-in" element={<SignInPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route
                        path="/pathway"
                        element={
                          <ProtectedRoute>
                            <PathwaySelectionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/onboarding/pathways"
                        element={
                          <ProtectedRoute>
                            <PathwaySelectionPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Feature 3: Structured Profile Builder */}
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfileBuilderPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/common"
                        element={
                          <ProtectedRoute>
                            <ProfileBuilderPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/career"
                        element={
                          <ProtectedRoute>
                            <CareerProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile/scholarships"
                        element={
                          <ProtectedRoute>
                            <ScholarshipProfilePage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Feature 4: Readiness Assessment Engine */}
                      <Route
                        path="/assessment"
                        element={
                          <ProtectedRoute>
                            <AssessmentGatePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/assessment/questions"
                        element={
                          <ProtectedRoute>
                            <AssessmentQuestionnairePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/assessment/results"
                        element={
                          <ProtectedRoute>
                            <AssessmentResultsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/action-plan"
                        element={<Navigate replace to="/recommendations" />}
                      />
                      <Route
                        path="/recommendations"
                        element={
                          <ProtectedRoute>
                            <RecommendedLearningPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/learning"
                        element={
                          <ProtectedRoute>
                            <RecommendedLearningPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Feature 5: Opportunities Catalog, Personalised Feed (U17), Saved (U19) & Detail */}
                      <Route path="/opportunities" element={<OpportunitiesCatalogPage />} />
                      <Route
                        path="/opportunities/for-you"
                        element={
                          <ProtectedRoute>
                            <OpportunitiesCatalogPage initialTab="For you" />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
                      <Route
                        path="/saved"
                        element={
                          <ProtectedRoute>
                            <SavedOpportunitiesPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Feature 6: Application Pipeline (U20) & Outcome Follow-up (U22) */}
                      <Route
                        path="/applications"
                        element={
                          <ProtectedRoute>
                            <ApplicationPipelinePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/applications/:application_id/update"
                        element={
                          <ProtectedRoute>
                            <OutcomeFollowUpPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Feature 7: Dashboard, Notifications (U24) & Settings (U25) */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <UserDashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={<Navigate replace to="/dashboard" />}
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/preferences"
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/account/preferences"
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Feature 5 Operations: Admin Console (A01 - A15) */}
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute requireAdmin>
                            <AdminLayout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<AdminDashboardPage />} />
                        <Route path="opportunities" element={<AdminOpportunitiesPage />} />
                        <Route path="import" element={<AdminBulkImportPage />} />
                        <Route path="users" element={<AdminUsersPage />} />
                        <Route path="versions" element={<AdminAssessmentVersionsPage />} />
                        <Route path="rules" element={<AdminRecommendationRulesPage />} />
                        <Route path="taxonomies" element={<AdminTaxonomiesPage />} />
                        <Route path="applications" element={<AdminApplicationsPage />} />
                        <Route path="analytics" element={<AdminAnalyticsPage />} />
                        <Route path="templates" element={<AdminEmailTemplatesPage />} />
                        <Route path="email-logs" element={<AdminEmailLogsPage />} />
                        <Route path="staff" element={<AdminStaffAccessPage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                        <Route path="audit" element={<AdminAuditLogsPage />} />
                      </Route>

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
        </ApplicationProvider>
        </OpportunityProvider>
        </AssessmentProvider>
        </ProfileProvider>
        </TaxonomyProvider>
      </AuthProvider>
      </SystemLinksProvider>
    </ToastProvider>
  );
}
