import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle2,
  Trash2,
  Send,
} from 'lucide-react';
import type { UserApplication, ApplicationStatus } from '../../types/application';
import type { Opportunity } from '../../types/opportunity';
import { useApplications } from '../../context/ApplicationContext';
import { MarkAsAppliedModal } from './MarkAsAppliedModal';
import { UpdateStatusModal } from './UpdateStatusModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ApplicationCardProps {
  application: UserApplication;
  opportunity: Opportunity;
  onStatusChange?: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  opportunity,
  onStatusChange,
}) => {
  const { removeApplication } = useApplications();
  const [showHistory, setShowHistory] = useState(false);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Status Badge styling & labels per U20 specification
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SAVED':
        return { label: 'Saved', help: 'An opportunity you want to revisit.', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'PREPARING':
        return { label: 'Preparing', help: 'You are working on your application.', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'APPLIED':
        return { label: 'Applied', help: 'You have submitted an application through the official process.', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'SHORTLISTED':
        return { label: 'Shortlisted', help: 'The provider has told you that you have progressed.', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'INTERVIEW':
        return { label: 'Interview', help: 'You have been invited to or completed an interview.', color: 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold' };
      case 'OFFER_SUCCESSFUL':
        return { label: 'Offer received or opportunity secured', help: 'Career pathway only. Record the stage the employer has confirmed.', color: 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1] font-extrabold' };
      case 'AWARDED':
        return { label: 'Scholarship awarded', help: 'Scholarship pathway only. Record an award confirmed by the provider.', color: 'bg-[#e3f4ed] text-[#087b63] border-[#bddbd1] font-extrabold' };
      case 'UNSUCCESSFUL':
        return { label: 'Unsuccessful', help: 'The provider has told you the application was unsuccessful.', color: 'bg-red-50 text-red-800 border-red-200' };
      case 'WITHDRAWN':
        return { label: 'Withdrawn', help: 'You have withdrawn your application.', color: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { label: status, help: '', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getNextAction = (status: ApplicationStatus) => {
    switch (status) {
      case 'SAVED':
        return 'Review criteria & start preparing';
      case 'PREPARING':
        return 'Submit application on official website';
      case 'APPLIED':
        return 'Await shortlist notification';
      case 'SHORTLISTED':
        return 'Prepare for upcoming interview / assessment';
      case 'INTERVIEW':
        return application.interviewDate ? `Interview scheduled for ${application.interviewDate}` : 'Attend scheduled interview';
      case 'OFFER_SUCCESSFUL':
        return 'Review and confirm offer conditions';
      case 'AWARDED':
        return 'Review provider award documentation';
      case 'UNSUCCESSFUL':
        return 'Explore alternative opportunities';
      case 'WITHDRAWN':
        return 'No further action';
      default:
        return 'Check provider website for updates';
    }
  };

  const badge = getStatusBadge(application.status);
  const nextAction = getNextAction(application.status);
  const appliedDateDisplay = application.appliedAt
    ? new Date(application.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Not yet applied';
  const lastUpdatedDisplay = new Date(application.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Card className="p-5 sm:p-6 space-y-4 border border-[#e4eaf0] bg-white rounded-[12px] shadow-card">
      {/* Top Header: Status & Reference */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-[11px] text-[#627086] font-mono">
            {opportunity.referenceCode}
          </span>
        </div>

        <div className="text-[11px] text-[#627086]">
          Last updated: <strong className="text-[#102641] font-semibold">{lastUpdatedDisplay}</strong>
        </div>
      </div>

      {/* Opportunity Details */}
      <div>
        <Link
          to={`/opportunities/${opportunity.id}`}
          className="font-brand font-bold text-base text-[#102641] hover:text-[#087b63] transition-colors line-clamp-2"
        >
          {opportunity.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 text-xs">
          <span className="font-semibold text-[#087b63]">{opportunity.organization}</span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-[#627086] flex items-center gap-1">
            <MapPin size={12} />
            <span>{opportunity.location}</span>
          </span>
        </div>
        <p className="text-[11px] text-[#627086] italic mt-1">
          {badge.help}
        </p>
      </div>

      {/* Structured U20 Labels Grid: Application date | Next action | Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#f8fafb] border border-[#e4eaf0] text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#627086]">
            Application date
          </div>
          <div className="text-[#102641] font-medium mt-0.5">
            {appliedDateDisplay}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#627086]">
            Next action
          </div>
          <div className="text-[#102641] font-medium mt-0.5">
            {nextAction}
          </div>
        </div>

        <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#627086]">
            Notes
          </div>
          <div className="text-[#526078] text-[11px] mt-0.5 leading-relaxed">
            {application.notes || 'No notes added yet.'}
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f3]">
        <div className="flex items-center gap-2 flex-wrap">
          {application.status === 'PREPARING' || application.status === 'SAVED' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsMarkModalOpen(true)}
              leftIcon={<Send size={13} />}
            >
              Mark as applied
            </Button>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUpdateModalOpen(true)}
          >
            Update status
          </Button>

          <Link to={`/opportunities/${opportunity.id}`}>
            <Button variant="ghost" size="sm" rightIcon={<ExternalLink size={12} />}>
              Details
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[11px] font-bold text-[#627086] hover:text-[#102641] flex items-center gap-1 cursor-pointer"
          >
            <History size={13} />
            <span>View status history {application.history.length > 0 && `(${application.history.length})`}</span>
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded cursor-pointer"
            title="Remove from tracker"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => removeApplication(application.id)}
        title="Remove Tracked Application?"
        description={`Are you sure you want to remove "${opportunity.title}" from your application tracker?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
      />

      {/* Collapsible History Drawer */}
      {showHistory && (
        <div className="p-4 rounded-xl bg-slate-50 border border-[#e4eaf0] space-y-3 animate-in fade-in duration-150">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#102641]">
            Status History
          </h4>
          {application.history.length > 0 ? (
            <div className="space-y-2.5">
              {application.history.map((h, idx) => (
                <div key={h.id || idx} className="flex items-start gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#087b63] mt-1.5 flex-shrink-0" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-bold text-[#102641]">
                      <span>{h.toStatus}</span>
                      <span className="text-[10px] text-[#627086] font-normal">
                        {new Date(h.changedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {h.notes && <p className="text-[#627086] text-[11px]">{h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#627086]">No stage changes recorded yet.</p>
          )}
        </div>
      )}

      {/* Modals */}
      <MarkAsAppliedModal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        opportunity={opportunity}
        applicationId={application.id}
        onSuccess={onStatusChange}
      />

      <UpdateStatusModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        application={application}
        opportunity={opportunity}
      />
    </Card>
  );
};
