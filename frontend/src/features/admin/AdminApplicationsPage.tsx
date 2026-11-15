import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Filter,
  Download,
  Info,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  User,
  Building,
  Calendar,
  Clock,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Pagination } from '../../components/ui/Pagination';

export const AdminApplicationsPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  // View Application Details modal state (Read-only)
  const [viewingApp, setViewingApp] = useState<any | null>(null);

  const fetchApplications = async (targetPage = page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', '25');
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/applications-outcomes?${params.toString()}`);
      setData(res.data);
      setPage(targetPage);
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to load applications.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(1);
  }, [statusFilter]);



  const handleExportCsv = () => {
    if (!data?.applications || data.applications.length === 0) {
      toast('No applications to export.', 'info');
      return;
    }

    const rows = [
      [
        'Application ID',
        'Candidate Name',
        'Candidate Email',
        'Opportunity Code',
        'Opportunity Title',
        'Organization',
        'Current Stage',
        'Last Updated',
      ],
      ...data.applications.map((app: any) => [
        app.id,
        `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim(),
        app.user?.email || '',
        app.opportunity?.referenceCode || '',
        app.opportunity?.title || '',
        app.opportunity?.organization || '',
        app.status,
        new Date(app.updatedAt).toISOString(),
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e: any[]) => e.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sterling_applications_outcomes_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stages = [
    { key: 'SAVED', label: 'Saved' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'APPLIED', label: 'Applied' },
    { key: 'SHORTLISTED', label: 'Shortlisted' },
    { key: 'INTERVIEW', label: 'Interview' },
    { key: 'OFFER_SUCCESSFUL', label: 'Offer Received' },
    { key: 'AWARDED', label: 'Awarded / Won' },
    { key: 'UNSUCCESSFUL', label: 'Unsuccessful' },
    { key: 'WITHDRAWN', label: 'Withdrawn' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">
            Applications and outcomes
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Review self-reported progress with appropriate access controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchApplications(page)}
            className="p-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center px-4 py-2 bg-[#102641] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export report
          </button>
        </div>
      </div>

      {/* Verification Copy Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center">
        <Info className="w-4 h-4 mr-2 flex-shrink-0 text-blue-600" />
        <span>
          <strong>Verification Notice:</strong> Reported outcomes are user declarations unless separately verified.
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700">Filter Stage:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Pipeline Stages</option>
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 ml-2"
            >
              Clear
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Showing {data?.applications?.length || 0} applications
        </div>
      </div>

      {/* Applications Table */}
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
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Stage History</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.applications?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No applications recorded yet.
                    </td>
                  </tr>
                ) : (
                  data?.applications?.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {app.user?.firstName} {app.user?.lastName}
                        </div>
                        <div className="text-slate-500 text-[11px]">{app.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {app.opportunity?.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {app.opportunity?.referenceCode} • {app.opportunity?.organization}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'AWARDED' || app.status === 'OFFER_SUCCESSFUL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'APPLIED' || app.status === 'SHORTLISTED' || app.status === 'INTERVIEW'
                              ? 'bg-blue-100 text-blue-800'
                              : app.status === 'UNSUCCESSFUL'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {app.statusHistory?.length > 0 ? (
                          <div className="truncate max-w-xs font-medium">
                            {app.statusHistory[0].fromStatus ? (
                              <span>
                                {app.statusHistory[0].fromStatus} →{' '}
                                <strong className="text-slate-800">{app.statusHistory[0].toStatus}</strong>
                              </span>
                            ) : (
                              <strong className="text-slate-800">{app.statusHistory[0].toStatus}</strong>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Initial entry</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(app.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewingApp(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                          title="View application details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered Pagination */}
        {data?.pagination && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <Pagination
              currentPage={data.pagination.page || page}
              totalPages={data.pagination.totalPages || 1}
              onPageChange={(p) => fetchApplications(p)}
              totalItems={data.pagination.total}
              pageSize={25}
              itemLabel="applications"
            />
          </div>
        )}
      </div>

      {/* View Application Details Modal (Read-only) */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Outcome Record
                </span>
                <h3 className="text-lg font-serif font-bold text-gray-900 mt-1">
                  Application Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Candidate Info Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>
                    {viewingApp.user?.firstName} {viewingApp.user?.lastName}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="font-semibold block text-slate-500">Email:</span>
                    <span>{viewingApp.user?.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-500">Candidate ID:</span>
                    <span className="font-mono text-[11px]">{viewingApp.user?.id || viewingApp.userId}</span>
                  </div>
                </div>
              </div>

              {/* Opportunity Info Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  {viewingApp.opportunity?.opportunityType === 'SCHOLARSHIP' ? (
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="line-clamp-1">{viewingApp.opportunity?.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="font-semibold block text-slate-500">Organization:</span>
                    <span>{viewingApp.opportunity?.organization}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-500">Reference Code:</span>
                    <span className="font-mono text-[11px]">{viewingApp.opportunity?.referenceCode}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-500">Type / Pathway:</span>
                    <span className="font-bold text-slate-700">{viewingApp.opportunity?.opportunityType}</span>
                  </div>
                  <div>
                    <span className="font-semibold block text-slate-500">Location:</span>
                    <span>{viewingApp.opportunity?.location || 'Remote / Unspecified'}</span>
                  </div>
                </div>
                {viewingApp.opportunity?.applicationUrl && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <a
                      href={viewingApp.opportunity.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                    >
                      <span>Open official opportunity page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Current Status Box */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
                    Current Funnel Stage
                  </span>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                      viewingApp.status === 'AWARDED' || viewingApp.status === 'OFFER_SUCCESSFUL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : viewingApp.status === 'APPLIED' || viewingApp.status === 'SHORTLISTED' || viewingApp.status === 'INTERVIEW'
                        ? 'bg-blue-100 text-blue-800'
                        : viewingApp.status === 'UNSUCCESSFUL'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {viewingApp.status}
                  </span>
                </div>
                <div className="text-right text-slate-500 text-[11px]">
                  <div>Applied: {new Date(viewingApp.createdAt).toLocaleDateString()}</div>
                  <div>Updated: {new Date(viewingApp.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Status Audit History Timeline */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Stage Audit History</span>
                </h4>
                {viewingApp.statusHistory && viewingApp.statusHistory.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {viewingApp.statusHistory.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1 text-[11px]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-800">
                            {item.fromStatus ? `${item.fromStatus} → ` : ''}
                            <span className="text-blue-700 font-bold">{item.toStatus}</span>
                          </span>
                          <span className="text-slate-400 font-mono">
                            {new Date(item.changedAt || item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-[10px]">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">
                    No intermediate transitions recorded. Current stage recorded upon submission.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
