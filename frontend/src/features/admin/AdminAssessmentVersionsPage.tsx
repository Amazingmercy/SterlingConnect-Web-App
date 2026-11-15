import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Plus,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
  HelpCircle,
  FileCheck2,
  BookOpen,
  Calendar,
  Layers,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

export const AdminAssessmentVersionsPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Create draft modal
  const [isDraftModalOpen, setIsDraftModalOpen] = useState<boolean>(false);
  const [draftTitle, setDraftTitle] = useState<string>('Universal 10-Category Readiness Diagnostic');

  // Publish confirmation modal
  const [publishTarget, setPublishTarget] = useState<{ id: string; verNum: string | number } | null>(null);

  // Inspect Version Modal
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [inspectVersionData, setInspectVersionData] = useState<any | null>(null);
  const [isInspectingLoading, setIsInspectingLoading] = useState<boolean>(false);

  // Delete draft version
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<any | null>(null);
  const [isDeletingVersion, setIsDeletingVersion] = useState<boolean>(false);

  // Question item edit state
  const [editQuestionTarget, setEditQuestionTarget] = useState<any | null>(null);
  const [editStatement, setEditStatement] = useState<string>('');
  const [editConstruct, setEditConstruct] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isSavingQuestion, setIsSavingQuestion] = useState<boolean>(false);

  // Question item delete state
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<any | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState<boolean>(false);

  // Question item add state
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState<boolean>(false);
  const [addCategoryId, setAddCategoryId] = useState<string>('CAT-01');
  const [addQuestionCode, setAddQuestionCode] = useState<string>('');
  const [addStatement, setAddStatement] = useState<string>('');
  const [addConstruct, setAddConstruct] = useState<string>('Self-report capability');
  const [isAddingQuestion, setIsAddingQuestion] = useState<boolean>(false);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/assessment-versions');
      setData(res.data);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to load assessment versions.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleOpenInspect = async (versionId: string) => {
    setSelectedVersionId(versionId);
    setIsInspectingLoading(true);
    try {
      const res = await api.get(`/admin/assessment-versions/${versionId}`);
      setInspectVersionData(res.data);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to load assessment version details.', 'error');
      setSelectedVersionId(null);
    } finally {
      setIsInspectingLoading(false);
    }
  };

  const handleCreateDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) return;
    setIsCreatingDraft(true);
    try {
      await api.post('/admin/assessment-versions', {
        title: draftTitle.trim(),
      });
      toast('New draft assessment version created with seeded diagnostic items.');
      setIsDraftModalOpen(false);
      setDraftTitle('Universal 10-Category Readiness Diagnostic');
      fetchVersions();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to create draft version.', 'error');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!publishTarget) return;
    setIsPublishing(true);
    setFeedbackMsg(null);
    try {
      const res = await api.post(`/admin/assessment-versions/${publishTarget.id}/publish`);
      setFeedbackMsg(
        res.data.message ||
          'Publishing this version changes future assessments. Existing completed results will be preserved.'
      );
      toast(`Version v${publishTarget.verNum} published successfully.`);
      setPublishTarget(null);
      fetchVersions();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to publish version.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const confirmDeleteVersion = async () => {
    if (!deleteVersionTarget) return;
    setIsDeletingVersion(true);
    try {
      await api.delete(`/admin/assessment-versions/${deleteVersionTarget.id}`);
      toast(`Assessment version v${deleteVersionTarget.versionNumber} removed.`);
      setDeleteVersionTarget(null);
      fetchVersions();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete assessment version.', 'error');
    } finally {
      setIsDeletingVersion(false);
    }
  };

  // Question CRUD handlers
  const handleOpenEditQuestion = (q: any) => {
    setEditQuestionTarget(q);
    setEditStatement(q.statement);
    setEditConstruct(q.construct || 'Self-report capability');
    setEditIsActive(q.isActive ?? true);
  };

  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuestionTarget || !editStatement.trim()) return;
    setIsSavingQuestion(true);
    try {
      await api.put(`/admin/assessment-versions/questions/${editQuestionTarget.id}`, {
        statement: editStatement.trim(),
        construct: editConstruct.trim(),
        isActive: editIsActive,
      });
      toast(`Question item ${editQuestionTarget.questionCode} updated successfully.`);
      setEditQuestionTarget(null);
      if (selectedVersionId) {
        handleOpenInspect(selectedVersionId);
      }
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update question item.', 'error');
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteQuestionTarget) return;
    setIsDeletingQuestion(true);
    try {
      await api.delete(`/admin/assessment-versions/questions/${deleteQuestionTarget.id}`);
      toast(`Question item ${deleteQuestionTarget.questionCode} removed.`);
      setDeleteQuestionTarget(null);
      if (selectedVersionId) {
        handleOpenInspect(selectedVersionId);
      }
      fetchVersions();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete question item.', 'error');
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !addQuestionCode.trim() || !addStatement.trim()) return;
    setIsAddingQuestion(true);
    try {
      await api.post(`/admin/assessment-versions/${selectedVersionId}/questions`, {
        categoryId: addCategoryId,
        questionCode: addQuestionCode.trim().toUpperCase(),
        statement: addStatement.trim(),
        construct: addConstruct.trim(),
      });
      toast(`Question item ${addQuestionCode.trim().toUpperCase()} added successfully.`);
      setIsAddQuestionOpen(false);
      setAddQuestionCode('');
      setAddStatement('');
      setAddConstruct('Self-report capability');
      if (selectedVersionId) {
        handleOpenInspect(selectedVersionId);
      }
      fetchVersions();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to add question item.', 'error');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  // Group questions by category for the inspector modal
  const groupedQuestions: Record<string, any[]> = {};
  if (inspectVersionData?.questions) {
    inspectVersionData.questions.forEach((q: any) => {
      const cat = q.categoryName || `Category ${q.categoryId}`;
      if (!groupedQuestions[cat]) groupedQuestions[cat] = [];
      groupedQuestions[cat].push(q);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header A08 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Assessment versions</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Published versions remain attached to historical submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchVersions}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh versions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDraftModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-md cursor-pointer ring-2 ring-[#102641]/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> + Create draft version
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Spec A08 Note Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-blue-700 flex-shrink-0" />
        <span>
          <strong>Operational Rule:</strong> Publishing this version changes future assessments. Existing completed results will be preserved.
        </span>
      </div>

      {/* Versions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Items / Categories</th>
                  <th className="py-3 px-4">Submissions Bound</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.versions?.map((ver: any) => (
                  <tr key={ver.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      v{ver.versionNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{ver.title}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ver.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ver.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ver.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {ver._count?.questions || 50} questions (10 categories)
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {ver._count?.attempts || 0} candidate results bound
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenInspect(ver.id)}
                          className="inline-flex items-center px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 mr-1" /> View / Manage Items
                        </button>

                        {ver.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => setPublishTarget({ id: ver.id, verNum: ver.versionNumber })}
                              disabled={isPublishing}
                              className="inline-flex items-center px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                            >
                              Publish version
                            </button>
                            <button
                              onClick={() => setDeleteVersionTarget(ver)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition"
                              title="Delete draft version"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {ver.status === 'PUBLISHED' && (
                          <span className="text-[11px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                            Current Active
                          </span>
                        )}
                        {ver.status === 'ARCHIVED' && (
                          <span className="text-[11px] font-medium text-slate-400">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Version Questions & Items Modal (A08 CRUD) */}
      {selectedVersionId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Version v{inspectVersionData?.versionNumber}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      inspectVersionData?.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inspectVersionData?.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {inspectVersionData?.status}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-900 mt-1">
                  {inspectVersionData?.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </button>
                <button
                  onClick={() => {
                    setSelectedVersionId(null);
                    setInspectVersionData(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {isInspectingLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              ) : inspectVersionData ? (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Items</span>
                      <span className="text-xl font-bold text-slate-900">
                        {inspectVersionData.questions?.length || 50} questions
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Diagnostic Categories</span>
                      <span className="text-xl font-bold text-slate-900">10 Core Dimensions</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Historical Submissions</span>
                      <span className="text-xl font-bold text-slate-900">
                        {inspectVersionData._count?.attempts || 0} candidate attempts
                      </span>
                    </div>
                  </div>

                  {/* Grouped Questions List with Item Edit / Delete */}
                  <div className="space-y-6">
                    {Object.entries(groupedQuestions).map(([category, questions]: [string, any[]]) => (
                      <div key={category} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {category}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {questions.length} diagnostic items
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100 bg-white">
                          {questions.map((q: any) => (
                            <div key={q.id} className="p-3.5 hover:bg-slate-50/60 transition flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="font-mono text-xs font-bold text-slate-500 w-12 flex-shrink-0 pt-0.5">
                                  {q.questionCode}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-900 leading-relaxed">
                                    "{q.statement}"
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                                      Construct: {q.construct || 'Readiness'}
                                    </span>
                                    <span>•</span>
                                    <span>Item #{q.orderIndex || q.orderInCategory}</span>
                                    {!q.isActive && (
                                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold text-[10px]">
                                        Inactive
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Question Item CRUD Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditQuestion(q)}
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  title="Edit diagnostic item"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteQuestionTarget(q)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete diagnostic item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Item Modal */}
      <Modal
        isOpen={Boolean(editQuestionTarget)}
        onClose={() => setEditQuestionTarget(null)}
        title={`Edit diagnostic item ${editQuestionTarget?.questionCode}`}
        description="Refine question statement, diagnostic construct, or toggle availability."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditQuestion} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Diagnostic Statement / Likert Prompt
            </label>
            <textarea
              rows={3}
              required
              value={editStatement}
              onChange={(e) => setEditStatement(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102641]"
              placeholder="e.g. I can clearly describe my core strengths..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Diagnostic Construct"
              type="text"
              value={editConstruct}
              onChange={(e) => setEditConstruct(e.target.value)}
              placeholder="e.g. Career Clarity"
            />
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-[#102641] focus:ring-[#102641]"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Active diagnostic item in assessment
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditQuestionTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingQuestion}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Question Item Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteQuestionTarget)}
        onClose={() => setDeleteQuestionTarget(null)}
        onConfirm={confirmDeleteQuestion}
        title={`Delete item ${deleteQuestionTarget?.questionCode}?`}
        description={`Are you sure you want to delete "${deleteQuestionTarget?.statement}"? Published versions with completed results preserve candidate history and prevent deletion.`}
        confirmLabel="Delete Item"
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isDeletingQuestion}
      />

      {/* Add Question Item Modal */}
      <Modal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        title={`Add Question Item to v${inspectVersionData?.versionNumber}`}
        description="Add a new standardized Likert diagnostic item to this assessment version."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diagnostic Category
              </label>
              <select
                value={addCategoryId}
                onChange={(e) => setAddCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102641]"
              >
                <option value="CAT-01">CAT-01: Career Clarity & Direction</option>
                <option value="CAT-02">CAT-02: Academic & Intellectual Readiness</option>
                <option value="CAT-03">CAT-03: Skills & Industry Competency</option>
                <option value="CAT-04">CAT-04: Experience & Practical Exposure</option>
                <option value="CAT-05">CAT-05: Professional Communication & Articulation</option>
                <option value="CAT-06">CAT-06: Leadership, Impact & Initiative</option>
                <option value="CAT-07">CAT-07: Global Adaptability & Cultural Agility</option>
                <option value="CAT-08">CAT-08: Personal Drive & Resilience</option>
                <option value="CAT-09">CAT-09: Application Strategy & Packaging</option>
                <option value="CAT-10">CAT-10: Network, Sponsorship & Mentorship</option>
              </select>
            </div>
            <Input
              label="Question Code (e.g. Q51)"
              type="text"
              required
              value={addQuestionCode}
              onChange={(e) => setAddQuestionCode(e.target.value)}
              placeholder="Q51"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Diagnostic Statement / Likert Prompt
            </label>
            <textarea
              rows={3}
              required
              value={addStatement}
              onChange={(e) => setAddStatement(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#102641]"
              placeholder="e.g. I have a targeted list of organisations that align with my values..."
            />
          </div>

          <Input
            label="Construct / Capability Focus"
            type="text"
            value={addConstruct}
            onChange={(e) => setAddConstruct(e.target.value)}
            placeholder="e.g. Career Clarity"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddQuestionOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isAddingQuestion}>
              Add question item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Draft Modal */}
      <Modal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        title="Create draft version"
        description="Published versions remain attached to historical submissions."
        maxWidth="md"
      >
        <form onSubmit={handleCreateDraftSubmit} className="space-y-4 pt-2">
          <Input
            label="Assessment Version Title"
            type="text"
            required
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="e.g. Universal 10-Category Readiness Diagnostic"
          />

          <p className="text-xs text-slate-500">
            A new draft version will be created. The 50 standardized Likert diagnostic statements across all 10 categories will be cloned from the active version ready for refinement.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDraftModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingDraft}>
              Create draft
            </Button>
          </div>
        </form>
      </Modal>

      {/* Publish Confirmation Modal (A08) */}
      <ConfirmationModal
        isOpen={Boolean(publishTarget)}
        onClose={() => setPublishTarget(null)}
        onConfirm={handleConfirmPublish}
        title={`Publish version v${publishTarget?.verNum}?`}
        description="Publishing this version changes future assessments. Existing completed results will be preserved."
        confirmLabel="Publish version"
        cancelLabel="Cancel"
        variant="primary"
        icon="warning"
        isLoading={isPublishing}
      />

      {/* Delete Draft Version Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteVersionTarget)}
        onClose={() => setDeleteVersionTarget(null)}
        onConfirm={confirmDeleteVersion}
        title={`Delete draft version v${deleteVersionTarget?.versionNumber}?`}
        description="Are you sure you want to delete this draft assessment version? This action cannot be undone."
        confirmLabel="Delete Draft"
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isDeletingVersion}
      />
    </div>
  );
};
