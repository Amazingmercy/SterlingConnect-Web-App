import React, { useState } from 'react';
import { useApplications } from '../../context/ApplicationContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Check } from 'lucide-react';
import type { Opportunity } from '../../types/opportunity';
import type { UserApplication, ApplicationStatus } from '../../types/application';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: UserApplication;
  opportunity: Opportunity;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  isOpen,
  onClose,
  application,
  opportunity,
}) => {
  const { updateStatus } = useApplications();
  const { toast } = useToast();

  const isScholarship = opportunity.opportunityType === 'SCHOLARSHIP';

  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState<string>('');
  const [interviewDate, setInterviewDate] = useState<string>(application.interviewDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStatus(application.id, selectedStatus, notes, selectedStatus === 'INTERVIEW' ? interviewDate : undefined);
    toast('Your application update has been saved.');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Application Stage"
      description={`Update the self-reported status for ${opportunity.title}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Select
          label="Current application stage"
          required
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as ApplicationStatus)}
        >
          <option value="PREPARING">Preparing (Drafting materials)</option>
          <option value="APPLIED">Applied (Officially submitted)</option>
          <option value="SHORTLISTED">Shortlisted / Progressed</option>
          <option value="INTERVIEW">Interview Stage</option>
          {isScholarship ? (
            <option value="AWARDED">Scholarship Awarded (Outcome)</option>
          ) : (
            <option value="OFFER_SUCCESSFUL">Job Offer / Successful (Outcome)</option>
          )}
          <option value="UNSUCCESSFUL">Unsuccessful (Outcome)</option>
          <option value="WITHDRAWN">Withdrawn</option>
        </Select>

        {selectedStatus === 'INTERVIEW' && (
          <Input
            label="Scheduled Interview Date"
            type="date"
            required
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            helperText="We will keep this highlighted on your application tracker."
          />
        )}

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-[#102641] block">
            Progress Notes &amp; Updates (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Received email invitation for 2nd round panel interview on Teams..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 text-[13px] rounded-[7px] bg-white border border-[#e4eaf0] text-[#10223c] focus:outline-none focus-visible:outline-[#90cfc0] focus-visible:outline-[3px]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#edf0f3]">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            rightIcon={<Check size={14} />}
          >
            Save Update
          </Button>
        </div>
      </form>
    </Modal>
  );
};
