import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';

export const AdminTaxonomiesPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>('SECTOR');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal State for adding option
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for editing canonical label (PUT /admin/taxonomies/:id)
  const [editTarget, setEditTarget] = useState<{ id: string; code: string; name: string } | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');

  // Modal State for adding alias
  const [aliasTarget, setAliasTarget] = useState<{ id: string; name: string } | null>(null);
  const [aliasValue, setAliasValue] = useState('');

  // Modal State for deactivating/reactivating
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string; isActive: boolean } | null>(null);

  // Modal State for delete option (CRUD Delete)
  const [deleteOptionTarget, setDeleteOptionTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTaxonomies = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await api.get(`/admin/taxonomies?type=${selectedType}`);
      setData(res.data);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to load taxonomies.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomies();
  }, [selectedType]);

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/taxonomies', {
        type: selectedType,
        code: newCode.trim(),
        name: newName.trim(),
      });
      toast(`Option "${newName.trim()}" added.`);
      setIsAddOpen(false);
      setNewCode('');
      setNewName('');
      fetchTaxonomies();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to add option.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditLabel = (item: any) => {
    setEditTarget({ id: item.id, code: item.code, name: item.name });
    setEditLabelValue(item.name);
  };

  const handleSaveEditLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editLabelValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.put(`/admin/taxonomies/${editTarget.id}`, {
        name: editLabelValue.trim(),
      });
      toast(`Label updated to "${editLabelValue.trim()}".`);
      setEditTarget(null);
      fetchTaxonomies();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update taxonomy label.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasTarget || !aliasValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/admin/taxonomies/${aliasTarget.id}/aliases`, {
        alias: aliasValue.trim(),
      });
      toast(`Alias "${aliasValue.trim()}" added.`);
      setAliasTarget(null);
      setAliasValue('');
      fetchTaxonomies();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to add alias.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlias = async (aliasId: string, aliasName: string) => {
    try {
      await api.delete(`/admin/taxonomies/aliases/${aliasId}`);
      toast(`Alias "${aliasName}" removed.`);
      fetchTaxonomies();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to remove alias.', 'error');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsSubmitting(true);
    try {
      const res = await api.patch(`/admin/taxonomies/${deactivateTarget.id}/deactivate`);
      setFeedback(
        res.data.message ||
          'This option is referenced by existing records. Deactivate it rather than deleting it.'
      );
      toast(deactivateTarget.isActive ? 'Taxonomy option deactivated.' : 'Taxonomy option reactivated.');
      setDeactivateTarget(null);
      fetchTaxonomies();
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update taxonomy option.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteOption = async () => {
    if (!deleteOptionTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/taxonomies/${deleteOptionTarget.id}`);
      toast(`Taxonomy option "${deleteOptionTarget.name}" deleted.`);
      setDeleteOptionTarget(null);
      fetchTaxonomies();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'This option is referenced by existing records. Deactivate it rather than deleting it.';
      setFeedback(msg);
      toast(msg, 'error');
      setDeleteOptionTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const taxonomyTypes = [
    { key: 'SECTOR', label: 'Sectors', singular: 'Sector' },
    { key: 'FUNCTION', label: 'Job Functions', singular: 'Job Function' },
    { key: 'SKILL', label: 'Skills', singular: 'Skill' },
    { key: 'STUDY_FIELD', label: 'Study Fields', singular: 'Study Field' },
    { key: 'DEGREE_LEVEL', label: 'Degree Levels', singular: 'Degree Level' },
  ];

  return (
    <div className="space-y-6">
      {/* Header A10 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Manage taxonomies</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Maintain sectors, functions, skills, study fields and approved relations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTaxonomies}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-md cursor-pointer ring-2 ring-[#102641]/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> + Add option
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-600" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Type Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        {taxonomyTypes.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedType(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedType === tab.key
                ? 'bg-[#102641] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Taxonomy Table */}
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
                <th className="py-3 px-4">Code Identifier</th>
                <th className="py-3 px-4">Canonical Label</th>
                <th className="py-3 px-4">Aliases &amp; Mappings</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">CRUD Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.items?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No options found for {taxonomyTypes.find((t) => t.key === selectedType)?.label || selectedType}. Click "+ Add option" to create one.
                  </td>
                </tr>
              ) : (
                data?.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        {item.aliases?.map((al: any) => (
                          <span
                            key={al.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700"
                          >
                            {al.alias}
                            <button
                              onClick={() => handleDeleteAlias(al.id, al.alias)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Remove alias"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => {
                            setAliasTarget({ id: item.id, name: item.name });
                            setAliasValue('');
                          }}
                          className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer ml-1"
                        >
                          + Add alias
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* Edit label (CRUD Update) */}
                        <button
                          onClick={() => handleOpenEditLabel(item)}
                          className="inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          title="Edit canonical label"
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Edit label
                        </button>

                        {/* Deactivate / Reactivate */}
                        <button
                          onClick={() =>
                            setDeactivateTarget({
                              id: item.id,
                              name: item.name,
                              isActive: item.isActive,
                            })
                          }
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded transition cursor-pointer ${
                            item.isActive
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {item.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>

                        {/* Delete option (CRUD Delete) */}
                        <button
                          onClick={() => setDeleteOptionTarget({ id: item.id, name: item.name })}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition"
                          title="Delete option"
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

      {/* Modal Add Option */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={`Add ${taxonomyTypes.find((t) => t.key === selectedType)?.singular || selectedType} Option`}
        description="Maintain approved taxonomy classifications across the repository."
        maxWidth="md"
      >
        <form onSubmit={handleAddOption} className="space-y-4 pt-2">
          <Input
            label="Code Identifier (e.g. software_engineering, agriculture_agribusiness)"
            type="text"
            required
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="e.g. software_engineering"
            helperText="The unique lowercase identifier matching the workbook taxonomy specification."
          />
          <Input
            label="Canonical Display Label (Exact copy users see)"
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Software Engineering"
            helperText="The human-readable label shown in candidate dropdowns and filter chips."
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
            <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add option
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Label */}
      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Edit Canonical Label (${editTarget?.code})`}
        description="Changing canonical label updates display across all catalog filters."
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditLabel} className="space-y-4 pt-2">
          <Input
            label="Canonical Label"
            type="text"
            required
            value={editLabelValue}
            onChange={(e) => setEditLabelValue(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
            <Button type="button" variant="secondary" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save label
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Alias */}
      <Modal
        isOpen={Boolean(aliasTarget)}
        onClose={() => setAliasTarget(null)}
        title={`Add Alias for "${aliasTarget?.name}"`}
        description="Aliases help fuzzy search and CV keyword parsing map to canonical taxonomy terms."
        maxWidth="md"
      >
        <form onSubmit={handleSaveAlias} className="space-y-4 pt-2">
          <Input
            label="Alias / Alternate Keyword"
            type="text"
            required
            value={aliasValue}
            onChange={(e) => setAliasValue(e.target.value)}
            placeholder="e.g. FinTech, Banking Tech"
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-[#edf0f3]">
            <Button type="button" variant="secondary" onClick={() => setAliasTarget(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Add alias
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Reactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
        title={`${deactivateTarget?.isActive ? 'Deactivate' : 'Reactivate'} "${deactivateTarget?.name}"?`}
        description="This option is referenced by existing records. Deactivate it rather than deleting it."
        confirmLabel={deactivateTarget?.isActive ? 'Deactivate' : 'Reactivate'}
        cancelLabel="Cancel"
        variant={deactivateTarget?.isActive ? 'warning' : 'primary'}
        icon="warning"
        isLoading={isSubmitting}
      />

      {/* Delete Option Confirmation Modal (A10 State Copy) */}
      <ConfirmationModal
        isOpen={Boolean(deleteOptionTarget)}
        onClose={() => setDeleteOptionTarget(null)}
        onConfirm={handleConfirmDeleteOption}
        title={`Delete taxonomy option "${deleteOptionTarget?.name}"?`}
        description="This option is referenced by existing records. Deactivate it rather than deleting it."
        confirmLabel="Delete Option"
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isDeleting}
      />
    </div>
  );
};
