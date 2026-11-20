import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react';

interface HaveYouAppliedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmApplied: () => void;
  opportunityTitle: string;
  organization: string;
  deadline?: string;
  daysLeft?: number;
}

export const HaveYouAppliedModal: React.FC<HaveYouAppliedModalProps> = ({
  isOpen,
  onClose,
  onConfirmApplied,
  opportunityTitle,
  organization,
  deadline,
  daysLeft,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Have you applied for this opportunity?"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-xl bg-[#e3f4ed]/70 border border-[#bddbd1] space-y-1">
          <div className="text-xs font-bold text-[#087b63] flex items-center gap-1.5">
            <CheckCircle2 size={15} />
            <span>Application Milestone Tracking</span>
          </div>
          <p className="text-xs text-[#102641] font-medium leading-relaxed">
            {opportunityTitle} <span className="text-[#627086]">at</span> {organization}
          </p>
          {daysLeft !== undefined && daysLeft >= 0 && daysLeft <= 30 && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit mt-1">
              <Clock size={12} className="text-amber-700" />
              <span>
                {daysLeft === 0 ? 'Deadline is today!' : `Deadline in ${daysLeft} days (${deadline})`}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-[#526078] leading-relaxed">
          Tracking your submissions helps you monitor selection stages, benchmark milestones, and get reminders as the decision date approaches.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#edf0f3]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            No, Not Yet
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirmApplied}
            className="w-full sm:w-auto"
            rightIcon={<ArrowRight size={13} />}
          >
            Yes, I've Applied
          </Button>
        </div>
      </div>
    </Modal>
  );
};
