import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  MailCheck,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Eye,
  X,
  Send,
  Trash2,
} from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const AdminEmailLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, sent: 0, failed: 0, successRate: 100 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [triggerFilter, setTriggerFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Deletion state
  const [logToDelete, setLogToDelete] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const confirmDeleteEmailLog = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/email-logs/${logToDelete.id}`);
      setLogToDelete(null);
      await fetchEmailLogs(pagination.page);
    } catch (err) {
      console.error('Failed to delete email log', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === logs.length && logs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map((l) => l.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const executeBulkDeleteEmailLogs = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await api.post('/admin/email-logs/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      await fetchEmailLogs(pagination.page);
    } catch (err) {
      console.error('Failed to bulk delete email logs', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearEmailLogs = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/admin/email-logs');
      setIsClearModalOpen(false);
      await fetchEmailLogs(1);
    } catch (err) {
      console.error('Failed to clear email logs', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchEmailLogs = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    setSelectedIds([]);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(pagination.limit));
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (triggerFilter !== 'ALL') params.append('triggerType', triggerFilter);
      if (search.trim()) params.append('search', search.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/admin/email-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load email delivery logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs(1);
  }, [statusFilter, triggerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmailLogs(1);
  };

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setTriggerFilter('ALL');
    setSearch('');
    setStartDate('');
    setEndDate('');
    fetchEmailLogs(1);
  };

  const triggerTypes = [
    { code: 'ALL', label: 'All Triggers' },
    { code: 'EM002', label: 'EM002: Email Verification' },
    { code: 'EM001', label: 'EM001: Welcome & Onboarding' },
    { code: 'EM003', label: 'EM003: Assessment Results' },
    { code: 'EM004', label: 'EM004: Deadline Closing Soon' },
    { code: 'EM005', label: 'EM005: Application Progress Follow-up' },
    { code: 'EM006', label: 'EM006: Opportunity Recommendations' },
    { code: 'AUTH_RESET', label: 'AUTH_RESET: Password Reset' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-gray-900">Gmail SMTP Delivery Logs</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              Live Audit Log
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Complete transactional delivery audit for automated notifications, verification, and reminders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 shadow-xs cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Logs
          </button>
          <button
            onClick={() => fetchEmailLogs(pagination.page)}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer transition"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispatched</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Delivered Successfully
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.sent}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Delivery Failures
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{stats.failed}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Success Rate</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{stats.successRate}%</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="SENT">Sent Successfully</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <select
              value={triggerFilter}
              onChange={(e) => setTriggerFilter(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white max-w-xs"
            >
              {triggerTypes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                aria-label="Start date"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                aria-label="End date"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchEmailLogs(1)}
              className="px-3 py-2 bg-[#102641] text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              Filter
            </button>

            {(statusFilter !== 'ALL' || triggerFilter !== 'ALL' || search || startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900">
              {selectedIds.length} {selectedIds.length === 1 ? 'log' : 'logs'} selected
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

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MailCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 mb-1">No email delivery logs found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No transmission records matched your query. Adjust or clear your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={logs.length > 0 && selectedIds.length === logs.length}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Trigger Type</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Sent At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50 transition ${
                      selectedIds.includes(log.id) ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(log.id)}
                        onChange={() => handleToggleSelectOne(log.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status === 'SENT' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {log.triggerType}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {log.recipientEmail}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 mr-1" /> Inspect
                        </button>
                        <button
                          onClick={() => setLogToDelete(log)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete email log record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
            onPageChange={(p) => fetchEmailLogs(p)}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            itemLabel="transmissions"
          />
        </div>
      </div>

      {/* Delete Single Email Log Modal */}
      <ConfirmationModal
        isOpen={Boolean(logToDelete)}
        onClose={() => setLogToDelete(null)}
        onConfirm={confirmDeleteEmailLog}
        title="Delete email delivery record?"
        description={`Are you sure you want to delete the email log record for "${logToDelete?.recipientEmail}" (${logToDelete?.triggerType})?`}
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />

      {/* Bulk Delete Email Logs Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={executeBulkDeleteEmailLogs}
        title={`Delete ${selectedIds.length} email logs?`}
        description={`Are you sure you want to permanently delete these ${selectedIds.length} selected email transmission records? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Records`}
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />

      {/* Clear All Email Logs Modal */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={confirmClearEmailLogs}
        title="Clear all email delivery logs?"
        description="Are you sure you want to permanently clear all email transmission records? This action cannot be undone."
        confirmLabel="Clear All Logs"
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />

      {/* Inspect Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#102641]" />
                <h3 className="text-base font-bold text-slate-900">Email Delivery Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Delivery Status:</span>
                <span
                  className={`inline-flex items-center mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    selectedLog.status === 'SENT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedLog.status}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Trigger Type:</span>
                <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                  {selectedLog.triggerType}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Recipient:</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {selectedLog.recipientEmail}
                </span>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Subject Line:</span>
                <span className="text-slate-800 mt-0.5 block bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                  {selectedLog.subject}
                </span>
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <span className="text-rose-600 font-bold block">Error Diagnostic:</span>
                  <div className="mt-0.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-mono text-[11px] break-all">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-500 font-medium block">Timestamp:</span>
                <span className="text-slate-700 mt-0.5 block">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer transition"
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
