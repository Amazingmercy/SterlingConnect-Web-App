import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, LogOut, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: 'trash' | 'logout' | 'reset' | 'warning' | 'check' | 'none';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  icon = 'warning',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'trash':
        return <Trash2 size={22} className="text-red-600" />;
      case 'logout':
        return <LogOut size={22} className="text-[#102641]" />;
      case 'reset':
        return <RotateCcw size={22} className="text-amber-600" />;
      case 'check':
        return <CheckCircle2 size={22} className="text-emerald-600" />;
      case 'warning':
      default:
        return <AlertTriangle size={22} className="text-amber-600" />;
    }
  };

  const getIconBg = () => {
    switch (icon) {
      case 'check':
        return 'bg-emerald-50 border-emerald-100';
      case 'trash':
        return 'bg-red-50 border-red-100';
      case 'logout':
        return 'bg-slate-100 border-slate-200';
      case 'reset':
        return 'bg-amber-50 border-amber-100';
      case 'warning':
      default:
        return 'bg-amber-50 border-amber-100';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="space-y-4 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {icon && icon !== 'none' && (
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 ${getIconBg()}`}
            >
              {getIcon()}
            </div>
          )}

          <div className="space-y-1.5 flex-1">
            <h3 className="font-brand font-extrabold text-lg text-[#102641] leading-snug">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#526078] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[#edf0f3] flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto justify-center"
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            isLoading={isLoading}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:w-auto justify-center"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
