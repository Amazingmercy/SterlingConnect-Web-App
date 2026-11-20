import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import type { UserApplication, ApplicationStatus } from '../../types/application';
import type { Opportunity } from '../../types/opportunity';

interface ApplicationMilestoneCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: UserApplication;
  opportunity?: Opportunity;
  onUpdateStatus: (status: ApplicationStatus, notes?: string) => Promise<void>;
}

export const ApplicationMilestoneCheckInModal: React.FC<ApplicationMilestoneCheckInModalProps> = ({
  isOpen,
  onClose,
  application,
  opportunity,
  onUpdateStatus,
}) => {
  const oppTitle = opportunity?.title || 'Your Tracked Opportunity';
  const org = opportunity?.organization || 'Provider';

  let daysLeft: number | null = null;
  let formattedDeadline = '';
  if (opportunity?.deadline) {
    const d = new Date(opportunity.deadline);
    formattedDeadline = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  const isDeadlineClose = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;

  const handleSelectStatus = async (status: ApplicationStatus, noteText: string) => {
    await onUpdateStatus(status, noteText);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Progress Check-in"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Opportunity Card Header */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#087b63] flex items-center gap-1">
              <Sparkles size={13} />
              <span>Milestone Follow-Through</span>
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              Current: {application.status}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-[#102641] leading-snug">
            {oppTitle}
          </h4>
          <p className="text-xs text-[#526078]">{org}</p>

          {/* Deadline Warning if within 30 days */}
          {isDeadlineClose && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 mt-2 font-medium">
              <AlertTriangle size={14} className="text-amber-700 flex-shrink-0" />
              <span>
                {daysLeft === 0
                  ? 'Deadline is today!'
                  : `Deadline closing soon: in ${daysLeft} days (${formattedDeadline})`}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Question & Action Choices based on status */}
        {(application.status === 'PREPARING' || application.status === 'SAVED') && (
          <div className="space-y-3">
            <p className="text-xs text-[#526078] leading-relaxed">
              {isDeadlineClose
                ? `The application deadline for ${org} is within 30 days. Have you submitted your application on the official website?`
                : `Have you finalized and submitted your application for ${oppTitle}?`}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                className="justify-center"
                leftIcon={<CheckCircle2 size={14} />}
                onClick={() =>
                  handleSelectStatus('APPLIED', 'Application submitted on official portal.')
                }
              >
                Yes, I Have Applied
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-center"
                onClick={onClose}
              >
                Still Preparing
              </Button>
            </div>
          </div>
        )}

        {application.status === 'APPLIED' && (
          <div className="space-y-3">
            <p className="text-xs text-[#526078] leading-relaxed">
              Checking in on your submission with <strong>{org}</strong>: Have you heard back regarding your status? Have you been shortlisted or invited to an interview?
            </p>

            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectStatus('SHORTLISTED', 'Candidate confirmed shortlisted.')
                  }
                  className="p-3 text-left rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 transition text-xs font-semibold text-blue-900 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                  <span>I was Shortlisted!</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectStatus('INTERVIEW', 'Invited to interview or assessment.')
                  }
                  className="p-3 text-left rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 transition text-xs font-semibold text-purple-900 flex items-center gap-2 cursor-pointer"
                >
                  <Calendar size={16} className="text-purple-600 flex-shrink-0" />
                  <span>Invited to Interview!</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectStatus('OFFER_SUCCESSFUL', 'Offer received and accepted!')
                  }
                  className="p-3 text-left rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 transition text-xs font-semibold text-emerald-900 flex items-center gap-2 cursor-pointer"
                >
                  <Award size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>Received an Offer! 🎉</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectStatus('UNSUCCESSFUL', 'Application was not selected.')
                  }
                  className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <XCircle size={16} className="text-slate-500 flex-shrink-0" />
                  <span>Not Selected</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Still Waiting for Response
                </Button>
              </div>
            </div>
          </div>
        )}

        {(application.status === 'SHORTLISTED' || application.status === 'INTERVIEW') && (
          <div className="space-y-3">
            <p className="text-xs text-[#526078] leading-relaxed">
              How did your interview or screening with <strong>{org}</strong> go? Follow through to update your outcome:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  handleSelectStatus('OFFER_SUCCESSFUL', 'Offer / award received!')
                }
                className="p-3 text-left rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 transition text-xs font-semibold text-emerald-900 flex items-center gap-2 cursor-pointer"
              >
                <Award size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Selected / Offer Received! 🎉</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectStatus('UNSUCCESSFUL', 'Not selected after interview.')
                }
                className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <XCircle size={16} className="text-slate-500 flex-shrink-0" />
                <span>Unsuccessful / Regret</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Still in Interview Process
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
