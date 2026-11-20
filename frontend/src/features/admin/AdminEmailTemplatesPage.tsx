import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Send, Eye, CheckCircle2, RefreshCw, Plus, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export const AdminEmailTemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sendingTestId, setSendingTestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  // Edit Template modal
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editPreviewText, setEditPreviewText] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Template confirmation
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const res = await api.get('/admin/email-templates');
      setData(res.data);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to load email templates.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSendTest = async (tplId: string) => {
    setSendingTestId(tplId);
    setFeedback(null);
    try {
      const res = await api.post(`/admin/email-templates/${tplId}/test`);
      const msg = res.data.message || 'Controlled test email dispatched successfully.';
      setFeedback(msg);
      toast(msg);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to dispatch test email.', 'error');
    } finally {
      setSendingTestId(null);
    }
  };

  const handleOpenEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    setEditSubject(tpl.subject);
    setEditPreviewText(tpl.previewText);
    setEditBody(tpl.body);
    setEditStatus(tpl.status);
  };

  const handleSaveEditTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setIsSavingEdit(true);
    try {
      await api.put(`/admin/email-templates/${editingTemplate.id}`, {
        subject: editSubject.trim(),
        previewText: editPreviewText.trim(),
        body: editBody,
        status: editStatus,
      });
      toast(`Template ${editingTemplate.id} updated.`);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      toast(
        err.response?.data?.message ||
          'Template contains an unsupported variable. Correct it before activation.',
        'error'
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/email-templates/${deleteTarget.id}`);
      toast(`Template ${deleteTarget.id} removed.`);
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete template.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === (data?.templates?.length || 0) && (data?.templates?.length || 0) > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds((data?.templates || []).map((t: any) => t.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const executeBulkDeleteTemplates = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await api.post('/admin/email-templates/bulk-delete', { ids: selectedIds });
      toast(`Successfully deleted ${res.data.deletedCount} email templates.`);
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete selected templates.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Email templates</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Review template variables, update messaging, and send a controlled test before activation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTemplates}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
          {feedback}
        </div>
      )}

      {/* Whitelisted Variables Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
        <h4 className="font-bold text-slate-800 mb-2">Approved Template Variables</h4>
        <div className="flex flex-wrap gap-2">
          {data?.approvedVariables?.map((v: string) => (
            <code
              key={v}
              className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-[#102641] font-bold"
            >
              {v}
            </code>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          <strong>Validation Rule:</strong> Template contains an unsupported variable. Correct it before activation.
        </p>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'template' : 'templates'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
            >
              Deselect all
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.templates?.map((tpl: any) => (
          <div
            key={tpl.id}
            className={`bg-white rounded-xl border shadow-xs p-5 flex flex-col justify-between transition ${
              selectedIds.includes(tpl.id)
                ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300'
                : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tpl.id)}
                    onChange={() => handleToggleSelectOne(tpl.id)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                    title={`Select ${tpl.id}`}
                  />
                  <span className="text-[10px] font-mono text-slate-500 font-bold px-2 py-0.5 bg-slate-100 rounded">
                    {tpl.id}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tpl.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tpl.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{tpl.name}</h3>
              <p className="text-[11px] text-slate-500 mb-3 italic">{tpl.trigger}</p>
              <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-3 font-mono">
                <div className="font-bold text-slate-900 truncate">Subject: {tpl.subject}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Preheader: {tpl.previewText}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-4">
                {tpl.variables?.map((v: string) => (
                  <span
                    key={v}
                    className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPreviewTemplate(tpl)}
                  className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition"
                  title="Preview template"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenEdit(tpl)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer transition"
                  title="Edit template"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(tpl)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition"
                  title="Delete template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => handleSendTest(tpl.id)}
                disabled={sendingTestId === tpl.id}
                className="inline-flex items-center px-3 py-1.5 bg-[#102641] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                {sendingTestId === tpl.id ? 'Sending...' : 'Send test'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900">
                  Edit Template: {editingTemplate.id}
                </h3>
                <p className="text-xs text-gray-500">{editingTemplate.name}</p>
              </div>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  required
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preheader / Preview Text</label>
                <input
                  type="text"
                  value={editPreviewText}
                  onChange={(e) => setEditPreviewText(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activation Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Dispatched automatically on trigger)</option>
                  <option value="INACTIVE">INACTIVE (Dispatches suppressed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={6}
                  required
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center px-4 py-2 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {isSavingEdit ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTemplate}
        title={`Delete template "${deleteTarget?.id}"?`}
        description={`Are you sure you want to delete template "${deleteTarget?.name}"? Automated notifications tied to this trigger will be suspended.`}
        confirmLabel="Delete Template"
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isDeleting}
      />

      {/* Bulk Delete Templates Confirmation */}
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={executeBulkDeleteTemplates}
        title={`Delete ${selectedIds.length} email templates?`}
        description={`Are you sure you want to delete these ${selectedIds.length} selected email templates? Automated triggers tied to them will be suspended.`}
        confirmLabel={isDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Templates`}
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isDeleting}
      />

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Preview: {previewTemplate.name}
                </h3>
                <span className="text-xs font-mono text-slate-500">{previewTemplate.id}</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 mb-1">
                  Subject: {previewTemplate.subject}
                </div>
                <div className="text-slate-500">Preview: {previewTemplate.previewText}</div>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl whitespace-pre-line font-serif text-slate-800 leading-relaxed max-h-60 overflow-y-auto">
                {previewTemplate.body}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
