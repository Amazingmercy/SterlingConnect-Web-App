import React, { useState } from 'react';
import { useApplications } from '../../context/ApplicationContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Check, Calendar } from 'lucide-react';
import type { Opportunity } from '../../types/opportunity';

interface MarkAsAppliedModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity;
  applicationId?: string;
  onSuccess?: () => void;
}

export const MarkAsAppliedModal: React.FC<MarkAsAppliedModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  applicationId,
  onSuccess,
}) => {
  const { addOrUpdateApplication } = useApplications();
  const { toast } = useToast();

  const [appliedDate, setAppliedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [submissionNotes, setSubmissionNotes] = useState<string>('');
  const [confirmationCode, setConfirmationCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fullNotes = [
        confirmationCode ? `Application Ref / ID: ${confirmationCode}` : '',
        submissionNotes,
      ]
        .filter(Boolean)
        .join(' — ');

      // Always update via opportunity.id to ensure persistent tracking and exact appliedDate
      await addOrUpdateApplication(opportunity.id, 'APPLIED', fullNotes, appliedDate);

      toast('Your application has been added to your tracker.');
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Have you submitted your application?"
      description="Mark this as applied only after you have submitted it through the provider’s official process."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Input
          label="When did you apply?"
          type="date"
          required
          value={appliedDate}
          onChange={(e) => setAppliedDate(e.target.value)}
          helperText="The date you officially submitted on the external provider website."
        />

        <Input
          label="Application Reference / Tracking ID (Optional)"
          placeholder="e.g. CHEV-2027-88419, GDC-APP-992"
          value={confirmationCode}
          onChange={(e) => setConfirmationCode(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-[#102641] block">
            Notes optional
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Uploaded CV v2 and leadership essay; 2 references submitted..."
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            className="w-full p-3 text-[13px] rounded-[7px] bg-white border border-[#e4eaf0] text-[#10223c] focus:outline-none focus-visible:outline-[#90cfc0] focus-visible:outline-[3px]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#edf0f3]">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Not yet
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            rightIcon={<Check size={14} />}
          >
            Confirm application submitted
          </Button>
        </div>
      </form>
    </Modal>
  );
};
