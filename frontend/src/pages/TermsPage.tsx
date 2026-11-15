import React from 'react';
import { Card } from '../components/ui/Card';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Card className="p-8 sm:p-10 space-y-6">
        <div>
          <h1 className="font-brand font-bold text-3xl text-sterling-navy tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-sterling-muted mt-1">
            Last Updated: October 2026 &bull; MVP Version 1.0
          </p>
        </div>

        <section className="space-y-3 text-xs text-sterling-muted leading-relaxed">
          <h2 className="font-brand font-bold text-sm text-sterling-navy">
            1. Platform Purpose &amp; Scope
          </h2>
          <p>
            Sterling Connect provides opportunity navigation, readiness self-assessments, and tracking tools. All opportunity listings, deadlines, eligibility criteria, and match explanations are provided for informational and planning purposes only.
          </p>
        </section>

        <section className="space-y-3 text-xs text-sterling-muted leading-relaxed">
          <h2 className="font-brand font-bold text-sm text-sterling-navy">
            2. External Applications &amp; Decisions
          </h2>
          <p>
            Saving or tracking an opportunity within Sterling Connect does not submit an application to, nor create an affiliation with, the scholarship provider or employer. Users are solely responsible for verifying official requirements and submitting applications directly on the respective official provider websites.
          </p>
        </section>

        <section className="space-y-3 text-xs text-sterling-muted leading-relaxed">
          <h2 className="font-brand font-bold text-sm text-sterling-navy">
            3. Readiness Diagnostics
          </h2>
          <p>
            Readiness assessment scores and learning recommendations reflect self-reported diagnostic criteria and do not constitute a guarantee of admission, scholarship award, or employment.
          </p>
        </section>

        <section className="space-y-3 text-xs text-sterling-muted leading-relaxed">
          <h2 className="font-brand font-bold text-sm text-sterling-navy">
            4. User Responsibility
          </h2>
          <p>
            You agree to provide accurate information in your profile and assessment. Do not rely exclusively on Sterling Connect notifications or deadline estimates as the sole record of an official deadline.
          </p>
        </section>
      </Card>
    </div>
  );
};
