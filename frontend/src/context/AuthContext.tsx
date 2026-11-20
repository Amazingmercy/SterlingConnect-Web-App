import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, RegisterFormData, LoginFormData, PathwayType } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string; user?: User }>;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string; user?: User }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string; error?: string }>;
  setPathway: (
    pathway: PathwayType,
    primaryGoal?: PathwayType,
    goal?: string,
    stage?: string,
  ) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'sterling_connect_user';
const TOKEN_STORAGE_KEY = 'sterling_connect_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        const apiUser = res.data.user;
        const formatted: User = {
          id: apiUser.id,
          email: apiUser.email,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          role: apiUser.role || 'USER',
          country: apiUser.commonProfile?.locationCountry || 'Nigeria',
          nationality: apiUser.commonProfile?.nationalities?.[0] || 'Nigerian',
          isEmailVerified: apiUser.isEmailVerified,
          hasCompletedAssessment: apiUser.hasCompletedAssessment,
          hasSelectedPathway: Boolean(apiUser.hasSelectedPathway),
          pathway:
            apiUser.activePathway === 'SCHOLARSHIP'
              ? 'Education & Scholarships'
              : 'Career & Employment',
          createdAt: apiUser.createdAt,
        };
        setUser(formatted);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(formatted));
        return;
      }
    } catch {
      // Fallback to cached user if offline or server reboot
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load user session on startup: try /api/auth/me, fallback to localStorage
  useEffect(() => {
    fetchMe();
  }, []);

  const refreshUser = async () => {
    await fetchMe();
  };

  const register = async (data: RegisterFormData): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      return { success: false, error: 'Please fill in all required fields.' };
    }

    try {
      const res = await api.post('/auth/register', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        country: data.country || 'Nigeria',
        nationality: data.nationality || 'Nigerian',
        pathway: data.pathway,
        agreeToTerms: data.agreeToTerms,
      });

      if (res.data?.user) {
        const apiUser = res.data.user;
        const newUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          role: apiUser.role || 'USER',
          country: data.country || 'Nigeria',
          nationality: data.nationality || 'Nigerian',
          isEmailVerified: apiUser.isEmailVerified || false,
          hasCompletedAssessment: Boolean(apiUser.hasCompletedAssessment),
          pathway:
            apiUser.activePathway === 'SCHOLARSHIP'
              ? 'Education & Scholarships'
              : 'Career & Employment',
          createdAt: apiUser.createdAt || new Date().toISOString(),
        };

        setUser(newUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        if (res.data.accessToken) {
          localStorage.setItem(TOKEN_STORAGE_KEY, res.data.accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
        }
        return { success: true, user: newUser };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg };
    }

    return { success: false, error: 'Unable to register.' };
  };

  const login = async (data: LoginFormData): Promise<{ success: boolean; error?: string; user?: User }> => {
    const username = (data.username || data.email || '').trim();
    if (!username || !data.password) {
      return { success: false, error: 'Enter your username and password to continue.' };
    }

    try {
      const res = await api.post('/auth/login', {
        username,
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (res.data?.user) {
        const apiUser = res.data.user;
        const loggedInUser: User = {
          id: apiUser.id,
          email: apiUser.email,
          firstName: apiUser.firstName,
          lastName: apiUser.lastName,
          role: apiUser.role || 'USER',
          country: 'Nigeria',
          nationality: 'Nigerian',
          isEmailVerified: apiUser.isEmailVerified,
          hasCompletedAssessment: apiUser.hasCompletedAssessment,
          hasSelectedPathway: Boolean(apiUser.hasSelectedPathway),
          pathway:
            apiUser.activePathway === 'SCHOLARSHIP'
              ? 'Education & Scholarships'
              : 'Career & Employment',
          createdAt: apiUser.createdAt,
        };

        setUser(loggedInUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
        if (res.data.accessToken) {
          localStorage.setItem(TOKEN_STORAGE_KEY, res.data.accessToken);
        }
        return { success: true, user: loggedInUser };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      return { success: false, error: Array.isArray(msg) ? msg[0] : msg };
    }

    return { success: false, error: 'Login failed.' };
  };

  const verifyEmail = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post('/auth/verify-email', { code, token: code });
      if (user) {
        const updated = { ...user, isEmailVerified: true };
        setUser(updated);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired code.';
      return { success: false, error: msg };
    }
  };

  const resendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.post('/auth/resend-verification');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.message || 'Failed to resend.' };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: res.data?.message || 'If an account exists for this email address, we’ll send a password reset link.',
      };
    } catch {
      return {
        success: true, // Always generic success response per specification
        message: 'If an account exists for this email address, we’ll send a password reset link.',
      };
    }
  };

  const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      return {
        success: true,
        message: res.data?.message || 'Your password has been updated. Sign in to continue.',
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'This verification link has expired or has already been used. Request a new link to continue.';
      return {
        success: false,
        message: msg,
        error: msg,
      };
    }
  };

  const setPathway = async (
    pathway: PathwayType,
    primaryGoal?: PathwayType,
    goal?: string,
    stage?: string,
  ): Promise<void> => {
    const apiPathway =
      (pathway.includes('Scholarship') || pathway.includes('Education')) && !pathway.includes('Both')
        ? 'SCHOLARSHIP'
        : (primaryGoal?.includes('Scholarship') || primaryGoal?.includes('Education'))
        ? 'SCHOLARSHIP'
        : 'EMPLOYMENT';

    try {
      await api.patch('/auth/pathway', {
        pathway: apiPathway,
        goal: goal || undefined,
        stage: stage || undefined,
      });
    } catch {}

    if (user) {
      const updated: User = { ...user, pathway, primaryGoal, hasSelectedPathway: true };
      setUser(updated);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}

    const currentUserId = user?.id;

    // Purge session tokens
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    delete api.defaults.headers.common['Authorization'];

    // Purge legacy un-scoped storage keys
    localStorage.removeItem('sterling_connect_assessment_answers');
    localStorage.removeItem('sterling_connect_assessment_result');
    localStorage.removeItem('sterling_connect_profile_v2');
    localStorage.removeItem('sterling_connect_user_applications_v2');
    localStorage.removeItem('sterling_connect_saved_opportunities');
    localStorage.removeItem('sterling_connect_notifications_v1');

    // Purge user-scoped keys for the user logging out
    if (currentUserId) {
      localStorage.removeItem(`sterling_connect_assessment_answers_${currentUserId}`);
      localStorage.removeItem(`sterling_connect_assessment_result_${currentUserId}`);
      localStorage.removeItem(`sterling_connect_profile_${currentUserId}`);
      localStorage.removeItem(`sterling_connect_saved_opportunities_${currentUserId}`);
      localStorage.removeItem(`sterling_connect_user_applications_${currentUserId}`);
      localStorage.removeItem(`sterling_connect_notifications_${currentUserId}`);
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        register,
        login,
        verifyEmail,
        resendVerificationEmail,
        forgotPassword,
        resetPassword,
        setPathway,
        updateUser,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
