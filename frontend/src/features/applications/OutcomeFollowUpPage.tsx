import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Calendar, HelpCircle, Bell } from 'lucide-react';
import { useApplications } from '../../context/ApplicationContext';
import { useOpportunities } from '../../context/OpportunityContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ApplicationStatus } from '../../types/application';

export const OutcomeFollowUpPage: React.FC = () => {
  const { application_id } = useParams<{ application_id: string }>();
  const navigate = useNavigate();
  const { applications, updateStatus } = useApplications();
  const { opportunities } = useOpportunities();
  const { toast } = useToast();

  const application = applications.find((a) => a.id === application_id);
  const opportunity = application
    ? opportunities.find((o) => o.id === application.opportunityId)
    : undefined;

  const isScholarship = opportunity?.opportunityType === 'SCHOLARSHIP';

  // Status option mapping to specification
  // No update yet | Shortlisted | Interview | Offer received or opportunity secured | Scholarship awarded | Unsuccessful | Withdrawn
  type OptionKey =
    | 'NO_UPDATE'
    | 'SHORTLISTED'
    | 'INTERVIEW'
    | 'SUCCESS'
    | 'UNSUCCESSFUL'
    | 'WITHDRAWN';

  const [selectedOption, setSelectedOption] = useState<OptionKey>('NO_UPDATE');
  const [outcomeDate, setOutcomeDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>('');

  if (!application || !opportunity) {
    return (
      <div className="py-12 px-4 max-w-2xl mx-auto text-center space-y-4">
        <h2 className="font-brand font-extrabold text-2xl text-[#102641]">
          Application Not Found
        </h2>
        <p className="text-xs text-[#627086]">
          The tracked application you are looking for does not exist or may have been removed.
        </p>
        <Link to="/applications">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back to My Applications
          </Button>
        </Link>
      </div>
    );
  }

  const successLabel = isScholarship
    ? 'Scholarship awarded'
    : 'Offer received or opportunity secured';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetStatus: ApplicationStatus = application.status;
    let successMessage = 'Your progress has been updated.';

    if (selectedOption === 'SHORTLISTED') {
      targetStatus = 'SHORTLISTED';
    } else if (selectedOption === 'INTERVIEW') {
      targetStatus = 'INTERVIEW';
    } else if (selectedOption === 'SUCCESS') {
      if (isScholarship) {
        targetStatus = 'AWARDED';
        successMessage =
          'Your scholarship award has been recorded. Keep the provider’s confirmation and next steps together.';
      } else {
        targetStatus = 'OFFER_SUCCESSFUL';
        successMessage =
          'Your offer update has been recorded. You can add further details to your tracker.';
      }
    } else if (selectedOption === 'UNSUCCESSFUL') {
      targetStatus = 'UNSUCCESSFUL';
    } else if (selectedOption === 'WITHDRAWN') {
      targetStatus = 'WITHDRAWN';
    } else {
      // No update yet
      if (notes.trim()) {
        targetStatus = application.status;
      }
    }

    const compiledNotes = notes.trim()
      ? `${notes.trim()} (Date: ${outcomeDate})`
      : `Update logged on ${outcomeDate}`;

    updateStatus(
      application.id,
      targetStatus,
      compiledNotes,
      selectedOption === 'INTERVIEW' ? interviewDate : undefined
    );

    toast(successMessage, 'success');
    navigate('/applications');
  };

  const handleRemindLater = () => {
    toast(
      `Reminder set. We’ll follow up on ${opportunity.title} in 14 days.`,
      'info'
    );
    navigate('/applications');
  };

  return (
    <div className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#627086] hover:text-[#102641] transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to applications pipeline</span>
      </Link>

      {/* Main Card (U22 Outcome follow-up) */}
      <Card className="p-6 sm:p-8 bg-white border border-[#e4eaf0] rounded-2xl shadow-sm space-y-6">
        {/* Exact Header Copy */}
        <div className="space-y-2 pb-4 border-b border-[#edf0f3]">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#087b63]">
            APPLICATION OUTCOME FOLLOW-UP (U22)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102641] font-brand tracking-tight">
            Any update on your application?
          </h1>
          <p className="text-xs sm:text-sm text-[#526078] leading-relaxed">
            Tell us what has happened with{' '}
            <strong className="text-[#102641] font-bold">{opportunity.title}</strong>. If you
            haven’t heard back, you can leave the status unchanged.
          </p>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Options */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#102641] uppercase tracking-wider block">
              What is the latest status?
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'NO_UPDATE' as OptionKey,
                  label: 'No update yet',
                  desc: 'Still waiting to hear back from the organization.',
                },
                {
                  key: 'SHORTLISTED' as OptionKey,
                  label: 'Shortlisted',
                  desc: 'Application has progressed to the next assessment stage.',
                },
                {
                  key: 'INTERVIEW' as OptionKey,
                  label: 'Interview',
                  desc: 'Invited for one or more interview rounds.',
                },
                {
                  key: 'SUCCESS' as OptionKey,
                  label: successLabel,
                  desc: isScholarship
                    ? 'Official scholarship funding granted.'
                    : 'Formal job offer or placement secured.',
                  badge: 'Success',
                },
                {
                  key: 'UNSUCCESSFUL' as OptionKey,
                  label: 'Unsuccessful',
                  desc: 'Application was not selected in this cycle.',
                },
                {
                  key: 'WITHDRAWN' as OptionKey,
                  label: 'Withdrawn',
                  desc: 'Decided not to proceed with this application.',
                },
              ].map((opt) => {
                const isSelected = selectedOption === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => setSelectedOption(opt.key)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#087b63] bg-[#e3f4ed]/30 ring-2 ring-[#087b63]/20 shadow-xs'
                        : 'border-[#e4eaf0] bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#102641] flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#087b63] bg-[#087b63]'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{opt.label}</span>
                      </span>
                      {opt.badge && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#e3f4ed] text-[#087b63] border border-[#bddbd1]">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#627086] leading-relaxed pl-5">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interview Date (Only when Interview is selected) */}
          {selectedOption === 'INTERVIEW' && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-2">
              <Input
                label="Scheduled Interview Date"
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                helperText="We will keep this date prominently highlighted on your application tracker."
              />
            </div>
          )}

          {/* Outcome Date (Exact display copy: "When did this happen?") */}
          <div className="space-y-1.5">
            <Input
              label="When did this happen?"
              type="date"
              required
              value={outcomeDate}
              onChange={(e) => setOutcomeDate(e.target.value)}
              helperText="Date you received notification or reached this stage."
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#102641] block">
              Additional notes or context (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Received confirmation email from admissions; preparing visa documents..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-[13px] rounded-lg bg-white border border-[#e4eaf0] text-[#10223c] focus:outline-none focus-visible:outline-[#90cfc0] focus-visible:outline-[3px]"
            />
          </div>

          {/* Actions: Save update & Remind me later */}
          <div className="pt-4 border-t border-[#edf0f3] flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleRemindLater}
              leftIcon={<Bell size={14} />}
              className="w-full sm:w-auto text-[#627086] hover:text-[#102641]"
            >
              Remind me later
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link to="/applications" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto justify-center"
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto justify-center"
              >
                Save update
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};
