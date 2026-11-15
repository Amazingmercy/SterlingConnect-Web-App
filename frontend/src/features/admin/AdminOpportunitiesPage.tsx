import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Search,
  Plus,
  ExternalLink,
  Edit2,
  Archive,
  CheckCircle,
  RefreshCw,
  Trash2,
  Eye,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  MapPin,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminOpportunityModal } from './AdminOpportunityModal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../context/ToastContext';

export const AdminOpportunitiesPage: React.FC = () => {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<'EMPLOYMENT' | 'SCHOLARSHIP'>('EMPLOYMENT');
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);

  // Preview Modal
  const [previewOpp, setPreviewOpp] = useState<any | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<{ id: string; title: string; newStatus: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fetchOpportunities = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('opportunityType', typeFilter);

      const res = await api.get(`/admin/opportunities?${params.toString()}`);
      setOpportunities(res.data.opportunities || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load admin opportunities', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities(1);
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities(1);
  };

  const executeStatusChange = async (id: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      await api.patch(`/admin/opportunities/${id}/status`, { status: newStatus });
      toast(`Opportunity status updated to ${newStatus}.`);
      setArchiveTarget(null);
      fetchOpportunities(pagination.page);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = (opp: any, newStatus: string) => {
    if (newStatus === 'DRAFT' || newStatus === 'ARCHIVED') {
      setArchiveTarget({ id: opp.id, title: opp.title, newStatus });
      return;
    }
    executeStatusChange(opp.id, newStatus);
  };

  const executeDeleteOpportunity = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      await api.delete(`/admin/opportunities/${deleteTarget.id}`);
      toast('Opportunity removed permanently.');
      setDeleteTarget(null);
      fetchOpportunities(pagination.page);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to delete opportunity.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (opp: any) => {
    setSelectedOpp(opp);
    setModalInitialType(opp.opportunityType);
    setIsModalOpen(true);
  };

  const handleCreateNew = (type: 'EMPLOYMENT' | 'SCHOLARSHIP' = 'EMPLOYMENT') => {
    setSelectedOpp(null);
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header (A04) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">Manage opportunities</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Create, review and maintain opportunity records.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/import"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Bulk Import
          </Link>

          {/* Primary Add Opportunity (Opens modal with Employment/Scholarship choice) */}
          <button
            type="button"
            onClick={() => handleCreateNew('EMPLOYMENT')}
            className="inline-flex items-center px-4 py-2 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-md cursor-pointer ring-2 ring-[#102641]/20"
          >
            <Plus className="w-4 h-4 mr-1.5" /> + Add Opportunity
          </button>

          {/* Refresh at the end of toolbar */}
          <button
            onClick={() => fetchOpportunities(pagination.page)}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, organization, reference..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Opportunity Types</option>
            <option value="EMPLOYMENT">Career & Employment</option>
            <option value="SCHOLARSHIP">Education & Scholarships</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {(search || typeFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('');
                setStatusFilter('');
                fetchOpportunities(1);
              }}
              className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 mb-1">No opportunity records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Get started by creating your first employment or scholarship opportunity.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleCreateNew('EMPLOYMENT')}
                className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg cursor-pointer"
              >
                + Add Employment
              </button>
              <button
                onClick={() => handleCreateNew('SCHOLARSHIP')}
                className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg cursor-pointer"
              >
                + Add Scholarship
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Title & Organization</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Engagement</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {opp.referenceCode || opp.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">{opp.title}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <span>{opp.organization}</span>
                        <span>•</span>
                        <span>{opp.country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          opp.opportunityType === 'EMPLOYMENT'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {opp.opportunityType === 'EMPLOYMENT' ? (
                          <Briefcase className="w-3 h-3 mr-1" />
                        ) : (
                          <GraduationCap className="w-3 h-3 mr-1" />
                        )}
                        {opp.opportunityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(opp.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          opp.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : opp.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {opp._count?.savedByUsers || 0} saved • {opp._count?.applications || 0} applications
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewOpp(opp)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer transition"
                          title="Preview opportunity"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => handleEdit(opp)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition"
                          title="Edit Opportunity"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Publish / Unpublish */}
                        {opp.status === 'PUBLISHED' ? (
                          <button
                            onClick={() => handleStatusChange(opp, 'ARCHIVED')}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded cursor-pointer transition"
                            title="Unpublish / Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(opp, 'PUBLISHED')}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer transition"
                            title="Publish Opportunity"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget({ id: opp.id, title: opp.title })}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition"
                          title="Delete Opportunity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Official link */}
                        <a
                          href={opp.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                          title="Open official portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchOpportunities(p)}
            totalItems={pagination.total}
            pageSize={10}
            itemLabel="opportunities"
          />
        </div>
      </div>

      {/* Editor Modal */}
      <AdminOpportunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => fetchOpportunities(pagination.page)}
        opportunityToEdit={selectedOpp}
        initialType={modalInitialType}
      />

      {/* Interactive Preview Modal */}
      {previewOpp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {previewOpp.referenceCode}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    previewOpp.opportunityType === 'EMPLOYMENT'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {previewOpp.opportunityType}
                </span>
              </div>
              <button
                onClick={() => setPreviewOpp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">{previewOpp.title}</h3>
                <p className="text-sm font-semibold text-slate-700 mt-1">{previewOpp.organization}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {previewOpp.location}, {previewOpp.country}
                  </span>
                  <span>•</span>
                  <span>Deadline: {new Date(previewOpp.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {previewOpp.overview && (
                <div className="text-xs text-slate-700">
                  <h4 className="font-bold text-slate-900 mb-1">Overview:</h4>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{previewOpp.overview}</p>
                </div>
              )}

              {previewOpp.requirements && (
                <div className="text-xs text-slate-700">
                  <h4 className="font-bold text-slate-900 mb-1">Requirements:</h4>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100">{previewOpp.requirements}</p>
                </div>
              )}

              {previewOpp.scholarshipDetail && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <p>
                    <strong>Funding Level:</strong> {previewOpp.scholarshipDetail.fundingLevel}
                  </p>
                  <p>
                    <strong>Study Levels:</strong>{' '}
                    {Array.isArray(previewOpp.scholarshipDetail.studyLevels)
                      ? previewOpp.scholarshipDetail.studyLevels.join(', ')
                      : previewOpp.scholarshipDetail.studyLevels}
                  </p>
                  <p>
                    <strong>Eligible Fields:</strong>{' '}
                    {Array.isArray(previewOpp.scholarshipDetail.eligibleFields)
                      ? previewOpp.scholarshipDetail.eligibleFields.join(', ')
                      : previewOpp.scholarshipDetail.eligibleFields}
                  </p>
                </div>
              )}

              {previewOpp.employmentDetail && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                  <p>
                    <strong>Work Arrangement:</strong> {previewOpp.employmentDetail.workArrangement}
                  </p>
                  <p>
                    <strong>Experience Level:</strong> {previewOpp.employmentDetail.experienceLevel}
                  </p>
                  <p>
                    <strong>Sector / Function:</strong> {previewOpp.employmentDetail.sector} •{' '}
                    {previewOpp.employmentDetail.function}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
              <a
                href={previewOpp.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:underline gap-1"
              >
                Open Official Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewOpp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish / Archive Confirmation (A04 State Copy) */}
      <ConfirmationModal
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && executeStatusChange(archiveTarget.id, archiveTarget.newStatus)}
        title="Unpublish opportunity?"
        description="Unpublishing removes this item from discovery. Saved and application records remain."
        confirmLabel="Unpublish"
        cancelLabel="Cancel"
        variant="warning"
        icon="warning"
        isLoading={isProcessing}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDeleteOpportunity}
        title={`Permanently delete "${deleteTarget?.title}"?`}
        description="This action cannot be undone and will delete all associated engagement records."
        confirmLabel="Delete Opportunity"
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isProcessing}
      />
    </div>
  );
};
