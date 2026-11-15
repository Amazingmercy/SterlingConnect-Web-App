import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AssessmentResult, CategoryResult, PerformanceBand } from '../types/assessment';
import { ASSESSMENT_QUESTIONS } from '../features/assessment/data/questions';
import { calculateAssessmentResult } from '../features/assessment/scoringEngine';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const getAnswersKey = (userId?: string) =>
  userId ? `sterling_connect_assessment_answers_${userId}` : 'sterling_connect_assessment_answers_guest';
const getResultKey = (userId?: string) =>
  userId ? `sterling_connect_assessment_result_${userId}` : 'sterling_connect_assessment_result_guest';

// Legacy keys to clean up
const LEGACY_ANSWERS_KEY = 'sterling_connect_assessment_answers';
const LEGACY_RESULT_KEY = 'sterling_connect_assessment_result';

interface AssessmentContextType {
  answers: Record<string, number>;
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  setAnswer: (questionId: string, value: number) => void;
  result: AssessmentResult | null;
  submitAssessment: () => Promise<AssessmentResult>;
  resetAssessment: () => void;
  clearAssessmentState: () => void;
  isCompleted: boolean;
  answeredCount: number;
  totalQuestions: number;
  hasUnsavedProgress: boolean;
  isSubmitting: boolean;
  serverSyncStatus: 'synced' | 'saving' | 'offline';
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverSyncStatus, setServerSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to clear all assessment state
  const clearAssessmentState = useCallback(() => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setServerSyncStatus('synced');
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }
  }, []);

  // Clean legacy unscoped keys on startup
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_ANSWERS_KEY);
      localStorage.removeItem(LEGACY_RESULT_KEY);
    } catch {
      // ignore
    }
  }, []);

  // User-scoped hydration & synchronization
  useEffect(() => {
    if (!user) {
      // Reset state for unauthenticated visitor or after logout
      clearAssessmentState();
      return;
    }

    const answersKey = getAnswersKey(user.id);
    const resultKey = getResultKey(user.id);

    // Initial local hydration for THIS specific user
    try {
      // If user has not completed assessment according to their profile, do not hydrate stale results
      if (!user.hasCompletedAssessment) {
        setResult(null);
        localStorage.removeItem(resultKey);
      } else {
        const storedResult = localStorage.getItem(resultKey);
        if (storedResult) {
          setResult(JSON.parse(storedResult));
        } else {
          setResult(null);
        }
      }

      const storedAnswers = localStorage.getItem(answersKey);
      if (storedAnswers) {
        setAnswers(JSON.parse(storedAnswers));
      } else {
        setAnswers({});
      }
    } catch {
      setAnswers({});
      setResult(null);
    }

    // Server-side verification for THIS user
    api
      .get('/assessment/results')
      .then((res) => {
        if (res.data?.completed && res.data.categoryScores) {
          const mappedResult: AssessmentResult = {
            completedAt: res.data.completedAt || new Date().toISOString(),
            version: '1.0',
            overallScore: res.data.overallScore || 0,
            categoryResults: res.data.categoryScores.map((c: any) => ({
              categoryId: c.categoryId,
              categoryTitle: c.categoryName,
              score: c.scorePercent,
              band: (c.readinessBand.charAt(0) + c.readinessBand.slice(1).toLowerCase()) as PerformanceBand,
              rawAnswers: [],
              rawSum: c.rawTotal,
              lowAnswerCount: c.lowResponseCount,
            })),
            priorityCategories: res.data.topPriorityCategories.map((c: any) => ({
              categoryId: c.categoryId,
              categoryTitle: c.categoryName,
              score: c.scorePercent,
              band: (c.readinessBand.charAt(0) + c.readinessBand.slice(1).toLowerCase()) as PerformanceBand,
              rawAnswers: [],
              rawSum: c.rawTotal,
              lowAnswerCount: c.lowResponseCount,
            })),
            strengths: res.data.categoryScores
              .filter((c: any) => c.scorePercent >= 75)
              .map((c: any) => ({
                categoryId: c.categoryId,
                categoryTitle: c.categoryName,
                score: c.scorePercent,
                band: 'Proficient' as PerformanceBand,
                rawAnswers: [],
                rawSum: c.rawTotal,
                lowAnswerCount: c.lowResponseCount,
              })),
          };
          setResult(mappedResult);
          localStorage.setItem(resultKey, JSON.stringify(mappedResult));
        } else {
          // This user has NOT completed assessment: explicitly purge any stale result!
          setResult(null);
          localStorage.removeItem(resultKey);

          // Fetch user-specific draft responses
          api
            .get('/assessment/questions')
            .then((qRes) => {
              if (qRes.data?.draftResponses && Object.keys(qRes.data.draftResponses).length > 0) {
                setAnswers(qRes.data.draftResponses);
                localStorage.setItem(answersKey, JSON.stringify(qRes.data.draftResponses));
              } else {
                setAnswers({});
                localStorage.removeItem(answersKey);
              }
            })
            .catch(() => {
              setAnswers({});
            });
        }
      })
      .catch(() => {
        // If results endpoint fails/404, respect user.hasCompletedAssessment
        if (!user.hasCompletedAssessment) {
          setResult(null);
          localStorage.removeItem(resultKey);
        }
      });
  }, [user?.id, user?.hasCompletedAssessment, clearAssessmentState]);

  // Debounced server draft saver for current user
  const saveDraftToServer = useCallback(
    (latestAnswers: Record<string, number>) => {
      if (!user) return;
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }

      draftSaveTimeoutRef.current = setTimeout(async () => {
        try {
          setServerSyncStatus('saving');
          const payload = Object.entries(latestAnswers).map(([code, score]) => ({
            questionCode: code,
            response: score,
          }));

          await api.post('/assessment/save-draft', { responses: payload });
          setServerSyncStatus('synced');
        } catch {
          setServerSyncStatus('offline');
        }
      }, 1200);
    },
    [user],
  );

  const setAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: value };
      const answersKey = getAnswersKey(user?.id);
      localStorage.setItem(answersKey, JSON.stringify(updated));
      saveDraftToServer(updated);
      return updated;
    });
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  // Completed is true ONLY when result exists AND belongs to authenticated state
  const isCompleted = !!result && Boolean(user?.hasCompletedAssessment !== false);
  const hasUnsavedProgress = answeredCount > 0 && !isCompleted;

  const submitAssessment = async (): Promise<AssessmentResult> => {
    setIsSubmitting(true);
    const answersKey = getAnswersKey(user?.id);
    const resultKey = getResultKey(user?.id);

    try {
      // 1. Send to backend if authenticated
      const payload = Object.entries(answers).map(([code, score]) => ({
        questionCode: code,
        response: score,
      }));

      const res = await api.post('/assessment/submit', { responses: payload });

      if (res.data && res.data.categoryScores) {
        const mappedResult: AssessmentResult = {
          completedAt: res.data.completedAt || new Date().toISOString(),
          version: '1.0',
          overallScore: res.data.overallScore || 0,
          categoryResults: res.data.categoryScores.map((c: any) => ({
            categoryId: c.categoryId,
            categoryTitle: c.categoryName,
            score: c.scorePercent,
            band: (c.readinessBand.charAt(0) + c.readinessBand.slice(1).toLowerCase()) as PerformanceBand,
            rawAnswers: [],
            rawSum: c.rawTotal,
            lowAnswerCount: c.lowResponseCount,
          })),
          priorityCategories: res.data.topPriorityCategories.map((c: any) => ({
            categoryId: c.categoryId,
            categoryTitle: c.categoryName,
            score: c.scorePercent,
            band: (c.readinessBand.charAt(0) + c.readinessBand.slice(1).toLowerCase()) as PerformanceBand,
            rawAnswers: [],
            rawSum: c.rawTotal,
            lowAnswerCount: c.lowResponseCount,
          })),
          strengths: res.data.categoryScores
            .filter((c: any) => c.scorePercent >= 75)
            .map((c: any) => ({
              categoryId: c.categoryId,
              categoryTitle: c.categoryName,
              score: c.scorePercent,
              band: 'Proficient' as PerformanceBand,
              rawAnswers: [],
              rawSum: c.rawTotal,
              lowAnswerCount: c.lowResponseCount,
            })),
        };

        setResult(mappedResult);
        localStorage.setItem(resultKey, JSON.stringify(mappedResult));
        // Clear draft responses after successful submission
        localStorage.removeItem(answersKey);

        // Refresh user context so hasCompletedAssessment is true immediately
        if (refreshUser) {
          await refreshUser();
        }

        setIsSubmitting(false);
        return mappedResult;
      }
    } catch {
      // Fallback to local calculation if offline/error
    }

    // Local fallback
    const calculated = calculateAssessmentResult(answers);
    setResult(calculated);
    localStorage.setItem(resultKey, JSON.stringify(calculated));
    localStorage.removeItem(answersKey);

    if (refreshUser) {
      await refreshUser();
    }
    setIsSubmitting(false);
    return calculated;
  };

  const resetAssessment = () => {
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    const answersKey = getAnswersKey(user?.id);
    const resultKey = getResultKey(user?.id);
    localStorage.removeItem(answersKey);
    localStorage.removeItem(resultKey);
    localStorage.removeItem(LEGACY_ANSWERS_KEY);
    localStorage.removeItem(LEGACY_RESULT_KEY);
  };

  return (
    <AssessmentContext.Provider
      value={{
        answers,
        currentIndex,
        setCurrentIndex,
        setAnswer,
        result,
        submitAssessment,
        resetAssessment,
        clearAssessmentState,
        isCompleted,
        answeredCount,
        totalQuestions,
        hasUnsavedProgress,
        isSubmitting,
        serverSyncStatus,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
