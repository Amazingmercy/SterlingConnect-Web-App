import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { GitBranch, Plus, CheckCircle, XCircle, AlertCircle, RefreshCw, Edit2, Trash2, X, Check } from 'lucide-react';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useToast } from '../../context/ToastContext';

export const AdminRecommendationRulesPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New rule form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('CAT-01');
  const [readinessBand, setReadinessBand] = useState('EMERGING');
  const [courseCode, setCourseCode] = useState('SA-011');
  const [ruleName, setRuleName] = useState('');
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // Edit rule modal state
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editReadinessBand, setEditReadinessBand] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editRuleName, setEditRuleName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete rule state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRules = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get('/admin/recommendation-rules');
      setData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load recommendation rules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId: string) => {
    setErrorMsg(null);
    try {
      await api.patch(`/admin/recommendation-rules/${ruleId}/toggle`);
      fetchRules();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'This rule references a missing product or dimension. Correct it before activation.'
      );
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingRule) return;
    setIsCreatingRule(true);
    setErrorMsg(null);
    try {
      await api.post('/admin/recommendation-rules', {
        categoryId,
        readinessBand,
        courseCode,
        ruleName: ruleName || `${categoryId} [${readinessBand}] -> ${courseCode}`,
      });
      toast('Recommendation rule created successfully.');
      setIsModalOpen(false);
      setRuleName('');
      fetchRules();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'This rule references a missing product or dimension. Correct it before activation.'
      );
    } finally {
      setIsCreatingRule(false);
    }
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRule(rule);
    setEditCategoryId(rule.categoryId);
    setEditReadinessBand(rule.readinessBand);
    setEditCourseCode(rule.courseCode);
    setEditRuleName(rule.ruleName);
  };

  const handleSaveEditRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setIsSavingEdit(true);
    setErrorMsg(null);
    try {
      await api.put(`/admin/recommendation-rules/${editingRule.id}`, {
        categoryId: editCategoryId,
        readinessBand: editReadinessBand,
        courseCode: editCourseCode,
        ruleName: editRuleName,
      });
      toast(`Rule "${editRuleName}" updated.`);
      setEditingRule(null);
      fetchRules();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'This rule references a missing product or dimension. Correct it before activation.'
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDeleteRule = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/recommendation-rules/${deleteTarget.id}`);
      toast(`Recommendation rule removed.`);
      setDeleteTarget(null);
      fetchRules();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete rule.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header A09 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Recommendation rules</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Map dimensions and goals to canonical Academy products.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRules}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh rules"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-md cursor-pointer ring-2 ring-[#102641]/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> + Create rule
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Diagnostic Dimension</th>
                  <th className="py-3 px-4">Readiness Band</th>
                  <th className="py-3 px-4">Canonical Product Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.rules?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No recommendation rules mapped yet. Click "+ Create rule" to map a diagnostic category to an Academy course.
                  </td>
                </tr>
              ) : (
                data?.rules?.map((rule: any) => (
                  <tr key={rule.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">{rule.ruleName}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{rule.categoryId}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                        {rule.readinessBand}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {rule.courseCode}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rule.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenEdit(rule)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer transition"
                          title="Edit rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggle(rule.id)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded transition cursor-pointer ${
                            rule.isActive
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {rule.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => setDeleteTarget(rule)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Create Rule Modal */}
    {isModalOpen && (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900">
                  Create Recommendation Rule
                </h3>
                <p className="text-xs text-gray-500">
                  Map dimensions and goals to canonical Academy products.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Diagnostic Dimension (Category)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {data?.diagnosticDimensions?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.id}: {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trigger Readiness Band
                </label>
                <select
                  value={readinessBand}
                  onChange={(e) => setReadinessBand(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">ALL (Any Readiness Band)</option>
                  <option value="EMERGING">EMERGING (1.0 - 2.4)</option>
                  <option value="FOUNDATIONAL">FOUNDATIONAL (2.5 - 3.4)</option>
                  <option value="DEVELOPING">DEVELOPING (3.5 - 4.1)</option>
                  <option value="PROFICIENT">PROFICIENT (4.2 - 5.0)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Canonical Academy Course
                </label>
                <select
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {data?.canonicalProducts?.map((course: any) => (
                    <option key={course.courseCode} value={course.courseCode}>
                      {course.courseCode}: {course.title} {course.isFree ? '(Free)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rule Label (Optional)
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Bridge Professional Communication Gap"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRule}
                  className="inline-flex items-center px-4 py-2 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCreatingRule ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5" />
                      <span>Creating rule...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Create rule</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900">
                  Edit Recommendation Rule
                </h3>
                <p className="text-xs text-gray-500">
                  Update mappings to canonical Academy products.
                </p>
              </div>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={editRuleName}
                  onChange={(e) => setEditRuleName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Diagnostic Dimension (Category)
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {data?.diagnosticDimensions?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.id}: {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Readiness Band
                </label>
                <select
                  value={editReadinessBand}
                  onChange={(e) => setEditReadinessBand(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ALL">ALL (Any Readiness Band)</option>
                  <option value="EMERGING">EMERGING (1.0 - 2.4)</option>
                  <option value="FOUNDATIONAL">FOUNDATIONAL (2.5 - 3.4)</option>
                  <option value="DEVELOPING">DEVELOPING (3.5 - 4.1)</option>
                  <option value="PROFICIENT">PROFICIENT (4.2 - 5.0)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Canonical Academy Course
                </label>
                <select
                  value={editCourseCode}
                  onChange={(e) => setEditCourseCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  {data?.canonicalProducts?.map((course: any) => (
                    <option key={course.courseCode} value={course.courseCode}>
                      {course.courseCode}: {course.title} {course.isFree ? '(Free)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
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
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Rule Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteRule}
        title={`Delete recommendation rule?`}
        description={`Are you sure you want to delete rule "${deleteTarget?.ruleName}"? Candidates in band ${deleteTarget?.readinessBand} will no longer receive this automated pathway recommendation.`}
        confirmLabel="Delete Rule"
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isDeleting}
      />
    </div>
  );
};
