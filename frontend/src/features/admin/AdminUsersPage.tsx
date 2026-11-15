import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Search,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Mail,
  Award,
  Trash2,
  Eye,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Pagination } from '../../components/ui/Pagination';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pathwayFilter, setPathwayFilter] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  // Delete User confirmation
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Modal confirmations for status & role
  const [statusModalTarget, setStatusModalTarget] = useState<{ user: any; newStatus: string } | null>(null);
  const [roleModalTarget, setRoleModalTarget] = useState<{ user: any; newRole: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const isStaffAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (pathwayFilter) params.set('pathway', pathwayFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter, pathwayFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      toast(`User ${deleteTarget.email} deleted.`);
      setDeleteTarget(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!statusModalTarget) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.patch(`/admin/users/${statusModalTarget.user.id}/status`, {
        status: statusModalTarget.newStatus,
      });
      toast(`Account status updated to ${statusModalTarget.newStatus}.`);
      setStatusModalTarget(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmChangeRole = async () => {
    if (!roleModalTarget) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.patch(`/admin/users/${roleModalTarget.user.id}/role`, {
        role: roleModalTarget.newRole,
      });
      toast(`Role updated to ${roleModalTarget.newRole}.`);
      setRoleModalTarget(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header (A03) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-900">User management</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Find a user and review only the information needed for support.
          </p>
        </div>
        <button
          onClick={() => fetchUsers(pagination.page)}
          className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh List
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            {actionError}
          </div>
          <button onClick={() => setActionError(null)} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email address..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value="USER">Candidates (USER)</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPER_ADMIN">Super Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <select
            value={pathwayFilter}
            onChange={(e) => setPathwayFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
            aria-label="Filter by pathway"
          >
            <option value="">All Pathways</option>
            <option value="EMPLOYMENT">Employment</option>
            <option value="SCHOLARSHIP">Scholarship</option>
          </select>

          {(search || roleFilter || statusFilter || pathwayFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('');
                setStatusFilter('');
                setPathwayFilter('');
                fetchUsers(1);
              }}
              className="px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No candidates or administrators found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Candidate / User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pathway</th>
                  <th className="py-3 px-4">Readiness Diagnostic</th>
                  <th className="py-3 px-4">Applications</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">CRUD & Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {u.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isStaffAdmin && !isSelf ? (
                          <select
                            value={u.role}
                            onChange={(e) => {
                              if (e.target.value !== u.role) {
                                setRoleModalTarget({ user: u, newRole: e.target.value });
                              }
                            }}
                            className="text-[11px] font-semibold p-1 rounded border border-slate-300 bg-white cursor-pointer"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        ) : (
                          <span className="font-semibold text-slate-800">{u.role}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize whitespace-nowrap">
                        {u.activePathway?.toLowerCase() || 'Employment'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.hasCompletedAssessment ? (
                          <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                            <Award className="w-3.5 h-3.5 mr-1" /> Unlocked
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pending Gate</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {u._count?.applications || 0} tracked
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* View user */}
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition"
                            title="View user details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Reactivate account */}
                          {!isSelf && u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() =>
                                setStatusModalTarget({
                                  user: u,
                                  newStatus: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                                })
                              }
                              className={`p-1.5 rounded cursor-pointer transition ${
                                u.status === 'ACTIVE'
                                  ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              }`}
                              title={u.status === 'ACTIVE' ? 'Suspend account' : 'Reactivate account'}
                            >
                              {u.status === 'ACTIVE' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete user account (CRUD Delete) */}
                          {!isSelf && u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Numbered Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchUsers(p)}
            totalItems={pagination.total}
            pageSize={15}
            itemLabel="candidates & users"
          />
        </div>
      </div>

      {/* Delete User Confirmation Modal (CRUD Delete) */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
        title={`Permanently delete user account?`}
        description={`This will permanently remove the account for ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.email}) and all associated records. This action cannot be undone.`}
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        variant="danger"
        icon="warning"
        isLoading={isProcessing}
      />

      {/* View User Modal (A03: View user) */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  {viewingUser.firstName} {viewingUser.lastName}
                </h3>
                <span className="text-xs font-mono text-slate-500">{viewingUser.email}</span>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold block">Role:</span>
                  <span className="font-bold text-slate-800">{viewingUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Status:</span>
                  <span className="font-bold text-slate-800">{viewingUser.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Active Pathway:</span>
                  <span className="font-bold text-slate-800">{viewingUser.activePathway}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">Readiness Gate:</span>
                  <span className="font-bold text-slate-800">
                    {viewingUser.hasCompletedAssessment ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
              {viewingUser.commonProfile && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-800 block mb-1">Candidate Profile:</span>
                  <p>Country: {viewingUser.commonProfile.locationCountry || 'Not specified'}</p>
                  <p>Highest Qualification: {viewingUser.commonProfile.highestQualification || 'Not specified'}</p>
                  <p>Field of Study: {viewingUser.commonProfile.fieldOfStudy || 'Not specified'}</p>
                </div>
              )}
            </div>
            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend/Reactivate Account Confirmation Modal (A03 State Copy) */}
      <ConfirmationModal
        isOpen={Boolean(statusModalTarget)}
        onClose={() => setStatusModalTarget(null)}
        onConfirm={confirmToggleStatus}
        title={`${statusModalTarget?.newStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} user account?`}
        description="This action changes account access. Confirm that it is authorised."
        confirmLabel={statusModalTarget?.newStatus === 'SUSPENDED' ? 'Suspend account' : 'Reactivate account'}
        cancelLabel="Cancel"
        variant={statusModalTarget?.newStatus === 'SUSPENDED' ? 'danger' : 'primary'}
        icon="warning"
        isLoading={isProcessing}
      />

      {/* Change Role Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(roleModalTarget)}
        onClose={() => setRoleModalTarget(null)}
        onConfirm={confirmChangeRole}
        title={`Change user role to ${roleModalTarget?.newRole}?`}
        description="This changes operational permissions for this account."
        confirmLabel="Change role"
        cancelLabel="Cancel"
        variant="warning"
        icon="warning"
        isLoading={isProcessing}
      />
    </div>
  );
};
