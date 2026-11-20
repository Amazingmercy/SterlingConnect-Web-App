import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { RefreshCw, Terminal, Eye, Calendar, X, Copy, Check, Trash2 } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPayloadLog, setSelectedPayloadLog] = useState<any | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Deletion state
  const [logToDelete, setLogToDelete] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    setSelectedIds([]);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter, entityTypeFilter, startDate, endDate]);

  const handleCopyPayload = () => {
    if (!selectedPayloadLog?.payload) return;
    navigator.clipboard.writeText(JSON.stringify(selectedPayloadLog.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/audit-logs/${logToDelete.id}`);
      setLogToDelete(null);
      await fetchLogs(pagination.page);
    } catch (err) {
      console.error('Failed to delete audit log', err);
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

  const executeBulkDeleteAuditLogs = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await api.post('/admin/audit-logs/bulk-delete', { ids: selectedIds });
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      await fetchLogs(pagination.page);
    } catch (err) {
      console.error('Failed to bulk delete audit logs', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearLogs = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/admin/audit-logs');
      setIsClearModalOpen(false);
      await fetchLogs(1);
    } catch (err) {
      console.error('Failed to clear audit logs', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header (FR-18) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">
            System audit trail
          </h2>
          <p className="text-xs text-gray-600">
            Compliance record of all administrative modifications, imports, and status adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 shadow-sm cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Audit Trail
          </button>
          <button
            onClick={() => fetchLogs(pagination.page)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Trail
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Operational Actions</option>
              <option value="OPPORTUNITY_CREATED">Opportunity Created</option>
              <option value="OPPORTUNITY_UPDATED">Opportunity Updated</option>
              <option value="OPPORTUNITY_STATUS_CHANGED">Opportunity Status Changed</option>
              <option value="OPPORTUNITY_DELETED">Opportunity Deleted</option>
              <option value="OPPORTUNITIES_BULK_IMPORTED">Bulk Import Completed</option>
              <option value="USER_STATUS_UPDATED">User Status Updated</option>
              <option value="USER_ROLE_UPDATED">User Role Modified</option>
              <option value="STAFF_INVITED">Staff Invited</option>
              <option value="ADMIN_ACCESS_REVOKED">Admin Access Revoked</option>
              <option value="ASSESSMENT_DRAFT_CREATED">Assessment Draft Created</option>
              <option value="ASSESSMENT_PUBLISHED">Assessment Published</option>
              <option value="RULE_CREATED">Recommendation Rule Created</option>
              <option value="RULE_TOGGLED">Recommendation Rule Toggled</option>
              <option value="TAXONOMY_CREATED">Taxonomy Created</option>
              <option value="TAXONOMY_UPDATED">Taxonomy Updated</option>
              <option value="TAXONOMY_ALIAS_ADDED">Taxonomy Alias Added</option>
              <option value="TAXONOMY_TOGGLED">Taxonomy Toggled</option>
              <option value="TEST_EMAIL_SENT">Test Email Sent</option>
              <option value="ASSESSMENT_SUBMITTED">Assessment Submitted</option>
              <option value="PATHWAY_CHANGED">Pathway Changed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Entity:</span>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Opportunity">Opportunity</option>
              <option value="AssessmentVersion">Assessment Version</option>
              <option value="RecommendationRule">Recommendation Rule</option>
              <option value="Taxonomy">Taxonomy</option>
              <option value="EmailTemplate">Email Template</option>
              <option value="Application">Application</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            />
          </div>

          {(startDate || endDate || actionFilter || entityTypeFilter) && (
            <button
              onClick={() => {
                setActionFilter('');
                setEntityTypeFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-sterling-navy hover:underline font-medium cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 whitespace-nowrap">
          Showing {logs.length} of {pagination.total || logs.length} events
        </div>
      </div>

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

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sterling-navy"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No audit logs recorded for this filter.
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
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Operator / Staff</th>
                  <th className="py-3 px-4">Payload Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
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
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded font-sans font-bold text-[10px] bg-slate-100 text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {log.user ? (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {log.user.firstName} {log.user.lastName}
                          </span>
                          <span className="text-slate-400 block text-[10px]">
                            {log.user.email} ({log.user.role})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">System Automation</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {log.payload ? (
                        <button
                          onClick={() => setSelectedPayloadLog(log)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-sterling-navy bg-sterling-navy/5 hover:bg-sterling-navy/10 border border-sterling-navy/20 rounded-md transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View payload</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                      <button
                        onClick={() => setLogToDelete(log)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete audit log record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
            onPageChange={(p) => fetchLogs(p)}
            totalItems={pagination.total}
            pageSize={25}
            itemLabel="audit records"
          />
        </div>
      </div>

      {/* Delete Single Log Modal */}
      <ConfirmationModal
        isOpen={Boolean(logToDelete)}
        onClose={() => setLogToDelete(null)}
        onConfirm={confirmDeleteLog}
        title="Delete audit log entry?"
        description={`Are you sure you want to delete the audit log for action "${logToDelete?.action}" on ${logToDelete?.entityType}? This action cannot be undone.`}
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />

      {/* Bulk Delete Audit Logs Modal */}
      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={executeBulkDeleteAuditLogs}
        title={`Delete ${selectedIds.length} audit logs?`}
        description={`Are you sure you want to permanently delete these ${selectedIds.length} selected audit log records? This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : `Delete ${selectedIds.length} Records`}
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />

      {/* Clear All Logs Modal */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={confirmClearLogs}
        title="Clear entire audit trail?"
        description="Are you sure you want to permanently clear all audit log records? This will delete all recorded events across the platform."
        confirmLabel="Clear All Records"
        cancelLabel="Cancel"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />

      {/* Payload Details Modal */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sterling-navy/10 text-sterling-navy rounded-lg">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sans">
                    Audit Log Payload Details
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">{selectedPayloadLog.action}</span>
                    <span>•</span>
                    <span>{selectedPayloadLog.entityType}</span>
                    <span>•</span>
                    <span>{new Date(selectedPayloadLog.createdAt).toUTCString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Operator:</span>
                  <span className="font-medium text-slate-800">
                    {selectedPayloadLog.user
                      ? `${selectedPayloadLog.user.firstName} ${selectedPayloadLog.user.lastName} (${selectedPayloadLog.user.email})`
                      : 'System Automation'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Entity ID / Target:</span>
                  <span className="font-mono text-slate-800 truncate block">
                    {selectedPayloadLog.entityId || '—'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Payload JSON:</span>
                  <button
                    onClick={handleCopyPayload}
                    className="inline-flex items-center gap-1 text-xs text-sterling-navy hover:text-sterling-navy/80 font-medium cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80 leading-relaxed border border-slate-800 shadow-inner">
                  {JSON.stringify(selectedPayloadLog.payload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 shadow-sm cursor-pointer"
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
