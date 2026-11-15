import React, { useRef, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Tag,
  Paperclip,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import type { DocumentCategory, UserUploadedDocument } from '../../types/profile';

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'CV / Resume',
  'Academic Transcript',
  'Degree Certificate',
  'Statement of Purpose / Cover Letter',
  'Academic Reference Letter',
  'Professional Reference Letter',
  'Language Test Result (IELTS / TOEFL)',
  'Portfolio / Writing Sample',
  'Identification / Passport',
  'Other Supporting Document',
];

export const DocumentsSection: React.FC = () => {
  const { profile, addDocument, removeDocument } = useProfile();
  const { documents } = profile;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document custom labeling state
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('Academic Transcript');
  const [customLabel, setCustomLabel] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<UserUploadedDocument | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate size (max 5MB) and type per specification
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (file.size > 5 * 1024 * 1024 || !hasValidExt) {
      toast('We couldn’t upload this file. Use an accepted file type and check the size limit.', 'error');
      return;
    }

    setSelectedFile(file);
    if (!customLabel.trim()) {
      // Default label to filename without extension
      const defaultName = file.name.replace(/\.[^/.]+$/, '');
      setCustomLabel(defaultName);
    }
  };

  const handleUploadAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast('Please select a file to upload.', 'error');
      return;
    }

    if (documents.length >= 10) {
      toast('You have reached the limit of 10 supporting documents.', 'error');
      return;
    }

    const labelToSave = customLabel.trim() || selectedFile.name;

    addDocument({
      name: selectedFile.name,
      label: labelToSave,
      category: selectedCategory,
      size: selectedFile.size,
      type: selectedCategory === 'CV / Resume' ? 'CV_RESUME' : selectedCategory.includes('Transcript') ? 'ACADEMIC_TRANSCRIPT' : 'OTHER',
    });

    toast(`Attached "${labelToSave}" successfully!`, 'success');
    setSelectedFile(null);
    setCustomLabel('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="font-brand font-bold text-base text-[#102641]">
          Supporting Documents &amp; Verification
        </h3>
        <p className="text-xs text-[#627086] mt-0.5">
          Attach verified CVs, transcripts, certificates, or references. Label each document so you can choose which materials accompany your applications.
        </p>
      </div>

      {/* Upload & Label Form Card */}
      <form
        onSubmit={handleUploadAndSave}
        className="p-5 sm:p-6 rounded-2xl border border-[#e4eaf0] bg-white shadow-xs space-y-4"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-[#102641]">
          <Tag size={15} className="text-[#087b63]" />
          <span>Upload New Supporting Document</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Document Type / Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
            options={DOCUMENT_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
            helperText="Select the official category for this document"
          />

          <Input
            label="Custom Document Label"
            placeholder="e.g. Undergraduate Transcript (1st Class) or Chevening CV"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            helperText="Give your document a clear label for quick identification"
          />
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileSelect(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#087b63] bg-[#e3f4ed]/40'
              : selectedFile
              ? 'border-[#087b63] bg-[#f0f8f5]'
              : 'border-[#d0dbe5] bg-[#f8fafb] hover:bg-slate-50 hover:border-[#b8dcd0]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          {selectedFile ? (
            <div className="space-y-1 text-center">
              <div className="w-10 h-10 rounded-full bg-[#e3f4ed] text-[#087b63] grid place-items-center mx-auto">
                <Paperclip size={20} />
              </div>
              <div className="text-xs font-bold text-[#102641]">{selectedFile.name}</div>
              <div className="text-[11px] text-[#627086]">{formatFileSize(selectedFile.size)} &bull; Click to change file</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#e3f4ed] text-[#087b63] grid place-items-center mx-auto">
                <UploadCloud size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#102641]">
                  Click to select file or drag &amp; drop
                </p>
                <p className="text-[11px] text-[#627086]">
                  Supports PDF or Word document (up to 5 MB)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!selectedFile}
            leftIcon={<Plus size={14} />}
          >
            Add Document to Profile
          </Button>
        </div>
      </form>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[#102641]">
          <span>Uploaded Documents ({documents.length} of max 10)</span>
          <span className="text-[#627086] font-normal">Available for opportunity applications</span>
        </div>

        {documents.length > 0 ? (
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 sm:p-4 rounded-xl border border-[#e4eaf0] bg-white shadow-2xs flex items-center justify-between gap-4 hover:border-[#bddbd1] transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#e3f4ed] text-[#087b63] grid place-items-center flex-shrink-0 mt-0.5">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#102641]">
                        {doc.label || doc.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.category || 'Supporting Document'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#627086]">
                      <span className="truncate max-w-[200px]">{doc.name}</span>
                      <span>&bull;</span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>&bull;</span>
                      <span>Added {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDocumentToDelete(doc)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0 cursor-pointer"
                  title="Remove document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-white text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 grid place-items-center mx-auto">
              <FileText size={18} />
            </div>
            <p className="text-xs font-semibold text-[#102641]">No supporting documents uploaded yet</p>
            <p className="text-[11px] text-[#627086] max-w-sm mx-auto">
              Adding your academic transcripts and tailored CV increases your profile completeness score and speeds up your applications.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(documentToDelete)}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={() => {
          if (documentToDelete) {
            removeDocument(documentToDelete.id);
            toast(`Removed "${documentToDelete.label || documentToDelete.name}".`);
            setDocumentToDelete(null);
          }
        }}
        title="Remove Supporting Document?"
        description={
          documentToDelete
            ? `Are you sure you want to remove "${documentToDelete.label || documentToDelete.name}" from your profile? This cannot be undone.`
            : ''
        }
        confirmLabel="Remove Document"
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
      />
    </div>
  );
};
